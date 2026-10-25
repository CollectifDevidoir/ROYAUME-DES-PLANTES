# Éléments dessinés en symboles (<use>), vocabulaire des illustrations .ri du jeu
import math
from elements import *
import elements as E
rnd = E.rnd
# ================= symboles =================
SYM = {}; BB = {}
def sym(name, fn, bb):
    if name not in SYM: SYM[name] = fn(); BB[name] = bb
def use(name, x, y, s=1.): return f'<use href="#s-{name}" transform="translate({f(x)} {f(y)}) scale({f(s)})"/>'
def bbox(name, x, y, s): a, b, c, d = BB[name]; return box(x + a * s, y + b * s, x + c * s, y + d * s)
TB = (-14, -40, 17, 4)
for i in range(4):
    sym(f'tA{i}', lambda: tree(0, 0, 1, ('g3', 'g2', 'g1')), TB); sym(f'tB{i}', lambda: tree(0, 0, 1, ('g4', 'g3', 'g2')), TB)
    sym(f'sh{i}', lambda: shrub(0, 0, 1, ('g3', 'g2', 'g1')), (-13, -23, 15, 4)); sym(f'sd{i}', lambda: shrub(0, 0, 1, ('g4', 'g3', 'g2')), (-13, -23, 15, 4))
    sym(f'sw{i}', lambda: shrub(0, 0, 1, ('g3', 'g2', 'g1'), C['c1']), (-13, -23, 15, 4)); sym(f'sy{i}', lambda: shrub(0, 0, 1, ('g3', 'g2', 'g1'), C['y2']), (-13, -23, 15, 4))
    sym(f'sp{i}', lambda: shrub(0, 0, 1, ('g3', 'g2', 'g1'), C['p2']), (-13, -23, 15, 4))
    sym(f'hp{i}', lambda: cushion(0, 0, 1, '#b7789f', '#d9a7c6', '#6f7a3e'), (-11, -12, 14, 4)); sym(f'hm{i}', lambda: cushion(0, 0, 1, '#8d6c9b', '#b9a0c8', '#6f7a3e'), (-11, -12, 14, 4))
for i in range(3):
    sym(f'cf{i}', lambda: conifer(0, 0, 1), (-12, -41, 13, 4)); sym(f'rd{i}', lambda: reeds(0, 0, 1), (-6, -24, 7, 1)); sym(f'rk{i}', lambda: rock(0, 0, 1), (-12, -10, 16, 4))
    sym(f'tu{i}', lambda: tuft(0, 0, 1), (-6, -10, 6, 1)); sym(f'tt{i}', lambda: tuft(0, 0, 1, 't3', 't2'), (-6, -10, 6, 1))
    sym(f'ma{i}', lambda: tuft(0, 0, 1, 'g3', 'g2').replace(C['g3'], '#8ea35a').replace(C['g2'], '#b4c77a'), (-6, -10, 6, 1))
    sym(f'tf{i}', lambda: tree(0, 0, 1, ('g3', 'g2', 'g1'), C['r2']), TB)
sym('tk', lambda: tree(0, 0, 1, ('p3', 'p2', 'p1')), TB)
def pine():
    o = shadow(0, 0, 14) + f'<path d="M-1.6 0Q-3 -12 2 -24L4.2 -23Q.6 -12 1.8 0Z" fill="{C["b2"]}"/>'
    return o + cloud(2, -27, 17, 6.5, 9, C['g4']) + cloud(.5, -29.5, 13, 4.6, 8, C['g3']) + cloud(-4, -31, 4.5, 1.8, 6, C['g2'])
