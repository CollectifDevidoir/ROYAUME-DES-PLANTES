"""Lot 2, étape C : illustrations « carnet naturaliste ».
Trait d'encre sépia (classe k, couleur var(--ink), claire en mode sombre) et aplats de pigments
légèrement décalés du trait, comme à la main. Ni dégradé, ni reflet, ni ombre portée.
Les couleurs varient d'une illustration à l'autre, et les rangs suivent les saisons
(printemps → été → automne → crépuscule doré).
Usage : python3 outils/illustrations.py --ecrire          remplace les illustrations, leur CSS et le décor dans index.html
        python3 outils/illustrations.py --json fichier    écrit les dessins dans un fichier JSON (aperçu)"""
import json,math,re,sys,os

# Pigments (classes CSS .ri .cX) : un nom court par couleur
PAL={'mo':'#7fa456','fe':'#a9c97a','pi':'#4f8a73','li':'#8cbcae',
     'ba':'#8d6040','wo':'#d9ae7c','oc':'#dba643','go':'#ecc85f','ru':'#c86d45',
     'be':'#b44b62','pl':'#8c6aa8','ro':'#e3a0a4','wa':'#7fb3d5','ic':'#cfe5ef',
     'pa':'#f3e8cf','st':'#a9a69c','du':'#5d6f9e'}
def f(x): return ('%.1f'%x).rstrip('0').rstrip('.')
def W(d,c,dx=1.3,dy=1.1): return f'<path class="c{c}" transform="translate({f(dx)} {f(dy)})" d="{d}"/>'
def K(d,w=2.6,cls='k'): return f'<path class="{cls}" stroke-width="{f(w)}" d="{d}"/>'
def B(d,c,w=2.6,dx=1.3,dy=1.1): return W(d,c,dx,dy)+K(d,w)
def circ(cx,cy,r): return f'M{f(cx-r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx+r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx-r)} {f(cy)}Z'
def ell(cx,cy,rx,ry): return f'M{f(cx-rx)} {f(cy)}A{f(rx)} {f(ry)} 0 1 0 {f(cx+rx)} {f(cy)}A{f(rx)} {f(ry)} 0 1 0 {f(cx-rx)} {f(cy)}Z'
def g(body,x,y,a=0,s=1): return f'<g transform="translate({f(x)} {f(y)}) rotate({f(a)}){"" if s==1 else " scale("+f(s)+")"}">{body}</g>'
def leafd(l,w): return f'M0 0C{f(w)} {f(-l*.28)} {f(w*.75)} {f(-l*.78)} 0 {f(-l)}C{f(-w*.75)} {f(-l*.78)} {f(-w)} {f(-l*.28)} 0 0Z'
def leaf(x,y,a,l,w,c,iw=2.2,rib=True):
    d=leafd(l,w);b=W(d,c,1,.9)+K(d,iw)
    if rib: b+=K(f'M0 -1L0 {f(-l*.7)}',iw*.6)
    return g(b,x,y,a)
def bumps(cx,cy,rx,ry,n,amp=.2,a0=-90,jit=None):
    """Contour festonné (houppier, buisson) : n lobes autour d'une ellipse."""
    pts=[];jit=jit or [1]*n
    for i in range(n):
        t=math.radians(a0+360*i/n);pts.append((cx+rx*math.cos(t),cy+ry*math.sin(t)))
    d=f'M{f(pts[0][0])} {f(pts[0][1])}'
    for i in range(n):
        t=math.radians(a0+360*(i+.5)/n);k=1+amp*2*jit[i]
        qx,qy=cx+rx*k*math.cos(t),cy+ry*k*math.sin(t);p=pts[(i+1)%n]
        d+=f'Q{f(qx)} {f(qy)} {f(p[0])} {f(p[1])}'
    return d+'Z'
