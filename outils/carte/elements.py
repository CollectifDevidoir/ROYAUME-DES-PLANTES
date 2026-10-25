# Outils géométriques et éléments dessinés (vocabulaire des illustrations .ri du jeu), partagés par gen_carte.py
import math, random, json, pathlib
from shapely.geometry import Polygon, MultiPolygon, LineString, Point, box
from shapely.ops import unary_union, polylabel
rnd = random.Random(11)
r = lambda a, b: a + rnd.random() * (b - a)
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')

# ---------------- outils géométriques ----------------
def cr(P, closed=True, n=14, t=.5):
    """Catmull-Rom échantillonné : courbe lisse en polyligne dense"""
    out = []; m = len(P)
    g = (lambda i: P[i % m]) if closed else (lambda i: P[max(0, min(m - 1, i))])
    for i in range(m if closed else m - 1):
        p0, p1, p2, p3 = g(i - 1), g(i), g(i + 1), g(i + 2)
        for k in range(n):
            u = k / n; u2, u3 = u * u, u * u * u
            out.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3) for j in (0, 1)))
    if not closed: out.append(P[-1])
    return out
def poly(P): return Polygon(cr(P)).buffer(0)
def tube(L, w0, w1, n=10):
    pts = cr(L, False, n); parts = []
    for i, p in enumerate(pts):
        w = w0 + (w1 - w0) * i / (len(pts) - 1); parts.append(Point(p).buffer(w, 24))
    return unary_union(parts).buffer(2).buffer(-2)
def parts(g):
    if g.is_empty: return []
    return list(g.geoms) if hasattr(g, 'geoms') else [g]
def d_of(g, tol=.35):
    s = []
    for p in parts(g):
        if p.geom_type != 'Polygon': continue
        p = p.simplify(tol)
        for ring in [p.exterior] + list(p.interiors):
            c = list(ring.coords)[:-1]
            if len(c) < 3: continue
            s.append('M' + 'L'.join(f(x) + ' ' + f(y) for x, y in c) + 'Z')
    return ''.join(s)

# ---------------- palette (classes .ri) ----------------
C = dict(g1='#b4e67f', g2='#72c24c', g3='#459c3c', g4='#2c7433', t2='#33b48f', t3='#1f8a6d', t4='#14614f', b1='#c99263', b2='#9c653a', b3='#734529',
         c1='#fffaf0', c2='#f6e7c4', c3='#dfc591', s1='#dcd8d0', s2='#b3ada2', s3='#8c877c', u1='#c8ecff', u2='#4db3f2', u3='#2a83cc', p1='#ffd6e6', p2='#ff92bb', p3='#e2628f',
         v2='#ab7ce9', v3='#7c52c4', y1='#fff3a8', y2='#ffcf3d', y3='#ef9f1c', o2='#f27c46', o3='#c8552c', r2='#f0466b', r3='#c22a50', w1='#ffe6b5', w2='#f6c67c', w3='#d99a4f')
GROUND = dict(FOR='#5f9150', ROC='#cdc6b6', LIT='#f0dcab', LIS='#8fbb62', PRA='#c4dd8a', HUM='#9dc9ad', LAN='#cdb684', HAB='#d2e5a4', EAU='#5aa8d8')
EDGE = dict(FOR='#3f6f3a', ROC='#a79f8e', LIT='#d9bd82', LIS='#679a45', PRA='#9fc266', HUM='#6fa78c', LAN='#a88e5c', HAB='#a9c97c', EAU='#2f7fb6')

