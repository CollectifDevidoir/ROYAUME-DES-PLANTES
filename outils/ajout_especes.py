# Ajoute les nouvelles espèces préparées (donnees/nouvelles-especes.json) à l'appli, avec leurs genres et familles
# (donnees/nouveaux-genres-familles.json), leurs photos (donnees/photos-nouvelles.json), les 3 rangs supplémentaires
# (donnees/rangs-nouveaux.json) et les textes « Plus de 700 ».
# Seules les espèces complètes entrent : 3 à 5 clés de 55 caractères au plus, 2 sources au moins, une phrase,
# port et feuilles décrits, et au moins 3 photos libres trouvées sur iNaturalist. Les autres sont listées, avec la raison.
# Noms acceptés en plus du nom affiché (donnees/synonymes.json) et compléments de familles (donnees/familles-complements.json).
# Usage : python3 outils/ajout_especes.py [--ecrire]   (sans option : bilan seulement, rien n'est modifié)
import json,re,sys,csv,io,pathlib
R=pathlib.Path(__file__).resolve().parent.parent;D=R/'donnees'
E=json.load(open(D/'nouvelles-especes.json',encoding='utf-8'))
GF=json.load(open(D/'nouveaux-genres-familles.json',encoding='utf-8'))
PH=json.load(open(D/'photos-nouvelles.json',encoding='utf-8'))['especes'] if (D/'photos-nouvelles.json').exists() else {}
RG=json.load(open(D/'rangs-nouveaux.json',encoding='utf-8'))
s=(R/'index.html').read_text(encoding='utf-8')
qa=s.index('const Q={');deja=set(re.findall(r'^"([^"]+)":',s[qa:s.index('\n};',qa)],re.M))
garde,refus=[],[]
for x in E:
    k=x.get('cles') or [];why=[]
    if x['latin'] in deja:why.append('déjà dans l\'appli')
    if not 3<=len(k)<=5 or any(len(c)>55 for c in k):why.append('clés incomplètes')
    if len(x.get('sources_cles') or [])<2:why.append('moins de 2 sources')
    if not x.get('phrase'):why.append('pas de phrase')
    d=x.get('description') or {}
    if not d.get('port') or not d.get('feuilles'):why.append('description incomplète')
    p=PH.get(x['latin'])
    if not p:why.append('aucune photo libre trouvée' if PH else 'photos pas encore vérifiées')
    elif len(p[5])<3:why.append(f'{len(p[5])} photo(s) seulement')
    (refus if why else garde).append((x,why))
N=len(deja)+len(garde)
print(f'{len(garde)} espèces retenues, {len(refus)} écartées → {N} espèces au total')
for x,w in refus:print('  écartée :',x['latin'],'—',', '.join(w))
if '--ecrire' not in sys.argv:sys.exit(0)
G=[x for x,_ in garde]
def rep(a,b,n=1):
    global s
    if s.count(a)!=n:raise SystemExit('motif introuvable ou ambigu : '+a[:70])
    s=s.replace(a,b)
# 1. liste des espèces (bloc X4, même forme que X, X2, X3)
cats={}
for x in G:cats.setdefault(x['cat'],[]).append(x['latin']+'|'+x['commun'].split(' (')[0])
X4='const X4={\n'+',\n'.join(f'{json.dumps(c,ensure_ascii=False) if c not in ("arbre","arbuste","vivace","grimpante") else c}:"{";".join(v)}"' for c,v in cats.items())+'\n};\n'
X4+="for(const t in X4)X4[t].split(';').forEach(e=>{const[l,c]=e.split('|');if(!S.some(s=>s[0]===l))S.push([l,c,t])});\n"
rep("S.forEach(s=>{if(s[2]==='conifère')s[2]='arbre'});","// Nouvelles espèces (2026) : paysage, flore de Gironde et des Landes ; données dans donnees/nouvelles-especes.json\n"+X4+"S.forEach(s=>{if(s[2]==='conifère')s[2]='arbre'});")
# 2. tables JSON d'une ligne : phrase (AS), description (DSC), milieu (ES), genres (GD), familles (FX)
def maj(nom,ajout):
    global s
    k=s.index('const '+nom+'=');a=k+len('const '+nom+'=');o,fin=json.JSONDecoder().raw_decode(s[a:]);o.update(ajout)
    s=s[:a]+json.dumps(o,ensure_ascii=False,separators=(',',':'))+s[a+fin:]
maj('AS',{x['latin']:x['phrase'] for x in G})
maj('DSC',{x['latin']:{k:v for k,v in x['description'].items() if v and k in('port','feuilles','ecorce','fleurs','floraison','fruits')} for x in G})
maj('ES',{x['latin']:x['milieu'] for x in G if x.get('milieu')})
gen={x['latin'].split()[0] for x in G}
NG={g:v for g,v in GF['genres'].items() if g in gen}
maj('GD',{g:v['GD'] for g,v in NG.items()})
fams={v['famille'] for v in NG.values()}
NF={f:v for f,v in GF['familles'].items() if f in fams}
maj('FX',{f:v['FX'] for f,v in NF.items()})
# 3. familles → genres (FG), fiches de familles (FI) et nombre d'espèces (FW)
for g,v in NG.items():
    f=v['famille'];o=s.index('const FG={');m=re.compile(r"(?:^|[\n,{])"+f+r":'([^']*)'").search(s,o)
    if m:s=s[:m.start(1)]+' '.join(sorted(m.group(1).split()+[g]))+s[m.end(1):]
    else:rep('const FG={\n','const FG={\n'+f+":'"+g+"',\n")
