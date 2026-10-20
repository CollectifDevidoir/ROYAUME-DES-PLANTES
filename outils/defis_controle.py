#!/usr/bin/env python3
"""Contrôle de la banque de questions du Défi du jour : alertes automatiques, score et verdict par question.

Ne modifie ni les questions, ni les séries, ni index.html : le résultat est écrit à part,
dans donnees/defis-banque-controle.json (une entrée par question candidate) et donnees/defis-banque-controle.md.

Usage (depuis la racine du dépôt) :
  NODE_PATH=$(npm root -g) node outils/defis_extraire.js app.json
  python3 outils/defis_questions.py app.json --banque banque.json
  python3 outils/defis_controle.py app.json banque.json

Ce que le contrôle SAIT faire : erreurs certaines (structure, doublons, réponses recalculées sur les données,
deux bonnes réponses possibles, synonymes en distracteur), indices probables (nom, origine, type de plante),
explications qui répètent la réponse, réponses devinables, photos de repli.
Ce qu'il NE FAIT PAS : consulter les sources, juger l'intérêt pédagogique, vérifier la botanique. Un verdict
« conserver » veut dire « aucune alerte automatique », jamais « question validée » : toute question reste à relire.
"""
import json, re, sys, os, hashlib, unicodedata, collections
from urllib.parse import urlparse

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
APP = json.load(open(sys.argv[1], encoding='utf8'))
BANQUE = json.load(open(sys.argv[2], encoding='utf8'))
SORTIE = os.environ.get('DEFIS_SORTIE') or os.path.join(RAC, 'donnees')   # dossier des résultats (par défaut donnees/)
lire = lambda f: json.load(open(os.path.join(RAC, 'donnees', f), encoding='utf8'))
PHOTOS = lire('photos.json')['especes']
MILIEUX = lire('milieux-especes.json')['especes']
SYN = lire('synonymes.json')
LIGNE = lire('defis-questions.json')['series']

S = {s[0]: s for s in APP['S']}
FAM, FI, LVL, CU = APP['FAM'], APP['FI'], APP['lvl'], APP['CU']
PAIRS = collections.defaultdict(set)
for a, b in APP['PAIRS']: PAIRS[a].add(b); PAIRS[b].add(a)
gen = lambda l: l.split(' ')[0]
epi = lambda l: l.split(' ')[1] if ' ' in l else ''
nom = lambda l: S[l][1] if l in S else l
typ = lambda l: {'arbuste': 'arbre'}.get(S[l][2], S[l][2]) if l in S else ''
fam = lambda l: FAM.get(gen(l), '')
fr = lambda f: FI[f][0] if f in FI else f
norm = lambda t: unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()