def ground(x1=14,x2=50,y=57.5): return K(f'M{x1} {y}C{f((x1+x2)/2-6)} {f(y-1.6)} {f((x1+x2)/2+6)} {f(y-1.6)} {x2} {y}',2.2)
def svg(body): return '<svg class="ri" viewBox="0 0 64 64" aria-hidden="true">'+body+'</svg>'
def trunk(x,yb,yt,wb,wt,c='ba',w=2.4):
    d=f'M{f(x-wb)} {yb}C{f(x-wb*.6)} {f((yb+yt)/2)} {f(x-wt)} {f(yt+4)} {f(x-wt)} {yt}L{f(x+wt)} {yt}C{f(x+wt)} {f(yt+4)} {f(x+wb*.6)} {f((yb+yt)/2)} {f(x+wb)} {yb}Z'
    return B(d,c,w,1,.8)

I={}
# ---------- Icônes ----------
OAK="M32 7C36 7 37.5 11.5 35.5 14.5C39.5 13 43.5 15.5 42 19.5C41 21.5 39 21.5 38 22.5C42.5 22 46 25 44 28.5C42.5 30.5 40 30 39 31C43.5 31.5 46 35 43 38C41 39.5 39 39 38 39.5C40 42 40 45.5 37 46.5C35.5 47 34 47 33.5 48.5V57H30.5V48.5C30 47 28.5 47 27 46.5C24 45.5 24 42 26 39.5C25 39 23 39.5 21 38C18 35 20.5 31.5 25 31C24 30 21.5 30.5 20 28.5C18 25 21.5 22 26 22.5C25 21.5 23 21.5 22 19.5C20.5 15.5 24.5 13 28.5 14.5C26.5 11.5 28 7 32 7Z"
I['quiz']=svg(B(OAK,'mo')+K('M32 13V50M32 23L37 20.5M32 23L27 20.5M32 32L38.5 29.5M32 32L25.5 29.5M32 41L36.5 38.5M32 41L27.5 38.5',1.7))
cover="M5 22C16 17 26 18 32 23C38 18 48 17 59 22V54C48 50 38 51 32 55C26 51 16 50 5 54Z"
book="M8 19C18 15 26 16 32 20C38 16 46 15 56 19V50C46 46 38 47 32 51C26 47 18 46 8 50Z"
I['herbier']=svg(W(cover,'pi',0,0)+K(cover,2.2)+B(book,'pa')+K('M32 20V51',2)+K('M13 25.5L26 27M13 31L25 32.3M13 36.5L23 37.6',1.6,'k kl')
  +leaf(44,43,38,19,6.5,'mo',2,True))
I['progres']=svg(B(circ(32,33,22),'ba')+W(circ(32,33,17.5),'wo',0,0)+K(circ(32,33,17.5),1.8)
  +K('M31.5 21.5C38 21 43.5 26.5 43.5 33C43.5 40 38 44.5 31.5 44.5C25 44.5 20.5 39.5 20.5 33.5C20.5 27 25 22 31.5 21.5Z',1.4,'k kl')
  +K('M31 27C35 27 37.5 30 37.5 33C37.5 36.5 35 39 31.5 39C28 39 26 36.5 26 33.5C26 30 28 27.5 31 27Z',1.4,'k kl')
  +K('M38 38L46 46',1.7)+leaf(46,13,42,14,5.2,'fe',2,False)+K('M43 14C44 11 46 10 48 9',2))
rays=''.join(K(f'M{f(32+17*math.cos(math.radians(a)))} {f(32+17*math.sin(math.radians(a)))}L{f(32+(25 if i%2==0 else 22)*math.cos(math.radians(a)))} {f(32+(25 if i%2==0 else 22)*math.sin(math.radians(a)))}',2.8) for i,a in enumerate(range(0,360,45)))
I['soleil']=svg(W(circ(32,32,12.5),'go',1.2,1)+K(circ(32,32,12.5),2.6)+rays)
clod="M5 57C9 44 20 37 32 37C44 37 55 44 59 57Z"
I['sol']=svg(B(clod,'ru')+K('M12 47C22 44.5 42 44.5 52 47M8 52.5C22 50 42 50 56 52.5',1.6,'k kl')+B(ell(42,50,5,3.2),'st',2)+B(ell(20,47.5,3,2),'st',1.8)
  +K('M31 37C30.5 29 31 24 32 18',2.4)+leaf(31.5,26,-58,13,4.8,'fe',2,False)+leaf(32,22,52,12,4.6,'mo',2,False))
