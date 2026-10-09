"""Petite faune du décor de fond (proposition) et fougères réparties sans symétrie.
Tout est en silhouettes, dans les teintes et transparences du sous-bois ; coordonnées du décor (1200 × 800).
Trois calques : FOND (toile tendue entre deux troncs), ARBRES (niche de chouette, écureuil, sur les troncs
proches), DEVANT (coccinelles sur les frondes, papillons)."""
import math,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import io,contextlib
with contextlib.redirect_stdout(io.StringIO()):
    _a=sys.argv;sys.argv=['illustrations.py'];import illustrations as I;sys.argv=_a
f=I.f;tronc=I.tronc;fronde=I.fronde
def qpt(x0,y0,x1,y1,cx,cy,t):
    p=((1-t)**2*x0+2*(1-t)*t*cx+t*t*x1,(1-t)**2*y0+2*(1-t)*t*cy+t*t*y1)
    d=(2*(1-t)*(cx-x0)+2*t*(x1-cx),2*(1-t)*(cy-y0)+2*t*(y1-cy));return p,math.degrees(math.atan2(d[1],d[0]))
# ---------- Fougères : grandes à gauche, plus basses à droite, une touffe au centre-gauche et une fronde seule au centre-droit
FRONDES=[(0,800,190,628,40,640,15,50),(26,800,268,722,128,690,12,32),(-12,800,92,688,8,720,9,26),      # gauche
         (1200,800,1070,694,1172,702,11,34),(1184,800,1012,752,1100,736,9,24),                            # droite, plus basse
         (458,800,416,706,444,744,8,22),(470,800,548,714,494,744,9,25),(464,800,482,744,466,772,5,13),    # centre-gauche (téléphone)
         (756,800,706,750,742,770,6,15),                                                                  # centre-droit, seule
         (150,800,214,744,170,770,7,16),(300,800,262,752,292,772,6,14),                                   # sol, à gauche
         (612,800,574,748,600,772,7,17),(628,800,662,758,640,778,5,12),                                   # pied du tronc central
         (900,800,932,752,908,772,6,14),(1040,800,990,756,1025,776,6,15)]                                 # sol, à droite
FR=''.join(fronde(*a) for a in FRONDES)
# ---------- Niche de chouette, creusée dans le tronc proche x=979 (axe ≈ 976 à cette hauteur, demi-largeur ≈ 13)
CHOUETTE=('<g transform="translate(976.5 322)">'
  '<path d="M-7.5 9C-9.4 2-8.8-6-4.6-10C-2-12.4 2.4-12.4 5-10C8.8-6 9.4 2 7.5 9C6 13-6 13-7.5 9Z" fill="var(--t1)" opacity=".42"/>'
  '<path d="M-5.2 10C-6.2 5-5.8-1-4.2-3.6C-3-5.6-1.4-6.6 0-6.6C1.4-6.6 3-5.6 4.2-3.6C5.8-1 6.2 5 5.2 10C3 11.6-3 11.6-5.2 10Z" fill="var(--t1)" opacity=".38"/>'
  '<path d="M-3.4-1.6Q-2.2-.7-1-1.6M1-1.6Q2.2-.7 3.4-1.6" fill="none" stroke="var(--bg2)" stroke-width=".7" stroke-linecap="round" opacity=".7"/>'
  '<path d="M-.6-.6L0 1 .6-.6Z" fill="var(--bg2)" opacity=".45"/></g>')
# ---------- Écureuil agrippé à la verticale au tronc proche x=217 (bord droit ≈ 231 à cette hauteur), tête vers le haut
ECUREUIL=('<g transform="translate(230.5 592) scale(.85)" fill="var(--t1)" opacity=".36">'
  '<path d="M11-4C16-2 21-4 23-9Q25.6-10 25.2-13Q27.2-15 26-18Q27-21 24.8-23Q25-26 22.4-27.2Q21.2-30 18.4-29.6Q17-31.6 14.6-30.4'
  'C15.8-28 16.4-25.4 16.2-22.6C17.6-19.6 17.8-16 16.6-12.6C15.6-9.6 13.4-7.4 11-7Z"/>'
  '<path d="M2.5-30C1-26 .4-20 .8-14C1.2-8 2.4-4 5-2.8C8-1.6 11.4-3 12.8-6.4C14.2-10 13.6-15 12-19.6C10.6-23.6 9.4-27.4 8.4-30.4C6.6-31.8 4-31.8 2.5-30Z"/>'
  '<path d="M2.6-30.2C1.4-31.6 1-34 1.4-36.2C1.6-37.4 2-38.6 2.6-39.8C3.8-39.4 5.2-38.9 6.4-38.4C6.9-39.9 7.9-40.8 9-40.7C9.6-39.6 9.6-38.2 9.1-37C10.1-35.2 9.9-32.5 8.6-30.6C6.6-29.6 4.4-29.6 2.6-30.2Z"/>'
  '<circle cx="4.7" cy="-35.6" r=".6" fill="var(--bg2)"/>'
  '<path d="M2.4-27C1.2-27.8-.2-28.4-1.2-28.6M1.8-24.4C.6-24.2-.6-23.8-1.4-23.2M2.4-5.4C1-5-.2-4.2-1-3.4M3.6-3C2.4-2.2 1.2-1.2.4-.2" fill="none" stroke="var(--t1)" stroke-width="1.2" stroke-linecap="round"/></g>')