# ---------------- éléments ----------------
def shadow(x, y, rx, op=.17): return f'<ellipse cx="{f(x + rx * .3)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(rx * .27)}" fill="#14281a" opacity="{op}"/>'
def cloud(cx, cy, rx, ry, k=8, fill='#000', rot=None):
    a0 = rnd.random() * 6.28 if rot is None else rot; pts = []
    for i in range(k):
        a = a0 + i / k * 6.283; pts.append((cx + math.cos(a) * rx * .9, cy + math.sin(a) * ry * .9))
    s = f'M{f(pts[0][0])} {f(pts[0][1])}'
    for i in range(k):
        a = a0 + (i + .5) / k * 6.283; c = (cx + math.cos(a) * rx * 1.16, cy + math.sin(a) * ry * 1.16); p = pts[(i + 1) % k]
        s += f'Q{f(c[0])} {f(c[1])} {f(p[0])} {f(p[1])}'
    return f'<path d="{s}Z" fill="{fill}"/>'
def tree(x, y, s=1., pal=('g3', 'g2', 'g1'), fruit=None):
    R = 13 * s; cy = y - 24 * s
    o = shadow(x, y, 12 * s)
    o += f'<path d="M{f(x-2.6*s)} {f(y)}L{f(x-1.7*s)} {f(y-15*s)}H{f(x+1.7*s)}L{f(x+2.6*s)} {f(y)}Z" fill="{C["b2"]}"/><path d="M{f(x)} {f(y-15*s)}H{f(x+1.7*s)}L{f(x+2.6*s)} {f(y)}H{f(x+.6*s)}Z" fill="{C["b3"]}"/>'
    o += cloud(x + 1.2 * s, cy + 1.2 * s, R, R * .95, 8, C[pal[0]]) + cloud(x - 1.4 * s, cy - 1.6 * s, R * .8, R * .76, 8, C[pal[1]]) + cloud(x - 5 * s, cy - 6.5 * s, R * .3, R * .27, 6, C[pal[2]])
    if fruit:
        for dx, dy in ((-5, -2), (4, 1), (0, -8), (6, -6)): o += f'<circle cx="{f(x+dx*s)}" cy="{f(cy+dy*s)}" r="{f(1.8*s)}" fill="{fruit}"/>'
    return o
def conifer(x, y, s=1., pal=('t3', 't4', 't2')):
    o = shadow(x, y, 9 * s) + f'<rect x="{f(x-1.5*s)}" y="{f(y-7*s)}" width="{f(3*s)}" height="{f(7*s)}" fill="{C["b3"]}"/>'
    for i in range(3):
        yb = y - 5 * s - i * 9.5 * s; w = (11 - i * 2.6) * s; h = 16 * s
        o += f'<path d="M{f(x)} {f(yb-h)}L{f(x-w)} {f(yb)}Q{f(x)} {f(yb+2.6*s)} {f(x+w)} {f(yb)}Z" fill="{C[pal[0]]}"/>'
        o += f'<path d="M{f(x)} {f(yb-h)}L{f(x+w)} {f(yb)}Q{f(x+w*.5)} {f(yb+1.9*s)} {f(x+.4*s)} {f(yb+1.3*s)}Z" fill="{C[pal[1]]}"/>'
    return o
def shrub(x, y, s=1., pal=('g3', 'g2', 'g1'), dots=None):
    R = 8 * s
    o = shadow(x, y, 11 * s) + cloud(x - 5 * s, y - 6 * s, R * .8, R * .72, 7, C[pal[0]]) + cloud(x + 5.5 * s, y - 5.6 * s, R * .76, R * .68, 7, C[pal[0]])
    o += cloud(x, y - 10 * s, R * .9, R * .82, 7, C[pal[1]]) + cloud(x - 3 * s, y - 13.5 * s, R * .28, R * .25, 6, C[pal[2]])
    if dots:
        for _ in range(4): o += f'<circle cx="{f(x+r(-8,8)*s)}" cy="{f(y-r(4,15)*s)}" r="{f(1.5*s)}" fill="{dots}"/>'
    return o