drop="M32 7C38 17 48 28 48 39C48 48.5 41 56 32 56C23 56 16 48.5 16 39C16 28 26 17 32 7Z"
I['eau']=svg(B(drop,'wa')+K('M23 39C23 44.5 26.5 48.5 31 49.5',2,'k kl'))
tube="M24 6H40V50C40 55 36.5 58 32 58C27.5 58 24 55 24 50Z"
I['ph']=svg(W('M24 30H40V50C40 55 36.5 58 32 58C27.5 58 24 55 24 50Z','wa',0,0)+W('M24 30H40V39H24Z','ro',0,0)
  +W('M24 39H40V45H24Z','pl',0,0)+K(tube,2.6)+B('M22 6H42V12H22Z','ru',2.2,0,0)+K('M24 30H40',1.6,'k kl'))
fl=''
for a in range(0,360,60):
    r=math.radians(a-90);ux,uy=math.cos(r),math.sin(r)
    fl+=K(f'M32 32L{f(32+21*ux)} {f(32+21*uy)}',2.8)
    for t,s in ((12,6),):
        px,py=32+t*ux,32+t*uy
        for sg in (1,-1):
            r2=r+sg*math.radians(42);fl+=K(f'M{f(px)} {f(py)}L{f(px+s*math.cos(r2))} {f(py+s*math.sin(r2))}',2.4)
I['froid']=svg(re.sub(r'class="k" stroke-width="[\d.]+"','class="kwa" stroke-width="7"',fl)+fl+B(circ(32,32,3.4),'wa',2,0,0))
I['coche']=svg(K('M14 33L27 46L50 19',7,'k kok'))
I['croix']=svg(K('M18 18L46 46M46 18L18 46',7,'k kko'))
star=lambda cx,cy,r,q: f'M{cx} {f(cy-r)}C{f(cx+q)} {f(cy-q)} {f(cx+q)} {f(cy-q)} {f(cx+r)} {cy}C{f(cx+q)} {f(cy+q)} {f(cx+q)} {f(cy+q)} {cx} {f(cy+r)}C{f(cx-q)} {f(cy+q)} {f(cx-q)} {f(cy+q)} {f(cx-r)} {cy}C{f(cx-q)} {f(cy-q)} {f(cx-q)} {f(cy-q)} {cx} {f(cy-r)}Z'
I['etincelle']=svg(B(star(28,34,22,4.5),'go',3)+B(star(50,13,9,2.2),'oc',2.6))
def gear(cx,cy,ro,ri,n):
    pts=[]
    for i in range(n*4):
        a=math.radians(-90+360*i/(n*4)-360/(n*8));r=ro if i%4 in (1,2) else ri
        pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    return 'M'+'L'.join(f'{f(x)} {f(y)}' for x,y in pts)+'Z'
I['reglages']=svg(B(gear(31,34,23,17.5,8),'wo',2.6)+B(circ(31,34,7),'pa',2.4)+leaf(46,15,40,15,5.5,'mo',2,False))

# ---------- Trophée → couronne de laurier ; ampoule → étiquette ; cible → boussole ; loupe ----------
lau=K('M27 53C15 47 9.5 34 15 19',2.4)+K('M37 53C49 47 54.5 34 49 19',2.4)
for i,(x,y,a) in enumerate([(17.5,46,-118),(13,38,-100),(12,29,-80),(14.5,21,-62)]):
    lau+=leaf(x,y,a,11,4.2,'mo' if i%2==0 else 'pi',1.9,False)
    lau+=leaf(64-x,y,-a,11,4.2,'pi' if i%2==0 else 'mo',1.9,False)
