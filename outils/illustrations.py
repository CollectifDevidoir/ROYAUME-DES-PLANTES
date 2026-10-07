"""Lot 2, étape C (version 2) : illustrations « vignettes ludiques ».
Formes pleines et arrondies, couleurs franches. Le volume vient de deux tons (un dessous plus foncé,
légèrement décalé) et d'un petit reflet clair. Ni trait d'encre, ni dégradé, ni filtre.
Les rangs suivent les saisons (printemps → été → automne → nuit étoilée → or).
Usage : python3 outils/illustrations.py --ecrire          remplace les illustrations, leur CSS et le décor dans index.html
        python3 outils/illustrations.py --json fichier    écrit les dessins dans un fichier JSON (aperçu)"""
import json,math,re,sys,os

# Palette : une teinte = 3 ou 4 tons (1 clair, 2 base, 3 ombre, 4 ombre profonde)
PAL={'g1':'#b4e67f','g2':'#72c24c','g3':'#459c3c','g4':'#2c7433',
     't1':'#86e0c4','t2':'#33b48f','t3':'#1f8a6d','t4':'#14614f',
     'b1':'#c99263','b2':'#9c653a','b3':'#734529',
     'w1':'#ffe6b5','w2':'#f6c67c','w3':'#d99a4f',
     'y1':'#fff3a8','y2':'#ffcf3d','y3':'#ef9f1c',
     'o1':'#ffb684','o2':'#f27c46','o3':'#c8552c',
     'r1':'#ffa3b5','r2':'#f0466b','r3':'#c22a50',
     'p1':'#ffd6e6','p2':'#ff92bb','p3':'#e2628f',
     'v1':'#dcc2ff','v2':'#ab7ce9','v3':'#7c52c4',
     'u1':'#c8ecff','u2':'#4db3f2','u3':'#2a83cc',
     'n2':'#4256a6','n3':'#2e3b7e',
     'c1':'#fffaf0','c2':'#f6e7c4','c3':'#dfc591',
     's1':'#dcd8d0','s2':'#b3ada2','s3':'#8d877c',
     'd1':'#bd8a5c','d2':'#93613c','d3':'#6c4428'}
def f(x): return ('%.1f'%x).rstrip('0').rstrip('.')
def F(d,c,tr=''): return f'<path class="f{c}"{" transform=%s" % chr(34)+tr+chr(34) if tr else ""} d="{d}"/>'
def S(d,c,w): return f'<path class="s{c}" stroke-width="{f(w)}" d="{d}"/>'
def dep(d,c,cd,dx=1.4,dy=1.8): return F(d,cd,f'translate({f(dx)} {f(dy)})')+F(d,c)
def Sdep(d,c,cd,w,dx=1,dy=1.4): return f'<path class="s{cd}" stroke-width="{f(w)}" transform="translate({f(dx)} {f(dy)})" d="{d}"/>'+S(d,c,w)
def circ(cx,cy,r): return f'M{f(cx-r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx+r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx-r)} {f(cy)}Z'
def ell(cx,cy,rx,ry): return f'M{f(cx-rx)} {f(cy)}A{f(rx)} {f(ry)} 0 1 0 {f(cx+rx)} {f(cy)}A{f(rx)} {f(ry)} 0 1 0 {f(cx-rx)} {f(cy)}Z'
def g(body,x,y,a=0,s=1): return f'<g transform="translate({f(x)} {f(y)}) rotate({f(a)}){"" if s==1 else " scale("+f(s)+")"}">{body}</g>'
def shadow(cx=32,cy=58.5,rx=18,ry=2.8): return f'<ellipse class="sh" cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}"/>'
def svg(body): return '<svg class="ri" viewBox="0 0 64 64" aria-hidden="true">'+body+'</svg>'
def leafd(l,w): return f'M0 0C{f(w)} {f(-l*.28)} {f(w*.75)} {f(-l*.78)} 0 {f(-l)}C{f(-w*.75)} {f(-l*.78)} {f(-w)} {f(-l*.28)} 0 0Z'
def halfd(l,w): return f'M0 0C{f(w)} {f(-l*.28)} {f(w*.75)} {f(-l*.78)} 0 {f(-l)}Z'
def leaf(x,y,a,l,w,c='g2',cd='g3',rib='g1'):
    b=F(leafd(l,w),c)+F(halfd(l,w),cd)
    if rib: b+=S(f'M0 {f(-l*.12)}L0 {f(-l*.7)}',rib,max(1,w*.22))
    return g(b,x,y,a)