# ---------- règles : code -> (certitude, poids, description) ----------
# certitude « certaine » : détectable sans jugement ; « probable » : indice statistique ou lexical, à confirmer à la relecture ;
# « info » : à savoir, ne pénalise presque pas. Poids : points retirés au score (sur 100).
REGLES = {
 'STRUCTURE':        ('certaine', 100, "choix mal formés (pas 4 choix distincts, bonne hors liste, énoncé ou explication vide)"),
 'DOUBLON':          ('certaine', 100, "même énoncé et même bonne réponse qu'une autre candidate"),
 'DOUBLON_GENRE':    ('certaine', 100, "plusieurs questions de famille sur le même genre : on n'en garde qu'une (la mieux notée)"),
 'REPONSE_RECALCULEE': ('certaine', 100, "la bonne réponse ne correspond pas aux données de l'appli, recalculées indépendamment"),
 'DEUX_BONNES':      ('certaine', 100, "un distracteur est aussi une bonne réponse (même famille, ou synonyme de la bonne espèce)"),
 'FORMULATION_MOIS': ('certaine', 0, "« de avril », « de août », « de octobre » : élision à corriger mécaniquement (non pénalisé : correction triviale)"),
 'INDICE_NOM':       ('probable', 25, "le nom français de la bonne réponse laisse lire le genre ou l'épithète latine"),
 'INDICE_ORIGINE':   ('probable', 20, "seule la bonne réponse n'a pas de nom exotique (Japon, japonica…) : on la trouve par élimination"),
 'DISTRACTEURS_FACILES': ('probable', 20, "choix de ports très différents (arbre, graminée, vivace…) ou familles sans rapport avec la plante"),
 'EXPLICATION_PAUVRE': ('probable', 20, "l'explication ne fait que reformuler la réponse (rien de transférable à retenir)"),
 'REPONSE_DEVINABLE': ('probable', 25, "réponse la plus fréquente du modèle (printemps ou été : 97 % des réponses « quand fleurit »)"),
 'SECURITE_TOXICITE': ('probable', 20, "affirme qu'une plante « n'est pas toxique » ou comestible : formulation de sécurité à relire"),
 'SOURCE_ABSENTE':   ('probable', 15, "question sourcée par nature (curiosité, milieu, rédigée) sans aucun lien"),
 'PHOTO_REPLI':      ('probable', 10, "une des plantes n'a pas de photo dans l'index : repli sur Wikipédia, rendu non garanti"),
 'PHOTO_ORGANE':     ('info', 5, "l'organe demandé (fleurs, fruits, feuillage) n'a pas de photo dédiée pour toutes les plantes : photo générale à la place"),
 'PIEGE_A_CONFIRMER': ('info', 5, "étiquette « piège » posée par le générateur, sans confusion documentée dans PAIRS"),
 'ANECDOTE_LOCALE':  ('info', 5, "anecdote liée à un lieu étranger précis : peu transférable (à juger)"),
 'SURREPRESENTEE':   ('info', 10, "la plante est déjà la bonne réponse de 3 questions mieux notées"),
 'ENONCE_VOISIN':    ('info', 5, "même plante et énoncé très proche d'une autre rédigée : risque de redite"),
 'SOURCE_HORS_LISTE': ('info', 0, "domaine de la source absent de la liste de références usuelles (ne dit rien de sa fiabilité)"),
}
POIDS = {k: v[1] for k, v in REGLES.items()}
BLOQUANTES = {k for k, v in REGLES.items() if v[0] == 'certaine' and v[1] >= 100}
SOURCES_USUELLES = {'powo.science.kew.org', 'taxref.mnhn.fr', 'inpn.mnhn.fr', 'fr.wikipedia.org', 'en.wikipedia.org', 'rhs.org.uk',
                    'bsbi.org', 'treesandshrubsonline.org', 'plants.ces.ncsu.edu', 'ncbi.nlm.nih.gov', 'gbif.org', 'tela-botanica.org',
                    'worldfloraonline.org', 'theplantlist.org', 'plantnet.org', 'temperate.theferns.info', 'floraveg.eu', 'mnhn.fr'}

def modele(q):
    t, k = q['theme'], q['question']
    if q['origine'] == 'rédigée': return 'redigee'
    if t == 'Anecdotes': return 'anecdote_' + q['format']
    if t == 'Familles': return 'famille_' + q['format']
    if t == 'Noms latins': return 'nom_latin_' + ('genre' if q['niveau'] == 'difficile' else 'simple')
    for m, mot in [('milieu_ombre', "plaît à l'ombre"), ('milieu_eau', 'gorgé'), ('milieu_secheresse', 'sécheresse'), ('milieu_acide', 'acide'),
                   ('milieu_calcaire', 'calcaires'), ('feuillage_persistant', 'garde ses feuilles'), ('feuillage_caduc', 'perd ses feuilles'),
                   ('toxicite', 'très toxique'), ('indigene', 'indigène'), ('floraison_hiver', 'plein hiver'), ('floraison_saison', 'quand fleurit')]:
        if mot in k: return m
    return 'autre'