for x,y,a in [(21,49.5,-155),(14.5,42,-140)]:
    lau+=leaf(x,y,a+180,9,3.6,'fe',1.8,False)+leaf(64-x,y,-(a+180),9,3.6,'fe',1.8,False)
TROPHY=svg(lau+B('M23 51C28 48.5 36 48.5 41 51L38.5 59L32 55.5L25.5 59Z','be',2.4)+B('M0 0C-2.6 0 -3.6 3.6 -2.4 6C-1.2 8.4 1.2 8.4 2.4 6C3.6 3.6 2.6 0 0 0Z','oc',2,.5,.5).join(['<g transform="translate(32 26)">','</g>'])+B('M27 27C27 22.5 29.5 20.5 32 20.5C34.5 20.5 37 22.5 37 27Z','ba',2,0,0))
tag="M10 20L42 12L55 23L58 47L16 55Z"
BULB=svg(K('M49 21C53 13 59 10 61 5',2.2)+B(tag,'pa')+B(circ(48.5,22.5,3),'ru',2,0,0)
  +leaf(20,49,62,15,5.4,'mo',2,True)+K('M30 34L49 31M31 40.5L50 37.7',1.8,'k kl'))
TARGET=svg(B(circ(32,35,24),'oc',2.6)+W(circ(32,35,18),'pa',0,0)+K(circ(32,35,18),2)
  +B('M32 9V4.5M28.5 6.5H35.5','oc',2.4,0,0)+W('M32 18L37.5 35H26.5Z','ru',0,0)+W('M32 52L37.5 35H26.5Z','du',0,0)
  +K('M32 18L37.5 35L32 52L26.5 35Z',2.4)+K('M26.5 35H37.5',1.6)
  +K('M32 19.5V22M32 48V50.5M15.5 35H18M46 35H48.5',1.8,'k kl'))
HINT=svg(K('M41 41L55 55',9,'k khd')+K('M41.5 41.5L54.5 54.5',5,'kba')+B(circ(27,27,19),'oc',2.6)+W(circ(27,27,14),'ic',0,0)+K(circ(27,27,14),2)
  +leaf(23,35,38,17,6,'mo',2,True))

# ---------- Catégories ----------
CI={}
can=bumps(32,26,19,15.5,9,.13,jit=[1,.8,1.1,.9,1,1.2,.8,1,.9])
CI['arbre']=ground(12,52)+trunk(32,57,34,6,3.4)+K('M31 44L24 36M33.5 41L40 35',2.2)+B(can,'mo')+K('M24 22C26 18 30 16 34 16',1.6,'k kl')
sh=bumps(32,42,23,13,10,.12,a0=-100,jit=[1,1.1,.9,1,1.2,.9,1,1,.8,1.1])
CI['arbuste']=ground(8,56)+B(sh,'pi')+''.join(B(circ(x,y,2.8),'be',1.8,.5,.5) for x,y in [(20,38),(25,44),(36,36),(42,45),(46,38),(30,48)])
CI['vivace']=ground(18,46)+K('M32 57C31 48 33 40 32 32',2.6)+leaf(31.5,49,-62,13,5,'mo',2,False)+leaf(32,45,58,12,4.6,'fe',2,False)+''.join(
  g(B('M0 0C4 -3 5 -9 0 -13C-5 -9 -4 -3 0 0Z','ro',2,.8,.8),32,22,a) for a in range(0,360,60))+B(circ(32,22,4.2),'oc',2.2,0,0)
CI['grimpante']=K('M20 58V8',5.4)+K('M20 58V8',2.6,'kba')+K('M20 54C30 50 33 44 25 40C17 36 20 29 30 27C40 25 38 18 30 15',2.4)\
  +leaf(29,49.5,70,11,4.6,'mo',1.9,False)+leaf(21,35,-70,11,4.6,'pi',1.9,False)+leaf(34,26,64,11,4.6,'mo',1.9,False)\
  +''.join(g(B('M0 0C3 -2.5 3.5 -7 0 -10C-3.5 -7 -3 -2.5 0 0Z','pl',1.8,.6,.6),44,39,a) for a in range(0,360,72))+B(circ(44,39,2.6),'go',1.6,0,0)