sym('pn', pine, (-19, -36, 22, 4))
sym('cm', lambda: conifer(0, 0, 1, ('t4', 't4', 't3')).replace(C['t4'], '#1d5a4a', 1), (-12, -41, 13, 4))
def birch():   # bouleau : tronc blanc tigré, feuillage léger
    o = shadow(0, 0, 9) + '<path d="M-1.8 0L-1.2 -30H1.2L1.8 0Z" fill="#f4f1e8"/><path d="M0 -30H1.2L1.8 0H.4Z" fill="#d9d4c6"/>'
    o += ''.join(f'<rect x="-1.6" y="{-6 - i * 7}" width="2.4" height="1.2" fill="#3b3a35"/>' for i in range(4))
    return o + cloud(1, -34, 9, 11, 7, '#7fbf55') + cloud(-1, -36, 7, 8.5, 7, '#a2d66a') + cloud(-3.5, -40, 2.6, 2.4, 5, '#c9ee95')
sym('bi', birch, (-11, -47, 12, 3))
def willow():  # saule pleureur des berges
    o = shadow(2, 0, 15) + f'<path d="M-2.4 0L-1.6 -16H1.6L2.4 0Z" fill="{C["b2"]}"/>'
    o += cloud(0, -24, 16, 11, 8, '#6ea85a') + cloud(-1, -27, 12, 8, 8, '#93c46f')
    o += ''.join(f'<path d="M{x} -20Q{x + 1} -8 {x - 1} {-2 - abs(x) * .3}" stroke="#6ea85a" stroke-width="2.6" fill="none" stroke-linecap="round"/>' for x in (-14, -9, -4, 3, 9, 14))
    return o
sym('wl', willow, (-17, -36, 19, 4))
def fern():
    o = ''
    for a in (-55, -25, 0, 25, 55):
        ar = math.radians(a); L = 15 - abs(a) / 10; tx, ty = math.sin(ar) * L, -math.cos(ar) * L
        o += f'<path d="M0 0Q{f(tx*.4 - 2)} {f(ty*.6)} {f(tx)} {f(ty)}Q{f(tx*.4 + 2)} {f(ty*.5)} 0 0Z" fill="{C["g3"] if a % 50 else C["g4"]}"/>'
    return o
sym('fe', fern, (-14, -16, 14, 1))
def poppy_g():  # coquelicot géant : corolle en coupe ouverte vers le haut
    o = shadow(1, 0, 6, .14) + '<path d="M-.8 0Q-3 -18 .6 -34L2 -33.6Q-1 -18 1 0Z" fill="#4f8f3a"/><path d="M0 -14q-8 -2 -10 -8q6 0 10 5z" fill="#5fa043"/>'
    o += '<path d="M-1 -22Q-6 -26 -7 -31" stroke="#4f8f3a" stroke-width="1.2" fill="none"/><ellipse cx="-7.5" cy="-32.5" rx="1.8" ry="2.6" fill="#6f9e4a"/>'
    o += '<path d="M-10 -44Q-11 -35 0 -33Q11 -35 10 -44Q5 -41 0 -42Q-5 -41 -10 -44Z" fill="#c8302c"/>'
    o += '<path d="M-10 -44Q-8 -49 -3 -46Q0 -50 3 -46Q8 -49 10 -44Q5 -41 0 -42Q-5 -41 -10 -44Z" fill="#e8463a"/>'
    o += '<ellipse cx="0" cy="-44.2" rx="4.6" ry="1.5" fill="#3a1d1a"/><circle cx="0" cy="-44.6" r="1.3" fill="#c9b04a"/>'
    return o
sym('pg', poppy_g, (-11, -50, 11, 2))
def daisy_g():  # grande marguerite
    o = shadow(1, 0, 5, .14) + '<path d="M-.6 0Q1 -18 -1 -34L.6 -34Q2.6 -18 .8 0Z" fill="#4f8f3a"/>'
    o += ''.join(f'<ellipse cx="{f(math.cos(i*.785)*6)}" cy="{f(-38+math.sin(i*.785)*3.2)}" rx="4.4" ry="2" transform="rotate({i*45} {f(math.cos(i*.785)*6)} {f(-38+math.sin(i*.785)*3.2)})" fill="#fffaf0"/>' for i in range(8))
    return o + '<ellipse cx="0" cy="-38" rx="3.2" ry="2.2" fill="#ffcf3d"/>'