def tuft(x, y, s=1., c1='g3', c2='g2'):
    o = ''
    for i, a in enumerate((-30, -12, 6, 24)):
        L = (9 if i in (1, 2) else 7) * s; ar = math.radians(a)
        tx, ty = x + math.sin(ar) * L, y - math.cos(ar) * L
        o += f'<path d="M{f(x-1.3*s)} {f(y)}Q{f((x+tx)/2-.6*s)} {f((y+ty)/2)} {f(tx)} {f(ty)}Q{f((x+tx)/2+.9*s)} {f((y+ty)/2+.6*s)} {f(x+1.3*s)} {f(y)}Z" fill="{C[c1] if i % 2 else C[c2]}"/>'
    return o
def flowers(x, y, col, n=3, s=1.):
    o = ''
    for _ in range(n):
        dx, dy = r(-5, 5) * s, r(-3, 3) * s; o += f'<circle cx="{f(x+dx)}" cy="{f(y+dy)}" r="{f(2.4*s)}" fill="{col}"/><circle cx="{f(x+dx-.5)}" cy="{f(y+dy-.5)}" r="{f(.8*s)}" fill="#fff8d6"/>'
    return o
def rock(x, y, s=1.):
    w, h = 11 * s, 9 * s
    return shadow(x, y, w * 1.05) + f'<path d="M{f(x-w)} {f(y)}L{f(x-w*.75)} {f(y-h*.7)}L{f(x-w*.15)} {f(y-h)}L{f(x+w*.6)} {f(y-h*.75)}L{f(x+w)} {f(y)}Z" fill="{C["s2"]}"/>' \
        f'<path d="M{f(x-w*.75)} {f(y-h*.7)}L{f(x-w*.15)} {f(y-h)}L{f(x+w*.05)} {f(y-h*.35)}L{f(x-w)} {f(y)}Z" fill="{C["s1"]}"/><path d="M{f(x+w*.05)} {f(y-h*.35)}L{f(x+w*.6)} {f(y-h*.75)}L{f(x+w)} {f(y)}H{f(x+w*.2)}Z" fill="{C["s3"]}" opacity=".55"/>'
def reeds(x, y, s=1.):
    o = ''
    for i, a in enumerate((-16, -6, 4, 14)):
        ar = math.radians(a); L = (17 if i in (1, 2) else 13) * s; tx, ty = x + math.sin(ar) * L, y - math.cos(ar) * L
        o += f'<path d="M{f(x-1*s)} {f(y)}Q{f((x+tx)/2)} {f((y+ty)/2)} {f(tx)} {f(ty)}Q{f((x+tx)/2+.8*s)} {f((y+ty)/2)} {f(x+1*s)} {f(y)}Z" fill="{C["g4"] if i % 2 else C["g3"]}"/>'
    for dx, hh in ((-2.5, 18), (3, 15)):
        o += f'<rect x="{f(x+dx*s-.5)}" y="{f(y-hh*s)}" width="1" height="{f(hh*s)}" fill="{C["g4"]}"/><rect x="{f(x+dx*s-1.8*s)}" y="{f(y-(hh+5)*s)}" width="{f(3.6*s)}" height="{f(7.5*s)}" rx="{f(1.8*s)}" fill="{C["b3"]}"/>'
    return o
def cushion(x, y, s=1., top='#c46aa2', dot='#e9a6d0', base='#7a7f3d'):
    w, h = 10 * s, 7 * s
    return shadow(x, y, w * 1.05, .15) + f'<path d="M{f(x-w)} {f(y)}C{f(x-w)} {f(y-h*1.35)} {f(x+w)} {f(y-h*1.35)} {f(x+w)} {f(y)}Z" fill="{base}"/>' + cloud(x - .5 * s, y - h * .78, w * .86, h * .62, 8, top) + \
        ''.join(f'<circle cx="{f(x+r(-6,5)*s)}" cy="{f(y-h*r(.6,1.15))}" r="{f(1.3*s)}" fill="{dot}"/>' for _ in range(4))