gr=''
for x0,x1,y1,c in [(26,10,22,0),(29,18,12,0),(32,33,6,0),(35,46,11,0),(38,55,20,0)]:
    gr+=K(f'M{x0} 57C{x0} 44 {f((x0+x1)/2)} {f(y1+10)} {x1} {y1}',2.4)
for x,y,a in [(18,14,-30),(33,7,0),(46,13,28)]:
    gr+=g(B('M0 0C2.6 -3 2.6 -9 0 -12C-2.6 -9 -2.6 -3 0 0Z','go',1.9,.6,.6),x,y+10,a)
CI['graminée']=ground(16,48)+gr

# ---------- Rangs (printemps → été → automne → crépuscule doré) ----------
RI=[]
acorn="M20 27C20 42 25 54 32 57C39 54 44 42 44 27Z"
RI.append(B(acorn,'oc')+B('M16 28C16 18 23 13 32 13C41 13 48 18 48 28C40 31 24 31 16 28Z','ba')+K('M21 21L43 21M19.5 25.5L44.5 25.5',1.5,'k kl')+K('M32 13C32 9 34 6 38 5',2.6))
mound="M10 57C15 49 49 49 54 57Z"
RI.append(B(mound,'ru')+K('M32 52C32 46 31.5 41 32 36',2.6)+leaf(32,37,-62,14,6,'fe',2.1,False)+leaf(32,37,62,14,6,'fe',2.1,False))
RI.append(B(mound,'ru')+K('M32 52C31 43 33 33 34 22',2.6)+leaf(32.5,42,-60,17,6.5,'mo',2.1,True)+leaf(33.5,33,60,15,6,'fe',2.1,True)+leaf(34,23,6,12,5,'fe',2.1,False))
pot="M19 41H45L41 58H23Z"
RI.append(K('M32 41C32 32 31.5 24 32 13',2.6)+leaf(32,36,-56,14,5.6,'mo',2,False)+leaf(32,36,56,14,5.6,'fe',2,False)+leaf(32,27,-48,12,5,'fe',2,False)+leaf(32,27,48,12,5,'mo',2,False)+leaf(32,15,0,10,4.4,'fe',2,False)
  +B(pot,'ru')+B('M16.5 37H47.5V43H16.5Z','ru',2.4,0,0))
RI.append(ground(10,54)+K('M28 57L24 44M36 57L40 44M32 57V46',2.4)+B(bumps(32,36,20,13,9,.14,jit=[1,.9,1.1,1,.8,1.2,1,.9,1]),'mo')
  +''.join(B(circ(x,y,2.6),'be',1.7,.4,.4) for x,y in [(22,34),(30,30),(40,35),(35,41),(25,41)]))
RI.append(ground(18,46)+trunk(32,57,32,3.2,2)+K('M32 44L37 39',1.9)+B(bumps(32,22,11.5,15,8,.13),'fe')+K('M27 17C28 13 30 11 33 10',1.5,'k kl'))
RI.append(ground(12,52)+trunk(32,57,36,5.5,3.2)+K('M31 46L25 39M33.5 43L39 38',2.1)+B(bumps(32,25,20,17,10,.12,jit=[1,.9,1.1,1,.8,1.2,1,.9,1,1.1]),'pi')
  +K('M23 22C25 17 29 14 34 14',1.6,'k kl'))
