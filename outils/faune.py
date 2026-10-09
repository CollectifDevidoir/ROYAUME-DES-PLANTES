"""Petite faune du décor de fond (proposition) et fougères réparties sans symétrie.
Tout est en silhouettes, dans les teintes et transparences du sous-bois ; coordonnées du décor (1200 × 800).
Trois calques : FOND (renard, derrière un tronc lointain, masqué par lui), ARBRES (niche de chouette,
écureuil, sur les troncs proches), DEVANT (coccinelles sur les frondes, papillons, toile)."""
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
         (756,800,706,750,742,770,6,15)]                                                                  # centre-droit, seule
FR=''.join(fronde(*a) for a in FRONDES)
# ---------- Renard : ombre qui passe derrière un tronc lointain (x=621), la tête qui dépasse
RENARD=('M-30-14C-24-19-8-21 6-19.5C13-19 18-20.5 22-24L23.6-31.5 26.4-25.6 29-30.6 29.8-23.6C32.4-22 35.6-20.2 40.6-18.8'
        'C37.6-16.2 33.6-15.4 29.6-15.6C27.6-12.6 24.6-10.8 21-10.2L22.4-4 21.4 0H19.2L19.4-4 17.4-8.8C9-7.6 0-7.4-10-8.6'
        'L-11.6-4.4-10.8 0H-13L-13.6-4.4-16-9.4C-21-10.4-25.6-11.6-29-12.6Z'
        'M-29-13C-37-15-47-12-56-4C-51-1.6-43-2.4-37-6C-33.6-8-31-10.4-29-11.6Z')
FOND=(f'<mask id="m-renard" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800"><rect width="1200" height="800" fill="#fff"/>'
      f'<path d="{tronc(621,10,4,1.5,-10,[])}" fill="#000"/></mask>'
      f'<g mask="url(#m-renard)"><path transform="translate(603 797)" d="{RENARD}" fill="var(--t1)" opacity=".17"/></g>')
# ---------- Niche de chouette, creusée dans le tronc proche x=979 (axe ≈ 976 à cette hauteur, demi-largeur ≈ 13)
CHOUETTE=('<g transform="translate(976.5 322)">'
  '<path d="M-7.5 9C-9.4 2-8.8-6-4.6-10C-2-12.4 2.4-12.4 5-10C8.8-6 9.4 2 7.5 9C6 13-6 13-7.5 9Z" fill="var(--t1)" opacity=".42"/>'
  '<path d="M-5.2 10C-6.2 5-5.8-1-4.2-3.6C-3-5.6-1.4-6.6 0-6.6C1.4-6.6 3-5.6 4.2-3.6C5.8-1 6.2 5 5.2 10C3 11.6-3 11.6-5.2 10Z" fill="var(--t1)" opacity=".38"/>'
  '<path d="M-3.4-1.6Q-2.2-.7-1-1.6M1-1.6Q2.2-.7 3.4-1.6" fill="none" stroke="var(--bg2)" stroke-width=".7" stroke-linecap="round" opacity=".7"/>'
  '<path d="M-.6-.6L0 1 .6-.6Z" fill="var(--bg2)" opacity=".45"/></g>')
# ---------- Écureuil agrippé à la verticale au tronc proche x=217 (bord droit ≈ 231 à cette hauteur), tête vers le haut
ECUREUIL=('<g transform="translate(230 578) scale(.95)" fill="var(--t1)" opacity=".36">'
  '<path d="M8.4-4C16-2 23-7 24-16C25-23 21-28 16-27C14-26.6 13-25 13.6-23.6C17-23 19-19 18-14C17-9 13-7.4 9-8Z"/>'
  '<path d="M1.6-21.6C-.4-16-.4-8 1-3C2.6 1 8 1 9.6-3C11.2-8 10.4-16.6 7.8-21.6Z"/>'
  '<path d="M2.4-21C.8-23.6.8-28.2 2.6-31.4C4-30.6 5.8-30 7.2-29.4L8.8-32.8 8.9-28.4C9.7-26.8 9.5-23.4 7.6-21Z"/>'
  '<circle cx="4.4" cy="-27.8" r=".75" fill="var(--bg2)"/>'
  '<path d="M1.6-19.4-1.8-21.2M1.2-16.4-1.8-16M1.4-3.6-1.8-2.4M2-1.2-1 1.2" stroke="var(--t1)" stroke-width="1.5" stroke-linecap="round"/></g>')
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
PAPILLONS=papillon(520,362,-12,1)+papillon(845,262,16,.7)
# ---------- Toile accrochée entre les deux frondes de droite
TOILE=('<g transform="translate(1104 742)" fill="none" stroke="var(--t1)" stroke-width=".5" opacity=".2">'
  '<path d="M0 0L-14-10M0 0L3-16M0 0L16-7M0 0L12 10M0 0L-12 8"/>'
  '<path d="M-5.2-3.8Q-1.8-6 1.3-6Q4.4-5.2 6.2-2.6Q6.2 .9 4.8 3.9Q0 4.8-4.6 3.2Q-6.5 0-5.2-3.8Z'
  'M-9.6-7Q-3.5-10.8 2.4-10.8Q7.8-8.6 10.8-4.8Q10.8 1.7 8.3 7.1Q0 8.3-8.5 6Q-10.8 0-9.6-7Z"/></g>')
ARBRES=CHOUETTE+ECUREUIL
DEVANT=COCCINELLES+PAPILLONS+TOILE
if __name__=='__main__':
    import json;json.dump({'FR':FR,'FOND':FOND,'ARBRES':ARBRES,'DEVANT':DEVANT},open(sys.argv[1],'w'))
