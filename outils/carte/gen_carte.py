# Carte du Royaume des Plantes, version 10 : bloc-diagramme isométrique.
# Tout le monde est conçu sur un PLAN (repère 600 × 600, vu de dessus) : milieux, eau, chemins, champs, bâtiments, haies.
# Une seule projection isométrique (affine) le pose en volume ; les objets (arbres, rochers, fleurs) sont dessinés debout
# à leur point projeté ; les tranches avant du socle montrent les strates du sol (et l'eau en coupe le long de la mer).
# Architecture interactive inchangée : un groupe SVG autonome par milieu, dont le tracé sert de sol, de découpe,
# de contour et de surface cliquable.
# Usage : python3 outils/carte/gen_carte.py [--art]   (demande shapely : pip install shapely)
# Sortie : illustrations/carte-milieux.js (chargée par l'Herbier à la première ouverture de la carte)
#   (--art : illustration seule, sans étiquettes)
import math, json, pathlib, sys, re
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from elements import *
import elements as E
from symbols import SYM, BB, sym, use, bbox, pick, stake, TB
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union, polylabel
from shapely.affinity import affine_transform
E.rnd.seed(31); rnd = E.rnd
HERE = pathlib.Path(__file__).parent
RACINE = HERE.parent.parent
W, H = 1000, 820
ARTONLY = '--art' in sys.argv

# ================= projection =================
K, OX, OY = .9, 500, 214
A = [.866 * K, -.866 * K, .5 * K, .5 * K, OX, OY]
def proj(g): return affine_transform(g, A)
def P(x, y, z=0): return (OX + (x - y) * .866 * K, OY + (x + y) * .5 * K - z)
def plan_pts(L, n=10): return cr(L, False, n)
def pline(L, n=10): return LineString(cr(L, False, n))

# ================= le plan =================
# socle organique : bords ondulés, pas de redents ; tout le monde tient dedans
PLAN = Polygon(cr([(40,30),(130,8),(240,22),(340,6),(440,18),(530,10),(592,44),(614,132),(598,220),(616,300),(602,392),(618,472),(592,560),(530,606),(450,594),
                   (380,614),(300,600),(220,616),(140,598),(68,608),(18,560),(6,470),(24,380),(4,290),(20,200),(6,110)], True, 10)).buffer(0)
COAST = [(352,-30),(384,56),(432,118),(494,164),(556,198),(640,224)]
SEA = Polygon(plan_pts(COAST) + [(700, 300), (700, -60), (340, -60)]).buffer(0).intersection(PLAN)
SEA = max(parts(SEA.buffer(-4, 16).buffer(4, 16).intersection(PLAN)), key=lambda g: g.area)   # pas de liseré de mer le long du bord
TARN = poly([(226,176),(252,166),(276,174),(272,192),(242,196)])
RIVER = [(262,192),(272,196),(282,200),(306,222),(336,260),(362,290),(392,306)]
POND = poly([(384,300),(422,284),(460,296),(474,330),(452,358),(410,362),(386,340)])
OUTF = [(468,316),(500,292),(534,268),(568,248),(600,232)]
BROOK = [(180,262),(214,252),(246,240),(272,222),(296,206)]
def ribbon(L, w0, w1, n=8, ex=1.3):
    pts = cr(L, False, n); m = len(pts); Lf, Rt = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(0, i - 2)], pts[min(m - 1, i + 2)]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy) or 1
        w = w0 + (w1 - w0) * (i / (m - 1)) ** ex
        Lf.append((x - dy / l * w, y + dx / l * w)); Rt.append((x + dy / l * w, y - dx / l * w))
    return unary_union([Polygon(Lf + Rt[::-1]).buffer(0), Point(pts[0]).buffer(w0, 12)]).buffer(.8).buffer(-.8)
# embouchure : le fleuve s'évase en entonnoir et se fond dans la mer ; les deux rives sont arrondies
ESTU_P = unary_union([ribbon(OUTF, 8, 14), Point(OUTF[-2]).buffer(17, 32), Point(OUTF[-1]).buffer(28, 32)]).convex_hull.intersection(
    unary_union([ribbon(OUTF, 8, 14).buffer(30), Point(OUTF[-1]).buffer(40)])).union(ribbon(OUTF, 8, 14))
ESTU_P = ESTU_P.buffer(6, 32).buffer(-6, 32).intersection(PLAN)
_near = Point(OUTF[-1]).buffer(70)
_land = PLAN.difference(unary_union([SEA, ESTU_P]).buffer(.05)).buffer(0)
_open = _land.buffer(-13, 32).buffer(13, 32)
ESTU_P = unary_union([ESTU_P, _land.difference(_open).intersection(_near).buffer(.3)]).buffer(.3).buffer(-.3).intersection(PLAN)
for g in parts(PLAN.difference(unary_union([SEA, ESTU_P]).buffer(.05)).buffer(0)):   # aucun îlot isolé dans l'embouchure
    if g.area < 1500: ESTU_P = unary_union([ESTU_P, g.buffer(.3)]).intersection(PLAN)
from shapely import set_precision, make_valid
ESTU_P = make_valid(set_precision(ESTU_P, .01)).buffer(0)
WATER_P = unary_union([TARN, ribbon(RIVER, 4, 8), POND, ESTU_P, ribbon(BROOK, 2.4, 4)]).intersection(PLAN)

SEEDP = {}
SEEDP['PRA'] = box(-80, -80, 700, 700)
SEEDP['FOR'] = poly([(-60,216),(140,206),(214,196),(244,224),(232,270),(204,338),(156,392),(84,424),(-60,434)])
SEEDP['LIS'] = unary_union([SEEDP['FOR'].buffer(24), pline([(140,404),(196,440),(266,454),(340,442)]).buffer(11, cap_style=1)])
SEEDP['ROC'] = poly([(-60,-60),(440,-60),(400,60),(340,126),(262,170),(176,204),(80,220),(-60,228)])
SEEDP['HUM'] = poly([(262,206),(300,150),(350,126),(408,150),(456,214),(486,286),(468,370),(420,408),(352,398),(306,350),(282,282)])
SEEDP['LAN'] = poly([(466,410),(494,336),(520,280),(580,252),(700,236),(700,700),(404,700),(398,566),(424,460)])
SEEDP['HAB'] = poly([(-60,462),(80,446),(170,454),(250,470),(336,456),(400,500),(420,560),(420,700),(-60,700)])
SEEDP['LIT'] = unary_union([SEA, pline(COAST).buffer(58)]).intersection(box(330, -80, 700, 300)).difference(SEEDP['HUM']).difference(ESTU_P.buffer(-1))
# l'eau libre (lac d'altitude, étang, estuaire) forme le milieu des eaux ; torrent et ruisseau appartiennent au milieu qu'ils traversent
SEEDP['EAU'] = unary_union([TARN, POND, ESTU_P, ribbon(RIVER, 4, 8).intersection(SEEDP['ROC'])]).buffer(.4).buffer(-.4)
ZWATER_P = WATER_P.difference(SEEDP['EAU'].buffer(.5))
ORDER = ['PRA', 'LIS', 'FOR', 'ROC', 'HUM', 'LAN', 'HAB', 'LIT', 'EAU']
REGP = {}; acc = None
for k in reversed(ORDER):
    g = SEEDP[k].intersection(PLAN)
    if acc is not None: g = g.difference(acc)
    REGP[k] = g; acc = SEEDP[k] if acc is None else unary_union([acc, SEEDP[k]])