oak=bumps(32,26,25,15,12,.12,a0=-95,jit=[1,1.2,.8,1,1.1,.9,1,1.2,.9,1,.8,1.1])
RI.append(ground(8,56)+trunk(32,57,35,7.5,4.5)+K('M30 45L19 36M34 43L46 35',2.4)+B(oak,'mo')+K('M18 25C20 19 25 16 30 15M38 30C42 29 46 27 48 23',1.6,'k kl')
  +''.join(B('M0 0C-2.2 0 -3 3 -2 5C-1 7 1 7 2 5C3 3 2.2 0 0 0Z','oc',1.6,.4,.4).join([f'<g transform="translate({x} {y})">','</g>']) for x,y in [(20,31),(44,33)]))
RI.append(ground(4,60)+trunk(16,57,38,3.6,2.2)+B(bumps(16,30,10,11,8,.13),'oc')+trunk(48,57,38,3.6,2.2)+B(bumps(48,30,10,11,8,.13),'ru')
  +trunk(32,57,34,4.5,2.8)+B(bumps(32,24,13,14,9,.13),'mo'))
def fir(x,yb,h,w,c):
    d=f'M{x} {f(yb-h)}L{f(x+w*.55)} {f(yb-h*.62)}L{f(x+w*.3)} {f(yb-h*.62)}L{f(x+w*.8)} {f(yb-h*.3)}L{f(x+w*.45)} {f(yb-h*.3)}L{f(x+w)} {f(yb-6)}L{f(x-w)} {f(yb-6)}L{f(x-w*.45)} {f(yb-h*.3)}L{f(x-w*.8)} {f(yb-h*.3)}L{f(x-w*.3)} {f(yb-h*.62)}L{f(x-w*.55)} {f(yb-h*.62)}Z'
    return K(f'M{x} {yb}V{f(yb-7)}',2.4)+B(d,c,2.3,1,.9)
RI.append(ground(4,60)+fir(15,57,36,10,'li')+fir(49,57,38,10.5,'pi')+fir(32,57,48,13,'pi')+fir(23,58,26,8,'mo')+fir(42,58,24,7.5,'li'))
RI.append(W(circ(46,16,11),'pl',0,0)+W(circ(50,13,8.5),'pa',0,0)+K(circ(46,16,11),1.8,'k kl')+ground(6,58)+trunk(30,57,32,9,5)+K('M30 49C28 46 28 42 30 40C32 42 32 46 30 49Z',1.8)
  +K('M27 41L17 33M33 38L42 31',2.4)+B(bumps(29,24,21,14,11,.14,a0=-80,jit=[1,1.1,.8,1.2,1,.9,1,1.1,.9,1,1]),'pi')
  +g(B('M0 0C3 -4 3 -11 0 -14C-3 -11 -3 -4 0 0Z','fe',1.8,.6,.6),12,58,-40)+g(B('M0 0C3 -4 3 -11 0 -14C-3 -11 -3 -4 0 0Z','mo',1.8,.6,.6),47,58,38))
crown="M21 9L25 13L28.5 5.5L32 11.5L35.5 5.5L39 13L43 9L41.5 17H22.5Z"
RI.append(ground(6,58)+trunk(32,57,38,7.5,4.5)+K('M30 47L20 39M34 45L45 37',2.4)+B(bumps(32,33,24,12,12,.12,a0=-95,jit=[1,1.2,.8,1,1.1,.9,1,1.2,.9,1,.8,1.1]),'oc')
  +K('M17 33C19 28 24 25 29 24',1.6,'k kl')+B(crown,'go',2.3))