def bumps(cx,cy,rx,ry,n,amp=.2,a0=-90,jit=None):
    """Contour festonné : n lobes autour d'une ellipse."""
    pts=[];jit=jit or [1]*n
    for i in range(n):
        t=math.radians(a0+360*i/n);pts.append((cx+rx*math.cos(t),cy+ry*math.sin(t)))
    d=f'M{f(pts[0][0])} {f(pts[0][1])}'
    for i in range(n):
        t=math.radians(a0+360*(i+.5)/n);k=1+amp*2*jit[i]
        qx,qy=cx+rx*k*math.cos(t),cy+ry*k*math.sin(t);p=pts[(i+1)%n]
        d+=f'Q{f(qx)} {f(qy)} {f(p[0])} {f(p[1])}'
    return d+'Z'
def crown_blob(cx,cy,rx,ry,n,c1,c2,c3,jit=None,amp=.13,a0=-90,spots=True):
    """Houppier en volume : ombre en bas à droite, base, reflet en haut à gauche."""
    b=F(bumps(cx,cy,rx,ry,n,amp,a0,jit),c3)
    b+=F(bumps(cx-1.4,cy-2.2,rx-2.2,ry-2.6,n,amp,a0,jit),c2)
    if spots:
        b+=F(bumps(cx-rx*.38,cy-ry*.36,rx*.3,ry*.26,6,.16),c1)
    return b
def trunk(x,yb,yt,wb,wt,c='b2',cd='b3'):
    d=f'M{f(x-wb)} {yb}C{f(x-wb*.55)} {f((yb+yt)/2)} {f(x-wt)} {f(yt+4)} {f(x-wt)} {yt}L{f(x+wt)} {yt}C{f(x+wt)} {f(yt+4)} {f(x+wb*.55)} {f((yb+yt)/2)} {f(x+wb)} {yb}Z'
    half=f'M{x} {yt}L{f(x+wt)} {yt}C{f(x+wt)} {f(yt+4)} {f(x+wb*.55)} {f((yb+yt)/2)} {f(x+wb)} {yb}L{f(x+wb*.25)} {yb}C{f(x+wb*.2)} {f((yb+yt)/2)} {f(x+wt*.3)} {f(yt+4)} {x} {yt}Z'
    return F(d,c)+F(half,cd)
def star(cx,cy,r,q):
    return f'M{f(cx)} {f(cy-r)}Q{f(cx+q)} {f(cy-q)} {f(cx+r)} {f(cy)}Q{f(cx+q)} {f(cy+q)} {f(cx)} {f(cy+r)}Q{f(cx-q)} {f(cy+q)} {f(cx-r)} {f(cy)}Q{f(cx-q)} {f(cy-q)} {f(cx)} {f(cy-r)}Z'
def star5(cx,cy,R,r):
    p=[]
    for i in range(10):
        a=math.radians(-90+36*i);rr=R if i%2==0 else r;p.append(f'{f(cx+rr*math.cos(a))} {f(cy+rr*math.sin(a))}')
    return 'M'+'L'.join(p)+'Z'
def berry(x,y,r=2.8,c='r2',cd='r3',cl='r1'):
    return F(circ(x,y,r),cd)+F(circ(x-.4,y-.5,r*.82),c)+F(circ(x-r*.35,y-r*.4,r*.28),cl)

I={}
# ---------- Icônes ----------
OAK="M32 7C36 7 37.5 11.5 35.5 14.5C39.5 13 43.5 15.5 42 19.5C41 21.5 39 21.5 38 22.5C42.5 22 46 25 44 28.5C42.5 30.5 40 30 39 31C43.5 31.5 46 35 43 38C41 39.5 39 39 38 39.5C40 42 40 45.5 37 46.5C35.5 47 34 47 33.5 48.5V57H30.5V48.5C30 47 28.5 47 27 46.5C24 45.5 24 42 26 39.5C25 39 23 39.5 21 38C18 35 20.5 31.5 25 31C24 30 21.5 30.5 20 28.5C18 25 21.5 22 26 22.5C25 21.5 23 21.5 22 19.5C20.5 15.5 24.5 13 28.5 14.5C26.5 11.5 28 7 32 7Z"
OAKR="M32 7C36 7 37.5 11.5 35.5 14.5C39.5 13 43.5 15.5 42 19.5C41 21.5 39 21.5 38 22.5C42.5 22 46 25 44 28.5C42.5 30.5 40 30 39 31C43.5 31.5 46 35 43 38C41 39.5 39 39 38 39.5C40 42 40 45.5 37 46.5C35.5 47 34 47 33.5 48.5V57H32Z"
I['quiz']=svg(shadow(32,59,12,2.2)+'<g transform="translate(32 0) scale(1.2 1) translate(-32 0)">'+F(OAK,'g2')+F(OAKR,'g3')+S('M32 13V52M32 23L37 20.5M32 23L27 20.5M32 32L38.5 29.5M32 32L25.5 29.5M32 41L36.5 38.5M32 41L27.5 38.5','g1',1.8)+F(ell(26,17,2.2,3.6),'g1')+'</g>')
cover="M5 21C16 16 26 17 32 22C38 17 48 16 59 21V53C48 49 38 50 32 54C26 50 16 49 5 53Z"
pl="M8 18C18 14 26 15 32 19V50C26 46 18 45 8 49Z";pr="M56 18C46 14 38 15 32 19V50C38 46 46 45 56 49Z"
I['herbier']=svg(shadow(32,58.5,24,2.4)+dep(cover,'t2','t4',0,2)+F(pl,'c1')+F(pr,'c1')+F('M32 19C34 17.5 36 16.6 38 16.2V47C36 47.4 34 48.3 32 50Z','c2')+F('M32 19C30 17.5 28 16.6 26 16.2V47C28 47.4 30 48.3 32 50Z','c2')
  +S('M13 25L24 25.6M13 30.5L23 31M13 36L21 36.4','c3',2)+leaf(44,43,36,20,7,'g2','g3','g1')+F('M30 49H34V60L32 58L30 60Z','r2'))