def lignes(debut,ajout):
    global s
    a=s.index(debut)+len(debut);b=s.index('`',a);L=s[a:b].split('\n')+ajout
    L=sorted(set(L),key=lambda l:l.split('|')[0]);s=s[:a]+'\n'.join(L)+s[b:]
lignes('const FI={};`',[v['FI'] for v in NF.values()])
lignes('const FW={};`',[v['FW'] for v in NF.values()])
# 4. trois rangs de plus, au-dessus de « Maître du royaume » (les seuils existants ne bougent pas : personne ne perd son rang)
top=N-N%10;P=[[600,'Druide'],[680,'Esprit de la forêt'],[min(760,top),'Légende du royaume']]
m=re.search(r'const R=(\[\[.*?\]\]);',s);Rk=json.loads(m.group(1))
if len(Rk)==12:s=s[:m.start(1)]+json.dumps(Rk+P,ensure_ascii=False)+s[m.end(1):]
k=s.index('const RI=');a=k+9;o,fin=json.JSONDecoder().raw_decode(s[a:])
if len(o)==12:
    o+=[re.sub(r'^<svg[^>]*>|</svg>$','',RG[n]) for n in ('druide','esprit','legende')];s=s[:a]+json.dumps(o,ensure_ascii=False,separators=(',',':'))+s[a+fin:]
rep('aria-label="Les 12 rangs"','aria-label="Les ${R.length} rangs"',2)
rep('.rgs{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));','.rgs{display:grid;grid-template-columns:repeat(15,minmax(0,1fr));')
# 5. noms botaniques récents ou anciens acceptés à l'écrit (le nom affiché reste le plus courant) et dans la recherche de l'herbier
SYN=json.load(open(D/'synonymes.json',encoding='utf-8')) if (D/'synonymes.json').exists() else {}
if SYN:
    rep("S.forEach(s=>{if(s[2]==='conifère')s[2]='arbre'});","S.forEach(s=>{if(s[2]==='conifère')s[2]='arbre'});\n// Autres noms acceptés quand on écrit la réponse (nouveau nom accepté ou ancien nom courant) ; données : donnees/synonymes.json\nconst SYN="+json.dumps(SYN,ensure_ascii=False,separators=(',',':'))+";\nconst noms=s=>[s[0],...(SYN[s[0]]||[])];")
    rep("const w=S.find(s=>typed?norm(s[0])===norm(v):s[0]===v);","const w=S.find(s=>typed?noms(s).some(n=>norm(n)===norm(v)):s[0]===v);")
    rep("const good=typed?near(norm(v),norm(cur[0])):v===cur[0];","const good=typed?noms(cur).some(n=>near(norm(v),norm(n))):v===cur[0];")
    rep("typo=typed&&good&&norm(v)!==norm(c[0]);","typo=typed&&good&&!noms(c).some(n=>norm(n)===norm(v)),autre=typed&&good&&!typo&&norm(v)!==norm(c[0]);")
    rep('<span class="sl2"><em>${c[0]}</em>','<span class="sl2"><em>${c[0]}</em>${autre?` <small class="fm">· aussi accepté : <em>${esc(v)}</em></small>`:\'\'}')
    rep("S.filter(s=>norm(s[0]).includes(q)||norm(s[1]).includes(q))","S.filter(s=>noms(s).some(n=>norm(n).includes(q))||norm(s[1]).includes(q))")
# 6. compléments de familles : curiosités des cartes « Famille du jour » (FC) et nombres d'espèces manquants (FW)
FCX=json.load(open(D/'familles-complements.json',encoding='utf-8')) if (D/'familles-complements.json').exists() else {}
if FCX.get('FC'):maj('FC',FCX['FC'])
if FCX.get('FW'):
    a=s.index('const FW={};`')+len('const FW={};`');b=s.index('`',a);have={l.split('|')[0] for l in s[a:b].split('\n')}
    lignes('const FW={};`',[f+'|'+n for f,n in FCX['FW'].items() if f not in have])
# 7. textes : « Plus de 600 » devient « Plus de 700 »
if N>=700:rep('Plus de 600 ','Plus de 700 ',3)
(R/'index.html').write_text(s,encoding='utf-8')
# 6. clés sourcées (tableur des clés, puis table Q régénérée) et photos (index de l'appli)
with open(D/'cles-revues.csv','a',encoding='utf-8',newline='') as f:
    w=csv.writer(f,delimiter=';',lineterminator='\n')
    for x in G:w.writerow([x['latin'],'nouvelles espèces 2026','',' ; '.join(x['cles']),' | '.join(x['sources_cles'])])
ix=json.load(open(D/'photos.json',encoding='utf-8'));ix['especes'].update({x['latin']:PH[x['latin']] for x in G})
json.dump(ix,open(D/'photos.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('index.html, cles-revues.csv et photos.json mis à jour ; lancer ensuite : python3 outils/cles_vers_appli.py')
