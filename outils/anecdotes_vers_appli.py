# Anecdotes vérifiées (donnees/anecdotes-especes.json) → index.html :
#  - phrases « À découvrir » corrigées (table AS) quand la relecture les a jugées fausses ou trompeuses ;
#  - table CU des curiosités sourcées, affichées dans la fiche à la suite de « À découvrir », avec leur source.
# Une curiosité « en réserve » (source fragile, doublon, légende) reste dans le fichier mais n'est ni affichée ni utilisée.
# Usage : python3 outils/anecdotes_vers_appli.py [--ecrire]
import json,re,sys,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A=json.load(open(os.path.join(R,'donnees','anecdotes-especes.json'),encoding='utf8'))['especes']
p=os.path.join(R,'index.html');s=open(p,encoding='utf8').read()
m=re.search(r'^const AS=(\{.*?\});\n',s,re.M);AS=json.loads(m.group(1))
noms=dict(re.findall(r'\["([A-Z][a-z]+ [^"]+)","([^"]+)",',s))
err=[]
for l,e in A.items():
  if l not in AS:err.append(l+' : espèce absente de l\'appli')
  c=e['curiosite'];g=l.split(' ')[0]
  if len(c)>160:err.append(l+' : curiosité trop longue')
  if g.lower() in c.lower():err.append(l+' : la curiosité nomme le genre')
  if e['phrase_statut']=='corrigée' and not (0<len(e['phrase_corrigee'])<=160):err.append(l+' : phrase corrigée vide ou trop longue')
  if e['certitude']=='source' and not all(re.match(r'^https?://\S+$',u) for u in e['sources']):err.append(l+' : source invalide')
if err:sys.exit('Problèmes :\n'+'\n'.join(err))
cor={l:e['phrase_corrigee'] for l,e in A.items() if e['phrase_statut']=='corrigée' and AS.get(l)!=e['phrase_corrigee']}
CU={l:[e['curiosite'],e['sources'][0]] for l,e in A.items() if e['certitude']=='source' and e['sources'] and not e.get('reserve')}
print(len(A),'espèces relues ;',len(cor),'phrases à corriger ;',len(CU),'curiosités sourcées affichées ;',sum(1 for e in A.values() if e.get('reserve')),'en réserve')
if '--ecrire' in sys.argv:
  AS.update(cor);s=s[:m.start(1)]+json.dumps(AS,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
  j='const CU='+json.dumps(CU,ensure_ascii=False,separators=(',',':'))+';\n'
  mc=re.search(r'^const CU=\{.*?\};\n',s,re.M)
  if mc:s=s[:mc.start()]+j+s[mc.end():]
  else:
    ma=re.search(r'^const AS=\{.*?\};\n',s,re.M);s=s[:ma.end()]+'// Curiosités sourcées (donnees/anecdotes-especes.json, outils/anecdotes_vers_appli.py) : [texte, source]\n'+j+s[ma.end():]
  open(p,'w',encoding='utf8').write(s);print('index.html mis à jour')