# ---------- vérification indépendante des modèles « milieu » sur milieux-especes.json ----------
PRED = {  # modèle : (propriété, valeurs de la bonne réponse, valeurs des distracteurs)
 'milieu_ombre': ('expo', {'Mi-ombre à ombre'}, {'Soleil'}),
 'milieu_eau': ('humidite', {'Humide', 'Aquatique'}, {'Sec'}),
 'milieu_secheresse': ('humidite', {'Sec'}, {'Humide', 'Frais à humide', 'Aquatique'}),
 'milieu_acide': ('ph', {'Acide'}, {'Neutre à alcalin'}),
 'milieu_calcaire': ('ph', {'Neutre à alcalin'}, {'Acide'}),
 'feuillage_persistant': ('feuillage', {'persistant'}, {'caduc'}),
 'feuillage_caduc': ('feuillage', {'caduc'}, {'persistant'}),
 'toxicite': ('toxicite', {'très toxique'}, {'non toxique'}),
 'indigene': ('indigene', {'indigène en France'}, {'exotique'}),
}
def recalcule(q, m):
    """None si le modèle n'est pas recalculable ; True/False sinon."""
    bonne, autres = q['choix'][q['bonne']], [c for i, c in enumerate(q['choix']) if i != q['bonne']]
    if m in PRED:
        prop, ok_b, ok_d = PRED[m]
        v = lambda l: (MILIEUX.get(l) or {}).get(prop)
        return v(bonne) in ok_b and all(v(c) in ok_d for c in autres)
    if m.startswith('famille_'):
        if q['format'] == 'qcm': return bonne == fr(fam(q['plante']))
        f = re.sub(r'^.*famille des ', '', q['question']).rstrip(' ?')
        cible = [x for x in FI if re.sub(r'\s*\(.*\)', '', fr(x)) == f]
        return bool(cible) and fam(bonne) == cible[0] and all(fam(c) != cible[0] for c in autres)
    if m.startswith('nom_latin'): return bonne == q.get('plante')
    if m.startswith('anecdote'): return CU.get(bonne, [''])[0] == q.get('texte')
    return None

# ---------- indices dans les noms ----------
GEO = {'japonic': 'japon', 'sinens': 'chin', 'chinens': 'chin', 'american': 'americ', 'virgini': 'virgini', 'caucas': 'caucas',
       'orientalis': 'orient', 'canaden': 'canad', 'europae': 'europ', 'himalay': 'himalay', 'mexican': 'mexi', 'californ': 'californ',
       'korean': 'core', 'sibiric': 'siber', 'tibet': 'tibet', 'australis': 'austral', 'colchic': 'colchid', 'persic': 'pers',
       'nipponic': 'japon', 'manchur': 'mandchou', 'cretic': 'cret', 'hispanic': 'espagn', 'italic': 'ital', 'gallic': 'franc'}
EXOT_FR = re.compile(r'(japon|chin|americ|virgini|caucas|canad|himalaya|core|asie|mexi|pers|siber|californ|peru|chili|austral|nouvelle|inde|orient|turqu|maroc|crim|canarie|mandchou|cap\b)')
def epi_geo(l):
    e = epi(l)
    return next((v for k, v in GEO.items() if e.startswith(k)), None)
def exotique(l):
    return bool(epi_geo(l) or EXOT_FR.search(norm(nom(l))))
def indice_nom(q, m):
    l = q.get('plante')
    if not l or l not in S: return False
    n = norm(nom(l))
    if m == 'nom_latin_simple': return gen(l)[:5].lower() in n
    if m == 'nom_latin_genre':
        g = epi_geo(l); autres = [c for i, c in enumerate(q['choix']) if i != q['bonne']]
        return bool(g and g in n and not any(epi_geo(c) == g for c in autres))
    return False

MOTS_VIDES = set("de du des la le les un une et en à au aux d l qu ce cette pour par sur sous est sont son sa ses leur leurs plus pas ne que qui comme dans".split())
def info_nouvelle(q):
    """caractères de l'explication qui ne reprennent ni le nom de la bonne réponse ni l'énoncé"""
    e = q['explication']
    ref = ' '.join([q['question'], q.get('texte', '')] + ([q['plante'], nom(q['plante'])] if q.get('plante') in S else [q['choix'][q['bonne']]]))
    deja = set(re.findall(r"[a-zà-ÿœ']+", norm(ref).replace('-', ' ')))
    mots = [w for w in re.findall(r"[a-zà-ÿœ]+", norm(e)) if w not in deja and w not in MOTS_VIDES]
    return sum(len(w) for w in mots)

def jacc(a, b):
    a, b = set(re.findall(r'\w{4,}', norm(a))), set(re.findall(r'\w{4,}', norm(b)))
    return len(a & b) / max(1, len(a | b))

def fait_id(q):
    rep = q['choix'][q['bonne']]
    return hashlib.sha1((q['question'] + '|' + q.get('texte', '') + '|' + rep).encode('utf8')).hexdigest()[:10]