I['progres']=svg(shadow(32,59,20,2.6)+dep(circ(32,33,22),'b2','b3',0,2.4)+F(circ(32,33,18),'w2')+F(circ(31.4,32.4,16.6),'w1')
  +S(circ(31.5,33,12),'w3',1.8)+S(circ(31,33.2,7.4),'w3',1.8)+F(circ(30.8,33.4,2.6),'w3')+S('M37 37L44 45','w3',2)
  +S('M44 13C45 9 47 7 50 6','g3',2.4)+leaf(48,10,44,13,5,'g2','g3',None))
rays=''
for i,a in enumerate(range(0,360,45)):
    r=math.radians(a);l=24 if i%2==0 else 21.5
    p=lambda R,da:(32+R*math.cos(r+da),32+R*math.sin(r+da))
    a1,a2,t=p(16,-.2),p(16,.2),p(l,0)
    rays+=F(f'M{f(a1[0])} {f(a1[1])}L{f(t[0])} {f(t[1])}L{f(a2[0])} {f(a2[1])}Z','y3')
I['soleil']=svg(rays+dep(circ(32,32,13.5),'y2','y3',1,1.4)+F(circ(28,27.5,4),'y1'))
mound="M5 56C9 43 20 36 32 36C44 36 55 43 59 56Z"
I['sol']=svg(dep(mound,'d2','d3',0,2)+F('M8.5 48C18 45 46 45 55.5 48C56.5 50 57.3 52 58 54C46 51 18 51 6 54C6.7 52 7.5 50 8.5 48Z','d1')
  +F(ell(43,51,4.6,3),'s2')+F(ell(42.4,50.3,3.4,2),'s1')+F(ell(20,43,2.6,1.8),'s2')
  +S('M32 37C31.5 30 32 25 33 19','g3',2.6)+leaf(32,27,-58,14,5.4,'g2','g3',None)+leaf(32.6,22,54,13,5,'g1','g2',None))
drop="M32 6C38 16 48 27 48 39C48 48.5 41 56 32 56C23 56 16 48.5 16 39C16 27 26 16 32 6Z"
I['eau']=svg(shadow(32,59.5,12,2)+dep(drop,'u2','u3',1.4,1.4)+F('M23.5 37C23 43 26 48 31 49.5C27 49.5 21 45 21.5 38.5C21.6 37 23.4 36 23.5 37Z','u1')+F(circ(26,30,2),'u1'))
tube="M23 7H41V49C41 54.5 37 58 32 58C27 58 23 54.5 23 49Z"
I['ph']=svg(shadow(32,59.5,10,2)+dep(tube,'u1','s2',1,1.2)+F('M25.5 30H38.5V49C38.5 53 35.5 55.5 32 55.5C28.5 55.5 25.5 53 25.5 49Z','v2')
  +F('M25.5 30H38.5V38H25.5Z','r2')+F('M25.5 46H38.5V49C38.5 53 35.5 55.5 32 55.5C28.5 55.5 25.5 53 25.5 49Z','u2')
  +F('M27 12H29.5V46H27Z','c1')+dep('M20.5 4.5H43.5V11.5H20.5Z','b1','b3',0,1.6))
fl=''
for a in range(0,360,60):
    r=math.radians(a-90);ux,uy=math.cos(r),math.sin(r)
    fl+=f'M32 32L{f(32+22*ux)} {f(32+22*uy)}'
    px,py=32+13*ux,32+13*uy
    for sg in (1,-1):
        r2=r+sg*math.radians(45);fl+=f'M{f(px)} {f(py)}L{f(px+7*math.cos(r2))} {f(py+7*math.sin(r2))}'
