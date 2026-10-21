# Milieux et habitats (territoires et sous-milieux de la nomenclature v1.0) : donnees/milieux-habitats.csv → table MH de index.html.
# Vérifie le fichier contre donnees/milieux/nomenclature.json et contre les espèces du jeu (table Q) :
#   - codes de territoire, sous-milieu, contexte, force et confiance de la nomenclature, territoire permis pour le sous-milieu ;
#   - une association « verified » a sa source (URL), son extrait et sa date ; une exotique n'apparaît qu'en contexte cultivé (R10) ;
#   - chaque espèce du jeu a au moins une association vérifiée (renseignement obligatoire), aucune espèce inconnue, pas de doublon.
# Seules les associations vérifiées entrent dans l'appli ; celles « needs_review » restent dans le fichier, non affichées.
# Usage : python3 outils/habitats_vers_appli.py [--ecrire]   (sans option : contrôle et bilan, rien n'est modifié ; --table : la table MH attendue ;
#   --partiel : tolère les espèces encore sans association vérifiée, pendant le sourçage)
# À relancer avec --ecrire après tout ajout d'espèces (outils/ajout_especes.py refuse une espèce sans association vérifiée).
import csv,json,re,sys,pathlib,collections
R=pathlib.Path(__file__).resolve().parent.parent;D=R/'donnees'
N=json.load(open(D/'milieux'/'nomenclature.json',encoding='utf-8'))
SM={x['id']:x for x in N['sous_milieux']};TE={x['id']:x for x in N['territoires']}
H=['Nom latin','Statut','Territoire','Sous-milieu','Contexte','Force','EUNIS','Source','Extrait','Vérifié le','Confiance','Remarque']
def lire():
    f=open(D/'milieux-habitats.csv',encoding='utf-8',newline='');r=csv.DictReader(f,delimiter=';')
    if r.fieldnames!=H:sys.exit('En-tête inattendu : '+';'.join(r.fieldnames or []))
    return list(r)
def especes(s):
    qa=s.index('const Q={');return set(re.findall(r'^"([^"]+)":',s[qa:s.index('\n};',qa)],re.M))
def controle(rows,noms):
    err=[];vus=set()
    for i,r in enumerate(rows,2):
        n,t,sm,v=r['Nom latin'],r['Territoire'],r['Sous-milieu'],r['Confiance']
        def e(m):err.append(f'ligne {i} ({n} {sm}) : {m}')
        if n not in noms:e('espèce absente du jeu')
        if sm not in SM:e('sous-milieu hors nomenclature');continue
        if t not in TE or t not in SM[sm]['territoires']:e(f'territoire {t} non permis pour {sm}')
        if r['Contexte'] not in N['contextes']:e('contexte hors nomenclature')
        if r['Force'] not in N['forces']:e('force hors nomenclature')
        if v not in N['confiances']:e('confiance hors nomenclature')
        if r['EUNIS']!=SM[sm]['eunis'][0]:e('lettre EUNIS différente de celle du sous-milieu')
        if v=='verified' and not(re.match(r'https?://\S+$',r['Source']) and r['Extrait'].strip() and re.match(r'\d{4}-\d\d-\d\d$',r['Vérifié le'])):e('vérifiée sans source, extrait ou date')
        if r['Statut'].startswith('exotique') and r['Contexte']!='cultive_ou_plante':e('exotique hors contexte cultivé (règle R10)')
        k=(n,sm,r['Contexte'])
        if k in vus:e('doublon')
        vus.add(k)
    ok={r['Nom latin'] for r in rows if r['Confiance']=='verified'}
    err+=[f'{n} : aucune association vérifiée (milieu et habitat obligatoires)' for n in sorted(noms-ok)]
    return err
def table(rows):
    U=[];ui={};MH={}
    for r in rows:
        if r['Confiance']!='verified':continue
        u=r['Source']
        if u not in ui:ui[u]=len(U);U.append(u)
        e=MH.setdefault(r['Nom latin'],[[],r['Remarque']])
        e[0].append([r['Sous-milieu'],r['Territoire'],r['Contexte'][0],r['Force'][0],ui[u]])
    L={k:v['libelle'] for k,v in SM.items()};T={k:v['nom'] for k,v in TE.items()}
    return {'L':L,'T':T,'U':U,'E':MH}
if __name__=='__main__':
    if '--table' in sys.argv:print(json.dumps(table(lire()),ensure_ascii=False));sys.exit(0)
    p=R/'index.html';s=p.read_text(encoding='utf-8');rows=lire();noms=especes(s)
    err=controle(rows,noms)
    c=collections.Counter(r['Confiance'] for r in rows);esp={r['Nom latin'] for r in rows}
    print(f'{len(esp)} espèces sur {len(noms)}, {len(rows)} associations ({c["verified"]} vérifiées, {c["needs_review"]} à vérifier)')
    print('par territoire :',dict(collections.Counter(r['Territoire'] for r in rows if r['Confiance']=='verified').most_common()))
    manq=[x for x in err if x.endswith('(milieu et habitat obligatoires)')];autres=[x for x in err if x not in manq]
    if manq:print(len(manq),'espèce(s) sans association vérifiée'+(' (tolérées avec --partiel, en attendant leur sourçage)' if '--partiel' in sys.argv else ''))
    if autres:print(len(autres),'problème(s) :');print('\n'.join('  '+x for x in autres[:60]))
    if autres or (manq and '--partiel' not in sys.argv):sys.exit(1)
    if '--ecrire' in sys.argv:
        js='const MH='+json.dumps(table(rows),ensure_ascii=False,separators=(',',':'))+';\n'
        m=re.search(r'^const MH=.*;\n',s,re.M)
        s=s[:m.start()]+js+s[m.end():] if m else s.replace('\nconst AS=','\n'+js+'const AS=',1)
        p.write_text(s,encoding='utf-8');print('index.html mis à jour : table MH,',len(js)//1024,'Ko')
