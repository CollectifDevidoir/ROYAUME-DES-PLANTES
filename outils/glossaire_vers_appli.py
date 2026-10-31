# Glossaire botanique : donnees/glossaire.csv → table GLO de index.html.
# Contrôle le fichier avant de l'écrire :
#   - en-tête, identifiants uniques, catégorie connue, schéma connu, renvois « Voir aussi » existants ;
#   - définition courte (160 caractères au plus), sans balise ;
#   - au moins une source « Nom : https://… », prise dans la liste des sites de référence ci-dessous, et une date de vérification ;
#   - aucune variante partagée par deux entrées (un mot cliquable ouvre toujours la même définition).
# Usage : python3 outils/glossaire_vers_appli.py [--ecrire]   (sans option : contrôle et bilan, rien n'est modifié ; --table : la table GLO attendue)
import csv,json,re,sys,pathlib
R=pathlib.Path(__file__).resolve().parent.parent
H=['Identifiant','Terme','Variantes','Catégorie','Définition','Sources','Voir aussi','Schéma','Exclusions','Vérifié le']
CAT={'feuilles':'Feuilles','tiges':'Tiges, écorce et racines','port':'Port et cycle de vie','fleurs':'Fleurs et inflorescences',
     'fruits':'Fruits et graines','noms':'Noms et classification','milieux':'Origine et milieux','sols':'Sol, exposition et rusticité'}
SCH={'','feuille','dispo','composee','fleur','infl'}
SITES=('www.tela-botanica.org','fr.wikipedia.org','fr.wiktionary.org','www.rhs.org.uk','planthardiness.ars.usda.gov','vitrinelinguistique.oqlf.gouv.qc.ca')
MAX=160
def lire():
    f=open(R/'donnees'/'glossaire.csv',encoding='utf-8',newline='');r=csv.DictReader(f,delimiter=';')
    if r.fieldnames!=H:sys.exit('En-tête inattendu : '+';'.join(r.fieldnames or []))
    return list(r)
liste=lambda s:[x.strip() for x in s.split(',') if x.strip()]
def controle(rows):
    err=[];ids={r['Identifiant'] for r in rows};vus=set();var={}
    for i,r in enumerate(rows,2):
        k=r['Identifiant'];e=lambda m:err.append(f'ligne {i} ({k}) : {m}')
        if not re.fullmatch(r'[a-z]+',k):e('identifiant : lettres minuscules sans accent')
        if k in vus:e('identifiant en double')
        vus.add(k)
        if r['Catégorie'] not in CAT:e('catégorie inconnue')
        if r['Schéma'] not in SCH:e('schéma inconnu')
        d=r['Définition'].strip()
        if not d or len(d)>MAX:e(f'définition vide ou trop longue ({len(d)} > {MAX})')
        if re.search(r'[<>]',d+r['Terme']):e('balise interdite')
        S=[x.strip() for x in r['Sources'].split(' ; ') if x.strip()]
        if not S:e('aucune source')
        for s in S:
            m=re.fullmatch(r'(.+?) : (https://([^/\s]+)/\S*)',s)
            if not m:e(f'source mal écrite : {s}')
            elif m.group(3) not in SITES:e(f'site hors de la liste de référence : {m.group(3)}')
        if not re.fullmatch(r'\d{4}-\d\d-\d\d',r['Vérifié le']):e('date de vérification absente')
        for v in liste(r['Voir aussi']):
            if v not in ids:e(f'renvoi inconnu : {v}')
        V=liste(r['Variantes'])
        if not V:e('aucune variante')
        for v in V:
            c=v if re.search(r'[A-Z]',v) else v.lower()
            if c in var:e(f'variante « {v} » déjà prise par {var[c]}')
            var[c]=k
    return err
def table(rows):
    return {'c':CAT,'t':[[r['Identifiant'],r['Terme'],liste(r['Variantes']),r['Catégorie'],r['Définition'].strip(),
        [list(re.fullmatch(r'(.+?) : (\S+)',s.strip()).groups()) for s in r['Sources'].split(' ; ') if s.strip()],
        liste(r['Voir aussi']),r['Schéma'],liste(r['Exclusions'])] for r in rows]}
if __name__=='__main__':
    rows=lire();err=controle(rows)
    if '--table' in sys.argv:print(json.dumps(table(rows),ensure_ascii=False));sys.exit(1 if err else 0)
    for x in err:print('ERREUR',x)
    n={c:sum(r['Catégorie']==c for r in rows) for c in CAT}
    print(len(rows),'entrées :',', '.join(f'{CAT[c]} {n[c]}' for c in CAT))
    if err:sys.exit(1)
    if '--ecrire' in sys.argv:
        p=R/'index.html';s=p.read_text(encoding='utf-8')
        js='const GLO='+json.dumps(table(rows),ensure_ascii=False,separators=(',',':'))+';\n'
        m=re.search(r'^const GLO=.*;\n',s,re.M)
        s=s[:m.start()]+js+s[m.end():] if m else s.replace('\nconst FX=','\n'+js+'const FX=',1)
        p.write_text(s,encoding='utf-8');print('index.html mis à jour : table GLO,',len(js)//1024,'Ko')