I['froid']=svg(Sdep(fl,'u2','u3',5.2)+dep(star(32,32,7,1.6),'u1','u3',.6,.9))
I['coche']=svg('<path class="kok" stroke-width="8" d="M14 33L27 46L50 19"/>')
I['croix']=svg('<path class="kko" stroke-width="8" d="M18 18L46 46M46 18L18 46"/>')
I['etincelle']=svg(dep(star(27,35,23,4.6),'y2','y3',1.2,1.6)+F(star(24.5,30.5,7,1.6),'y1')+dep(star(50,13,10,2.4),'p2','p3',.8,1))
def gear(cx,cy,ro,ri,n):
    pts=[]
    for i in range(n*4):
        a=math.radians(-90+360*i/(n*4)-360/(n*8));r=ro if i%4 in (1,2) else ri
        pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    return 'M'+'L'.join(f'{f(x)} {f(y)}' for x,y in pts)+'Z'
I['reglages']=svg(shadow(31,59,18,2.4)+dep(gear(31,34,23,17.5,8),'w2','w3',0,2.2)+F(circ(29.5,32,13),'w1')+dep(circ(31,34,7.5),'t2','t3',0,1.2)+F(circ(29.5,32.5,2.4),'t1')
  +S('M44 17C46 13 48 11 51 10','g3',2.4)+leaf(49,13,46,13,5,'g2','g3',None))

# Profil : deux pousses côte à côte sur une même butte (moi et mes amis)
I['profil']=svg(dep('M9 58C11 49 20 46 32 46C44 46 53 49 55 58Z','d2','d3',0,1.4)+F('M13.5 52.5C19 49.6 25.5 48.6 32 48.6C38.5 48.6 45 49.6 50.5 52.5C44 51.2 38 50.8 32 50.8C26 50.8 20 51.2 13.5 52.5Z','d1')
  +S('M21 48C21 39 20 33 21 26','g3',3)+leaf(21,34,-58,14,5.8,'g2','g3',None)+leaf(21,27,52,12,5,'g1','g2',None)+F(circ(21,21,5.2),'p2')+F(circ(19.6,19.6,1.6),'p1')
  +S('M43 48C43 37 44 29 43 20','t3',3)+leaf(43,33,58,15,6,'t2','t3',None)+leaf(43,26,-54,13,5.2,'t1','t2',None)+dep(circ(43,15,5.6),'y2','y3',.4,.6)+F(circ(41.5,13.6,1.7),'y1'))
# Flamme : jours de suite
FL='M32 5C36 15 47 21 47 36C47 47 40 56 32 56C24 56 17 47 17 37C17 29 21 25 24 21C24 27 26 30 29 31C28 22 29 12 32 5Z'
I['flamme']=svg(shadow(32,59.5,12,2)+dep(FL,'o2','o3',1,1.2)+F('M32 25C35 31 41 35 41 43C41 49.5 37 53 32 53C27 53 23 49.5 23 44C23 39 26 36 28 34C28 38 30 40 32 40C31 35 31 30 32 25Z','y2')+F('M27 41C26 45 27 48 30 50C26 49.5 24.5 46.5 25 43C25.3 41.5 27.2 40 27 41Z','y1'))
# ---------- Trophée → couronne de laurier et médaille ; ampoule → étiquette ; cible → boussole ; loupe ----------
lau=S('M28 54C15 49 9 35 14.5 18','g4',2.6)+S('M36 54C49 49 55 35 49.5 18','g4',2.6)
for i,(x,y,a) in enumerate([(19,50,-130),(13.5,42.5,-112),(11.5,33.5,-92),(12.5,25,-74),(15,18,-56)]):
    lau+=leaf(x,y,a,11.5,4.6,'g2' if i%2 else 'g3','g4' if i%2 else 'g4',None)+leaf(64-x,y,-a,11.5,4.6,'g3' if i%2 else 'g2','g4',None)
TROPHY=svg(lau+dep('M25.5 41H38.5L41 56L32 51.5L23 56Z','r2','r3',0,1.4)+dep(circ(32,32,11.5),'y2','y3',0,1.8)+F(circ(32,32,8),'y3')+F(star5(32,32.6,6.4,2.7),'y1'))
tag="M10 20L42 12L55 23L58 47L16 55Z"
BULB=svg(shadow(34,59,19,2.2)+S('M49 21C52 13 57 10 60 5','o2',2.4)+dep(tag,'c1','c3',1,2)+F('M42 12L55 23L52.5 24.5L41 15Z','c2')+dep(circ(48.5,22.5,3.4),'o2','o3',.4,.6)+F(circ(48.5,22.5,1.5),'c1')
  +leaf(20,49,62,16,6,'g2','g3','g1')+S('M30 34L49 31M31 40.5L50 37.7','c3',2.2))
