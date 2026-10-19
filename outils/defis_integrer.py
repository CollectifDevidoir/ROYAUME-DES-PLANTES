#!/usr/bin/env python3
"""Intègre le planning de 90 jours dans index.html SANS toucher à const DQ (les 30 séries en ligne) ni aux réponses enregistrées.

Par défaut : essai à blanc (aucun fichier modifié), il affiche ce qui serait fait. Avec --ecrire, il :
  1. insère (ou remplace) la ligne « const DQP={debut:'AAAA-MM-JJ',s:[…]}; » juste après la table DQ ;
  2. remplace la ligne « const dfSerie=… » pour qu'elle lise d'abord le planning : un jour compris dans le planning a sa série, tout autre jour
     (avant le début, ou après les 90 jours) garde la série du cycle de 30 jours comme aujourd'hui.
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
dqp = 'const DQP={debut:' + json.dumps(debut) + ',s:' + json.dumps(series, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '};'
SERIE = ("const dfSerie=d=>{const k=Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(DQP.debut+'T00:00:00Z'))/864e5);"
         "return k>=0&&k<DQP.s.length?DQP.s[k]:(DQ.length?DQ[dfNum(d)]:null)};")
assert len(re.findall(r'^const DQ=.*;$', h, flags=re.M)) == 1, 'const DQ= introuvable ou en double'
assert len(re.findall(r'^const dfSerie=.*$', h, flags=re.M)) == 1, 'const dfSerie= introuvable ou en double'
if re.search(r'^const DQP=', h, flags=re.M): h2 = re.sub(r'^const DQP=.*;$', lambda m: dqp, h, count=1, flags=re.M)
else: h2 = re.sub(r'^(const DQ=.*;)$', lambda m: m.group(1) + '\n' + dqp, h, count=1, flags=re.M)
h2 = re.sub(r'^const dfSerie=.*$', lambda m: SERIE, h2, count=1, flags=re.M)
print(f"planning : {len(series)} séries de 10 questions, du {debut} au {(datetime.date.fromisoformat(debut) + datetime.timedelta(days=len(series) - 1)).isoformat()}")
print(f"index.html : {len(h):,} → {len(h2):,} octets ; const DQ inchangée : {re.search(r'^const DQ=.*;$', h, flags=re.M).group(0) == re.search(r'^const DQ=.*;$', h2, flags=re.M).group(0)}")
if ECRIRE:
    open(INDEX, 'w', encoding='utf8').write(h2); print('écrit :', INDEX)
else:
    print('essai à blanc : rien n\'a été écrit (ajouter --ecrire)')
