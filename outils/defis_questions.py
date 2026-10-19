#!/usr/bin/env python3
"""Questions du Défi du jour : 30 jours de 10 questions de culture botanique (QCM ou 4 images).

Deux sources :
- les questions générées ici à partir des données déjà vérifiées de l'appli (curiosités sourcées,
  milieux sourcés, familles, floraisons, noms, ressemblances connues) ;
- les questions rédigées et sourcées à la main : donnees/defis-redigees.json.
Le tout est réparti en 30 séries équilibrées (niveaux, thèmes, formats), écrites dans
donnees/defis-questions.json et reportées dans index.html (const DQ).

Usage : python3 outils/defis_questions.py app.json [--ecrire]
app.json : extraction des tables de l'appli (S, FAM, CU, AS, FI, PAIRS, NP, GD, lvl…), faite par
outils/defis_extraire.js.
"""
import json, re, sys, random, unicodedata, collections, os

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
JOURS, PAR_JOUR = 30, 10
# ordre des niveaux dans une série (3 simples, 3 pièges, 4 difficiles) : on monte doucement, les pièges sont glissés partout
GABARIT = ['simple', 'simple', 'piege', 'simple', 'difficile', 'piege', 'difficile', 'piege', 'difficile', 'difficile']

D = json.load(open(sys.argv[1], encoding='utf8'))
M = json.load(open(os.path.join(RAC, 'donnees', 'milieux-especes.json'), encoding='utf8'))['especes']
A = json.load(open(os.path.join(RAC, 'donnees', 'anecdotes-especes.json'), encoding='utf8'))['especes']
S = {s[0]: s for s in D['S']}
LVL, FAM, FI, CU, AS = D['lvl'], D['FAM'], D['FI'], D['CU'], D['AS']
gen = lambda l: l.split(' ')[0]
fam = lambda l: FAM.get(gen(l), '')
nom = lambda l: S[l][1]
typ = lambda l: S[l][2]
facile = lambda l: LVL[l] <= 1
R = random.Random(20261015)
cap = lambda t: (t.strip()[:1].upper() + t.strip()[1:].rstrip('.') + '.') if t.strip() else ''
norm = lambda t: unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()

POOL = []
def ajoute(q):
    assert len(q['choix']) == 4 and len(set(q['choix'])) == 4, q
    POOL.append(q)

def melange(bonne, autres):
    c = [bonne] + list(autres)
    R.shuffle(c)
    return c, c.index(bonne)

def tire(cands, n, exclus=()):
    c = [x for x in cands if x not in exclus]
    R.shuffle(c)
    out = []
    for x in c:
        if len(out) == n: break
        if all(gen(x) != gen(y) for y in out): out.append(x)
    return out if len(out) == n else None

# ---------- 1. Anecdotes : « De quelle plante parle-t-on ? » ----------
def trahit(l, t):
    """la curiosité laisse-t-elle deviner la plante (éponyme, épithète, mot du nom commun) ?"""
    n = norm(t)
    mots = [gen(l)[:5]] + [w[:5] for w in l.split(' ')[1:] if len(w) >= 5] + [w[:5] for w in re.findall(r"[a-zà-ÿ]{5,}", norm(nom(l)))]
    return any(m and m.lower() in n for m in mots)

for l, (t, u) in CU.items():
    if l not in S or trahit(l, t): continue
    e = A.get(l, {})
    if e.get('reserve'): continue
    if facile(l):
        d = tire([x for x in S if x != l and fam(x) != fam(l) and facile(x) and typ(x) == typ(l)], 3)
        niv = 'simple'
    else:
        d = tire([x for x in S if x != l and typ(x) == typ(l) and (fam(x) == fam(l) or not facile(x))], 3)
        niv = 'difficile'
    if not d: continue
    c, b = melange(l, d)
    fmt = 'images' if R.random() < .35 else 'qcm'
    ajoute({'theme': 'Anecdotes', 'niveau': niv, 'format': fmt, 'plantes': True, 'organe': '',
            'question': 'De quelle plante parle-t-on ?' if fmt == 'qcm' else 'Laquelle de ces plantes cache cette histoire ?',
            'texte': t, 'choix': c, 'bonne': b, 'plante': l,
            'explication': f"C'est : {nom(l)}. " + cap(re.sub('^' + re.escape(nom(l)) + r'\s*:\s*', '', AS.get(l, ''))),
            'sources': [u], 'origine': 'générée'})