def lily(x, y, s=1., fl=False):
    R = 5.5 * s; a = rnd.random() * 6.28
    o = f'<path d="M{f(x)} {f(y)}L{f(x+math.cos(a)*R)} {f(y+math.sin(a)*R*.6)}A{f(R)} {f(R*.6)} 0 1 1 {f(x+math.cos(a+.6)*R)} {f(y+math.sin(a+.6)*R*.6)}Z" fill="{C["g3"]}"/>'
    o += f'<ellipse cx="{f(x-1.5*s)}" cy="{f(y-1*s)}" rx="{f(R*.45)}" ry="{f(R*.25)}" fill="{C["g2"]}"/>'
    if fl: o += f'<circle cx="{f(x+1)}" cy="{f(y-1.5)}" r="{f(2.3*s)}" fill="{C["p1"]}"/><circle cx="{f(x+1)}" cy="{f(y-1.8)}" r="{f(.9*s)}" fill="{C["y2"]}"/>'
    return o
def bale(x, y, s=1.):
    w, h = 9 * s, 5.5 * s
    return shadow(x + 2, y, 10 * s, .15) + f'<rect x="{f(x-w)}" y="{f(y-2*h)}" width="{f(2*w)}" height="{f(2*h)}" rx="{f(2*s)}" fill="{C["w2"]}"/><rect x="{f(x-w)}" y="{f(y-2*h)}" width="{f(2*w)}" height="{f(h*.7)}" rx="{f(1.5*s)}" fill="{C["w1"]}"/>' \
        f'<ellipse cx="{f(x-w)}" cy="{f(y-h)}" rx="{f(h*.55)}" ry="{f(h)}" fill="{C["w3"]}"/><path d="M{f(x-w)} {f(y-h*1.5)}a{f(h*.3)} {f(h*.5)} 0 1 0 0 {f(h)}" stroke="{C["b2"]}" stroke-width="{f(.8*s)}" fill="none"/>'
def house(x, y, s=1., roof=('o3', '#9c3a22')):
    w, h, d = 22 * s, 18 * s, 14 * s
    rc = C.get(roof[0], roof[0])
    o = shadow(x + 6 * s, y + 1, 30 * s, .2)
    o += f'<path d="M{f(x-w)} {f(y)}V{f(y-h)}H{f(x+w*.25)}V{f(y)}Z" fill="{C["c2"]}"/>'  # façade
    o += f'<path d="M{f(x+w*.25)} {f(y)}V{f(y-h)}L{f(x+w*.25+d)} {f(y-h-d*.5)}V{f(y-d*.5)}Z" fill="{C["c3"]}"/>'  # pignon
    o += f'<path d="M{f(x+w*.25)} {f(y-h)}L{f(x+w*.25+d*.5)} {f(y-h-d*1.15)}L{f(x+w*.25+d)} {f(y-h-d*.5)}Z" fill="{C["c3"]}"/>'
    o += f'<path d="M{f(x-w-3*s)} {f(y-h+1)}L{f(x-w+d*.5-3*s)} {f(y-h-d*1.15)}H{f(x+w*.25+d*.5)}L{f(x+w*.25+2*s)} {f(y-h+1)}Z" fill="{rc}"/>'  # pan de toit
    o += f'<path d="M{f(x+w*.25+d*.5)} {f(y-h-d*1.15)}L{f(x+w*.25+d+1.5*s)} {f(y-h-d*.5+1)}L{f(x+w*.25+d)} {f(y-h-d*.5+2.5*s)}L{f(x+w*.25+2*s)} {f(y-h+1)}Z" fill="{roof[1]}"/>'
    o += f'<rect x="{f(x-w*.55)}" y="{f(y-h-d*1.05)}" width="{f(4*s)}" height="{f(8*s)}" fill="{C["b2"]}"/>'
    o += f'<rect x="{f(x-w*.7)}" y="{f(y-11*s)}" width="{f(6*s)}" height="{f(11*s)}" rx="{f(1*s)}" fill="{C["b3"]}"/><rect x="{f(x-w*.15)}" y="{f(y-13*s)}" width="{f(7*s)}" height="{f(6*s)}" rx="{f(1*s)}" fill="#bfe6f8"/>'
    return o