# ---------- Décor de fond (#bg, 1200×800, ancré en bas) ----------
def tronc(x,w,lean=0,flare=1.6,top=-10,br=None,rx=None):
    """Tronc effilé, légèrement penché, avec empattement au pied et départs de branches."""
    yb=800;xt=x+lean;wt=w*.72
    d=(f'M{f(x-w*flare)} {yb}C{f(x-w)} {yb-30} {f(x-w*.95)} {yb-80} {f(x-w*.9)} {yb-160}'
       f'C{f(x-w*.85+lean*.4)} {yb-420} {f(xt-wt)} {f(top+200)} {f(xt-wt)} {top}'
       f'L{f(xt+wt)} {top}C{f(xt+wt)} {f(top+200)} {f(x+w*.85+lean*.4)} {yb-420} {f(x+w*.9)} {yb-160}'
       f'C{f(x+w*.95)} {yb-80} {f(x+w)} {yb-30} {f(x+w*flare)} {yb}Z')
    for (y,sd,l) in (br or []):
        xx=x+lean*(1-y/800)+sd*w*.8
        d+=f'M{f(xx)} {y}Q{f(xx+sd*l*.6)} {f(y-l*.35)} {f(xx+sd*l)} {f(y-l*.9)}L{f(xx+sd*(l-6))} {f(y-l*.95)}Q{f(xx+sd*l*.45)} {f(y-l*.25)} {f(xx)} {f(y+w*.9)}Z'
    return d
def fronde(x0,y0,x1,y1,cx,cy,n,L,side=(1,-1)):
    """Fronde de fougère : rachis courbe et folioles qui raccourcissent vers la pointe."""
    d=''
    def pt(t): return ((1-t)**2*x0+2*(1-t)*t*cx+t*t*x1,(1-t)**2*y0+2*(1-t)*t*cy+t*t*y1)
    for i in range(n):
        t=.12+.85*i/n;px,py=pt(t);qx,qy=pt(min(1,t+.02))
        a=math.atan2(qy-py,qx-px);l=L*(1-t*.8)
        for sg in side:
            b=a+sg*math.radians(58);ex,ey=px+l*math.cos(b),py+l*math.sin(b)
            nx,ny=-math.sin(b)*l*.3,math.cos(b)*l*.3
            d+=f'M{f(px)} {f(py)}Q{f((px+ex)/2+nx)} {f((py+ey)/2+ny)} {f(ex)} {f(ey)}Q{f((px+ex)/2-nx)} {f((py+ey)/2-ny)} {f(px)} {f(py)}Z'
    # rachis
    d+=f'M{f(x0-3)} {y0}Q{f(cx)} {f(cy)} {f(x1)} {f(y1)}Q{f(cx+4)} {f(cy+4)} {f(x0+3)} {y0}Z'
    return d
TF=''.join(f'<path d="{tronc(x,w,l,1.5,-10,br)}"/>' for x,w,l,br in [
  (73,12,6,[]),(339,8,-5,[]),(621,10,4,[]),(888,8,-4,[]),(1082,11,5,[])])
TN=(f'<path d="{tronc(18,33,-6,1.5,-10,[])}"/><path d="{tronc(1190,38,8,1.45,-10,[])}"/>'
    f'<path opacity=".6" d="{tronc(217,16,5,1.6,-10,[])}"/><path opacity=".6" d="{tronc(979,18,-6,1.6,-10,[])}"/>')
FR=(fronde(0,800,175,640,40,650,14,46)+fronde(30,800,250,735,120,700,11,30)+fronde(1200,800,1025,640,1160,650,14,46)
    +fronde(1170,800,950,735,1080,700,11,30)+fronde(452,800,410,722,440,750,7,18)+fronde(462,800,515,728,478,752,7,17)
    +fronde(748,800,792,724,760,752,7,18)+fronde(738,800,690,735,722,758,6,16))
DECOR={'tf':TF,'tn':TN,'fr':FR}

