# Saisie des milieux et habitats : convertit un lot en format court en lignes de donnees/milieux-habitats.csv (ajout, ou remplacement des lignes d'une espèce).
# Format :  @Nom latin|statut[|remarque]   puis   sK URL   puis   [TERR:]SOUSMILIEU ctx force sK extrait   (sK = - et extrait vide : « à vérifier »)
#   statut : indigene, naturalisee, archeophyte, exotique, a_verifier ; ctx : hn, sp, cu ; force : typ, fre, pos. Une source par association.
# Usage : python3 outils/habitats_saisie.py lot.txt   (VERIF=1 : contrôle la syntaxe sans rien écrire), puis outils/habitats_vers_appli.py --ecrire
import sys,csv,json,datetime,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/';F=R+'donnees/milieux-habitats.csv'
N=json.load(open(R+'donnees/milieux/nomenclature.json',encoding='utf8'));SM={s['id']:s for s in N['sous_milieux']}
CTX={'hn':'habitat_naturel','sp':'presence_spontanee_secondaire','cu':'cultive_ou_plante'};FO={'typ':'typique','fre':'frequent','pos':'possible'}
ST={'indigene':'indigène','naturalisee':'naturalisée','exotique':'exotique (cultivée en France)','archeophyte':'archéophyte','a_verifier':'à vérifier'}
H=['Nom latin','Statut','Territoire','Sous-milieu','Contexte','Force','EUNIS','Source','Extrait','Vérifié le','Confiance','Remarque']
rows=[r for r in csv.DictReader(open(F,encoding='utf-8'),delimiter=';')] if os.path.exists(F) else []
new=[];cur=None;srcs={};today=datetime.date.today().isoformat()
for l in open(sys.argv[1],encoding='utf8').read().split('\n'):
  l=l.strip()
  if not l or l.startswith('#'):continue
  if l[0]=='@':
    p=l[1:].split('|');cur={'n':p[0].strip(),'st':ST[p[1].strip()],'rem':p[2].strip() if len(p)>2 else ''};srcs={};continue
  t=l.split(' ',1)
  if t[0][0]=='s' and t[0][1:].isdigit():srcs[t[0]]=t[1].strip();continue
  sm,ctx,fo,sk=l.split(' ')[:4];ex=l.split(' ',4)[4].strip() if len(l.split(' '))>4 else ''
  terr=None
  if ':' in sm:terr,sm=sm.split(':')
  assert sm in SM,('sous-milieu inconnu',sm,cur);terr=terr or SM[sm]['territoires'][0];assert terr in SM[sm]['territoires'],(terr,sm)
  eun=SM[sm]['eunis'][0]
  new.append({'Nom latin':cur['n'],'Statut':cur['st'],'Territoire':terr,'Sous-milieu':sm,'Contexte':CTX[ctx],'Force':FO[fo],'EUNIS':eun,
    'Source':srcs.get(sk,'') if sk!='-' else '','Extrait':ex,'Vérifié le':today,'Confiance':'verified' if (ex and sk!='-') else 'needs_review','Remarque':cur['rem']})
vu=set();dd=[]
for r in new:
  k=(r['Nom latin'],r['Sous-milieu'],r['Contexte'])
  if k not in vu:vu.add(k);dd.append(r)
if len(dd)<len(new):print(len(new)-len(dd),'doublon(s) retiré(s) (une source par association, la première gardée)')
new=dd
noms={r['Nom latin'] for r in new}
if os.environ.get('VERIF'):print('VERIF OK :',len(noms),'espèces,',len(new),'associations,',sum(r['Confiance']=='verified' for r in new),'vérifiées');sys.exit(0)
rows=[r for r in rows if r['Nom latin'] not in noms]+new
w=csv.DictWriter(open(F,'w',encoding='utf-8',newline=''),fieldnames=H,delimiter=';');w.writeheader();w.writerows(rows)
print(len(noms),'espèces ajoutées ;',len({r['Nom latin'] for r in rows}),'espèces au total ;',len(rows),'associations')
