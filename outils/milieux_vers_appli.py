# Milieux propres à chaque espèce (donnees/milieux-especes.json) → table ES de index.html.
# Les espèces du fichier (qui n'avaient pas de milieu propre) prennent ses valeurs ; les autres milieux ne bougent pas. Vocabulaire vérifié.
# Usage : python3 outils/milieux_vers_appli.py [--ecrire]
import json,re,sys,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V={'expo':["Soleil","Soleil à mi-ombre","Mi-ombre","Mi-ombre à ombre","Ombre"],
   'sol':["Tous sols","Drainé","Frais et drainé","Riche et frais","Humifère et frais","Pauvre, caillouteux, très drainé","Léger, sableux","Détrempé ou vaseux"],
   'humidite':["Sec","Sec à frais","Frais","Frais à humide","Humide","Aquatique"],
   'ph':["Acide","Acide à neutre","Neutre","Neutre à alcalin","Tous pH"]}
M=json.load(open(os.path.join(R,'donnees','milieux-especes.json'),encoding='utf8'))['especes']
p=os.path.join(R,'index.html');s=open(p,encoding='utf8').read()
m=re.search(r'^const ES=(\{.*?\});\n',s,re.M);ES=json.loads(m.group(1))
err=[f'{l} : {k} = {e[k]!r}' for l,e in M.items() for k in V if e[k] not in V[k]]
if err:sys.exit('Valeurs hors vocabulaire :\n'+'\n'.join(err))
nv={l:[e[k] for k in V] for l,e in M.items() if ES.get(l)!=[e[k] for k in V]}
print(len(ES),'milieux présents ;',len(nv),'à ajouter ou corriger ;',sum(1 for e in M.values() if e['certitude']=='source'),'sourcés dans le fichier')
if '--ecrire' in sys.argv:
  ES.update(nv);s=s[:m.start(1)]+json.dumps(ES,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
  open(p,'w',encoding='utf8').write(s);print('index.html mis à jour :',len(ES),'milieux')