# ---------- 2. Milieux, feuillage, toxicité, origine (fiches sourcées) ----------
Ms = {l: v for l, v in M.items() if v.get('certitude') == 'source' and l in S}
def milieu(theme, question, cible, contre, expl, niv_f=None, organe='', meme_type=True, n=14):
    cs = [l for l, v in Ms.items() if cible(v)]
    R.shuffle(cs)
    k = 0
    for l in cs:
        if k >= n: break
        d = tire([x for x, v in Ms.items() if contre(v) and x != l and (not meme_type or typ(x) == typ(l) or {typ(x), typ(l)} <= {'arbre', 'arbuste'})], 3)
        if not d: continue
        tous_faciles = facile(l) and all(facile(x) for x in d)
        niv = niv_f(l, d) if niv_f else ('simple' if tous_faciles else 'difficile')
        c, b = melange(l, d)
        ajoute({'theme': theme, 'niveau': niv, 'format': 'images', 'plantes': True, 'organe': organe,
                'question': question, 'choix': c, 'bonne': b, 'plante': l,
                'explication': expl(l, d), 'sources': Ms[l]['sources'][:2], 'origine': 'générée'})
        k += 1

liste = lambda d: ', '.join(nom(x) for x in d)
milieu('Milieux', "Laquelle de ces plantes se plaît à l'ombre ?",
       lambda v: v['expo'] == 'Mi-ombre à ombre', lambda v: v['expo'] == 'Soleil',
       lambda l, d: f"{nom(l)} pousse à la mi-ombre ou à l'ombre. {liste(d)} : plein soleil.")
milieu('Milieux', "Laquelle de ces plantes pousse en sol gorgé d'eau ?",
       lambda v: v['humidite'] in ('Humide', 'Aquatique'), lambda v: v['humidite'] == 'Sec',
       lambda l, d: f"{nom(l)} aime les sols humides, voire l'eau. {liste(d)} : sols secs.", meme_type=False)
milieu('Milieux', "Laquelle de ces plantes supporte le mieux la sécheresse ?",
       lambda v: v['humidite'] == 'Sec', lambda v: v['humidite'] in ('Humide', 'Frais à humide', 'Aquatique'),
       lambda l, d: f"{nom(l)} se contente d'un sol sec. {liste(d)} : sols frais à humides.", meme_type=False)
milieu('Milieux', "Laquelle de ces plantes exige un sol acide ?",
       lambda v: v['ph'] == 'Acide', lambda v: v['ph'] == 'Neutre à alcalin',
       lambda l, d: f"{nom(l)} veut un sol acide (terre de bruyère). {liste(d)} : sols neutres à calcaires.", meme_type=False)
milieu('Milieux', "Laquelle de ces plantes aime les sols calcaires ?",
       lambda v: v['ph'] == 'Neutre à alcalin', lambda v: v['ph'] == 'Acide',
       lambda l, d: f"{nom(l)} pousse en sol neutre à calcaire. {liste(d)} : sols acides.", meme_type=False, n=8)
CONIF = {'Pinaceae', 'Cupressaceae', 'Taxaceae', 'Araucariaceae', 'Sciadopityaceae', 'Podocarpaceae', 'Cephalotaxaceae'}
milieu('Saisons', "Laquelle de ces plantes garde ses feuilles en hiver ?",
       lambda v: v['feuillage'] == 'persistant', lambda v: v['feuillage'] == 'caduc',
       lambda l, d: f"{nom(l)} a un feuillage persistant. {liste(d)} : feuillage caduc.", organe='Feuillage', n=12)
