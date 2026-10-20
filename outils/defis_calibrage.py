#!/usr/bin/env python3
"""Difficulté réelle des questions du Défi du jour, d'après les réponses des joueurs (table defis, colonne reponses).

La table defis n'est lisible que par le service (accès fermé aux comptes) : on exporte donc des TOTAUX, sans pseudo, depuis
l'éditeur SQL de Supabase, puis on les passe à ce script. Requête à exécuter (lecture seule) :

  select d.jour, p.pos as position, count(*) as n, sum(substr(d.reponses, p.pos, 1)::int) as justes
  from public.defis d cross join generate_series(1, 10) as p(pos)
  group by d.jour, p.pos order by d.jour, p.pos;

Exporter en CSV (colonnes jour, position, n, justes), puis :
  python3 outils/defis_calibrage.py defis-totaux.csv [--depuis AAAA-MM-JJ] [--min 30]

--depuis : premier jour joué avec les séries actuelles de donnees/defis-questions.json (les jours antérieurs, joués avec d'autres
questions, fausseraient les taux). Écrit donnees/defis-calibrage.json. Ne modifie ni les questions ni les séries.

Limites à garder en tête : seuls les comptes connectés ayant terminé les 10 questions sont enregistrés (les autres joueurs et ceux
qui abandonnent n'y sont pas) ; l'ordre des questions suit le niveau supposé, donc position et niveau sont mêlés ; le serveur ne
garde pas la proposition choisie, on ne peut donc pas mesurer l'attrait de chaque distracteur.
"""
import csv, sys, json, os, math, hashlib, collections, datetime

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
args = sys.argv[1:]
opt = lambda nom, defaut: args[args.index(nom) + 1] if nom in args else defaut
SERIES = json.load(open(os.path.join(RAC, 'donnees', 'defis-questions.json'), encoding='utf8'))['series']
depuis = opt('--depuis', '2026-01-01'); MIN = int(opt('--min', 30))
serie_du = lambda j: round((datetime.date.fromisoformat(j) - datetime.date(2026, 1, 1)).days) % len(SERIES)   # = dfNum() de index.html
fait_id = lambda q: hashlib.sha1((q['question'] + '|' + q.get('texte', '') + '|' + q['choix'][q['bonne']]).encode('utf8')).hexdigest()[:10]
def wilson(k, n, z=1.96):
    if not n: return (None, None)
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); r = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return round((c - r) / d, 3), round((c + r) / d, 3)

agg = collections.defaultdict(lambda: [0, 0, set()])   # (série, position) -> n, justes, jours
for r in csv.DictReader(open(args[0], encoding='utf8')):
    if r['jour'] < depuis: continue
    k = (serie_du(r['jour']), int(r['position'])); a = agg[k]
    a[0] += int(r['n']); a[1] += int(r['justes']); a[2].add(r['jour'])
sortie = []
for (s, pos), (n, k, jours) in sorted(agg.items()):
    q = SERIES[s][pos - 1]; lo, hi = wilson(k, n)
    sortie.append({'id': fait_id(q), 'serie': s, 'position': pos, 'theme': q['theme'], 'niveau_suppose': q['niveau'], 'question': q['question'],
                   'joueurs': n, 'justes': k, 'taux': round(k / n, 3) if n else None, 'ic95': [lo, hi], 'jours_joues': len(jours),
                   'fiable': n >= MIN})
pas_assez = sum(1 for x in sortie if not x['fiable'])
par_niv = {}
for niv in ('simple', 'piege', 'difficile'):
    L = [x for x in sortie if x['niveau_suppose'] == niv]; n = sum(x['joueurs'] for x in L); k = sum(x['justes'] for x in L)
    par_niv[niv] = {'questions': len(L), 'reponses': n, 'taux': round(k / n, 3) if n else None}
json.dump({'depuis': depuis, 'seuil_min_reponses': MIN, 'questions_mesurees': len(sortie), 'dont_trop_peu_de_reponses': pas_assez,
           'par_niveau_suppose': par_niv, 'questions': sortie}, open(os.path.join(RAC, 'donnees', 'defis-calibrage.json'), 'w', encoding='utf8'),
          ensure_ascii=False, indent=1)
print(f"{len(sortie)} questions mesurées sur 300 ; {pas_assez} avec moins de {MIN} réponses (taux non interprétable)")
print('par niveau supposé :', par_niv)
