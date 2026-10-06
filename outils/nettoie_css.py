"""Étape 10.2 : retire du <style> de index.html les sélecteurs qui visent des classes CSS
absentes du reste du fichier (HTML et JS). Les règles groupées gardent leurs autres sélecteurs.
Usage : python3 outils/nettoie_css.py [--ecrire]"""
import re,sys
P='index.html'
s=open(P,encoding='utf-8').read()
m=re.search(r'(<style[^>]*>)(.*?)(</style>)',s,re.S)
css=m.group(2); rest=s[:m.start(2)]+s[m.end(2):]
def utilisee(c): return re.search(r'(?<![\w-])'+re.escape(c)+r'(?![\w-])',rest) is not None
classes=set(re.findall(r'\.([a-zA-Z_][\w-]*)',re.sub(r'url\([^)]*\)|\d*\.\d+','',css)))
mortes={c for c in classes if not utilisee(c)}
def morte(sel): return any(c in mortes for c in re.findall(r'\.([a-zA-Z_][\w-]*)',sel))
out=[];i=0;n=len(css);retires=[]
def bloc(txt,keyframes=False):
    res=[];i=0
    while i<len(txt):
        j=txt.find('{',i)
        if j<0: res.append(txt[i:]);break
        sel=txt[i:j]
        # trouver l'accolade fermante correspondante
        d=1;k=j+1
        while d:
            if txt[k]=='{':d+=1
            elif txt[k]=='}':d-=1
            k+=1
        corps=txt[j+1:k-1]
        st=sel.strip()
        if st.startswith('@'):
            kf=st.startswith('@keyframes') or st.startswith('@-webkit-keyframes')
            inner=corps if kf else bloc(corps)
            if inner.strip() or kf: res.append(sel+'{'+inner+'}')
        elif keyframes: res.append(sel+'{'+corps+'}')
        else:
            parts=[p for p in sel.split(',')]
            garde=[p for p in parts if not morte(p)]
            retires.extend(p.strip() for p in parts if morte(p))
            if garde: res.append(','.join(garde)+'{'+corps+'}')
        i=k
    return ''.join(res)
nouveau=bloc(css)
# animations @keyframes devenues orphelines
kfs=re.findall(r'@keyframes\s+([\w-]+)',nouveau)
orph=[k for k in kfs if not re.search(r'(?<![\w-])'+re.escape(k)+r'(?![\w-])',re.sub(r'@keyframes\s+'+re.escape(k),'',nouveau)+rest)]
for k in orph: nouveau=re.sub(r'@keyframes\s+'+re.escape(k)+r'\s*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}','',nouveau)
print('classes mortes :',len(mortes),sorted(mortes))
print('sélecteurs retirés :',len(retires)); print('animations orphelines retirées :',orph)
print('CSS : %d -> %d octets'%(len(css),len(nouveau)))
if '--ecrire' in sys.argv:
    open(P,'w',encoding='utf-8').write(s[:m.start(2)]+nouveau+s[m.end(2):]); print('écrit')