sym('dg', daisy_g, (-11, -43, 11, 2))
def bluebell_g():  # campanule géante
    o = '<path d="M0 0Q-2 -20 4 -34" stroke="#4f8f3a" stroke-width="1.6" fill="none"/>'
    for (x, y) in ((4, -34), (6, -24), (5, -14)): o += f'<path d="M{x-1} {y}l-4 6q4 2 8 0z" fill="#7c6fd6"/><path d="M{x+1} {y}l3 6q-2 1 -4 1z" fill="#5d50b8"/>'
    return o
sym('bg', bluebell_g, (-4, -35, 10, 1))
def puff():  # aigrette de pissenlit
    o = '<path d="M0 0Q-1 -12 0 -24" stroke="#7aa84f" stroke-width="1.2" fill="none"/><circle cx="0" cy="-28" r="7" fill="#ffffff" opacity=".85"/>'
    return o + ''.join(f'<path d="M0 -28L{f(math.cos(i*.52)*7)} {f(-28+math.sin(i*.52)*7)}" stroke="#d8dccd" stroke-width=".7"/>' for i in range(12))
sym('pu', puff, (-8, -36, 8, 1))
def seedfloat():  # graine en vol
    return '<path d="M0 0L0 -5" stroke="#cfd5c2" stroke-width=".8"/><path d="M-3.5 -6.5Q0 -9 3.5 -6.5" stroke="#ffffff" stroke-width="1.1" fill="none"/>'
sym('sf', seedfloat, (-4, -9, 4, 1))
def flowers_clump(c):
    return lambda: tuft(0, 0, .9) + f'<circle cx="-3" cy="-9" r="2.2" fill="{c}"/><circle cx="2.5" cy="-11" r="2.2" fill="{c}"/><circle cx="4" cy="-6" r="1.9" fill="{c}"/>'
for n, c in (('fy', C['y2']), ('fp', '#e8463a'), ('fb', '#6f8fe0'), ('fw', '#fffaf0'), ('fv', C['v2'])): sym(n, flowers_clump(c), (-6, -13, 7, 1))
def mossrock():
    return rock(0, 0, 1) + cloud(-3, -8, 6, 2.6, 6, '#8fbf5a') + cloud(4, -6, 3.6, 1.8, 5, '#a9d16e')
sym('mr', mossrock, (-12, -11, 16, 4))
def salic():  # salicorne des prés salés
    return ''.join(f'<path d="M{x} 0q{x*.2} -4 {x*.4} -8" stroke="{c}" stroke-width="1.5" fill="none" stroke-linecap="round"/>' for x, c in ((-3, '#8f9a4e'), (-1, '#b0644f'), (1, '#8f9a4e'), (3, '#a0705a')))
sym('sa', salic, (-5, -9, 5, 1))
def holly():  # panicaut maritime : feuilles épineuses glauques, capitules bleus
    o = ''
    for a_, l in ((-60, 7), (-25, 9), (15, 9), (55, 7)):
        ar = math.radians(a_); tx, ty = math.sin(ar) * l, -math.cos(ar) * l * .7
        o += f'<path d="M0 0Q{tx*.3-1.5:.1f} {ty*.6:.1f} {tx:.1f} {ty:.1f}Q{tx*.5+1:.1f} {ty*.4:.1f} 0 0Z" fill="#a7bfc4"/>'
    o += '<path d="M0 0V-9M0 -6L-3 -10M0 -6L3 -11" stroke="#8aa6b0" stroke-width="1" fill="none"/>'
    o += '<circle cx="-3" cy="-10.5" r="1.9" fill="#7f9fcf"/><circle cx="3" cy="-11.5" r="1.9" fill="#6d8fc7"/><circle cx="0" cy="-9.5" r="1.6" fill="#93aedb"/>'
    return o