TARGET=svg(shadow(32,60,17,2.2)+dep(circ(32,35,24),'y2','y3',0,2)+F(circ(32,35,18.5),'c1')+F('M32 16.5A18.5 18.5 0 0 1 50.5 35H46A14 14 0 0 0 32 21Z','c2')
  +dep('M27.5 5.5H36.5V11H27.5Z','y2','y3',0,1)+F('M32 18.5L38 35H26Z','r2')+F('M32 18.5L38 35H32Z','r3')+F('M32 51.5L38 35H26Z','n2')+F('M32 51.5L38 35H32Z','n3')
  +F(circ(32,35,3),'y3')+F(circ(31.4,34.4,1.4),'y1')+S('M32 19V21.5M32 48.5V51M15.5 35H18M46 35H48.5','s2',2))
HINT=svg(shadow(36,60,16,2)+Sdep('M42 42L54.5 54.5','b2','b3',8,0,1.4)+S('M44 44L50 50','b1',3)+dep(circ(27,27,19.5),'y2','y3',0,1.8)+F(circ(27,27,15),'u1')
  +leaf(22,35,36,18,6.6,'g2','g3','g1')+F('M16 22C17 17 21 13.5 26 12.5C22 15.5 19.5 19 19 23.5C18.6 25 15.8 24.5 16 22Z','c1'))

# ---------- Catégories ----------
CI={}
CI['arbre']=shadow(32,58.5,17,2.6)+trunk(32,57,34,6.2,3.6)+S('M31.5 45L25 38M33.5 42.5L39.5 37','b3',2.4)+crown_blob(32,25,19.5,16,9,'g1','g2','g3',jit=[1,.8,1.1,.9,1,1.2,.8,1,.9])
# Arbuste : dôme rond posé sur trois tiges courtes, trois baies (lisible à 24 px)
CI['arbuste']=shadow(32,58.5,19,2.6)+S('M28 57L26.5 49M32 57V48M36 57L37.5 49','b2',2.6)+crown_blob(32,35,21,16,9,'g1','t2','t3',jit=[1,1.1,.9,1,1.15,.9,1,1.05,.9],a0=-90)+''.join(berry(x,y,2.8) for x,y in [(24,37),(38,31),(36,43)])
pet=lambda c,cd,cl: F('M0 0C5 -3 6.5 -10.5 0 -15C-6.5 -10.5 -5 -3 0 0Z',cd)+F('M0 -1C3.6 -3.4 4.6 -9.6 0 -13.4C-4.6 -9.6 -3.6 -3.4 0 -1Z',c)
CI['vivace']=shadow(32,59,9,2)+S('M32 58C31 49 33 41 32 32','g3',3)+leaf(31.5,51,-60,13,5.2,'g2','g3',None)+leaf(32,46,58,12,4.8,'g2','g3',None)+''.join(
  g(pet('p2','p3','p1'),32,22,a) for a in range(0,360,60))+dep(circ(32,22,5),'y2','y3',.6,.8)+F(circ(30.6,20.6,1.6),'y1')
# Grimpante : tuteur au centre, tige enroulée de part et d'autre ; feuilles et fleur alternent gauche/droite
fleur=''.join(g(F('M0 0C3.4 -2.8 4 -8 0 -11C-4 -8 -3.4 -2.8 0 0Z','v3')+F('M0 -.8C2.6 -2.8 3 -7.2 0 -9.6C-3 -7.2 -2.6 -2.8 0 -.8Z','v2'),0,0,a) for a in range(0,360,72))+F(circ(0,0,2.8),'y2')
CI['grimpante']=shadow(32,59,13,2.2)+dep('M30 58V9.5C30 8.4 30.9 7.5 32 7.5C33.1 7.5 34 8.4 34 9.5V58Z','b1','b3',1,0)\
  +S('M32 56C42 53 42 46 32 43C22 40 22 33 32 30C42 27 42 20 32 17','g3',2.8)\
  +leaf(40,48,62,13,5.4,'g2','g3',None)+leaf(24,36,-62,13,5.4,'t2','t3',None)+leaf(40,23,58,12,5,'g2','g3',None)+g(fleur,22.5,17,0,.85)
gr=shadow(32,58.5,16,2.2)
for x0,x1,y1,c in [(25,9,24,'g3'),(28.5,17,13,'g2'),(32,33,7,'g3'),(35.5,47,12,'g2'),(39,56,22,'g3')]:
    gr+=F(f'M{f(x0-2.4)} 58C{f(x0-2.4)} 45 {f((x0+x1)/2-1)} {f(y1+10)} {x1} {y1}C{f((x0+x1)/2+1.4)} {f(y1+11)} {f(x0+2.4)} 46 {f(x0+2.4)} 58Z',c)