for k in ORDER:
    keep = []
    for p in sorted(parts(REGP[k]), key=lambda p: -p.area):
        if keep and k != 'EAU' and p.area < 6000:
            best = max((o for o in ORDER if o not in (k, 'EAU')), key=lambda o: p.buffer(1.5).intersection(REGP[o]).area)
            REGP[best] = unary_union([REGP[best], p]).buffer(.5).buffer(-.5)
        else: keep.append(p)
    REGP[k] = unary_union(keep).buffer(0)

# ================= montagnes =================
import random as _R
_pr = _R.Random(8)
def peak_geom(cx, by, w, h):
    j = lambda a: a * (1 + _pr.uniform(-.08, .08))
    L = [(cx - w, by), (cx - w * .72, by - j(h * .28)), (cx - w * .5, by - j(h * .46)), (cx - w * .34, by - j(h * .52)), (cx - w * .18, by - j(h * .8)), (cx - w * .06, by - h * .92), (cx, by - h)]
    R = [(cx + w * .1, by - j(h * .86)), (cx + w * .22, by - j(h * .74)), (cx + w * .36, by - j(h * .66)), (cx + w * .56, by - j(h * .42)), (cx + w * .78, by - j(h * .2)), (cx + w * .95, by)]
    ridge = [(cx, by - h), (cx + w * .05, by - h * .7), (cx - w * .04, by - h * .45), (cx + w * .06, by - h * .2), (cx + w * .02, by)]
    return Polygon(L + R).buffer(0), L, R, ridge
ROC_S = proj(REGP['ROC']).buffer(-7)
def fitpeak(px, py, w, h):
    cx, by = P(px, py); k = 1.
    while k > .4 and not (ROC_S.contains(Point(cx - w * k, by)) and ROC_S.contains(Point(cx + w * k * .95, by))): k *= .93
    return (round(cx, 1), round(by, 1), round(w * k, 1), round(h * k ** .8, 1))
PEAKS = [fitpeak(*q) for q in ((70, 56, 84, 150), (160, 46, 100, 190), (260, 40, 86, 150), (350, 30, 62, 104), (110, 130, 84, 140), (210, 116, 84, 136), (300, 96, 62, 100), (50, 170, 52, 80))]
PEAKS = [p for p in PEAKS if p[2] > 44]
PEAKS.sort(key=lambda p: p[1])
PEAKS.sort(key=lambda p: p[1])
PEAKG = {p: peak_geom(*p) for p in PEAKS}
MOUNT = unary_union([PEAKG[p][0] for p in PEAKS]).buffer(.5)
def peak2(p, pal, snow):
    cx, by, w, h = p; g, L, R, ridge = PEAKG[p]
    lit = Polygon(L[:-1] + ridge).buffer(0).intersection(g); shd = Polygon(ridge[::-1] + R).buffer(0).intersection(g)
    o = f'<path d="{d_of(g, .2)}" fill="{pal[0]}"/><path d="{d_of(shd, .2)}" fill="{pal[1]}"/>'
    for t in (.3, .55, .8):
        x0, y0 = cx + w * t * .7, by - h * (1 - t) * .8
        o += f'<path d="M{f(x0)} {f(y0)}q{f(w*.04)} {f(h*.16)} {f(w*.02)} {f(h*.3)}" stroke="{pal[2]}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>'
    for t in (.35, .6):
        x0, y0 = cx - w * t * .8, by - h * (1 - t) * .75
        o += f'<path d="M{f(x0)} {f(y0)}l{f(-w*.08)} {f(h*.2)}" stroke="{pal[3]}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>'
    if snow:
        sy = by - h * (1 - snow); zz = [(x, sy + abs(x - cx) * .18 + (_pr.uniform(2, 8) if i % 2 else -_pr.uniform(1, 6)) + 3 * math.sin(i * 1.7 + cx)) for i, x in enumerate(range(int(cx - w), int(cx + w) + 8, int(_pr.uniform(5, 9))))]
        cap = Polygon([(cx - w - 5, by - h - 20)] + zz + [(cx + w + 5, by - h - 20)]).buffer(0)
        sl, ss = lit.intersection(cap), shd.intersection(cap)
        if not sl.is_empty: o += f'<path d="{d_of(sl, .2)}" fill="#fffaf0"/>'
        if not ss.is_empty: o += f'<path d="{d_of(ss, .2)}" fill="#d9e1e6"/>'
    return o

# ================= écran : zones projetées =================
ISL = proj(PLAN)
REG = {k: proj(REGP[k]) for k in ORDER}
REG['ROC'] = unary_union([REG['ROC'], MOUNT]).buffer(0)
for k in ORDER:
    if k != 'ROC': REG[k] = REG[k].difference(MOUNT.buffer(.5)).buffer(0)
for k in ORDER:
    ps = sorted(parts(REG[k]), key=lambda p: -p.area)
    REG[k] = unary_union([p for i, p in enumerate(ps) if i == 0 or p.area > 300 or k == 'EAU'])
MAPS = unary_union([REG[k] for k in ORDER]).buffer(0)
ZIN = {k: REG[k].buffer(-2.5) for k in ORDER}
WATER = proj(WATER_P); SEAS = proj(SEA); ZWATER = proj(ZWATER_P)
print({k: [int(p.area) for p in parts(REG[k])] for k in ORDER})

GROUND = dict(FOR='#5f924d', ROC='#b4c48a', LIT='#eedcac', LIS='#90bd62', PRA='#bcd981', HUM='#9cc7a0', LAN='#c6b986', HAB='#c2dc92', EAU='#56a4d6')
MT = dict(FOR='#456B45', LIS='#79864B', PRA='#C6A24D', LAN='#96725B', HUM='#4D8B83', EAU='#4C8FAF', ROC='#8C877C', LIT='#D49A62', HAB='#B57F86')
def mix(a, b, t):
    A_ = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; B_ = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join('%02x' % round(x + (y - x) * t) for x, y in zip(A_, B_))
def shade(col, k): return mix(col, '#000000', 1 - k) if k < 1 else mix(col, '#ffffff', k - 1)

ANCHP = {'FOR': (58, 350), 'LIS': (228, 300), 'PRA': (376, 452), 'HUM': (354, 176), 'LAN': (560, 420), 'HAB': (60, 492), 'LIT': (460, 92), 'ROC': (150, 196), 'EAU': (424, 322)}
ANCH = {k: [round(v) for v in P(*ANCHP[k])] for k in ANCHP}
CLEAR = {k: box(ANCH[k][0] - 22, ANCH[k][1] - 30, ANCH[k][0] + 22, ANCH[k][1] + 4) for k in ANCH}