milieu('Saisons', "Laquelle de ces plantes perd ses feuilles en hiver ?",
       lambda v: v['feuillage'] == 'caduc', lambda v: v['feuillage'] == 'persistant',
       lambda l, d: f"{nom(l)} a un feuillage caduc. {liste(d)} : feuillage persistant.",
       niv_f=lambda l, d: 'piege' if fam(l) in CONIF else ('simple' if facile(l) else 'difficile'), organe='Feuillage', n=10)
milieu('Fruits et toxicité', "Laquelle de ces plantes est très toxique si on l'ingère ?",
       lambda v: v['toxicite'] == 'très toxique', lambda v: v['toxicite'] == 'non toxique',
       lambda l, d: f"{nom(l)} : très toxique ({Ms[l]['toxicite_parties'] or 'toutes les parties'}). Les trois autres ne sont pas toxiques.", meme_type=False, n=9)
milieu('Écologie', "Laquelle de ces plantes est indigène en France ?",
       lambda v: v['indigene'] == 'indigène en France', lambda v: v['indigene'] == 'exotique',
       lambda l, d: f"{nom(l)} est indigène en France. " + ' ; '.join(f"{nom(x)} : {Ms[x]['origine']}" for x in d) + '.',
       niv_f=lambda l, d: 'piege' if any(LVL[x] == 0 for x in d) else ('simple' if facile(l) else 'difficile'), n=14)

# ---------- 3. Familles ----------
STABLES = set('Rosaceae Fagaceae Betulaceae Pinaceae Cupressaceae Lamiaceae Asteraceae Fabaceae Ranunculaceae Apiaceae '
              'Brassicaceae Poaceae Oleaceae Ericaceae Iridaceae Salicaceae Rutaceae Geraniaceae Papaveraceae Boraginaceae '
              'Cornaceae Hydrangeaceae Myrtaceae Magnoliaceae Juglandaceae Ulmaceae Moraceae Vitaceae Arecaceae Cyperaceae '
              'Juncaceae Euphorbiaceae Malvaceae Sapindaceae Araliaceae Taxaceae'.split())
SURPRISE = {'Tilia': 'Malvaceae', 'Acer': 'Sapindaceae', 'Aesculus': 'Sapindaceae', 'Carpinus': 'Betulaceae',
            'Hedera': 'Araliaceae', 'Sorbus': 'Rosaceae', 'Prunus': 'Rosaceae', 'Malus': 'Rosaceae', 'Crataegus': 'Rosaceae',
            'Robinia': 'Fabaceae', 'Cercis': 'Fabaceae', 'Wisteria': 'Fabaceae', 'Ulex': 'Fabaceae', 'Fraxinus': 'Oleaceae',
            'Syringa': 'Oleaceae', 'Ligustrum': 'Oleaceae', 'Corylus': 'Betulaceae', 'Alnus': 'Betulaceae', 'Lavandula': 'Lamiaceae',
            'Rosmarinus': 'Lamiaceae', 'Salvia': 'Lamiaceae', 'Pittosporum': None}
LOOK = collections.defaultdict(set)
for a, b in D['PAIRS']: LOOK[a].add(b); LOOK[b].add(a)
fr = lambda f: FI[f][0] if f in FI else f
fr_court = lambda f: re.sub(r'\s*\(.*\)', '', fr(f))
phrase = lambda t: (t.strip().rstrip('.') + '.') if t.strip() else ''
traits = lambda f: phrase(FI[f][1][0].lower() + FI[f][1][1:]) if f in FI and FI[f][1] else ''
vus = collections.Counter()
especes = [l for l in S if fam(l) in STABLES]
R.shuffle(especes)
for l in especes:
    f = fam(l)
    if vus[gen(l)] or (not facile(l) and gen(l) not in SURPRISE): continue
    sosies = [fam(x) for x in LOOK[l] if fam(x) in STABLES and fam(x) != f]
    autres = [x for x in sorted(STABLES - {f}) if x not in sosies]
    R.shuffle(autres)
    d = (sosies[:1] + autres)[:3]
    c, b = melange(fr(f), [fr(x) for x in d])
    if gen(l) in SURPRISE and SURPRISE[gen(l)] == f: niv = 'piege'
    elif sosies: niv = 'piege'
    elif LVL[l] == 0: niv = 'simple'
    else: niv = 'difficile'
    vus[gen(l)] += 1
    ajoute({'theme': 'Familles', 'niveau': niv, 'format': 'qcm', 'plantes': False,
            'question': f"{nom(l)} : à quelle famille appartient cette plante ?", 'choix': c, 'bonne': b, 'plante': l,
            'explication': f"{nom(l)} fait partie des {fr_court(f)}." + (f" Traits fréquents dans la famille : {traits(f)}" if traits(f) else ''), 'sources': [], 'origine': 'générée'})
