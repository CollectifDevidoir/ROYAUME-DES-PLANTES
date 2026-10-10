-- =====================================================================
-- Le royaume des plantes : comptes, amis et tableau du jour (Supabase)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être relancé sans danger : il remplace les fonctions
-- et ne recrée pas les tables déjà présentes.
--
-- Principe de sécurité : les tables ne sont JAMAIS lisibles ni modifiables
-- directement depuis l'appli (RLS activée, aucune politique, droits retirés).
-- Tout passe par les fonctions ci-dessous, qui vérifient auth.uid() :
--   - chacun ne modifie que ses propres données ;
--   - on ne voit que les chiffres de ses amis (pseudo, rang, totaux, jour) ;
--   - un ami s'ajoute avec son code ami, qu'il a choisi de partager.
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.profils (
  id        uuid primary key references auth.users(id) on delete cascade,
  pseudo    text not null unique check (pseudo ~ '^[[:alnum:]_.-]{2,20}$'),
  code_ami  text not null unique,
  rang      int  not null default 0 check (rang between 0 and 50),
  acquises  int  not null default 0 check (acquises between 0 and 10000),
  reussite  int  not null default 0 check (reussite between 0 and 100),
  serie     int  not null default 0 check (serie between 0 and 100000),
  maj       timestamptz not null default now()
);

create table if not exists public.amities (
  user_id uuid not null references public.profils(id) on delete cascade,
  ami_id  uuid not null references public.profils(id) on delete cascade,
  cree    timestamptz not null default now(),
  primary key (user_id, ami_id),
  check (user_id <> ami_id)
);

create table if not exists public.jours (
  user_id   uuid not null references public.profils(id) on delete cascade,
  jour      date not null,
  exercices int  not null default 0 check (exercices between 0 and 5000),
  justes    int  not null default 0 check (justes between 0 and 5000),
  nouvelles int  not null default 0 check (nouvelles between 0 and 5000),
  primary key (user_id, jour)
);

create table if not exists public.progressions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  donnees jsonb not null check (pg_column_size(donnees) < 2000000),
  maj     timestamptz not null default now()
);

-- Essais d'ajout d'ami : limite les tentatives pour qu'on ne puisse pas deviner les codes.
create table if not exists public.essais_ami (
  user_id uuid not null references auth.users(id) on delete cascade,
  quand   timestamptz not null default now()
);
create index if not exists essais_ami_user on public.essais_ami (user_id, quand);

-- Visites (mesure d'audience anonyme) : un identifiant d'appareil tiré au hasard par l'appli, le jour,
-- le nombre d'ouvertures et si l'appareil a un compte. Ni adresse IP, ni nom, ni e-mail.
create table if not exists public.visites (
  jour        date    not null,
  appareil    uuid    not null,
  ouvertures  int     not null default 1 check (ouvertures between 1 and 500),
  compte      boolean not null default false,
  primary key (jour, appareil)
);
-- Statistiques de jeu (anonymes) : même identifiant d'appareil tiré au hasard que pour les visites.
-- Une ligne par jour, heure, appareil, plante, type d'exercice, organe photographié et mode, avec des compteurs.
create table if not exists public.jeu (
  jour      date     not null,
  heure     smallint not null check (heure between 0 and 23),
  appareil  uuid     not null,
  espece    text     not null,
  categorie text     not null,
  exercice  text     not null,   -- qcm, saisie, photos
  organe    text     not null,   -- plante, feuillage, fleurs, fruits, autre, photos
  mode      text     not null,   -- classique, arbre, arbuste…, famille, erreurs, revoir, paire
  vues      int      not null default 0,
  justes    int      not null default 0,
  acquises  int      not null default 0,
  secondes  int      not null default 0,
  primary key (jour, heure, appareil, espece, exercice, organe, mode)
);
-- Confusions : plante montrée, plante répondue à la place.
create table if not exists public.jeu_confusions (
  jour      date not null,
  appareil  uuid not null,
  espece    text not null,
  reponse   text not null,
  fois      int  not null default 0,
  primary key (jour, appareil, espece, reponse)
);
create index if not exists jeu_appareil on public.jeu (appareil, jour);
create index if not exists amities_ami on public.amities (ami_id);

-- Aucune lecture ni écriture directe : seules les fonctions y accèdent.
alter table public.profils      enable row level security;
alter table public.amities      enable row level security;
alter table public.jours        enable row level security;
alter table public.progressions enable row level security;
alter table public.essais_ami   enable row level security;
alter table public.visites      enable row level security;
alter table public.jeu          enable row level security;
alter table public.jeu_confusions enable row level security;
revoke all on public.profils, public.amities, public.jours, public.progressions, public.essais_ami, public.visites,
  public.jeu, public.jeu_confusions from anon, authenticated;

-- ---------- Outils internes ----------
create or replace function public._moi() returns uuid
language plpgsql stable set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NON_CONNECTE'; end if;
  return auth.uid();
end $$;

-- Code ami : « RPL- » + 5 caractères sans ambiguïté (pas de 0/O, 1/I/L), soit 28 millions de codes.
create or replace function public._nouveau_code() returns text
language plpgsql volatile set search_path = public as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := 'RPL-';
    for i in 1..5 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from profils where code_ami = c);
  end loop;
  return c;