# ================= placement =================
D = {k: [] for k in ORDER}
OCC = []    # sols occupés (chemins) : on ne pose pas le PIED d'un objet dessus
OCCB = []   # volumes (bâtiments, serre, potager) : aucun objet ne les recouvre
SIL = {k: [] for k in ORDER}   # silhouettes des objets posés : elles agrandissent la zone interactive (contour = dessin)
def add(k, y, s): D[k].append((y, s))
def silhouette(name, x, y, s):
    a, b, c, d = BB[name]; cx, w = x + (a + c) / 2 * s, (c - a) / 2 * s; top, hgt = y + b * s, (d - b) * s
    e = Point(cx, top + hgt * .42).buffer(1, 16)
    from shapely.affinity import scale as _sc
    return _sc(e, w * .92, hgt * .46).union(box(x - w * .3, y - hgt * .4, x + w * .3, y + d * s))
def put(k, name, x, y, s=1., force=False):
    for sc in ((s,) if force else (s, s * .85)):
        b = bbox(name, x, y, sc); fp = box(x - 4 * sc, y - 2.5, x + 4 * sc, y + 2.5)
        if force or (ZIN[k].contains(fp) and not CLEAR[k].intersects(fp) and not any(o.intersects(fp) for o in OCC) and not any(o.intersects(b) for o in OCCB) and (force or not silhouette(name, x, y, sc).intersection(box(x - 30, y - 16 * sc, x + 30, y + 6)).buffer(-1).intersects(ROADBLK))):
            add(k, y, use(name, x, y, sc)); SIL[k].append(silhouette(name, x, y, sc)); return True
    return False
BUSYP = Point(-999, -999).buffer(1)
ROADBLK = Point(-999, -999).buffer(1)
def grid_plan(gp, step, jit=.4):
    """semis sur le PLAN (rangées isométriques naturelles), rendu en points écran"""
    if gp.is_empty: return []
    x0, y0, x1, y1 = gp.bounds; out = []; y = y0; row = 0
    while y < y1 + step:
        x = x0 + (step / 2 if row % 2 else 0)
        while x < x1 + step:
            px, py = x + r(-jit, jit) * step, y + r(-jit, jit) * step
            if gp.contains(Point(px, py)) and not BUSYP.contains(Point(px, py)): out.append(P(px, py))
            x += step
        y += step * .86; row += 1
    return sorted(out, key=lambda p: p[1])
def centres(n, area, rmin, rmax, gap=6):
    out = []; t = 0
    while len(out) < n and t < 4000:
        t += 1; x0, y0, x1, y1 = area.bounds; c = (r(x0, x1), r(y0, y1)); rr = r(rmin, rmax)
        if area.contains(Point(c)) and all(math.hypot(c[0] - o[0], c[1] - o[1]) > rr + o[2] + gap for o in out): out.append((c[0], c[1], rr))
    return out
def patch(cx, cy, rx, ry, k=9):
    a0 = r(0, 6.28); Pp = [(cx + math.cos(a0 + i / k * 6.283) * rx * r(.8, 1.15), cy + math.sin(a0 + i / k * 6.283) * ry * r(.8, 1.15)) for i in range(k)]
    return Polygon(cr(Pp, True, 4)).buffer(0)

# ---------- réseau de chemins ----------
ROADS = [
    [(282,612),(282,560),(272,500),(254,444),(232,384),(190,330),(142,288),(110,262)],                   # du hameau à la clairière de l'Arbre doré
    [(254,444),(312,434),(380,420),(446,404),(474,372),(484,336),(482,300),(474,262),(470,214),(462,166)],          # vers les landes, pont sur l'estuaire, plage
    [(236,344),(282,316),(326,282),(366,242),(404,200),(424,150)],                                        # caillebotis du marais
    [(142,288),(100,360),(72,430),(60,480),(70,512),(100,522)],                                                      # chemin forestier
    [(446,404),(480,470),(520,530),(556,580)],                                                             # sente des landes
    [(272,512),(200,516),(140,520),(100,522)],                                                              # desserte du hameau
]
RP = [pline(L, 8) for L in ROADS]
ROADP = unary_union([l.buffer(5.2, cap_style=1) for l in RP]).intersection(PLAN.buffer(-3))
ROADP_IN = unary_union([l.buffer(1.8) for l in RP]).intersection(ROADP)
BUSYP = unary_union([ROADP.buffer(5), WATER_P.buffer(6)])
ROADS_S = proj(ROADP); ROADIN_S = proj(ROADP_IN)
BRIDGES = proj(ROADP.intersection(WATER_P.buffer(4)))
BOARD = proj(ROADP.intersection(REGP['HUM'].buffer(2)).difference(WATER_P.buffer(4)))
OCC.append(proj(ROADP.buffer(2))); ROADBLK = ROADS_S.buffer(.5)   # aucune silhouette ne recouvre un chemin

# ---------- objets « plan » ----------
def poly_d(pts): return 'M' + 'L'.join(f(a) + ' ' + f(b) for a, b in pts) + 'Z'
def iso_box(x0, y0, w, d, h, top, left, right):
    Q = P
    return (f'<path d="{poly_d((Q(x0,y0+d,0),Q(x0+w,y0+d,0),Q(x0+w,y0+d,h),Q(x0,y0+d,h)))}" fill="{left}"/>'
            f'<path d="{poly_d((Q(x0+w,y0,0),Q(x0+w,y0+d,0),Q(x0+w,y0+d,h),Q(x0+w,y0,h)))}" fill="{right}"/>'
            f'<path d="{poly_d((Q(x0,y0,h),Q(x0+w,y0,h),Q(x0+w,y0+d,h),Q(x0,y0+d,h)))}" fill="{top}"/>')
