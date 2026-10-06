# Étape 9 : recopie les clés revues (donnees/cles-revues.csv) dans index.html, entre les marqueurs du bloc « Étape 9 ».
# Usage : python3 outils/cles_vers_appli.py   (vérifie aussi les règles : 3 à 5 clés, 55 caractères au plus)
import csv,json,re,sys,pathlib
R=pathlib.Path(__file__).resolve().parent.parent
rows=list(csv.DictReader(open(R/'donnees/cles-revues.csv',encoding='utf-8'),delimiter=';'))
err=[]
for r in rows:
    k=[x.strip() for x in r['Clés revues'].split(' ; ')]
    if not 3<=len(k)<=5: err.append(f"{r['Nom latin']} : {len(k)} clés")
    for x in k:
        if len(x)>55: err.append(f"{r['Nom latin']} : clé trop longue ({len(x)}) « {x} »")
    if not r['Sources des clés'].strip(): err.append(f"{r['Nom latin']} : pas de source")
if err: print('\n'.join(err)); sys.exit(1)
s=(R/'index.html').read_text(encoding='utf-8')
a=s.index('// Étape 9 : clés revues et sourcées');b=s.index('});\n',a)+4
blk="// Étape 9 : clés revues et sourcées (Tela Botanica, Jardin ! l'Encyclopédie). Sources : donnees/cles-revues.csv (bloc régénéré par outils/cles_vers_appli.py)\nObject.assign(Q,{\n"+",\n".join(json.dumps(r['Nom latin'],ensure_ascii=False)+":"+json.dumps(' ; '.join(x.strip() for x in r['Clés revues'].split(' ; ')),ensure_ascii=False) for r in rows)+"\n});\n"
(R/'index.html').write_text(s[:a]+blk+s[b:],encoding='utf-8')
print(len(rows),'espèces recopiées')
