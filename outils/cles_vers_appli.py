# Recopie les clés revues (donnees/cles-revues.csv) dans index.html : régénère l'objet Q (« Ce qu'il faut regarder »)
# et la liste QS (sources de ces clés, dans l'ordre des espèces de Q, affichées dans « Sources et crédits » de la fiche).
# Usage : python3 outils/cles_vers_appli.py   (vérifie aussi les règles : 3 à 5 clés, 55 caractères au plus, au moins une source http)
import csv,json,re,sys,pathlib
R=pathlib.Path(__file__).resolve().parent.parent
rows=list(csv.DictReader(open(R/'donnees/cles-revues.csv',encoding='utf-8'),delimiter=';'))
# Débuts d'adresse fréquents, remplacés par « ^a », « ^b »… dans QS pour alléger le fichier (même liste que const QP dans index.html)
QP=['https://tela-botanica.org/eflore/?action=fiche&module=fiche&referentiel=bdtfx&onglet=description&num_nom=',
    'https://tela-botanica.org/eflore/?action=fiche&module=fiche&referentiel=bdtfx&onglet=synthese&num_nom=','https://tela-botanica.org/',
    'https://www.tela-botanica.org/bdtfx-nn-','https://www.tela-botanica.org/','http://nature.jardin.free.fr/',
    'https://www.rhs.org.uk/plants/','https://en.wikipedia.org/wiki/','https://plants.ces.ncsu.edu/plants/',
    'https://www.jardiner-malin.fr/fiche/','https://www.treesandshrubsonline.org/articles/','https://www.ncbi.nlm.nih.gov/pmc/']
srcs=lambda r:[u.strip() for u in r['Sources des clés'].split('|') if u.strip()]
err=[]
for r in rows:
    k=[x.strip() for x in r['Clés revues'].split(' ; ')]
    if not 3<=len(k)<=5: err.append(f"{r['Nom latin']} : {len(k)} clés")
    for x in k:
        if len(x)>55: err.append(f"{r['Nom latin']} : clé trop longue ({len(x)}) « {x} »")
    u=srcs(r)
    if not u: err.append(f"{r['Nom latin']} : pas de source")
    for x in u:
        if not re.match(r'https?://[^|^\n]+$',x): err.append(f"{r['Nom latin']} : source illisible « {x} »")
if err: print('\n'.join(err)); sys.exit(1)
def court(u):
    u=u.replace(' ','%20')   # quelques adresses contiennent des espaces
    for i,p in enumerate(QP):
        if u.startswith(p): return '^'+chr(97+i)+u[len(p):]   # ^a = QP[0], ^b = QP[1]…
    return u
s=(R/'index.html').read_text(encoding='utf-8')
TITRE="// Clés « Ce qu'il faut regarder », revues et sourcées (étape 9). Données : donnees/cles-revues.csv ; bloc régénéré par outils/cles_vers_appli.py"
TITRE2="// Sources des clés, dans l'ordre des espèces de Q (« ^a » = QP[0], « ^b » = QP[1]…). Même fichier, même outil"
a=s.index(TITRE);b=s.index('\n};\n',a)+4
if s.startswith('// Sources des clés',b): b=s.index('\n];\n',b)+4
blk=TITRE+"\nconst Q={\n"+",\n".join(json.dumps(r['Nom latin'],ensure_ascii=False)+":"+json.dumps(' ; '.join(x.strip() for x in r['Clés revues'].split(' ; ')),ensure_ascii=False) for r in rows)+"\n};\n"
blk+=TITRE2+"\nconst QP="+json.dumps(QP)+",QS=[\n"+",\n".join(json.dumps('|'.join(court(u) for u in srcs(r)),ensure_ascii=False) for r in rows)+"\n];\n"
(R/'index.html').write_text(s[:a]+blk+s[b:],encoding='utf-8')
print(len(rows),'espèces recopiées, sources :',len(blk.split(TITRE2)[1]),'caractères')