sym('ho', holly, (-6, -13, 6, 1))
def golden():  # l'Arbre doré du royaume (cf. icône de l'appli et rang « Maître du royaume »)
    o = shadow(3, 0, 26, .2) + f'<path d="M-6 0C-3 -12 -3 -22 -4 -32H4C3 -22 3 -12 6 0Z" fill="{C["b2"]}"/><path d="M0 -32H4C3 -22 3 -12 6 0H1.5C1 -12 1 -22 0 -32Z" fill="{C["b3"]}"/>'
    o += f'<path d="M-2 -14q-8 -4 -12 -2M2 -20q8 -5 12 -3" stroke="{C["b2"]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    o += cloud(2, -52, 30, 26, 10, '#e0a52a') + cloud(-2, -56, 25, 21, 10, '#f6c94a') + cloud(-10, -66, 9, 7, 7, '#fde58a')
    o += ''.join(f'<circle cx="{f(math.cos(a)*22)}" cy="{f(-54+math.sin(a)*18)}" r="1.8" fill="#fff3a8"/>' for a in (0.3, 1.4, 2.5, 3.5, 4.6, 5.6))
    return o
sym('gt', golden, (-30, -82, 34, 6))
def glasshouse():  # serre victorienne : soubassement de brique, nef vitrée, pavillon central à dôme, plantes derrière le verre
    o = '<ellipse cx="8" cy="2" rx="56" ry="7" fill="#14281a" opacity=".16"/>'
    o += cloud(-30, -16, 9, 8, 7, '#459c3c') + cloud(26, -17, 10, 9, 7, '#72c24c') + cloud(-6, -24, 8, 9, 7, '#2c7433') + '<circle cx="-28" cy="-20" r="2" fill="#f0466b"/><circle cx="24" cy="-22" r="2" fill="#ffcf3d"/>'
    o += '<path d="M-48 -8V-30H-14V-8ZM14 -8V-30H48V-8Z" fill="#c9ecfa" opacity=".62"/><path d="M-14 -8V-44H14V-8Z" fill="#c9ecfa" opacity=".62"/>'
    o += '<path d="M-48 -30Q-48 -42 -31 -43Q-14 -42 -14 -30ZM14 -30Q14 -42 31 -43Q48 -42 48 -30Z" fill="#e1f5fd"/><path d="M-14 -44Q-14 -63 0 -65Q14 -63 14 -44Z" fill="#e8f8fe"/>'
    o += '<path d="M-48 -30Q-48 -42 -31 -43V-30ZM14 -30Q14 -42 31 -43V-30ZM-14 -44Q-14 -63 0 -65V-44Z" fill="#f4fcff"/>'
    o += '<path d="M-48 -30H-14M14 -30H48M-14 -44H14M-38 -8V-30M-28 -8V-31M-20 -8V-30M20 -8V-30M28 -8V-31M38 -8V-30M-7 -8V-44M7 -8V-44M-31 -30V-43M31 -30V-43M0 -44V-65M-48 -19H-14M14 -19H48" stroke="#ffffff" stroke-width="1.2" fill="none"/>'
    o += '<path d="M-48 -8V-30M48 -8V-30M-14 -8V-44M14 -8V-44" stroke="#e9f4f0" stroke-width="1.8"/>'
    o += '<rect x="-50" y="-8" width="100" height="8" rx="1.5" fill="#b9694b"/><rect x="-50" y="-8" width="100" height="2.4" fill="#d18a6c"/>'
    o += '<path d="M-5 -8V-20Q0 -24 5 -20V-8Z" fill="#7fbfd8"/><circle cx="0" cy="-67" r="2.2" fill="#d9a34a"/>'
    return o
sym('gh', glasshouse, (-52, -70, 64, 9))
def stake():
    return ('<ellipse cx="2" cy="0" rx="9" ry="2.6" fill="#14281a" opacity=".22"/><path d="M-1.3 0L-1.3 -22H1.3L1.3 0Z" fill="#9c653a"/><path d="M0 -22H1.3V0H.3Z" fill="#734529"/>')
pick = lambda pre, n: f'{pre}{rnd.randrange(n)}'
sym('bl', lambda: bale(0, 0, 1), (-12, -12, 12, 3))