# ---------- Coccinelles posées sur un rachis (position et sens calculés sur la courbe de la fronde)
def cocci(i,t,dec=2.4,s=1):
    a=FRONDES[i];(x,y),ang=qpt(*a[:6],t);n=math.radians(ang-90);x+=dec*math.cos(n);y+=dec*math.sin(n)
    return (f'<g transform="translate({f(x)} {f(y)}) rotate({f(ang)}) scale({s})">'
      '<ellipse rx="3.6" ry="2.8" fill="#a8574a" opacity=".8"/>'
      '<path d="M3-1.8A2.6 2.6 0 0 1 3 1.8L4.8 1.2A1.6 1.6 0 0 0 4.8-1.2Z" fill="var(--t1)" opacity=".75"/>'
      '<path d="M0-2.8V2.8" stroke="var(--t1)" stroke-width=".5" opacity=".5"/>'
      '<circle cx="-1.4" cy="-1.1" r=".6" fill="var(--t1)" opacity=".6"/><circle cx="1.3" cy="1.2" r=".6" fill="var(--t1)" opacity=".6"/></g>')
COCCINELLES=cocci(0,.55)+cocci(6,.62,2.2,.9)+cocci(3,.42,2.4,.95)+cocci(1,.78,2,.85)
def papillon(x,y,a,s): return (f'<g transform="translate({x} {y}) rotate({a}) scale({s})" fill="#fff" opacity=".55">'
  '<path d="M0 0C-3-6-9-8-10-4C-11 0-6 2 0 0Z"/><path d="M0 0C3-6 9-8 10-4C11 0 6 2 0 0Z"/>'
  '<path d="M0 0C-2 3-6 5-7 3C-7 1-4 0 0 0Z"/><path d="M0 0C2 3 6 5 7 3C7 1 4 0 0 0Z"/></g>')
PAPILLONS=(papillon(520,362,-12,1)+papillon(845,262,16,.7)+papillon(452,612,8,.6)+papillon(688,468,-20,.55)
           +papillon(1012,524,12,.6)+papillon(152,418,-8,.7))
# ---------- Toile : grande, tendue entre le tronc proche x=217 (bord droit ≈ 232) et le tronc lointain x=339 (bord gauche ≈ 330)
def toile(cx,cy,R,n=11,tours=6,g=232,dr=330):
    import random;h=random.Random(7)
    A=[math.radians(-90+360*k/n+h.uniform(-9,9)) for k in range(n)];L=[R*h.uniform(.86,1.04) for _ in A]
    P=lambda k,r:(cx+r*math.cos(A[k%n]),cy+r*math.sin(A[k%n]))
    d=''.join(f'M{f(cx)} {f(cy)}L{f(P(k,L[k])[0])} {f(P(k,L[k])[1])}' for k in range(n))       # rayons
    for t in range(1,tours+1):                                                               # spirale, fils un peu détendus
        q=t/tours*.94
        for k in range(n):
            a=P(k,L[k]*q);b=P(k+1,L[(k+1)%n]*q);m=((a[0]+b[0])/2,(a[1]+b[1])/2);c=(m[0]+(cx-m[0])*.07,m[1]+(cy-m[1])*.07)
            d+=f'M{f(a[0])} {f(a[1])}Q{f(c[0])} {f(c[1])} {f(b[0])} {f(b[1])}'
    # amarres : des rayons extérieurs jusqu'aux deux troncs, et un fil qui remonte
    for k in range(n):
        x,y=P(k,L[k])
        if x<cx-R*.55:d+=f'M{f(x)} {f(y)}L{g} {f(y+(y-cy)*.25)}'
        elif x>cx+R*.55:d+=f'M{f(x)} {f(y)}L{dr} {f(y+(y-cy)*.25)}'
    top=min(range(n),key=lambda k:P(k,L[k])[1]);x,y=P(top,L[top]);d+=f'M{f(x)} {f(y)}L{f(x+4)} {f(y-60)}'
    return f'<path d="{d}" fill="none" stroke="var(--t1)" stroke-width=".42" stroke-linecap="round" opacity=".26"/>'
TOILE=toile(281,336,36)
FOND=TOILE
ARBRES=CHOUETTE+ECUREUIL
DEVANT=COCCINELLES+PAPILLONS
if __name__=='__main__':
    import json;json.dump({'FR':FR,'FOND':FOND,'ARBRES':ARBRES,'DEVANT':DEVANT},open(sys.argv[1],'w'))