for x,y,a in [(17,23,-28),(33,17,0),(47,22,26)]:
    gr+=g(dep('M0 0C3 -3.4 3 -10 0 -13.5C-3 -10 -3 -3.4 0 0Z','y2','y3',.8,.8)+S('M0 -3V-10','y1',1.2),x,y,a)
CI['graminée']=gr

# ---------- Rangs (printemps → été → automne → nuit → or) ----------
RI=[]
acorn="M20 28C20 43 25 54 32 57C39 54 44 43 44 28Z"
RI.append(shadow(32,59.5,11,2)+dep(acorn,'w2','w3',1.4,1)+F('M24 31C24 42 27 50 31 53C26 51 22.5 43 22.5 32Z','w1')
  +dep('M15.5 29C15.5 18.5 23 13 32 13C41 13 48.5 18.5 48.5 29C40 32.5 24 32.5 15.5 29Z','b2','b3',0,1.6)+''.join(F(circ(x,y,1.3),'b1') for x,y in [(23,20),(29,18),(35,18),(41,20),(26,25),(32,24),(38,25)])
  +S('M32 13C32 9 34 6 38 5','b3',3))
# Butte resserrée (≈ la largeur du gland) : la plante reste le sujet et occupe le haut du cadre
mound="M13 58C14.5 50 22 47 32 47C42 47 49.5 50 51 58Z"
MT=F('M16.5 52C21 49.6 26.5 48.8 32 48.8C37.5 48.8 43 49.6 47.5 52C42 51 37 50.6 32 50.6C27 50.6 22 51 16.5 52Z','d1')
# Germe : deux cotylédons bien ouverts
RI.append(dep(mound,'d2','d3',0,1.4)+MT+S('M32 49C32 42 31.6 36 32 30','g3',3)+leaf(32,31,-64,18,7.6,'g1','g2',None)+leaf(32,31,64,18,7.6,'g2','g3',None))
# Pousse : tige plus haute, cotylédons en bas, une paire de vraies feuilles au sommet
RI.append(dep(mound,'d2','d3',0,1.4)+MT+S('M32 49C32 40 31.6 31 32 22','g3',3)+leaf(32,40,-66,13,5.6,'g1','g2',None)+leaf(32,40,66,13,5.6,'g2','g3',None)
  +leaf(32,24,-38,18,7.4,'g2','g3','g1')+leaf(32,24,38,18,7.4,'g1','g2','g1'))
pot="M19 41H45L41 58H23Z"
RI.append(shadow(32,59.5,13,2)+S('M32 41C32 32 31.5 24 32 13','g3',2.8)+leaf(32,36,-56,15,6,'g2','g3',None)+leaf(32,36,56,15,6,'g1','g2',None)+leaf(32,27,-48,12.5,5.2,'g1','g2',None)+leaf(32,27,48,12.5,5.2,'g2','g3',None)+leaf(32,15,0,10,4.6,'g1','g2',None)
  +dep(pot,'o2','o3',0,1.2)+F('M36 41H45L41 58H34Z','o3')+dep('M16 36.5H48V43.5H16Z','o2','o3',0,1.2)+F('M16 36.5H48V38.5H16Z','o1'))
RI.append(shadow(32,58.5,20,2.6)+S('M28 57L25 46M36 57L39 46M32 57V48','b2',2.8)+crown_blob(32,37,20,13,9,'g1','g2','g3',jit=[1,.9,1.1,1,.8,1.2,1,.9,1])
  +''.join(g(''.join(F('M0 0C1.6 -1 2 -3.6 0 -5C-2 -3.6 -1.6 -1 0 0Z','p2').join(['<g transform="rotate(%d)">'%a,'</g>']) for a in range(0,360,72))+F(circ(0,0,1.3),'y2'),x,y) for x,y in [(22,34),(31,29),(41,34),(35,42),(25,42)]))
RI.append(shadow(32,58.5,11,2.2)+trunk(32,57,32,3.4,2.1)+S('M32 44L37.5 39','b3',2)+crown_blob(32,22,12.5,15.5,8,'g1','g1','g2',spots=False)+F(ell(28,17,3,5),'c1'))
RI.append(shadow(32,58.5,18,2.6)+trunk(32,57,36,5.8,3.4)+S('M31 46L25 39M33.5 43L39 38','b3',2.2)+crown_blob(32,25,20.5,17,10,'g1','g2','g3',jit=[1,.9,1.1,1,.8,1.2,1,.9,1,1.1])
  +''.join(berry(x,y,2.8) for x,y in [(22,30),(41,23),(36,33),(27,21)]))