def greenhouse(x, y, s=1.):
    w, h = 20 * s, 12 * s
    o = shadow(x + 3, y, 24 * s, .15)
    o += f'<path d="M{f(x-w)} {f(y)}V{f(y-h)}L{f(x-w*.4)} {f(y-h-8*s)}H{f(x+w*.95)}L{f(x+w)} {f(y-h)}V{f(y)}Z" fill="#cfeefb"/><path d="M{f(x-w)} {f(y-h)}L{f(x-w*.4)} {f(y-h-8*s)}L{f(x+w*.2)} {f(y-h)}Z" fill="#eaf8ff"/>'
    o += f'<path d="M{f(x-w)} {f(y-h)}H{f(x+w)}M{f(x-w*.4)} {f(y-h-8*s)}V{f(y)}M{f(x+w*.2)} {f(y-h)}V{f(y)}M{f(x+w*.6)} {f(y-h-8*s)}V{f(y)}" stroke="#fff" stroke-width="{f(1.3*s)}" fill="none"/>'
    return o
def bed(x, y, w, h):
    o = f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="3" fill="{C["b1"]}"/><rect x="{f(x)}" y="{f(y+h-2.6)}" width="{f(w)}" height="2.6" rx="1.3" fill="{C["b2"]}"/>'
    j = y + 5; row = 0
    while j < y + h - 4:
        i = x + 5
        while i < x + w - 3: o += f'<circle cx="{f(i)}" cy="{f(j)}" r="2.3" fill="{C["g2"] if row % 2 else C["g3"]}"/>'; i += 6.5
        j += 6; row += 1
    return o
def peak(cx, by, w, h, snow=.36):
    ax, ay = cx, by - h; rx = cx + w * .14
    o = f'<path d="M{f(cx-w)} {f(by)}L{f(ax)} {f(ay)}L{f(rx)} {f(by)}Z" fill="#e4dfd5"/>'
    o += f'<path d="M{f(ax)} {f(ay)}L{f(cx+w*.95)} {f(by)}H{f(rx)}Z" fill="#b9b2a5"/>'
    o += f'<path d="M{f(ax+w*.08)} {f(ay+h*.25)}L{f(cx+w*.5)} {f(by-h*.1)}L{f(cx+w*.42)} {f(by)}H{f(cx+w*.3)}Z" fill="#a39c8f"/>'
    o += f'<path d="M{f(ax-w*.25)} {f(ay+h*.55)}L{f(ax-w*.12)} {f(ay+h*.42)}L{f(ax-w*.05)} {f(by)}H{f(ax-w*.3)}Z" fill="#d3cdc1"/>'
    # neige : bord inférieur en dents
    sh = h * snow; L = lambda t: (ax + (cx - w - ax) * t, ay + (by - ay) * t); R_ = lambda t: (ax + (rx - ax) * t, ay + (by - ay) * t); R2 = lambda t: (ax + (cx + w * .95 - ax) * t, ay + (by - ay) * t)
    t = sh / h
    l1, l2, m1, rr = L(t), L(t * .7), R_(t * 1.1), R2(t * .9)
    o += f'<path d="M{f(ax)} {f(ay)}L{f(l1[0])} {f(l1[1])}L{f(l1[0]+w*.12)} {f(l1[1]-h*.05)}L{f(l2[0]+w*.2)} {f(l1[1]+h*.03)}L{f(ax-w*.04)} {f(m1[1]-h*.06)}L{f(m1[0])} {f(m1[1])}Z" fill="{C["c1"]}"/>'
    o += f'<path d="M{f(ax)} {f(ay)}L{f(m1[0])} {f(m1[1])}L{f(m1[0]+w*.12)} {f(m1[1]-h*.07)}L{f(rr[0])} {f(rr[1])}Z" fill="#dde3e6"/>'
    return o

