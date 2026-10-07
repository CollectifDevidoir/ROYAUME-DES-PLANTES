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
create index if not exists amities_ami on public.amities (ami_id);

-- Aucune lecture ni écriture directe : seules les fonctions y accèdent.
alter table public.profils      enable row level security;
alter table public.amities      enable row level security;
alter table public.jours        enable row level security;
alter table public.progressions enable row level security;
alter table public.essais_ami   enable row level security;
revoke all on public.profils, public.amities, public.jours, public.progressions, public.essais_ami from anon, authenticated;

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

-- ---------- Droits : seules les fonctions publiques, et seulement une fois connecté ----------
revoke all on function public._moi(), public._nouveau_code(), public._profil_json(profils) from public, anon, authenticated;
revoke all on function public.mon_profil(), public.choisir_pseudo(text), public.publier(date, int, int, int, int, int, int, int),
  public.ajouter_ami(text), public.retirer_ami(text), public.tableau(date), public.sauver_progression(jsonb),
  public.lire_progression(), public.supprimer_compte() from public, anon;
grant execute on function public.mon_profil(), public.choisir_pseudo(text), public.publier(date, int, int, int, int, int, int, int),
  public.ajouter_ami(text), public.retirer_ami(text), public.tableau(date), public.sauver_progression(jsonb),
  public.lire_progression(), public.supprimer_compte() to authenticated;