RI.append(shadow(32,58.5,24,2.8)+trunk(32,57,35,8,4.6)+S('M30 45L19 36M34 43L46 35','b3',2.8)+crown_blob(32,25,26,16,12,'g2','g3','g4',jit=[1,1.2,.8,1,1.1,.9,1,1.2,.9,1,.8,1.1],a0=-95)
  +''.join(g(dep('M-2.4 0C-2.4 4 -1.2 6.2 0 6.8C1.2 6.2 2.4 4 2.4 0Z','w2','w3',.4,.4)+F('M-3 .5C-3 -2 3 -2 3 .5Z','b2'),x,y) for x,y in [(19,29),(44,31),(33,33)]))
RI.append(shadow(32,58.5,28,2.6)+trunk(14,57,40,3.6,2.2)+crown_blob(14,31,10,11,8,'y1','y2','y3')+trunk(50,57,40,3.6,2.2)+crown_blob(50,31,10,11,8,'o1','o2','o3')
  +trunk(32,57,35,4.6,2.8)+crown_blob(32,24,13,14,9,'g1','g2','g3'))
def fir(x,yb,h,w,c,cd):
    d=f'M{x} {f(yb-h)}L{f(x+w*.55)} {f(yb-h*.62)}L{f(x+w*.3)} {f(yb-h*.62)}L{f(x+w*.8)} {f(yb-h*.3)}L{f(x+w*.45)} {f(yb-h*.3)}L{f(x+w)} {f(yb-6)}L{f(x-w)} {f(yb-6)}L{f(x-w*.45)} {f(yb-h*.3)}L{f(x-w*.8)} {f(yb-h*.3)}L{f(x-w*.3)} {f(yb-h*.62)}L{f(x-w*.55)} {f(yb-h*.62)}Z'
    half=f'M{x} {f(yb-h)}L{f(x+w*.55)} {f(yb-h*.62)}L{f(x+w*.3)} {f(yb-h*.62)}L{f(x+w*.8)} {f(yb-h*.3)}L{f(x+w*.45)} {f(yb-h*.3)}L{f(x+w)} {f(yb-6)}L{x} {f(yb-6)}Z'
    return F(f'M{f(x-1.6)} {yb}V{f(yb-7)}H{f(x+1.6)}V{yb}Z','b2')+F(d,c)+F(half,cd)
RI.append(shadow(32,58.5,28,2.6)+fir(15,58,34,10,'t2','t3')+fir(49,58,36,10.5,'t2','t3')+fir(32,58,48,13,'g3','g4')+fir(23,59,24,7.5,'t1','t2')+fir(42,59,23,7.5,'g2','g3'))
RI.append(F(circ(32,30,26),'n2')+F('M58 30A26 26 0 0 1 6 30A26 24 0 0 0 58 30Z','n3')+F('M47 9A9 9 0 1 0 55 21A7 7 0 1 1 47 9Z','y1')+''.join(F(star(x,y,r,r*.25),'y2') for x,y,r in [(14,14,3),(22,8,2),(40,10,2.2)])
  +shadow(32,58.5,24,2.6)+trunk(30,57,33,8.5,5)+S('M27.5 42L18 34M33 39L42 32','b3',2.6)+crown_blob(29,25,19,12.5,11,'t1','t2','t3',jit=[1,1.1,.8,1.2,1,.9,1,1.1,.9,1,1],a0=-80)
  +''.join(F(circ(x,y,1.5),'y2') for x,y in [(12,45),(50,40),(46,50)]))
crown="M20 13L25 17.5L28.5 8L32 15L35.5 8L39 17.5L44 13L42 22H22Z"
RI.append(F(star(11,14,4,1),'y2')+F(star(54,20,3,.8),'y2')+shadow(32,58.5,24,2.8)+trunk(32,57,40,7.5,4.6)+S('M30 49L20 41M34 47L45 39','b3',2.6)
  +crown_blob(32,33,24,12,12,'y1','y2','y3',jit=[1,1.2,.8,1,1.1,.9,1,1.2,.9,1,.8,1.1],a0=-95)+''.join(berry(x,y,2.3,'o2','o3','o1') for x,y in [(20,36),(40,30),(44,38)])
  +dep(crown,'y2','y3',0,1.4)+F(circ(32,18,1.8),'r2')+F(circ(24.5,19.2,1.3),'u2')+F(circ(39.5,19.2,1.3),'u2'))
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
# ---------- Page d'ouverture (#splash) : trois plans en parallaxe, 1200×800 ancrés en bas ----------
# Sur téléphone (portrait), seule la bande centrale x ≈ 415–785 est visible : le cadrage s'y concentre.
def lisiere(y0,seed=3):
    """Ligne d'horizon de forêt lointaine : houppiers ronds et quelques sapins."""
    import random;R=random.Random(seed);x=0;d=f'M0 800V{y0}'
    while x<1200:
        if R.random()<.28:
            w=R.uniform(26,40);h=R.uniform(70,110);d+=f'L{f(x+w*.5)} {f(y0-h)}L{f(x+w)} {y0}';x+=w
        else:
            w=R.uniform(50,90);h=R.uniform(40,75);d+=f'C{f(x)} {f(y0-h)} {f(x+w)} {f(y0-h)} {f(x+w)} {y0}';x+=w
    return d+'V800Z'