# ---------- candidates : banque générée + questions en ligne (version publiée prioritaire) ----------
EN_LIGNE = {}
for jour, serie in enumerate(LIGNE):
    for pos, q in enumerate(serie):
        EN_LIGNE[fait_id(q)] = (jour, pos + 1, q)
cands, vus = [], set()
for q in BANQUE:
    i = fait_id(q)
    if i in EN_LIGNE:
        jour, pos, live = EN_LIGNE[i]
        q = dict(q, choix=live['choix'], bonne=live['bonne'], explication=live.get('explication', q['explication']), serie=jour, position=pos)
    q = dict(q, id=i); cands.append(q); vus.add(i)
for i, (jour, pos, live) in EN_LIGNE.items():   # questions en ligne que le générateur ne reproduit pas
    if i not in vus:
        q = dict(live, id=i, origine='en ligne', niveau=live['niveau'], serie=jour, position=pos)
        q.setdefault('plantes', live['format'] == 'images'); cands.append(q)

# ---------- alertes par question ----------
def controle(q):
    f = []
    m = modele(q) if q['origine'] in ('générée', 'rédigée') else ('redigee' if q.get('plantes') or q.get('theme') else 'en_ligne')
    ch, b = q['choix'], q['bonne']
    if len(ch) != 4 or len(set(ch)) != 4 or not (0 <= b < 4) or not q['question'].strip() or not q.get('explication', '').strip(): f.append('STRUCTURE')
    images = q['format'] == 'images'
    plantes = images or q.get('plantes')
    autres = [c for i, c in enumerate(ch) if i != b]
    if q['origine'] == 'générée':
        r = recalcule(q, m)
        if r is False: f.append('REPONSE_RECALCULEE')
    if plantes and all(c in S for c in ch):
        # deux bonnes réponses : un distracteur est un synonyme de la bonne espèce
        bon = ch[b]
        if any(c in SYN.get(bon, []) or bon in SYN.get(c, []) for c in autres): f.append('DEUX_BONNES')
        if images:
            manque = [c for c in ch if not (PHOTOS.get(c) and PHOTOS[c][5])]
            if manque: f.append('PHOTO_REPLI')
            elif q.get('organe') and not all(any(p[1] == q['organe'] for p in PHOTOS[c][5]) for c in ch): f.append('PHOTO_ORGANE')
        types = {typ(c) for c in ch}
        if len(types) > 1 and q['origine'] == 'générée': f.append('DISTRACTEURS_FACILES')   # les rédigées ont des distracteurs choisis à la main : pas jugées sur le port
        if m == 'indigene' and not exotique(ch[b]) and sum(exotique(c) for c in autres) >= 2: f.append('INDICE_ORIGINE')
    if m == 'famille_qcm':   # familles proposées sans rapport avec le port de la plante
        l = q.get('plante')
        if l in S:
            plausibles = sum(1 for c in autres if any(fr(x) == c and sum(1 for e in S if fam(e) == x and typ(e) == typ(l)) >= 2 for x in FI))
            if plausibles < 2 and 'DISTRACTEURS_FACILES' not in f: f.append('DISTRACTEURS_FACILES')
    if indice_nom(q, m): f.append('INDICE_NOM')
    if m == 'floraison_saison' and ch[b] in ('Au printemps', 'En été'): f.append('REPONSE_DEVINABLE')
    if re.search(r'de (avril|août|octobre)\b', q['explication']): f.append('FORMULATION_MOIS')
    if info_nouvelle(q) < 25 and 'STRUCTURE' not in f: f.append('EXPLICATION_PAUVRE')
    if re.search(r"ne sont pas toxiques|non toxique|sans danger|sans risque|comestible", q['explication'], re.I): f.append('SECURITE_TOXICITE')
    src = q.get('sources') or []
    if not src and (q['origine'] == 'rédigée' or m in ('anecdote_qcm', 'anecdote_images') or m.startswith('milieu') or m in ('indigene', 'toxicite', 'feuillage_persistant', 'feuillage_caduc')):
        f.append('SOURCE_ABSENTE')
    if src and any(urlparse(u).hostname and urlparse(u).hostname.replace('www.', '') not in SOURCES_USUELLES for u in src[:2]): f.append('SOURCE_HORS_LISTE')
    if q['niveau'] == 'piege' and q['origine'] == 'générée':
        l = q.get('plante')
        if not (m.startswith('famille') and l and any(fam(x) in {fam(c) for c in ch} for x in PAIRS.get(l, ()))): f.append('PIEGE_A_CONFIRMER')
    if re.search(r'Massachusetts|États-Unis|Californie|Texas|Oregon|Floride|Ontario|Australie|Nouvelle-Zélande|Afrique du Sud|Japon\b', q.get('texte', '')): f.append('ANECDOTE_LOCALE')
    return m, f