# « Laquelle de ces plantes est une Rosacée ? » en images, avec un sosie d'une autre famille quand il existe
for f in ['Rosaceae', 'Fabaceae', 'Lamiaceae', 'Oleaceae', 'Betulaceae', 'Fagaceae', 'Asteraceae', 'Ericaceae', 'Malvaceae', 'Sapindaceae', 'Ranunculaceae', 'Apiaceae']:
    membres = [l for l in S if fam(l) == f]
    R.shuffle(membres)
    k = 0
    for l in membres:
        if k >= 2: break
        sos = [x for x in LOOK[l] if fam(x) != f]
        d = tire(sos[:1] + [x for x in S if fam(x) != f and typ(x) == typ(l) and fam(x)], 3)
        if not d: continue
        c, b = melange(l, d)
        ajoute({'theme': 'Familles', 'niveau': 'piege' if sos else ('simple' if facile(l) and LVL[l] == 0 else 'difficile'),
                'format': 'images', 'plantes': True, 'organe': '',
                'question': f"Laquelle de ces plantes appartient à la famille des {fr_court(f)} ?", 'choix': c, 'bonne': b, 'plante': l,
                'explication': f"{nom(l)} fait partie des {fr_court(f)}." + (f" Traits fréquents dans la famille : {traits(f)}" if traits(f) else ''),
                'sources': [], 'origine': 'générée'})
        k += 1

# ---------- 4. Floraisons (deux sources concordantes : fiche de genre et relecture de l'espèce) ----------
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
def mois_genre(l):
    g = D['GD'].get(gen(l))
    if not g: return None
    m = re.match(r"\s*([A-Za-zéû]+)\s+(?:à|-)\s+([a-zéû]+)", g[3])
    if not m: return None
    try: a, b = MOIS.index(m.group(1).lower()), MOIS.index(m.group(2).lower())
    except ValueError: return None
    return {(a + i) % 12 + 1 for i in range((b - a) % 12 + 1)}
def plage(m):
    """« de mars à mai » : mois de floraison, en partant de la fin de l'été pour garder l'hiver d'un seul tenant"""
    o = sorted(m, key=lambda x: (x - 9) % 12)
    return f"en {MOIS[o[0] - 1]}" if len(o) == 1 else f"de {MOIS[o[0] - 1]} à {MOIS[o[-1] - 1]}"
SAISON = {'En hiver': {12, 1, 2}, 'Au printemps': {3, 4, 5}, 'En été': {6, 7, 8}, 'En automne': {9, 10, 11}}
flo = {}
for l in S:
    e = A.get(l, {})
    m1, m2 = set(e.get('floraison') or []), mois_genre(l)
    if m1 and m2 and len(m1 & m2) >= max(1, min(len(m1), len(m2)) - 1) and typ(l) != 'graminée':
        flo[l] = m1 & m2 if len(m1 & m2) >= 2 else m1
hiver = [l for l, m in flo.items() if m <= {11, 12, 1, 2, 3} and m & {12, 1, 2}]
ete = [l for l, m in flo.items() if m <= {6, 7, 8, 9}]
R.shuffle(hiver)
for l in hiver[:12]:
    d = tire([x for x in ete if typ(x) == typ(l) or {typ(x), typ(l)} <= {'arbre', 'arbuste'}], 3)
    if not d: continue
    c, b = melange(l, d)
    ajoute({'theme': 'Saisons', 'niveau': 'piege' if facile(l) else 'difficile', 'format': 'images', 'plantes': True, 'organe': 'Fleurs',
            'question': "Laquelle de ces plantes fleurit en plein hiver ?", 'choix': c, 'bonne': b, 'plante': l,
            'explication': f"{nom(l)} fleurit {plage(flo[l])}. Les trois autres fleurissent en été.",
            'sources': (A.get(l, {}).get('sources') or [])[:1], 'origine': 'générée'})