def voute(y0,n=26,seed=5):
    """Canopée feuillue en haut : grappes festonnées qui retombent inégalement."""
    import random;R=random.Random(seed);w=1200/n;d=f'M0 0H1200V{y0}'
    for i in range(n):
        x=1200-i*w;d+=f'Q{f(x-w/2)} {f(y0+R.uniform(22,34))} {f(x-w)} {f(y0+R.uniform(-8,10))}'
    return d+'Z'
SP_L1=f'<path d="{lisiere(600)}"/><path opacity=".7" d="{lisiere(640,9)}"/>'
SP_L2=(''.join(f'<path d="{tronc(x,w,l,1.6,0)}"/>' for x,w,l in [(130,16,-6),(300,12,5),(455,14,-4),(745,15,5),(900,12,-5),(1075,17,6)])
       +f'<path d="{voute(78,34,5)}"/><path opacity=".55" d="{voute(108,44,8)}"/>')
SP_L3=(''.join(f'<path d="{tronc(x,w,l,1.5,-10)}"/>' for x,w,l in [(25,46,-8),(398,30,6),(803,32,-7),(1178,48,8)])
       +'<path d="'+fronde(415,800,560,640,440,660,13,44)+fronde(440,800,600,730,500,715,10,28)+fronde(785,800,640,640,760,660,13,44)
       +fronde(760,800,600,730,700,715,10,28)+fronde(0,800,200,620,40,640,14,52)+fronde(1200,800,1000,620,1160,640,14,52)
       +fronde(70,800,300,730,170,700,11,32)+fronde(1130,800,900,730,1030,700,11,32)+'"/>')
SPLASH={'l1':SP_L1,'l2':SP_L2,'l3':SP_L3}


out={'ICO':I,'CI':CI,'RI':RI,'TROPHY':TROPHY,'BULB':BULB,'TARGET':TARGET,'HINT':HINT}
tout=json.dumps(out)
uf=sorted(set(re.findall(r'class=\\?"f(\w\d)',tout)));us=sorted(set(re.findall(r'class=\\?"s(\w\d)',tout)))
# icônes au trait (croix, chevrons, flèches) : leur règle vit ici pour ne plus être effacée à la réécriture
CSS=('.tgi .gi{width:100%;height:100%;display:block;fill:none;stroke:currentColor;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}'
     +'.ri{width:100%;height:100%;display:block}.ri .sh{fill:#000;opacity:.12}@media(prefers-color-scheme:dark){.ri .sh{opacity:.3}}'
     +','.join(f'.ri .s{k}' for k in us)+',.ri .kok,.ri .kko{fill:none;stroke-linecap:round;stroke-linejoin:round}.ri .kok{stroke:var(--ok)}.ri .kko{stroke:var(--ko)}'
     # sur un fond vert plein (onglet actif, tuile active), l'icône se pose sur une pastille claire
     +'.tabs button[aria-current=true] .tgi,#chips .cats button[aria-pressed=true] .cti{background:#fbfdf9;border-radius:50%;padding:2px;box-shadow:0 1px 3px rgba(10,40,20,.25)}'
     +''.join(f'.ri .f{k}{{fill:{PAL[k]}}}' for k in uf)+''.join(f'.ri .s{k}{{stroke:{PAL[k]}}}' for k in us))
out['CSS']=CSS
D=os.path.dirname(os.path.abspath(__file__))
if '--json' in sys.argv: json.dump(out,open(sys.argv[sys.argv.index('--json')+1],'w'),ensure_ascii=False)
print(len(I),'icônes,',len(CI),'catégories,',len(RI),'rangs ;',len(uf)+len(us),'couleurs')
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
    for k,v in SPLASH.items():
        s=re.sub(r'<svg class="ly '+k+r'" viewBox="[^"]*" preserveAspectRatio="[^"]*" aria-hidden="true">(<g [^>]*>).*?</g></svg>',
                 lambda m:'<svg class="ly '+k+'" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">'+m.group(1)+v+'</g></svg>',s,count=1,flags=re.S)
    open(P,'w',encoding='utf-8').write(s);print('index.html mis à jour')