end $$;

create or replace function public._profil_json(p profils) returns json
language sql stable as $$
  select json_build_object('pseudo', p.pseudo, 'code_ami', p.code_ami, 'rang', p.rang,
    'acquises', p.acquises, 'reussite', p.reussite, 'serie', p.serie)
$$;

-- ---------- Profil ----------
-- Mon profil, ou null si je n'ai pas encore choisi de pseudo.
create or replace function public.mon_profil() returns json
language plpgsql stable security definer set search_path = public as $$
declare p profils;
begin
  select * into p from profils where id = _moi();
  if not found then return null; end if;
  return _profil_json(p);
end $$;

-- Crée mon profil (premier passage) ou change mon pseudo.
create or replace function public.choisir_pseudo(p_pseudo text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare p profils; ps text := btrim(p_pseudo);
begin
  if ps !~ '^[[:alnum:]_.-]{2,20}$' then raise exception 'PSEUDO_INVALIDE'; end if;
  if exists (select 1 from profils where lower(pseudo) = lower(ps) and id <> _moi()) then raise exception 'PSEUDO_PRIS'; end if;
  insert into profils (id, pseudo, code_ami) values (_moi(), ps, _nouveau_code())
  on conflict (id) do update set pseudo = excluded.pseudo
  returning * into p;
  return _profil_json(p);
end $$;

-- Publie mes chiffres : totaux du profil et ligne du jour (jour local de l'appareil, ± 1 jour).
create or replace function public.publier(p_jour date, p_exercices int, p_justes int, p_nouvelles int,
  p_rang int, p_acquises int, p_reussite int, p_serie int) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not exists (select 1 from profils where id = _moi()) then raise exception 'SANS_PROFIL'; end if;
  if p_jour < current_date - 1 or p_jour > current_date + 1 then raise exception 'JOUR_INVALIDE'; end if;
  update profils set rang = greatest(0, least(p_rang, 50)), acquises = greatest(0, least(p_acquises, 10000)),
    reussite = greatest(0, least(p_reussite, 100)), serie = greatest(0, least(p_serie, 100000)), maj = now()
  where id = _moi();
  insert into jours (user_id, jour, exercices, justes, nouvelles)
  values (_moi(), p_jour, greatest(0, least(p_exercices, 5000)), greatest(0, least(p_justes, p_exercices, 5000)), greatest(0, least(p_nouvelles, 5000)))
  on conflict (user_id, jour) do update set exercices = excluded.exercices, justes = excluded.justes, nouvelles = excluded.nouvelles;
end $$;

-- ---------- Amis ----------
-- Ajoute un ami avec son code (dans les deux sens). 20 essais par heure au plus.
-- Réponse : {pseudo} si c'est fait, {erreur: CODE_INCONNU | SOI_MEME} sinon.
create or replace function public.ajouter_ami(p_code text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')); a profils;
begin
  if not exists (select 1 from profils where id = _moi()) then raise exception 'SANS_PROFIL'; end if;
  if (select count(*) from essais_ami where user_id = _moi() and quand > now() - interval '1 hour') >= 20 then
    raise exception 'TROP_D_ESSAIS';
  end if;
  insert into essais_ami (user_id) values (_moi());
  if c !~ '^RPL' then c := 'RPL' || c; end if;
  c := 'RPL-' || substr(c, 4);
  select * into a from profils where code_ami = c;
  -- pas d'exception ici : elle annulerait aussi l'essai enregistré ci-dessus (et donc la limite)
  if not found then return json_build_object('erreur', 'CODE_INCONNU'); end if;
  if a.id = _moi() then return json_build_object('erreur', 'SOI_MEME'); end if;
  insert into amities (user_id, ami_id) values (_moi(), a.id), (a.id, _moi()) on conflict do nothing;
  return json_build_object('pseudo', a.pseudo);
end $$;

-- Retire un ami (dans les deux sens).
create or replace function public.retirer_ami(p_pseudo text) returns void
language plpgsql volatile security definer set search_path = public as $$
declare a uuid;
begin
  select id into a from profils where pseudo = p_pseudo;
  if a is null then return; end if;
  delete from amities where (user_id = _moi() and ami_id = a) or (user_id = a and ami_id = _moi());
end $$;

-- Tableau du jour : moi et mes amis, avec les chiffres du jour demandé.
create or replace function public.tableau(p_jour date) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((
    select json_agg(json_build_object('pseudo', p.pseudo, 'moi', p.id = _moi(), 'rang', p.rang,
      'acquises', p.acquises, 'reussite', p.reussite, 'serie', p.serie,
      'exercices', coalesce(j.exercices, 0), 'justes', coalesce(j.justes, 0), 'nouvelles', coalesce(j.nouvelles, 0))
      order by coalesce(j.exercices, 0) desc, p.pseudo)
    from profils p
    left join jours j on j.user_id = p.id and j.jour = p_jour
    where p.id = _moi() or p.id in (select ami_id from amities where user_id = _moi())
  ), '[]'::json);
end $$;

-- Tableau sur une période (cette semaine, ce mois-ci) : totaux de chacun, et nombre de jours joués. 62 jours au plus.
create or replace function public.tableau_periode(p_debut date, p_fin date) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if p_debut is null or p_fin is null or p_fin < p_debut or p_fin - p_debut > 62 then raise exception 'PERIODE_INVALIDE'; end if;
  return coalesce((
    select json_agg(json_build_object('pseudo', p.pseudo, 'moi', p.id = _moi(), 'rang', p.rang,
      'acquises', p.acquises, 'reussite', p.reussite, 'serie', p.serie,
      'exercices', coalesce(t.exercices, 0), 'justes', coalesce(t.justes, 0), 'nouvelles', coalesce(t.nouvelles, 0), 'jours', coalesce(t.jours, 0))
      order by coalesce(t.exercices, 0) desc, p.pseudo)
    from profils p
    left join lateral (select sum(j.exercices)::int exercices, sum(j.justes)::int justes, sum(j.nouvelles)::int nouvelles,
                              count(*) filter (where j.exercices > 0)::int jours
                       from jours j where j.user_id = p.id and j.jour between p_debut and p_fin) t on true
    where p.id = _moi() or p.id in (select ami_id from amities where user_id = _moi())
  ), '[]'::json);
end $$;

-- Rattrapage des jours passés (joués hors ligne, ou sur un autre appareil) : les 35 derniers jours au plus,
-- d'après l'historique de la progression ; « publier » ne garde que le jour même.
create or replace function public.publier_jours(p_jours jsonb) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not exists (select 1 from profils where id = _moi()) then raise exception 'SANS_PROFIL'; end if;
  if jsonb_typeof(p_jours) <> 'array' or jsonb_array_length(p_jours) > 40 then return; end if;
  insert into jours (user_id, jour, exercices, justes, nouvelles)
  select _moi(), x.j, greatest(0, least(max(x.n), 5000)), greatest(0, least(max(coalesce(x.ok, 0)), max(x.n), 5000)), greatest(0, least(max(coalesce(x.na, 0)), 5000))
  from jsonb_to_recordset(p_jours) as x(j date, n int, ok int, na int)
  where x.j between current_date - 35 and current_date + 1 and x.n is not null
  group by x.j
  on conflict (user_id, jour) do update set exercices = greatest(jours.exercices, excluded.exercices),
    justes = greatest(jours.justes, excluded.justes), nouvelles = greatest(jours.nouvelles, excluded.nouvelles);
end $$;

-- ---------- Sauvegarde de la progression ----------
create or replace function public.sauver_progression(p_donnees jsonb) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  insert into progressions (user_id, donnees, maj) values (_moi(), p_donnees, now())
  on conflict (user_id) do update set donnees = excluded.donnees, maj = now();
end $$;

create or replace function public.lire_progression() returns jsonb
language sql stable security definer set search_path = public as $$
  select donnees from progressions where user_id = _moi()
$$;

-- ---------- Supprimer mon compte (et toutes mes données) ----------
create or replace function public.supprimer_compte() returns void
language plpgsql volatile security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = _moi();
end $$;

-- ---------- Visites ----------
-- Compte une ouverture de l'appli (visiteur avec ou sans compte). Jour accepté : hier, aujourd'hui ou demain
-- (fuseaux horaires) ; 500 ouvertures au plus par appareil et par jour.
create or replace function public.compter_visite(p_appareil uuid, p_jour date, p_compte boolean) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if p_appareil is null or p_jour is null or p_jour not between current_date - 1 and current_date + 1 then return; end if;
  insert into visites (jour, appareil, compte) values (p_jour, p_appareil, coalesce(p_compte, false))
  on conflict (jour, appareil) do update
    set ouvertures = least(visites.ouvertures + 1, 500), compte = visites.compte or excluded.compte;
end $$;

-- Statistiques, à lire dans Supabase (SQL Editor) : « select * from visites_par_jour; »
create or replace view public.visites_par_jour with (security_invoker = true) as
  select jour, count(*) as appareils, sum(ouvertures) as ouvertures, count(*) filter (where compte) as avec_compte
  from public.visites group by jour order by jour desc;
revoke all on public.visites_par_jour from public, anon, authenticated;

-- ---------- Statistiques de jeu ----------
-- Reçoit un paquet de compteurs déjà regroupés par l'appli (400 lignes au plus par envoi).
-- Jours acceptés : la semaine passée (paquets gardés hors ligne) ; valeurs vérifiées ; plafonds par ligne et par appareil.
create or replace function public.envoyer_jeu(p_appareil uuid, p_jeu jsonb, p_confusions jsonb) returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  nom constant text := '^[A-Z][a-z]+( [a-z×-]+){0,3}$';
begin
  if p_appareil is null then return; end if;
  if (select count(*) from jeu where appareil = p_appareil and jour >= current_date - 1) > 4000 then return; end if;
  if jsonb_typeof(p_jeu) = 'array' and jsonb_array_length(p_jeu) <= 400 then
    insert into jeu (jour, heure, appareil, espece, categorie, exercice, organe, mode, vues, justes, acquises, secondes)
    select x.j, x.h, p_appareil, x.e, min(x.c), x.x, x.o, x.m,
           least(sum(x.v), 500), least(sum(greatest(x.ok, 0)), sum(x.v), 500),
           least(sum(greatest(x.a, 0)), sum(x.v)), least(sum(greatest(x.s, 0)), sum(x.v) * 120)
    from jsonb_to_recordset(p_jeu) as x(j date, h int, e text, c text, x text, o text, m text, v int, ok int, a int, s int)
    where x.j between current_date - 7 and current_date + 1 and x.h between 0 and 23 and x.v between 1 and 500
      and x.e ~ nom and length(x.e) <= 60
      and x.c in ('arbre', 'conifère', 'arbuste', 'grimpante', 'graminée', 'vivace')
      and x.x in ('qcm', 'saisie', 'photos')
      and x.o in ('plante', 'feuillage', 'fleurs', 'fruits', 'autre', 'photos')
      and x.m in ('classique', 'arbre', 'arbuste', 'vivace', 'grimpante', 'graminée', 'famille', 'erreurs', 'revoir', 'paire')
    group by x.j, x.h, x.e, x.x, x.o, x.m
    on conflict (jour, heure, appareil, espece, exercice, organe, mode) do update
      set vues = least(jeu.vues + excluded.vues, 5000), justes = least(jeu.justes + excluded.justes, 5000),
          acquises = least(jeu.acquises + excluded.acquises, 5000), secondes = least(jeu.secondes + excluded.secondes, 600000);
  end if;
  if jsonb_typeof(p_confusions) = 'array' and jsonb_array_length(p_confusions) <= 400 then
    insert into jeu_confusions (jour, appareil, espece, reponse, fois)
    select x.j, p_appareil, x.e, x.r, least(sum(x.n), 500)
    from jsonb_to_recordset(p_confusions) as x(j date, e text, r text, n int)
    where x.j between current_date - 7 and current_date + 1 and x.n between 1 and 500
      and x.e ~ nom and x.r ~ nom and length(x.e) <= 60 and length(x.r) <= 60 and x.e <> x.r
    group by x.j, x.e, x.r
    on conflict (jour, appareil, espece, reponse) do update set fois = least(jeu_confusions.fois + excluded.fois, 5000);
  end if;
end $$;

-- Tableaux récap, à lire dans Supabase (SQL Editor), par exemple « select * from jeu_par_jour; ».
-- Exercices du quiz et des entraînements confondus ; « réussite » en pour cent.
create or replace view public.jeu_par_jour with (security_invoker = true) as
  select jour, count(distinct appareil) as joueurs, sum(vues) as exercices, sum(justes) as justes, sum(vues) - sum(justes) as fautes,
         round(100.0 * sum(justes) / nullif(sum(vues), 0)) as reussite,
         round(1.0 * sum(vues) / nullif(count(distinct appareil), 0), 1) as exos_par_joueur,
         sum(acquises) as plantes_acquises, round(1.0 * sum(secondes) / nullif(sum(vues), 0), 1) as secondes_par_exo
  from public.jeu group by jour order by jour desc;
create or replace view public.especes_vues with (security_invoker = true) as
  select espece, min(categorie) as categorie, sum(vues) as vues, sum(justes) as justes, sum(vues) - sum(justes) as fautes,
         round(100.0 * sum(justes) / nullif(sum(vues), 0)) as reussite, count(distinct appareil) as joueurs
  from public.jeu group by espece order by vues desc, espece;
create or replace view public.especes_ratees with (security_invoker = true) as
  select * from public.especes_vues where vues >= 10 order by reussite, vues desc;
create or replace view public.confusions with (security_invoker = true) as
  select espece as plante_montree, reponse as reponse_donnee, sum(fois) as fois, count(distinct appareil) as joueurs
  from public.jeu_confusions group by espece, reponse order by fois desc, espece;
create or replace view public.par_exercice with (security_invoker = true) as
  select v.critere, v.valeur, sum(j.vues) as exercices, round(100.0 * sum(j.justes) / nullif(sum(j.vues), 0)) as reussite,
         round(1.0 * sum(j.secondes) / nullif(sum(j.vues), 0), 1) as secondes_par_exo, count(distinct j.appareil) as joueurs
  from public.jeu j
  cross join lateral (values ('1 exercice', j.exercice), ('2 organe', j.organe), ('3 mode', j.mode), ('4 catégorie', j.categorie)) as v(critere, valeur)
  group by v.critere, v.valeur order by v.critere, exercices desc;
create or replace view public.par_heure with (security_invoker = true) as
  select heure, sum(vues) as exercices, round(100.0 * sum(justes) / nullif(sum(vues), 0)) as reussite, count(distinct appareil) as joueurs
  from public.jeu group by heure order by heure;
revoke all on public.jeu_par_jour, public.especes_vues, public.especes_ratees, public.confusions, public.par_exercice, public.par_heure
  from public, anon, authenticated;

-- ---------- Droits : seules les fonctions publiques, et seulement une fois connecté ----------
revoke all on function public._moi(), public._nouveau_code(), public._profil_json(profils) from public, anon, authenticated;
revoke all on function public.mon_profil(), public.choisir_pseudo(text), public.publier(date, int, int, int, int, int, int, int),
  public.ajouter_ami(text), public.retirer_ami(text), public.tableau(date), public.tableau_periode(date, date), public.publier_jours(jsonb), public.sauver_progression(jsonb),
  public.lire_progression(), public.supprimer_compte() from public, anon;
revoke all on function public.compter_visite(uuid, date, boolean) from public;
grant execute on function public.compter_visite(uuid, date, boolean) to anon, authenticated;
revoke all on function public.envoyer_jeu(uuid, jsonb, jsonb) from public;
grant execute on function public.envoyer_jeu(uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.mon_profil(), public.choisir_pseudo(text), public.publier(date, int, int, int, int, int, int, int),
  public.ajouter_ami(text), public.retirer_ami(text), public.tableau(date), public.tableau_periode(date, date), public.publier_jours(jsonb), public.sauver_progression(jsonb),
  public.lire_progression(), public.supprimer_compte() to authenticated;