une = [(l, s) for l, m in flo.items() for s, ms in SAISON.items() if m <= ms]
R.shuffle(une)
k = collections.Counter()
for l, s in une:
    if k[s] >= 5: continue
    piege = (s in ('En hiver', 'En automne')) and facile(l) or gen(l) in ('Hedera', 'Hamamelis', 'Colchicum')
    ajoute({'theme': 'Saisons', 'niveau': 'piege' if piege else ('simple' if facile(l) else 'difficile'), 'format': 'qcm', 'plantes': False,
            'question': f"{nom(l)} : quand fleurit cette plante ?", 'choix': list(SAISON), 'bonne': list(SAISON).index(s), 'plante': l,
            'explication': f"{nom(l)} fleurit {plage(flo[l])}.",
            'sources': (A.get(l, {}).get('sources') or [])[:1], 'origine': 'générée'})
    k[s] += 1

# ---------- 5. Noms latins ----------
par_genre = collections.defaultdict(list)
for l in S:
    if ' ' in l and '×' not in l: par_genre[gen(l)].append(l)
cands = [l for l in S if ' ' in l and '×' not in l and "'" not in l]
R.shuffle(cands)
ns = nd = 0
for l in cands:
    if len(par_genre[gen(l)]) >= 4 and nd < 14:
        d = tire([x for x in par_genre[gen(l)] if x != l], 3) or None
        d = [x for x in par_genre[gen(l)] if x != l]
        R.shuffle(d); d = d[:3]; niv = 'difficile'; nd += 1
    elif facile(l) and ns < 10:
        d = tire([x for x in cands if typ(x) == typ(l) and fam(x) != fam(l)], 3); niv = 'simple'; ns += 1
    else: continue
    if not d or len(d) < 3: continue
    c, b = melange(l, d)
    ajoute({'theme': 'Noms latins', 'niveau': niv, 'format': 'qcm', 'plantes': False, 'latin': True,
            'question': f"Quel est le nom scientifique de : {nom(l)} ?", 'choix': c, 'bonne': b, 'plante': l,
            'explication': f"{nom(l)} : {l}." + (f" Les autres sont des espèces voisines du même genre : {', '.join(nom(x) for x in d)}." if niv == 'difficile' else ''),
            'sources': [], 'origine': 'générée'})

# ---------- questions rédigées et sourcées ----------
RED = json.load(open(os.path.join(RAC, 'donnees', 'defis-redigees.json'), encoding='utf8'))
THEMES = {'Idées reçues et faux-amis': 'Idées reçues', 'Vocabulaire et morphologie': 'Vocabulaire', 'Saisons et cycles': 'Saisons',
          'Usages, histoire et culture': 'Usages et histoire', 'Écologie et jardin': 'Écologie'}
for q in RED:
    q = dict(q); q['origine'] = 'rédigée'; q['theme'] = THEMES.get(q['theme'], q['theme'])
    q.setdefault('plantes', q['format'] == 'images')
    if q['plantes']:
        assert all(c in S for c in q['choix']), q['question']
        q['plante'] = q['choix'][q['bonne']]
    POOL.append(q)

# ---------- questions écartées après relecture ----------
cle = lambda q: q['question'] + '|' + q.get('texte', '') + '|' + ','.join(q['choix'])
EXCL = os.path.join(RAC, 'donnees', 'defis-exclues.json')
EX = set(json.load(open(EXCL, encoding='utf8'))) if os.path.exists(EXCL) else set()
POOL = [q for q in POOL if cle(q) not in EX]