def iso_house(x0, y0, w, d, h, rh, wall=('#f6e7c4', '#dfc591'), roof=('#c8552c', '#9c3a22'), glass=False):
    Q = P; ym = y0 + d / 2; ov = 2.5
    fw = [Q(x0, y0 + d, 0), Q(x0 + w, y0 + d, 0), Q(x0 + w, y0 + d, h), Q(x0, y0 + d, h)]
    sw = [Q(x0 + w, y0, 0), Q(x0 + w, y0 + d, 0), Q(x0 + w, y0 + d, h), Q(x0 + w, ym, h + rh), Q(x0 + w, y0, h)]
    br = [Q(x0 - ov, y0 - ov, h), Q(x0 + w + ov, y0 - ov, h), Q(x0 + w + ov, ym, h + rh), Q(x0 - ov, ym, h + rh)]
    fr = [Q(x0 - ov, ym, h + rh), Q(x0 + w + ov, ym, h + rh), Q(x0 + w + ov, y0 + d + ov, h - 1), Q(x0 - ov, y0 + d + ov, h - 1)]
    o = f'<path d="{d_of(proj(box(x0, y0, x0 + w + 8, y0 + d + 8)))}" fill="#14281a" opacity=".14"/>'
    if glass:
        o += f'<path d="{poly_d(br)}" fill="#d6f1fb" opacity=".9"/><path d="{poly_d(fw)}" fill="#c9ecfa" opacity=".8"/><path d="{poly_d(sw)}" fill="#b4dff2" opacity=".85"/>'
        for (px, py) in ((x0 + w * .3, y0 + d * .6), (x0 + w * .7, y0 + d * .5)):
            sx, sy = P(px, py); o += cloud(sx, sy - 7, 7, 6, 7, '#459c3c') + f'<circle cx="{f(sx-2)}" cy="{f(sy-9)}" r="1.6" fill="#f0466b"/>'
        o += f'<path d="{poly_d(fw)}" fill="#e8f8fe" opacity=".35"/><path d="{poly_d(fr)}" fill="#e6f7fe" opacity=".85"/>'
        mull = ''
        for t in (.2, .4, .6, .8):
            a, b = Q(x0 + w * t, y0 + d, 0), Q(x0 + w * t, y0 + d, h); mull += f'M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}'
            a, b = Q(x0 + w * t, ym, h + rh), Q(x0 + w * t, y0 + d + ov, h - 1); mull += f'M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}'
        for t in (.33, .66):
            a, b = Q(x0 + w, y0 + d * t, 0), Q(x0 + w, y0 + d * t, h + rh * (1 - abs(t - .5) * 2)); mull += f'M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}'
        o += f'<path d="{mull}" stroke="#ffffff" stroke-width="1.1" fill="none"/>'
        o += f'<path d="{poly_d(fr)}" fill="none" stroke="#ffffff" stroke-width="1.3"/><path d="{poly_d(sw)}" fill="none" stroke="#ffffff" stroke-width="1.3"/>'
        a = Q(x0 - 1, y0 + d + 1, 0); b = Q(x0 + w + 1, y0 + d + 1, 0); c = Q(x0 + w + 1, y0 - 1, 0)
        return o + f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}L{f(c[0])} {f(c[1])}" stroke="#b9694b" stroke-width="3" fill="none"/>'
    o += f'<path d="{poly_d(br)}" fill="{roof[1]}"/><path d="{poly_d(fw)}" fill="{wall[0]}"/><path d="{poly_d(sw)}" fill="{wall[1]}"/>'
    def win(t0, t1, z0, z1, col, face='f'):
        if face == 'f': pts = [Q(x0 + w * t0, y0 + d, z0), Q(x0 + w * t1, y0 + d, z0), Q(x0 + w * t1, y0 + d, z1), Q(x0 + w * t0, y0 + d, z1)]
        else: pts = [Q(x0 + w, y0 + d * t0, z0), Q(x0 + w, y0 + d * t1, z0), Q(x0 + w, y0 + d * t1, z1), Q(x0 + w, y0 + d * t0, z1)]
        return f'<path d="{poly_d(pts)}" fill="{col}"/>'
    o += win(.18, .34, 0, h * .62, '#734529') + win(.55, .78, h * .38, h * .72, '#a6d8ef') + win(.35, .65, h * .3, h * .62, '#a6d8ef', 's')
    o += f'<path d="{poly_d(fr)}" fill="{roof[0]}"/>'
    c0 = Q(x0 + w * .75, ym + 1, h + rh * .55)
    return o + f'<rect x="{f(c0[0]-2.6)}" y="{f(c0[1]-9)}" width="5.2" height="9" fill="#8a5a3c"/>'