res = []
for q in cands:
    m, f = controle(q)
    res.append({'id': q['id'], 'theme': q['theme'], 'modele': m, 'origine': q['origine'], 'format': q['format'], 'niveau_suppose': q['niveau'],
                'difficulte_plante': LVL.get(q.get('plante')) if q.get('plante') else None, 'difficulte_mesuree': None,
                'en_ligne': 'serie' in q, 'serie': q.get('serie'), 'position': q.get('position'),
                'question': q['question'], 'texte': q.get('texte'), 'choix': q['choix'], 'bonne': q['bonne'], 'plante': q.get('plante'),
                'organe': q.get('organe'), 'explication': q['explication'], 'sources': q.get('sources', []), 'alertes': f})

# doublons de fait (même identifiant) et de genre (familles), énoncés voisins
par_id = collections.defaultdict(list)
for r in res: par_id[r['id']].append(r)
for L in par_id.values():
    for r in L[1:]: r['alertes'].append('DOUBLON')
def poids(r): return sum(POIDS[a] for a in r['alertes'])
prio = lambda r: (poids(r), not r['en_ligne'], r['origine'] != 'rédigée', r['format'] != 'qcm')
genres = collections.defaultdict(list)
for r in res:
    if r['modele'].startswith('famille_') and not (set(r['alertes']) & BLOQUANTES): genres[gen(r['plante'])].append(r)
for L in genres.values():
    for r in sorted(L, key=prio)[1:]: r['alertes'].append('DOUBLON_GENRE')
red = [r for r in res if r['origine'] == 'rédigée' and r['plante']]
for i, a in enumerate(red):
    for c in red[i + 1:]:
        if a['plante'] == c['plante'] and jacc(a['question'] + a['explication'], c['question'] + c['explication']) >= .3 and 'ENONCE_VOISIN' not in c['alertes']: c['alertes'].append('ENONCE_VOISIN')
parp = collections.defaultdict(list)
for r in res:
    if r['plante'] and not (set(r['alertes']) & BLOQUANTES): parp[r['plante']].append(r)
for L in parp.values():
    for r in sorted(L, key=prio)[3:]: r['alertes'].append('SURREPRESENTEE')

FAIBLE_INTERET = {'REPONSE_DEVINABLE', 'EXPLICATION_PAUVRE', 'INDICE_NOM', 'INDICE_ORIGINE'}
for r in res:
    a = set(r['alertes'])
    r['score'] = max(0, 100 - poids(r))
    r['verdict'] = 'écarter' if a & BLOQUANTES else ('revoir' if any(REGLES[x][0] == 'probable' for x in a) else 'conserver')
    r['interet'] = 'faible probable' if a & FAIBLE_INTERET else 'à juger'
    r['a_verifier'] = ['pédagogie (intérêt, distracteurs)'] + (['source (non consultée)'] if r['sources'] else []) + \
        (['botanique'] if r['origine'] == 'rédigée' or r['modele'].startswith(('famille', 'nom_latin', 'floraison')) else [])
    r['validation'] = 'en ligne, non relue ici' if r['en_ligne'] else 'non relue'
res.sort(key=lambda r: (['conserver', 'revoir', 'écarter'].index(r['verdict']), -r['score'], r['theme'], r['id']))

# ---------- sorties ----------
C = collections.Counter
resume = {'candidates': len(res), 'verdict': C(r['verdict'] for r in res), 'origine': C(r['origine'] for r in res),
          'alertes': C(a for r in res for a in r['alertes']), 'en_ligne': sum(r['en_ligne'] for r in res)}