# ---------- répartition en 30 séries ----------
# thèmes servis à parts à peu près égales ; les noms latins un peu moins souvent
POIDS = {'Noms latins': 2}
def repartir(pool):
    reste = list(pool)
    R.shuffle(reste)
    # les rédigées d'abord : elles sont les plus variées
    reste.sort(key=lambda q: 0 if q['origine'] == 'rédigée' else 1)
    usage_theme = collections.Counter()
    plantes_recent = collections.deque(maxlen=3)
    jours, deja = [], set()
    for j in range(JOURS):
        serie, themes, plantes = [], collections.Counter(), set()
        recents = set().union(*plantes_recent) if plantes_recent else set()
        for niv in GABARIT:
            def ok(q, strict=True):
                if q['niveau'] != niv: return False
                if any(x['question'] == q['question'] for x in serie): return False   # pas deux fois le même modèle de question
                if serie and serie[-1]['theme'] == q['theme']: return False
                if themes[q['theme']] >= (2 if strict else 3): return False
                if q.get('plante') and (q['plante'] in plantes or (strict and q['plante'] in recents)): return False
                if q['origine'] == 'générée' and q.get('plante') in deja: return False
                if strict and q['format'] == 'images' and sum(x['format'] == 'images' for x in serie) >= 5: return False
                if q['theme'] == 'Anecdotes' and themes['Anecdotes'] >= 1 and strict: return False
                return True
            choix = [q for q in reste if ok(q)] or [q for q in reste if ok(q, False)]
            if not choix and niv == 'piege':   # plus de piège disponible : une question difficile à la place
                niv = 'difficile'; choix = [q for q in reste if ok(q)] or [q for q in reste if ok(q, False)]
            if not choix: raise SystemExit(f'jour {j + 1} : plus de question « {niv} »')
            # équilibre des thèmes sur l'ensemble : préfère le thème le moins servi, rédigées en priorité
            choix.sort(key=lambda q: (usage_theme[q['theme']] * POIDS.get(q['theme'], 1), q['origine'] != 'rédigée'))
            q = choix[0]
            reste.remove(q); serie.append(q); themes[q['theme']] += 1; usage_theme[q['theme']] += 1
            if q.get('plante'): plantes.add(q['plante'])
            if q['origine'] == 'générée': deja.add(q.get('plante'))
        plantes_recent.append(plantes)
        jours.append(serie)
    return jours, reste

jours, reste = repartir(POOL)
champs = ['theme', 'niveau', 'format', 'question', 'texte', 'choix', 'bonne', 'explication', 'sources', 'organe', 'plantes', 'latin', 'plante']
sortie = [[{k: q[k] for k in champs if k in q and q[k] not in ('', None, [])} for q in s] for s in jours]
nb = collections.Counter(q['niveau'] for s in jours for q in s)
print('réserve de questions :', len(POOL), dict(collections.Counter(q['origine'] for q in POOL)))
print('par niveau (réserve) :', dict(collections.Counter(q['niveau'] for q in POOL)))
print('séries :', len(jours), '× 10 ; niveaux', dict(nb), '; formats', dict(collections.Counter(q['format'] for s in jours for q in s)))
print('thèmes :', dict(collections.Counter(q['theme'] for s in jours for q in s).most_common()))
print('rédigées utilisées :', sum(q['origine'] == 'rédigée' for s in jours for q in s), '/', len(RED), '; non utilisées :', len(reste))
if '--ecrire' in sys.argv:
    json.dump({'_lisez_moi': "Défi du jour : 30 séries de 10 questions (QCM ou 4 images), générées par outils/defis_questions.py. "
               "Le jour n de la série est (jours écoulés depuis le 1er janvier 2026, heure de Paris) modulo 30.",
               'series': sortie}, open(os.path.join(RAC, 'donnees', 'defis-questions.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    p = os.path.join(RAC, 'index.html')
    h = open(p, encoding='utf8').read()
    js = 'const DQ=' + json.dumps(sortie, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';'
    h, n = re.subn(r'^const DQ=.*;$', lambda m: js, h, count=1, flags=re.M)
    assert n == 1, 'const DQ= introuvable dans index.html'
    open(p, 'w', encoding='utf8').write(h)
    print('donnees/defis-questions.json et index.html mis à jour')