def bed_iso(x0, y0, w, d):
    o = iso_box(x0, y0, w, d, 2.6, '#8a5a3c', '#a87650', '#7a4f33')
    for i in range(1, int(w // 5)):
        for j in range(1, int(d // 5) + 1):
            sx, sy = P(x0 + i * 5, y0 + j * 5 - 2.5, 2.6); o += f'<circle cx="{f(sx)}" cy="{f(sy-1)}" r="1.9" fill="{"#72c24c" if (i + j) % 2 else "#459c3c"}"/>'
    return o
def field(gp, ground, row, sp, wid, ang=0.):
    gp = gp.difference(ROADP.buffer(3)).intersection(REGP['HAB'].buffer(-6))
    o = f'<path d="{d_of(proj(gp))}" fill="{ground}"/>'
    c = gp.centroid; ca, sa = math.cos(ang), math.sin(ang); dd = ''
    for i in range(-40, 41):
        ox, oy = c.x - sa * i * sp, c.y + ca * i * sp
        ln = LineString([(ox - ca * 300, oy - sa * 300), (ox + ca * 300, oy + sa * 300)]).intersection(gp.buffer(-2))
        for seg in parts(ln) if hasattr(ln, 'geoms') else [ln]:
            if seg.is_empty or seg.length < 3: continue
            (a1, b1), (a2, b2) = P(*seg.coords[0]), P(*seg.coords[-1]); dd += f'M{f(a1)} {f(b1)}L{f(a2)} {f(b2)}'
    o += f'<path d="{dd}" stroke="{row}" stroke-width="{wid}" stroke-linecap="round" fill="none"/>'
    OCCB.append(proj(gp.buffer(2))); return o

# ================= décor par milieu =================
# Forêt : canopée étagée ; pinède en remontant vers la montagne ; clairière de l'Arbre doré
CLEARP = Point(100, 250).buffer(30)
add('FOR', -40, f'<path d="{d_of(proj(CLEARP).intersection(REG["FOR"]))}" fill="#a9cf74"/><path d="{d_of(proj(CLEARP.buffer(-12)).intersection(REG["FOR"]))}" fill="#b9da86"/>')
gx, gy = P(102, 256); add('FOR', gy, use('gt', gx, gy, .82))
OCCB.append(proj(CLEARP.buffer(-3)).difference(box(gx - 40, gy - 80, gx + 40, gy + 4)))
SIL['FOR'].append(box(gx - 26, gy - 70, gx + 30, gy + 4)); OCCB.append(box(gx - 30, gy - 30, gx + 34, gy + 8))
for (x, y) in [P(84, 240), P(120, 234), P(82, 266), P(122, 274)]:
    if not ROADS_S.buffer(6).contains(Point(x, y)): add('FOR', y, use('fe', x, y, .75))
for (x, y) in grid_plan(REGP['FOR'], 11):
    q = rnd.random(); pc = .2 + .65 * max(0, (380 - y) / 110)
    if q < .06: put('FOR', 'bi', x, y, .85)
    elif rnd.random() < pc: put('FOR', pick('cf', 3), x, y, r(1, 1.25))
    else: put('FOR', pick('tB' if rnd.random() < .5 else 'tA', 4), x, y, r(.95, 1.18))
for (x, y) in grid_plan(REGP['FOR'].buffer(-6), 60):
    if rnd.random() < .35: put('FOR', 'fe', x, y, .7)
# Montagnes : massif posé sur le socle, pelouse alpine, pins de montagne, éboulis
add('ROC', 0, ''.join(peak2(p, ('#dcdad3', '#c1beb5', '#aeaba2', '#ebe9e3') if i < 3 else ('#cec6b4', '#9d9583', '#857e6d', '#e0d9ca'), (.5 if i < 3 else .42) if p[3] > 90 else 0) for i, p in enumerate(PEAKS)))
for (x, y) in grid_plan(REGP['ROC'], 10.5):
    if MOUNT.buffer(7).contains(Point(x, y)): continue
    q = rnd.random()
    if q < .42: put('ROC', 'cm', x, y, r(.72, .92))
    elif q < .62: put('ROC', pick('rk', 3), x, y, r(.5, .75))
    elif q < .72: put('ROC', pick('tu', 3), x, y, .75)
    else: put('ROC', 'fw', x, y, .7)
# Littoral : mer, écume, plage, cordons dunaires à oyats, dune grise
SH = SEAS.boundary.difference(ISL.exterior.buffer(2)).difference(proj(ESTU_P).buffer(3))
add('LIT', -60, f'<path d="{d_of(SEAS)}" fill="#3f8fc8"/><path d="{d_of(SEAS.intersection(SH.buffer(90)))}" fill="#4a9ad2"/><path d="{d_of(SEAS.intersection(SH.buffer(44)))}" fill="#64b3e2"/><path d="{d_of(SEAS.intersection(SH.buffer(18)))}" fill="#8fd0ee"/>')
landL = REG['LIT'].difference(SEAS)
add('LIT', -59, f'<path d="{d_of(SH.buffer(7).intersection(landL))}" fill="#e2c78c"/><path d="{d_of(SH.buffer(2.4).intersection(REG["LIT"]))}" fill="#fff" opacity=".92"/>'
    f'<path d="{d_of(SH.buffer(11).difference(SH.buffer(9)).intersection(SEAS))}" fill="#fff" opacity=".4"/><path d="{d_of(SH.buffer(28).difference(SH.buffer(26.5)).intersection(SEAS))}" fill="#fff" opacity=".2"/>')
COASTL = pline(COAST, 10)
for off, amp in ((20, 2.5),):
    for side in ('left', 'right'):
        g = COASTL.parallel_offset(off, side)
        for gg in (list(g.geoms) if hasattr(g, 'geoms') else [g]):
            if gg.is_empty or gg.length < 20 or SEA.contains(gg.interpolate(.5, normalized=True)): continue
            n = int(gg.length / 2.5); pts = [gg.interpolate(gg.length * i / n) for i in range(n + 1)]
            pts = [(p.x + amp * math.sin(i / 3), p.y) for i, p in enumerate(pts)]
            crest = proj(LineString(pts))
            body = crest.buffer(7, cap_style=1).intersection(ZIN['LIT']).difference(WATER.buffer(6)).difference(SEAS.buffer(3)).difference(ROADS_S.buffer(2))
            if body.is_empty: continue
            lee = proj(LineString([(x - 3, y + 3) for x, y in pts])).buffer(3.6, cap_style=1).difference(crest.buffer(4)).intersection(body.buffer(.5))
            add('LIT', -40 + off, f'<path d="{d_of(body)}" fill="#faf0d8"/><path d="{d_of(lee)}" fill="#e3c88f"/>')
            for i in range(0, n, 3):
                sx, sy = P(*pts[i])
                if rnd.random() < .75: put('LIT', pick('ma', 3), sx, sy + 1.5, r(.7, .9))
add('LIT', -58, f'<path d="{d_of(proj(REGP["LIT"].difference(SEA.buffer(36))).intersection(REG["LIT"]))}" fill="#dcd3a3"/>')   # dune grise
for (x, y) in grid_plan(REGP['LIT'].difference(SEA.buffer(36)), 10):
    q = rnd.random(); put('LIT', 'ho' if q < .16 else ('mr' if q < .2 else pick('ma', 3)), x, y, .78)
# Haies et lisières : manteau arbustif fleuri qui borde la forêt et se prolonge en haie jusqu'au hameau
for (x, y) in [P(212, 330), P(170, 400)]: put('LIS', 'bg', x, y, 1.05)
for (x, y) in grid_plan(REGP['LIS'], 9.5):
    q = rnd.random()
    if q < .12: put('LIS', pick('tA', 4), x, y, r(.75, .9))
    elif q < .17: put('LIS', 'bi', x, y, .8)
    else: put('LIS', pick('sw' if q < .4 else ('sp' if q < .5 else 'sh'), 4), x, y, r(.8, 1))
# Prairies : nappes de fleurs, bosquet de fleurs géantes, foin, aigrettes, chênes isolés
PRG = REGP['PRA']
# nappes fleuries : réparties automatiquement dans la prairie, une couleur par nappe ; une nappe sans fleurs n'est pas dessinée
MEAD = [('#dfe89a', 'fy'), ('#efd9d3', 'fp'), ('#dcd9f2', 'fb'), ('#f1f3dc', 'fw'), ('#e4dcf0', 'fv')]
for i, (cx, cy, rr) in enumerate(centres(6, PRG.buffer(-12).difference(BUSYP.buffer(6)), 14, 22, 18)):
    tint, sym_ = MEAD[i % 5]
    gp = patch(cx, cy, rr * 1.3, rr * .9).intersection(PRG.buffer(-6)).difference(BUSYP)
    if gp.is_empty: continue
    pts = grid_plan(gp.buffer(-2), 6)
    if len(pts) < 8: continue
    for (x, y) in pts: put('PRA', sym_, x, y, r(.7, .85))
for (px, py, n, sc) in [(262, 356, 'dg', 1.2), (272, 368, 'bg', 1.25), (252, 372, 'dg', 1.0), (282, 352, 'bg', 1.0), (246, 344, 'dg', .85)]:
    x, y = P(px, py); put('PRA', n, x, y, sc)
for (px, py) in [(244, 390), (290, 386), (350, 462)]: x, y = P(px, py); put('PRA', 'pu', x, y, .9)
for (px, py, sc) in ((392, 444, 1.1), (404, 458, .95), (380, 460, .9)): x, y = P(px, py); put('PRA', pick('tA', 4), x, y, sc)
x, y = P(266, 140); put('PRA', 'tA2', x, y, .95)
for (x, y) in grid_plan(PRG, 10):
    q = rnd.random()
    if q < .12: put('PRA', pick('tu', 3), x, y, r(.8, 1))
# Marais : mares, roselières en touffes, laîches, saules ; le torrent y serpente
for Pp in ([(318,262),(338,256),(348,272),(332,280),(318,276)], [(408,196),(430,192),(440,208),(424,216),(408,212)], [(430,372),(450,368),(456,382),(442,390),(428,386)], [(330,346),(350,340),(358,356),(344,364),(328,360)]):
    gp = poly(Pp).intersection(REGP['HUM'].buffer(-5)).difference(WATER_P.buffer(5)).difference(ROADP.buffer(4))
    if gp.is_empty or gp.geom_type != 'Polygon': continue
    gs = proj(gp); add('HUM', -34, f'<path d="{d_of(gs)}" fill="#7fc0e2"/><path d="{d_of(gs.buffer(-3.5))}" fill="#a9daf1"/>')
    for i in range(6):
        pt = gs.exterior.interpolate(gs.exterior.length * (i / 6 + r(0, .05)))
        if pt.y < gs.centroid.y + 2: put('HUM', pick('rd', 3), pt.x, pt.y + 1, r(.75, .9))
for (px, py) in [(300, 312), (440, 250), (400, 392)]: x, y = P(px, py); put('HUM', 'wl', x, y, .9)
# roselières en massifs (plus denses près de l'eau), cariçaie claire entre eux
HS = ZIN['HUM']; HP = REGP['HUM']
CL_H = centres(16, HS.difference(WATER.buffer(4)), 9, 16, 6)
for (cx, cy, rr) in CL_H:
    add('HUM', -35, f'<path d="{d_of(patch(cx, cy, rr * 1.2, rr * .7).intersection(HS).difference(WATER.buffer(2)))}" fill="#8fbf95"/>')
for (x, y) in grid_plan(HP, 7):
    near = min(CL_H, key=lambda o: math.hypot(x - o[0], y - o[1])); dd = math.hypot(x - near[0], y - near[1]) / near[2]
    if dd < 1: put('HUM', pick('rd', 3), x, y, r(.8, .95))
    elif dd < 1.6 and rnd.random() < .3: put('HUM', pick('tt', 3), x, y, r(.9, 1.05))
# Eaux : lac d'altitude, étang (nénuphars), estuaire qui s'ouvre sur la mer
add('EAU', -60, f'<path d="{d_of(proj(POND.buffer(-9)))}" fill="#4895ca"/><path d="{d_of(proj(TARN.buffer(-4)))}" fill="#4f9bcf"/>'
    + f'<path d="{d_of(proj(ESTU_P).intersection(SEAS.buffer(30)))}" fill="#6db7e2"/>')
pa = P(396, 318); add('EAU', -59, f'<path d="M{f(pa[0])} {f(pa[1])}q22 -6 44 0" stroke="#bfe6f8" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
for (px, py, fl_) in [(404, 340, 1), (416, 348, 0), (430, 352, 1), (452, 324, 0), (446, 338, 1)]:
    x, y = P(px, py); add('EAU', y, lily(x, y, .9, fl_))
_sb = proj(ESTU_P.buffer(7, 24).difference(ESTU_P).difference(SEA.buffer(2)).intersection(Point(OUTF[-1]).buffer(58)).intersection(PLAN))
for kk in ('LAN',):
    bk = _sb.intersection(REG[kk])
    if not bk.is_empty: add(kk, -45, f'<path d="{d_of(bk)}" fill="#ead39b"/><path d="{d_of(bk.intersection(WATER.buffer(2.5)))}" fill="#d9bd84"/>'); OCC.append(bk.buffer(2))
# Landes : nappes de bruyère, ajoncs, cistes, rochers moussus, pins parasols
LAS = ZIN['LAN']
DR = centres(18, LAS, 14, 24, 4)
for (cx, cy, rr) in centres(7, LAS.buffer(-10), 7, 12, 30):
    add('LAN', -30, f'<path d="{d_of(patch(cx, cy, rr * 1.4, rr * .7).intersection(LAS))}" fill="#d8cfa6"/>'); OCC.append(Point(cx, cy).buffer(rr * .9))
for (px, py) in [(520, 520), (580, 470), (470, 560)]: x, y = P(px, py); put('LAN', 'mr', x, y, .8)
for (x, y) in grid_plan(REGP['LAN'], 11):
    near = min(DR, key=lambda o: math.hypot(x - o[0], y - o[1])); dd = math.hypot(x - near[0], y - near[1]) / near[2]
    if dd > 1.6:
        q = rnd.random()
        if q < .45: put('LAN', pick('ma', 3), x, y, .8)
        elif q < .6: put('LAN', pick('sy', 4), x, y, .72)
        elif q < .66: put('LAN', pick('rk', 3), x, y, .5)
        continue
    put('LAN', pick(('hp', 'hm', 'sy', 'hp', 'hm')[DR.index(near) % 5], 4), x, y, r(.75, .95) * (1.05 - dd * .2))
# Jardins et paysages façonnés : hameau, serre, potager, verger, champs bordés de haies
add('HAB', -50, field(box(150, 562, 236, 604), '#e8c977', '#c99a3c', 5, 1.8) + field(box(246, 560, 330, 604), '#b98a5c', '#5f9e3f', 6, 2.6, math.pi / 2)
    + field(box(28, 540, 110, 590), '#d7c070', '#b8913a', 5, 1.6, math.pi / 2))
for (x0, y0, w, d, h, rh, roof) in ((102, 468, 40, 28, 20, 14, ('#c8552c', '#9c3a22')), (156, 472, 30, 22, 16, 11, ('#5f7183', '#46535f'))):
    OCCB.append(Polygon([P(x0 - 3, y0 - 3, h + rh + 4), P(x0 + w + 3, y0 - 3, h + rh + 4), P(x0 + w + 3, y0 + d + 3), P(x0 - 3, y0 + d + 3), P(x0 - 3, y0 - 3)]).convex_hull)
    add('HAB', P(x0 + w, y0 + d)[1], iso_house(x0, y0, w, d, h, rh, roof=roof))
    SIL['HAB'].append(OCCB[-1])
gx0, gy0, gw, gd = 200, 472, 52, 28
OCCB.append(Polygon([P(gx0 - 3, gy0 - 3, 36), P(gx0 + gw + 3, gy0 - 3, 36), P(gx0 + gw + 3, gy0 + gd + 3), P(gx0 - 3, gy0 + gd + 3), P(gx0 - 3, gy0 - 3)]).convex_hull)
add('HAB', P(gx0 + gw, gy0 + gd)[1], iso_house(gx0, gy0, gw, gd, 17, 14, glass=True)); SIL['HAB'].append(OCCB[-1])
COUR = proj(box(104, 526, 262, 550)); OCCB.append(COUR)
beds = f'<path d="{d_of(COUR)}" fill="#e6d8b2"/>'
for i in range(6): beds += bed_iso(108 + i * 25, 530, 21, 15)
add('HAB', P(262, 550)[1] - 1, beds)
for i in range(4):
    for j in range(2):
        x, y = P(304 + i * 18 + (j % 2) * 9, 478 + j * 18); put('HAB', pick('tf', 3), x, y, .64)
for L in ([(144, 610), (144, 556), (238, 556)], [(24, 534), (114, 534)]):
    ln = LineString(L); t = 0
    while t <= ln.length:
        pt = ln.interpolate(t); x, y = P(pt.x, pt.y); put('HAB', pick('sd' if int(t) % 4 else 'sh', 4), x, y, .62); t += 6
x, y = P(80, 470); put('HAB', 'tk', x, y, .8)
for i in range(4):   # verger du coin ouest
    for j in range(3):
        x, y = P(22 + i * 18 + (j % 2) * 9, 470 + j * 16); put('HAB', pick('tf', 3), x, y, .64)
# arbres remarquables du parc : un hêtre pourpre et un cèdre étagé
def copper():
    o = shadow(2, 0, 17) + f'<path d="M-3 0L-2 -18H2L3 0Z" fill="#7a5038"/><path d="M0 -18H2L3 0H.8Z" fill="#5e3b29"/>'
    return o + cloud(1.5, -30, 18, 15, 9, '#6e2f45') + cloud(-1, -33, 14, 11.5, 9, '#93455e') + cloud(-6, -39, 5, 4, 7, '#b86a82')
def cedar():
    o = shadow(3, 0, 18) + '<path d="M-2.4 0L-1.6 -40H1.6L2.4 0Z" fill="#6b4a32"/>'
    for i, (y0, w) in enumerate(((-12, 20), (-22, 17), (-31, 13), (-39, 8))):
        o += f'<ellipse cx="{1.5*(i%2)-.5}" cy="{y0}" rx="{w}" ry="{w*.26:.1f}" fill="#2f5d4a"/><ellipse cx="{1.5*(i%2)-2}" cy="{y0-1.6}" rx="{w*.8:.1f}" ry="{w*.19:.1f}" fill="#4b7f63"/>'
    return o
sym('cb', copper, (-19, -51, 22, 4)); sym('ce', cedar, (-21, -44, 22, 4))
x, y = P(370, 560); print('cèdre', put('HAB', 'ce', x, y, 1.0))
for n, sc in (('cb', .95),):   # premier emplacement libre à l'est des maisons, près du bas du jardin
    ok = False
    for py in range(560, 500, -6):
        for px in range(270, 420, 6):
            x, y = P(px, py)
            if any(o.intersects(silhouette(n, x, y, sc)) for o in SIL['HAB']): continue
            if put('HAB', n, x, y, sc): ok = True; break
        if ok: break
    print('arbre remarquable', n, 'placé' if ok else 'NON placé', px, py)

# ================= sols : fondu des limites, berges, textures =================
TEXT = {}
_TEXT = dict(PRA=('#a5c76c', 19), LIS=('#73a24f', 22), HUM=('#7fb293', 18), LAN=('#b3a06c', 17), HAB=('#b1cd82', 22), ROC=('#97a57a', 20), FOR=('#4f8143', 24))
def soils(k):
    o = ''
    for oth in ORDER:
        if oth == k or oth == 'EAU' or k == 'EAU': continue
        sh = REG[k].boundary.intersection(REG[oth].buffer(1.2))
        if sh.is_empty or sh.length < 10: continue
        o += f'<path d="{d_of(sh.buffer(16, 8), .6)}" fill="{GROUND[oth]}" opacity=".5"/>'
    o = f'<g filter="url(#soft)">{o}</g>' if o else ''
    if k != 'EAU':
        bank = WATER.buffer(4).difference(WATER).intersection(REG[k])
        if not bank.is_empty: o += f'<path d="{d_of(bank)}" fill="{mix(GROUND[k], "#6f6440", .22)}"/>'
    tx = TEXT.get(k)
    if tx:
        col, step = tx; d = ''
        for (x, y) in grid_plan(REGP[k].buffer(-4), step / K, .5): d += f'M{f(x-3)} {f(y)}q1.5 -2.2 3 0q1.5 -2.2 3 0'
        o += f'<path d="{d}" fill="none" stroke="{col}" stroke-width="1" stroke-linecap="round" opacity=".5"/>'
    return o

# ================= socle : tranches avant =================
LAYERS = [(0, 6, '#7da653'), (6, 18, '#9c653a'), (18, 32, '#7f4f2f'), (32, 99, '#5e3a24')]
WATERL = [(0, 6, '#8fd0ee'), (6, 18, '#5aa0cf'), (18, 32, '#7f4f2f'), (32, 99, '#5e3a24')]
def depth(x): return 50 + 4 * math.sin(x / 47) + 3 * math.sin(x / 19 + 1)
ring = list(ISL.simplify(.6).exterior.coords); buckets = {}
WATS = unary_union([SEAS, proj(ESTU_P)]).buffer(.5)
def ISWET(x, y): return WATS.contains(Point(x, y - 2.5)) and WATS.contains(Point(x, y - 5))   # la tranche est en eau seulement si l'eau touche vraiment le bord
for i in range(len(ring) - 1):
    (x1, y1), (x2, y2) = ring[i], ring[i + 1]; dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1
    nx, ny = dy / L, -dx / L
    if ISL.contains(Point((x1 + x2) / 2 + nx * 2, (y1 + y2) / 2 + ny * 2)): nx, ny = -nx, -ny
    if ny <= .05: continue
    b = round((1.09 - .17 * (nx + 1) / 2) * 50) / 50
    wet = ISWET((x1 + x2) / 2, (y1 + y2) / 2)
    for li, (a, bb, col) in enumerate(WATERL if wet else LAYERS):
        q = Polygon([(x1, y1 + min(a, depth(x1))), (x2, y2 + min(a, depth(x2))), (x2, y2 + min(bb, depth(x2))), (x1, y1 + min(bb, depth(x1)))])
        if q.area > .01: buckets.setdefault((col, b), []).append(q.buffer(.35))
WETL = unary_union([LineString([ring[i], ring[i + 1]]) for i in range(len(ring) - 1) if ISWET((ring[i][0] + ring[i + 1][0]) / 2, (ring[i][1] + ring[i + 1][1]) / 2)])
BEV = []
for i in range(len(ring) - 1):
    (x1, y1), (x2, y2) = ring[i], ring[i + 1]
    t1, t2 = (max(0., 1 - WETL.distance(Point(x, y)) / 34) for x, y in ((x1, y1), (x2, y2)))
    if max(t1, t2) <= 0 or ISWET((x1 + x2) / 2, (y1 + y2) / 2) or y2 + y1 < 2 * min(y for _, y in ring) + 10: continue
    q = Polygon([(x1, y1 - .5), (x2, y2 - .5), (x2, y2 + 18 * t2 ** 1.1), (x1, y1 + 18 * t1 ** 1.1)]).buffer(0)
    if q.area > .05: BEV.append(q.buffer(.4))
BEVEL = None   # pas de biseau : la terre va jusqu au coin de la rive
CL = ''.join(f'<path d="{d_of(unary_union(qs), .3)}" fill="{shade(col, b)}" stroke="{shade(col, b)}" stroke-width=".6"/>' for (col, b), qs in sorted(buckets.items(), key=lambda kv: -kv[0][1]))
if BEVEL is not None:
    CL += f'<path d="{d_of(BEVEL, .3)}" fill="#5aa0cf"/><path d="{d_of(BEVEL.intersection(ISL.exterior.buffer(6.5)), .3)}" fill="#8fd0ee"/>'
SIDE = unary_union([q for qs in buckets.values() for q in qs])
for x in range(60, 960, 23):
    ys = [y for (xx, y) in ring if abs(xx - x) < 5]
    if not ys: continue
    yb = max(ys)
    if SIDE.contains(Point(x, yb + 30)): CL += f'<ellipse cx="{f(x+r(-6,6))}" cy="{f(yb+r(24,40))}" rx="{f(r(2.2,3.6))}" ry="{f(r(1.3,2))}" fill="#a87650" opacity=".55"/>'
    if False: CL += f'<path d="M{f(x)} {f(yb+7)}q2 6 -1 12" stroke="#5e3a24" stroke-width="1" fill="none" opacity=".6"/>'

# ================= étiquettes =================
# glyphes des milieux : la table MT de index.html (les mêmes que dans les fiches plantes)
mt = json.loads(re.search(r'^const MT=(\{.*?\});$', (RACINE / 'index.html').read_text(encoding='utf-8'), re.M).group(1))
def seal(k):
    x, y = ANCH[k]; g = mt[k]['g']; t = mt[k].get('t') or '0 0'
    return (f'<g class="zs" transform="translate({f(x)} {f(y)})">{stake()}'
            f'<g class="zsi"><path class="zsb" d="M-17 -48H17Q21 -48 21 -44V-25Q21 -21 17 -21H-17Q-21 -21 -21 -25V-44Q-21 -48 -17 -48Z" fill="#fffaf0" stroke="{MT[k]}" stroke-width="2.4"/>'
            f'<g transform="translate(-10 -46) scale(.98)" fill="none" stroke="{MT[k]}" class="zsg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="translate({t})">{g}</g></g></g></g>')

# ================= assemblage =================
EXT = {k: unary_union([REG[k]] + SIL[k]).buffer(1.2, 8).buffer(-1.2, 8) for k in ORDER}
Z = {k: d_of(EXT[k], .3) for k in ORDER}
ZG = {k: d_of(REG[k], .3) for k in ORDER}
DRAW = ['ROC', 'LIT', 'FOR', 'EAU', 'PRA', 'LIS', 'HUM', 'LAN', 'HAB']
DASH = ''.join(f'<path d="M{" L".join(f(a) + " " + f(b) for a, b in [P(*q) for q in cr(L, False, 8)][2:-2])}" stroke="#bfe6f8" stroke-width="{w}" stroke-dasharray="{da}" fill="none" stroke-linecap="round"/>'
               for L, w, da in ((RIVER, 1.3, '9 13'), (BROOK, .9, '6 10')))
TESTPT = {}
for k in ORDER:
    g = max(parts(REG[k].buffer(-5).difference(Point(*ANCH[k]).buffer(50)).difference(unary_union([EXT[o] for o in DRAW[DRAW.index(k) + 1:]] + [sl for o in ORDER if o != k for sl in SIL[o]] or [Point(-99, -99)]))), key=lambda p: p.area)
    TESTPT[k] = [round(v) for v in polylabel(g, .5).coords[0]]
defs = (f'<clipPath id="noroad"><path d="{d_of(box(-10, -10, W + 10, H + 10).difference(ROADS_S.buffer(.6)), .3)}" fill-rule="evenodd"/></clipPath><filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><feGaussianBlur stdDeviation="7"/></filter>'
        + ''.join(f'<g id="s-{k}">{v}</g>' for k, v in SYM.items()) + ''.join(f'<path id="zp-{k}" d="{Z[k]}"/><path id="zg-{k}" d="{ZG[k]}"/><clipPath id="cp-{k}"><use href="#zp-{k}"/></clipPath><clipPath id="cg-{k}"><use href="#zg-{k}"/></clipPath>' for k in ORDER))
zones = ''
for k in DRAW:
    rd_ = ROADS_S.intersection(REG[k]); ri = ROADIN_S.intersection(REG[k]); ps = ''
    if k == 'HUM':
        bw = BOARD.intersection(REG[k])
        if not bw.is_empty: ps = f'<path d="{d_of(bw)}" fill="#b98a5c"/><path d="{d_of(ROADIN_S.intersection(bw))}" fill="#d2a777"/>'
    elif k != 'EAU' and not rd_.is_empty:
        ps = f'<path d="{d_of(rd_)}" fill="#dcc795"/><path d="{d_of(ri)}" fill="#efe2bd"/>'
    if k != 'EAU':
        zw = ZWATER.intersection(REG[k])
        if not zw.is_empty: ps = f'<path d="{d_of(zw)}" fill="#5aa6d6"/>' + ps
    br = BRIDGES.intersection(REG[k].buffer(6))
    if not br.is_empty: ps += f'<path d="{d_of(br)}" fill="#a87650"/><path d="{d_of(br.buffer(-1.4))}" fill="#c99263"/>'
    zones += (f'<g class="z" id="z-{k}" data-m="{k}" style="--mc:{MT[k]}"><use class="zg" href="#zg-{k}" fill="{GROUND[k]}"/>'
              f'<g clip-path="url(#cg-{k})">{soils(k)}{ps}</g>'
              f'<g clip-path="url(#cg-{k})"><use class="zdim" href="#zg-{k}"/><use class="zwash" href="#zg-{k}"/><use class="zin" href="#zg-{k}"/></g>'
              f'<use class="zhit" href="#zp-{k}"/></g>')
outlines = ''.join(f'<use class="zl" data-for="{k}" href="#zp-{k}" style="--mc:{MT[k]}"/>' for k in ORDER)
seals = '' if ARTONLY else ''.join(f'<g class="zsw" data-m="{k}" data-for="{k}" style="--mc:{MT[k]}">{seal(k)}</g>' for k in ORDER)
style = '<style>.zdim{fill:#9aa597;opacity:0}.zwash{fill:#f2f6ec;opacity:0}.zin{fill:none;stroke:#fff;stroke-width:8;opacity:0}.zl{fill:none;opacity:0}.zhit{fill:transparent}.veil{fill:#fbfdf9;opacity:0}</style>'
shadowB = f'<path d="{d_of(unary_union([ISL, SIDE]).buffer(4), .5)}" fill="#14281a" opacity=".1" transform="translate(10 14)"/>'
ALL = sorted(((y, i, k, sv) for k in ORDER for i, (y, sv) in enumerate(D[k]) if y >= -1), key=lambda a: (a[0], a[1]))
FLAT = ''.join(sv for k in ORDER for (y, sv) in sorted(D[k], key=lambda a: a[0]) if y < -1)   # surfaces (sable, mares, champs) : sous les objets
runs, cur, buf = [], None, []
for (y, i, k, sv) in ALL:
    if k != cur and buf: runs.append((cur, ''.join(buf))); buf = []
    cur = k; buf.append(sv)
if buf: runs.append((cur, ''.join(buf)))
DECO = ''.join(f'<g class="dz" id="dr{i}" data-m="{k}">{sv}</g>' for i, (k, sv) in enumerate(runs))
FLATS = ''.join(f'<g class="dz" data-m="{k}" data-for="{k}" clip-path="url(#noroad)">' + ''.join(sv for (y, sv) in sorted(D[k], key=lambda a: a[0]) if y < -1) + '</g>' for k in ORDER)
print('séries de décor :', len(runs))
svg = (f'<svg class="msvg" viewBox="0 0 {W} {H}" role="group" aria-label="Carte du Royaume des Plantes"><defs>{style}{defs}</defs>'
       f'{shadowB}{CL}<g class="zones">{zones}</g><g class="flat">{FLATS}</g><g class="deco">{DECO}</g><path class="veil" d="{d_of(unary_union([ISL, SIDE] + list(EXT.values())).buffer(1), .4)}"/><g class="decosel"></g><g class="zls">{outlines}</g><g class="zss">{seals}</g></svg>')
js = ('// Carte des milieux de l\'Herbier : produite par outils/carte/gen_carte.py (ne pas modifier à la main)\nwindow.CARTE_MILIEUX=' +
      json.dumps({'W': W, 'H': H, 'Z': {k: {'a': ANCH[k], 'p': TESTPT[k]} for k in ORDER}, 'SVG': svg}, ensure_ascii=False, separators=(',', ':')) + ';\n')
if ARTONLY: (HERE / 'carte-illustration.svg').write_text(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1))
else: (RACINE / 'illustrations' / 'carte-milieux.js').write_text(js, encoding='utf-8')
print(len(svg) // 1024, 'Ko', TESTPT)