out={'ICO':I,'CI':CI,'RI':[r for r in RI],'TROPHY':TROPHY,'BULB':BULB,'TARGET':TARGET,'HINT':HINT,'PAL':PAL}
CSS=('.ri{width:100%;height:100%;display:block;--ink:#3a2c20;--inkl:#7b6a55}'
     '@media(prefers-color-scheme:dark){.ri{--ink:#efe3c8;--inkl:#b9aa90}}'
     '.ri .k{fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round}'
     '.ri .kl{stroke:var(--inkl)}.ri .kok{stroke:var(--ok)}.ri .kko{stroke:var(--ko)}.ri .kba{fill:none;stroke:#9c7350;stroke-linecap:round}.ri .kwa{fill:none;stroke:#a9d0e6;stroke-linecap:round}'
     +''.join(f'.ri .c{k}{{fill:{v}}}' for k,v in PAL.items())
     # sur un fond vert plein (onglet actif, tuile active), l'encre s'inverse pour rester lisible
     +'.tabs button[aria-current=true] .ri{--ink:#fbf3df;--inkl:#e6dcc4}#chips .cats button[aria-pressed=true] .ri{--ink:#fff;--inkl:#eef3ea}'
     +'@media(prefers-color-scheme:dark){.tabs button[aria-current=true] .ri,.fcard .ri{--ink:#3a2c20;--inkl:#7b6a55}}')
out['CSS']=CSS
D=os.path.dirname(os.path.abspath(__file__))
if '--json' in sys.argv: json.dump(out,open(sys.argv[sys.argv.index('--json')+1],'w'),ensure_ascii=False)
print(len(I),'icônes,',len(CI),'catégories,',len(RI),'rangs')

# ---------- Écriture dans index.html ----------
if '--ecrire' in sys.argv:
    P=os.path.join(D,'..','index.html');s=open(P,encoding='utf-8').read()
    def jsobj(name,new,merge):
        m=re.search(r'const '+name+r'=(\{.*?\});\n',s,re.S) if name!='RI' else re.search(r'const RI=(\[.*?\]);\n',s,re.S)
        cur=json.loads(m.group(1))
        if merge: cur.update(new)
        else: cur=new
        return s[:m.start(1)]+json.dumps(cur,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
    s=jsobj('ICO',I,True);s=jsobj('CI',CI,False);s=jsobj('RI',RI,False)
    for n,v in (('TROPHY',TROPHY),('BULB',BULB),('TARGET',TARGET),('HINT',HINT)):
        assert "'" not in v
        s=re.sub(r"const "+n+r"='[^\n]*?';\n",lambda m:"const "+n+"='"+v+"';\n",s,count=1)
    # CSS : anciennes règles .ri (dégradés, reflets, ombre portée) remplacées par la palette
    st=re.search(r'<style>(.*?)</style>',s,re.S)
    css=st.group(1)
    css=re.sub(r'\.ri \.[a-z0-9]+\{[^}]*\}\n?','',css)
    css=re.sub(r'\.ri\{filter:[^}]*\}\n?','',css)
    css=re.sub(r'\.ri\{width:100%;height:100%;display:block\}\n?','',css)
    css=re.sub(r'(?m)^/\*@ILLUS\*/.*\n','',css)
    css=css.replace('.tgi .gi{','/*@ILLUS*/'+CSS+'\n.tgi .gi{',1) if '.tgi .gi{' in css else css+'/*@ILLUS*/'+CSS+'\n'
    s=s[:st.start(1)]+css+s[st.end(1):]
    # Dégradés des anciennes icônes : retirés s'ils ne servent plus
    m=re.search(r'<svg width="0" height="0" style="position:absolute" aria-hidden="true">.*?</svg>\n?',s,re.S)
    if m:
        ids=re.findall(r'id="([^"]+)"',m.group(0));reste=s[:m.start()]+s[m.end():]
        if not any('#'+i+')' in reste for i in ids): s=reste
        else: print('dégradés encore utilisés :',[i for i in ids if '#'+i+')' in reste])
    s=re.sub(r'(<g class="tf" opacity="[.\d]+">).*?(</g>)',lambda m:m.group(1)+TF+m.group(2),s,count=1,flags=re.S)
    s=re.sub(r'(<g class="tn" opacity="[.\d]+">).*?(</g>)',lambda m:m.group(1)+TN+m.group(2),s,count=1,flags=re.S)
    s=re.sub(r'<path class="fr" d="[^"]*"/>',lambda m:'<path class="fr" d="'+FR+'"/>',s,count=1)
    open(P,'w',encoding='utf-8').write(s);print('index.html mis à jour')
