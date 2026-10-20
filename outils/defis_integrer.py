#!/usr/bin/env python3
"""Publie le planning du Défi du jour SANS toucher à const DQ (les 30 séries en ligne) ni aux réponses enregistrées.

Par défaut : essai à blanc (aucun fichier modifié), il affiche ce qui serait fait. Avec --ecrire, il :
  1. écrit le planning dans donnees/defis.json ({"debut":"AAAA-MM-JJ","s":[…]}), chargé par l'appli à l'ouverture du défi ;
  2. met à jour la ligne « const DQPI={debut:…,n:…}; » de index.html : l'appli refuse un fichier qui ne lui correspond pas.
  Un jour compris dans le planning a sa série ; tout autre jour (avant le début, ou après la fin) garde la série du cycle de 30 jours.
Usage : python3 outils/defis_integrer.py [--ecrire] [--index fichier.html] [--planning donnees/defis-v3/planning-90j-format-DQ.json] [--debut AAAA-MM-JJ]
Le premier jour du planning doit être POSTÉRIEUR au jour de mise en ligne : la série d'un jour déjà commencé ne change jamais.
"""
import json, os, re, sys, datetime

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
INDEX = os.path.join(RAC, arg('--index', 'index.html'))
PLAN = os.path.join(RAC, arg('--planning', 'donnees/defis-v3/planning-90j-format-DQ.json'))
META = os.path.join(RAC, 'donnees/defis-v3/planning-90j.json')
debut = arg('--debut', json.load(open(META, encoding='utf8'))['debut'])
ECRIRE = '--ecrire' in sys.argv

series = json.load(open(PLAN, encoding='utf8'))
assert all(len(s) == 10 for s in series), 'chaque série doit compter 10 questions'
for s in series:
    for q in s:
        assert len(q['choix']) == 4 and 0 <= q['bonne'] < 4 and q['question'] and q['explication'], q
assert datetime.date.fromisoformat(debut) > datetime.date.today() or not ECRIRE, "le premier jour du planning doit être postérieur à aujourd'hui"

h = open(INDEX, encoding='utf8').read()
SORTIE = os.path.join(RAC, 'donnees', 'defis.json')
dqpi = 'const DQPI={debut:' + json.dumps(debut) + ',n:' + str(len(series)) + '};'
assert len(re.findall(r'^const DQ=.*;$', h, flags=re.M)) == 1, 'const DQ= introuvable ou en double'
assert len(re.findall(r'^const DQPI=\{.*?\};', h, flags=re.M)) == 1, 'const DQPI= introuvable ou en double'
assert re.search(r'^const dfSerie=.*DQP\.s\[k\]', h, flags=re.M), 'const dfSerie= ne lit pas le planning'
h2 = re.sub(r'^const DQPI=\{.*?\};', lambda m: dqpi, h, count=1, flags=re.M)
fichier = json.dumps({'debut': debut, 's': series}, ensure_ascii=False, separators=(',', ':')) + '\n'
print(f"planning : {len(series)} séries de 10 questions, du {debut} au {(datetime.date.fromisoformat(debut) + datetime.timedelta(days=len(series) - 1)).isoformat()}")
print(f"donnees/defis.json : {len(fichier.encode()):,} octets ; index.html : {dqpi}")
if ECRIRE:
    open(SORTIE, 'w', encoding='utf8').write(fichier); open(INDEX, 'w', encoding='utf8').write(h2); print('écrit :', SORTIE, 'et', INDEX)
else:
    print('essai à blanc : rien n\'a été écrit (ajouter --ecrire)')