json.dump({'_lisez_moi': "Résultat du contrôle automatique de la banque (outils/defis_controle.py). Aucune question n'est modifiée ni validée : "
           "« conserver » = aucune alerte automatique ; « revoir » = au moins un indice probable ; « écarter » = erreur certaine ou doublon. "
           "Les sources n'ont pas été consultées. difficulte_mesuree reste vide tant qu'aucune donnée de joueurs n'a été importée (outils/defis_calibrage.py).",
           'regles': {k: {'certitude': v[0], 'poids': v[1], 'description': v[2]} for k, v in REGLES.items()}, 'resume': resume, 'questions': res},
          open(os.path.join(SORTIE, 'defis-banque-controle.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

L = []
w = L.append
w('# Contrôle automatique de la banque du Défi du jour\n')
w(f"Généré par `outils/defis_controle.py`. **{len(res)} questions candidates** ({dict(resume['origine'])}), dont {resume['en_ligne']} déjà dans les séries en ligne.")
w("Aucune question n'est validée par ce contrôle : « conserver » signifie seulement « aucune alerte automatique ». Les sources n'ont pas été consultées.\n")
w('## Verdicts\n'); w('| Verdict | Questions |\n|---|---|')
for v in ('conserver', 'revoir', 'écarter'): w(f"| {v} | {resume['verdict'][v]} |")
w('\n## Alertes (nombre de questions concernées)\n'); w('| Alerte | Certitude | Questions | Signification |\n|---|---|---|---|')
for k, v in sorted(resume['alertes'].items(), key=lambda x: -x[1]): w(f"| {k} | {REGLES[k][0]} | {v} | {REGLES[k][2]} |")
w('\n## Par thème\n'); w('| Thème | conserver | revoir | écarter | total | intérêt faible probable |\n|---|---|---|---|---|---|')
for t in sorted({r['theme'] for r in res}):
    c = C(r['verdict'] for r in res if r['theme'] == t); n = sum(c.values())
    w(f"| {t} | {c['conserver']} | {c['revoir']} | {c['écarter']} | {n} | {sum(1 for r in res if r['theme'] == t and r['interet'] == 'faible probable')} |")
w('\n## Par modèle de génération\n'); w('| Modèle | conserver | revoir | écarter | total |\n|---|---|---|---|---|')
for t in sorted({r['modele'] for r in res}):
    c = C(r['verdict'] for r in res if r['modele'] == t); w(f"| {t} | {c['conserver']} | {c['revoir']} | {c['écarter']} | {sum(c.values())} |")
w('\n## Niveau supposé des questions à conserver\n'); w('| Niveau supposé | conserver | revoir |\n|---|---|---|')
for n in ('simple', 'piege', 'difficile'):
    c = C(r['verdict'] for r in res if r['niveau_suppose'] == n); w(f"| {n} | {c['conserver']} | {c['revoir']} |")
interne = lambda r: r['modele'].startswith(('famille', 'nom_latin', 'floraison'))
base = [r for r in res if r['verdict'] == 'conserver' and 'SURREPRESENTEE' not in r['alertes'] and r['interet'] == 'à juger']
w(f"\n## Base pour un défi de qualité (à relire, aucune n'est validée)\n\n{len(base)} questions sans alerte, sans plante déjà surreprésentée et sans intérêt faible probable : "
  f"**{sum(not interne(r) for r in base)}** sourcées ou rédigées, **{sum(interne(r) for r in base)}** reposant sur les tables internes (familles, noms latins, floraisons : botanique à vérifier).\n")
w('| Thème | simple | piège | difficile | total |\n|---|---|---|---|---|')
for t in sorted({r['theme'] for r in base}):
    c = C(r['niveau_suppose'] for r in base if r['theme'] == t); w(f"| {t} | {c['simple']} | {c['piege']} | {c['difficile']} | {sum(c.values())} |")
c = C(r['niveau_suppose'] for r in base); w(f"| **Total** | {c['simple']} | {c['piege']} | {c['difficile']} | {len(base)} |")
w("\nLe niveau supposé vient de la notoriété de la plante ou du modèle de génération ; il n'a pas été mesuré sur des joueurs (`difficulte_mesuree` est vide).")
open(os.path.join(SORTIE, 'defis-banque-controle.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n')
print('\n'.join(L))
