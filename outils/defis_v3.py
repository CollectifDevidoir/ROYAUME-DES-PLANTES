#!/usr/bin/env python3
"""Banque v3 et planning de 90 jours du Défi du jour, SANS toucher au jeu ni aux séries en ligne.

Entrées (lecture seule) :
  donnees/defis-banque-controle.json        1 991 candidates d'origine et alertes automatiques (outils/defis_controle.py)
  donnees/defis-v2/revision.json            relecture des 202 candidates examinées une à une (statut, niveau, piège, corrections, recoupement web)
  donnees/defis-v2/nouvelles-questions.json premier lot de 35 nouvelles questions
  donnees/defis-v3/nouvelles-lots.json      deuxième série de nouvelles questions (6 lots thématiques, recoupées par recherche web)
  donnees/photos.json, donnees/defis-questions.json (photos disponibles ; séries en ligne)
Sorties (nouveaux fichiers, jamais ceux de production), dans donnees/defis-v3/ :
  banque.json                    la banque : validées, nouvelles, et questions « conformes aux données de l'appli » (statut « donnees »)
  planning-90j.json              90 jours de 10 questions, avec sources, statut, niveau, règles relâchées
  planning-90j-format-DQ.json    les 90 séries au format de const DQ (pour l'intégration)
  planning-90j.md, bilan-90j.md  version lisible et bilan chiffré

Usage : python3 outils/defis_v3.py [AAAA-MM-JJ]   (premier jour du planning, défaut 2026-10-20)

Statuts : validee    = relue + fait recoupé par recherche web (pages citées non ouvertes une à une) ;
          donnees    = question générée à partir des données sourcées de l'appli (curiosités, milieux, familles, origines…),
                       cohérente avec ces données et passée par les contrôles automatiques, mais NON recoupée sur le web ;
          a_verifier / ecartee : jamais planifiées.
"""
import json, os, re, sys, random, unicodedata, hashlib, datetime, collections
from urllib.parse import urlparse

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DOSS = os.path.join(RAC, 'donnees', 'defis-v3')
lire = lambda *p: json.load(open(os.path.join(RAC, *p), encoding='utf8'))
norm = lambda t: unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
DEBUT = datetime.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else datetime.date(2026, 10, 20)
JOURS = 90
ECART = 28            # une question rejouée ne revient qu'au bout de 28 jours au moins
MAX_USAGES = 2        # 2 passages au plus par question (3 seulement en dernier recours, signalé)
cnt = collections.Counter
PLANIFIABLES = ('validee', 'relue', 'donnees')

ORIG = {q['id']: q for q in lire('donnees', 'defis-banque-controle.json')['questions']}
REV = lire('donnees', 'defis-v2', 'revision.json')
NOUV = lire('donnees', 'defis-v2', 'nouvelles-questions.json')['questions'] + lire('donnees', 'defis-v3', 'nouvelles-lots.json')['questions']
PHOTOS = lire('donnees', 'photos.json')['especes']
LIGNE = lire('donnees', 'defis-questions.json')['series']
fait_id = lambda q: hashlib.sha1((q['question'] + '|' + (q.get('texte') or '') + '|' + q['choix'][q['bonne']]).encode('utf8')).hexdigest()[:10]
EN_LIGNE = {fait_id(q): (j, p + 1) for j, s in enumerate(LIGNE) for p, q in enumerate(s)}
NOMS_FR = {}   # premier mot du nom français -> nom latin : sert à repérer les plantes citées dans un énoncé
for lat, v in PHOTOS.items():
    w = norm(v[1].split(' ')[0].replace("'", ' ').split(' ')[-1]) if v[1] else ''
    if len(w) >= 4 and w not in ('petit', 'petite', 'grand', 'grande', 'faux', 'fausse', 'vrai', 'commun', 'commune', 'blanc', 'blanche', 'rouge', 'jaune', 'bleu', 'bleue', 'noir', 'noire', 'des', 'herbe', 'fleur'):
        NOMS_FR.setdefault(w, set()).add(lat)

# ---------- sujets : une plante ou un thème ne revient pas deux fois dans un défi, ni plusieurs jours de suite ----------
SUJETS = {'ginkgo': r'ginkgo', 'metaséquoia': r'm[ée]tas[ée]quoia|metasequoia', 'séquoia': r's[ée]quoia', 'robinier': r'robinier|robinia|faux[- ]acacia',
  'lierre': r'lierre', 'cornouiller': r'cornouiller|cornus', 'saule': r'saule|salix', 'tilleul': r'tilleul|tilia', 'marron': r'marron|aesculus',
  'chêne': r'ch[êe]ne|quercus', 'érable': r'[ée]rable|acer ', 'sapin': r'sapin|abies', 'argousier': r'argousier|hippophae', 'if': r'\bif\b|taxus',
  'houx': r'houx', 'fragon': r'fragon|ruscus', 'prunellier': r'prunell|prunus spinosa', 'perce-neige': r'perce-neige|galanthus', 'pin': r'\bpins?\b|pinus',
  'hortensia': r'hortensia|hydrangea', 'laurier': r'laurier', 'jasmin': r'jasmin', 'mimosa': r'mimosa|acacia dealbata', 'noyer': r'noyer|juglone',
  'ortie': r'ortie', 'abeille': r'abeille', 'bambou': r'bambou', 'figue': r'figuier|figue', 'genévrier': r'gen[ée]vri|genièvre', 'arum': r'gouet|arum',
  'cyprès': r'cypr[èe]s', 'pomme de terre': r'pomme de terre', 'pissenlit': r'pissenlit', 'vanille': r'vanille', 'poivre': r'poivre', 'rhubarbe': r'rhubarbe',
  'noisetier': r'noisetier|corylus', 'fraise': r'fraise|fraisier', 'cerisier': r'cerisier|prunus serotina', 'tournesol': r'tournesol', 'tomate': r'tomate',
  'séquoia géant': r'sequoiadendron', 'rose': r'rosier|\brose\b|rosa ', 'clématite': r'cl[ée]matite', 'hêtre': r'h[êe]tre|fagus', 'orme': r'\borme', 'frêne': r'fr[êe]ne|fraxinus',
  'amandier/abricot': r'amandier|abricot|amygdal', 'safran/crocus': r'safran|crocus', 'tulipe': r'tulipe', 'gui': r'\bgui\b', 'quinquina': r'quinquina|quinine',
  'lavande': r'lavande|lavandula', 'bouleau': r'bouleau|betula', 'peuplier': r'peuplier|populus', 'sureau': r'sureau|sambucus', 'ail': r'\bail\b|\bails\b|allium',
  'muguet': r'muguet', 'colchique': r'colchique', 'ciguë': r'cigu[ëe]', 'lilas': r'lilas|syringa', 'pivoine': r'pivoine', 'olivier': r'olivier|olea ', 'vigne': r'\bvigne|vitis',
  'pommier': r'pommier|pomme\b', 'poirier': r'poirier', 'thuya': r'thuya', 'buis': r'\bbuis\b', 'menthe': r'menthe', 'thym': r'\bthym\b', 'sauge': r'sauge', 'châtaignier': r'ch[âa]taign',
  'orchidée': r'orchid', 'carotte': r'carotte', 'ronce': r'\bronce|mûre', 'mûrier': r'm[ûu]rier', 'aubépine': r'aub[ée]pine|crataegus', 'sorbier': r'sorbier|sorbus', 'lis': r'\blis\b|lilium',
  'bruyère': r'bruy[èe]re|calluna|erica', 'genêt': r'gen[êe]t|cytisus', 'ajonc': r'ajonc', 'fougère': r'foug[èe]re', 'mousse': r'\bmousses?\b', 'champignon': r'champignon|mycorhiz',
  'cactus': r'cactus|cactée', 'palmier': r'palmier', 'blé': r'\bbl[ée]\b|c[ée]r[ée]ale', 'riz': r'\briz\b', 'café': r'\bcaf[ée]', 'thé': r'\bth[ée]\b|camellia', 'cacao': r'cacao',
  'coton': r'\bcoton', 'chanvre': r'chanvre', 'lin': r'\blin\b', 'tabac': r'tabac', 'pavot': r'pavot|opium', 'violette': r'violette', 'primevère': r'primev[èe]re|coucou',
  'artichaut': r'artichaut', 'coquelicot': r'coquelicot', 'houblon': r'houblon|lupuline', 'courgette': r'courgette|concombre|p[ée]pon', 'baie vraie': r'vraie baie|baie vraie|bananier', 'cacahuète': r'cacahu[èe]te|arachide',
  'pastel': r'pastel|cocagne|isatis', 'garance': r'garance|alizarine', 'iris': r'\biris\b', 'nénuphar': r'n[ée]nuphar', 'roseau': r'roseau|roseli[èe]re', 'platane': r'platane', 'cytise': r'cytise|laburnum',
  'digitale': r'digitale', 'chicorée': r'chicor[ée]e', 'aconit': r'aconit', 'buddleia': r'buddle', 'cannelle': r'cannell', 'darwin': r'darwin', 'newton': r'newton', 'ricin': r'\bricin', 'belladone': r'belladone',
  'datura': r'datura', 'absinthe': r'absinthe|th[ue]yone', 'liège': r'li[èe]ge|suber', 'bougainvillier': r'bougainvill', 'muscade': r'muscad|macis', 'gingembre': r'gingembre', 'girofle': r'girofle|giroflier', 'câpre': r'c[âa]pre|capparis', 'trèfle': r'tr[èe]fle|rhizobium|nodosit', 'mélèze': r'm[ée]l[èe]ze|larix', 'arbousier': r'arbousier|arbouse', 'cyclamen': r'cyclamen', 'séneçon': r's[ée]n[ée][çc]on', 'jussie': r'jussie|ludwigia', 'viorne': r'viorne|viburnum', 'daphné': r'bois-gentil|daphne', 'hamamélis': r'hamam[ée]lis', 'chimonanthe': r'chimonanthe', 'génépi': r'g[ée]n[ée]pi', 'brou': r'\bbrou\b', 'gaude': r'gaude|r[ée]s[ée]da', 'bisannuelle': r'bisannuel', 'cônes': r'pomme de pin|\bc[ôo]ne', 'aiguillon': r'aiguillon', 'amygdaline': r'amygdaline|noyau d.abricot', 'dionée': r'dion[ée]e', 'tourbière': r'tourbi[èe]re|sphaigne', 'lichen': r'lichen', 'orpin': r'orpin|joubarbe|sedum', 'chêne vert': r'chêne vert', 'fusain': r'fusain', 'pomme': r'\bpomme\b|pommes\b'}
RAW = {'maïs': r'\bmaïs\b'}   # « mais » (la conjonction) ne doit pas compter : testé avant retrait des accents
def sujets(q, fiche=True):
    brut = (q['question'] + ' ' + (q.get('texte') or '') + ' ' + q['choix'][q['bonne']] + (' ' + q['explication'] if fiche else '')).lower()
    t = norm(q['question'] + ' ' + (q.get('texte') or '') + ' ' + q['choix'][q['bonne']] + (' ' + q['explication'] if fiche else ''))
    s = {k for k, rx in SUJETS.items() if re.search(norm(rx), t)} | {k for k, rx in RAW.items() if re.search(rx, brut)}
    if fiche:
        for w in set(re.findall(r'[a-z]{4,}', norm(q['question'] + ' ' + q['choix'][q['bonne']]))):
            if w in NOMS_FR and w not in ('plante', 'arbre'): s.add(w)
    return sorted(s)

def mecanisme(q):
    th, fm = q['theme'], q['format']
    if q.get('modele') == 'nom_latin_genre' or th == 'Noms latins': return 'nom_latin'
    if th == 'Anecdotes': return 'anecdote'
    if th == 'Familles': return 'famille'
    if fm == 'images' and 'indigène' in q['question']: return 'photo_origine'
    if fm == 'images': return 'photo_critere'
    return {'Fruits et toxicité': 'qcm_toxicite_fruit', 'Idées reçues': 'qcm_idee_recue', 'Usages et histoire': 'qcm_usage_histoire',
            'Vocabulaire': 'qcm_vocabulaire', 'Écologie': 'qcm_ecologie', 'Milieux': 'qcm_milieu', 'Saisons': 'qcm_saison'}.get(th, 'qcm_autre')

EPITHETES = {'decidua': r'perd|caduc|automne', 'hyemalis': r'hiver', 'nudiflorum': r'avant|hiver|nu', 'sempervirens': r'garde|persistant|vert', 'spinosa': r'[ée]pin',
  'aculeatus': r'piquant|[ée]pin', 'suber': r'li[èe]ge', 'maritimum': r'dune|mer\b|littoral|sel', 'maritima': r'dune|mer\b|littoral', 'palustris': r'marais|humide', 'pratensis': r'pr[ée]s?\b',
  'sylvatica': r'for[êe]t|bois', 'alba': r'blanc', 'albus': r'blanc|boule', 'nigra': r'noir', 'rubra': r'rouge', 'caerulea': r'bleu', 'japonica': r'japon', 'sinensis': r'chin',
  'americana': r'am[ée]ric', 'orientalis': r'orient', 'tinctoria': r'teintur|colorant', 'praecox': r'pr[ée]coce|t[ôo]t', 'vernalis': r'printemps', 'autumnalis': r'automne',
  'odorata': r'odeur|parfum', 'fragrans': r'parfum', 'grandiflora': r'grandes? fleurs', 'tomentosa': r'duvet|feutr', 'majalis': r'\bmai\b', 'serotina': r'tardi', 'quinquefolia': r'cinq|palm',
  'aquatica': r'\beau\b|aquat', 'arborea': r'\barbre', 'arborescens': r'arbre', 'frutescens': r'arbuste', 'fruticosa': r'arbuste', 'officinalis': r'm[ée]dic|officin', 'edulis': r'comestible|manger'}
def fuite_epithete(q):
    if q['format'] != 'images': return None
    rep = q['choix'][q['bonne']]; e = norm(rep.split(' ')[-1].replace('×', '')) if ' ' in rep else ''
    rx = EPITHETES.get(e)
    return f"épithète « {e} » traduisible dans l'énoncé" if rx and re.search(rx, norm(q['question'])) else None
def fuite_nom_latin(q):
    """photo ou liste de noms latins affichés : l'énoncé ou l'ensemble des choix laisse-t-il lire la réponse ?"""
    if q['format'] != 'images' and not q.get('plantes'): return None
    rep = q['choix'][q['bonne']]; g = rep.split(' ')[0]
    mots = re.findall(r'[a-z]{5,}', norm(q['question'] + ' ' + (q.get('texte') or '')))
    genres = cnt(c.split(' ')[0] for c in q['choix'])
    if genres[g] == 1 and any(m[:5] == norm(g)[:5] for m in mots): return "genre du nom latin cité dans l'énoncé"
    if genres[g] == 1 and any(v >= 3 for v in genres.values()): return 'trois noms du même genre et un intrus'
    return None

# ---------- banque ----------
CHAMPS = ['id', 'theme', 'format', 'question', 'texte', 'choix', 'bonne', 'plante', 'organe', 'explication', 'sources', 'modele']
banque = []; ecartes_gen = cnt()
for i, r in REV.items():                       # 1. questions relues une à une (v2)
    o = ORIG[i]
    q = {k: o.get(k) for k in CHAMPS}
    q['origine'] = o['origine']; q['en_ligne'] = o.get('en_ligne', False); q['deja_en_ligne'] = EN_LIGNE.get(fait_id(q))
    if r.get('correction'):
        q['original'] = {k: q[k] for k in r['correction']}; q.update(r['correction']); q['corrigee'] = True
    q.update({'statut': r['statut'], 'niveau': r['niveau'], 'piege': r['piege'], 'note_revue': r['note'], 'verification': r['verification'], 'tier': 0})
    q['plantes'] = q['format'] == 'images'
    banque.append(q)
for n in NOUV:                                 # 2. nouvelles questions rédigées et recoupées
    q = dict(n); q['modele'] = 'nouvelle'; q['en_ligne'] = False; q['texte'] = None; q['plante'] = None; q['organe'] = None
    q.setdefault('note_revue', ''); q['deja_en_ligne'] = None; q['tier'] = 0 if q['statut'] == 'validee' else 1; q['plantes'] = q['format'] == 'images'
    banque.append(q)
vus = {q['id'] for q in banque}
def niveau_gen(o):
    n, m, d = o['niveau_suppose'], o['modele'], o['difficulte_plante'] or 0
    if n == 'simple': return 'facile', False
    if n == 'piege': return 'intermediaire', 'PIEGE_A_CONFIRMER' not in o['alertes']
    if m == 'nom_latin_genre': return 'difficile', False
    return ('difficile' if d >= 2.4 else 'intermediaire'), False
for i, o in ORIG.items():                      # 3. questions générées à partir des données sourcées de l'appli
    if i in vus or o['origine'] != 'générée': continue
    if o['verdict'] != 'conserver': ecartes_gen['verdict ' + o['verdict']] += 1; continue
    if {'ANECDOTE_LOCALE', 'PHOTO_ORGANE'} & set(o['alertes']): ecartes_gen['anecdote locale ou photo d\'organe incertaine'] += 1; continue
    if len(o['explication']) > 280: ecartes_gen['explication trop longue'] += 1; continue
    q = {k: o.get(k) for k in CHAMPS}; q['origine'] = 'générée'; q['en_ligne'] = o.get('en_ligne', False); q['deja_en_ligne'] = EN_LIGNE.get(fait_id(q))
    q['niveau'], q['piege'] = niveau_gen(o); q['statut'] = 'donnees'; q['tier'] = 1; q['note_revue'] = ''
    q['plantes'] = o['format'] == 'images' or o['modele'] == 'anecdote_qcm'; q['latin'] = o['modele'] == 'nom_latin_genre'
    q['verification'] = {'recoupement': 'données de l\'appli', 'note': "conforme aux données sourcées de l'appli (non recoupée sur le web)", 'sources_recoupement': []}
    banque.append(q)
for q in banque:
    q['mecanisme'] = mecanisme(q)
    q['cible'] = q['choix'][q['bonne']] if (q['format'] == 'images' or q.get('plantes')) else q.get('plante')
    q['sujets'] = sujets(q, fiche=q['tier'] == 0) + ([norm(q['cible'])] if q['cible'] else [])
    q['genre'] = q['cible'].split(' ')[0] if q['cible'] and ' ' in q['cible'] else None
    q['fuite_nom_latin'] = fuite_nom_latin(q); q['indice_epithete'] = fuite_epithete(q)
    q['photos_ok'] = all(c in PHOTOS and PHOTOS[c][5] for c in q['choix']) if q['format'] == 'images' else None
    q['sujets'] = sorted(set(q['sujets']))
STAT = cnt(q['statut'] for q in banque)
json.dump({'_lisez_moi': "Banque v3 : validee = relue et recoupée par recherche web (pages citées non ouvertes une à une) ; donnees = générée à partir des données sourcées de l'appli, cohérente avec elles, "
           "non recoupée sur le web. Les originaux restent dans defis-banque-controle.json et defis-redigees.json ; « original » donne les valeurs d'avant correction.",
           'bilan': {'statut': dict(STAT), 'niveau_planifiable': dict(cnt(q['niveau'] for q in banque if q['statut'] in PLANIFIABLES)), 'ecartes_generees': dict(ecartes_gen)}, 'questions': banque},
          open(os.path.join(DOSS, 'banque.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

# ---------- planning ----------
SLOTS = [('facile', 0), ('facile', 0), ('intermediaire', 0), ('facile', 0), ('intermediaire', 1), ('difficile', 0), ('intermediaire', 1), ('facile', 0), ('intermediaire', 0), ('difficile', 0)]
ORDRE = [5, 9, 4, 6, 0, 1, 3, 7, 2, 8]   # on place d'abord les niveaux rares (difficiles, pièges), puis les faciles
JOUEES = {((DEBUT - datetime.timedelta(days=k) - datetime.date(2026, 1, 1)).days) % len(LIGNE) for k in (1, 2, 3)}
PLEIN = [q for q in banque if q['statut'] in PLANIFIABLES and q['photos_ok'] is not False and not q['fuite_nom_latin'] and len(q['explication']) <= 280
         and not (q['deja_en_ligne'] and q['deja_en_ligne'][0] in JOUEES)]
CAP_MEC = {'anecdote': 1, 'famille': 1, 'photo_origine': 1, 'nom_latin': 1}   # un seul par défi
CAP_DEF = {'photo_critere': 3}                                                # sinon 2 par défi
BUDGET_ENONCE = 22                                                           # un même énoncé de photos (« Laquelle de ces plantes perd ses feuilles… ») au plus 16 fois sur 90 jours
BUDGET = {'nom_latin': 22}                                                    # question de pure mémoire : réservée aux difficiles, à petite dose

def voisin_ok(q, pos, jour):
    """pas deux fois le même mécanisme côte à côte, pas trois fois le même format d'affilée"""
    for d in (-1, 1):
        v = jour.get(pos + d)
        if v and v['mecanisme'] == q['mecanisme']: return False
    for a, b in ((-2, -1), (-1, 1), (1, 2)):
        x, y = jour.get(pos + a), jour.get(pos + b)
        if x and y and x['format'] == y['format'] == q['format']: return False
    return True
def faisable(q, pos, jour, rec_sujets, rec_cibles, rec_genres, rel):
    deja = list(jour.values())
    if sum(x['theme'] == q['theme'] for x in deja) >= (3 if rel >= 2 else 2): return False
    if sum(x['mecanisme'] == q['mecanisme'] for x in deja) >= CAP_MEC.get(q['mecanisme'], CAP_DEF.get(q['mecanisme'], 2)): return False
    if set(q['sujets']) & {s for x in deja for s in x['sujets']}: return False
    if q['genre'] and q['genre'] in {x['genre'] for x in deja}: return False
    if (q['question'], q.get('texte') or '') in {(x['question'], x.get('texte') or '') for x in deja}: return False
    if q['cible'] and q['cible'] in rec_cibles: return False
    if rel < 1 and set(q['sujets']) & rec_sujets: return False
    if rel < 3 and q['genre'] and q['genre'] in rec_genres: return False
    if q['format'] == 'images' and sum(x['format'] == 'images' for x in deja) >= 5: return False
    if q['format'] == 'qcm' and sum(x['format'] == 'qcm' for x in deja) >= 7: return False
    if q.get('indice_epithete') and sum(bool(x.get('indice_epithete')) for x in deja) >= 1: return False
    return True

def ordre_ok(qs):
    if qs[0]['niveau'] != 'facile' or qs[-1]['niveau'] == 'facile': return False
    for a, b in zip(qs, qs[1:]):
        if a['mecanisme'] == b['mecanisme'] or (a['niveau'] == b['niveau'] == 'difficile'): return False
    return not any(a['format'] == b['format'] == c['format'] for a, b, c in zip(qs, qs[1:], qs[2:]))
def ordonner(jour, R):
    """les 10 questions du jour sont choisies par niveau ; on les range ensuite pour éviter deux mécanismes identiques côte à côte
    et trois questions de même format d'affilée, en restant le plus près possible de la progression habituelle (faciles d'abord)"""
    base = [jour[k] for k in range(10)]
    if ordre_ok(base): return base, True
    meilleur = None
    for _ in range(4000):
        perm = list(range(10))
        for _ in range(R.randint(1, 6)):
            a, b = R.sample(range(10), 2); perm[a], perm[b] = perm[b], perm[a]
        qs = [base[i] for i in perm]
        if ordre_ok(qs):
            cout = sum(abs(i - k) for k, i in enumerate(perm))
            if meilleur is None or cout < meilleur[0]: meilleur = (cout, qs)
    return (meilleur[1], True) if meilleur else (base, False)

CAPA = {t: 2 * n for t, n in cnt(q['theme'] for q in PLEIN).items()}      # nombre de passages que le thème peut fournir
CAPA_M = {m: 2 * n for m, n in cnt(q['mecanisme'] for q in PLEIN).items()}
def tenter(graine):
    R = random.Random(graine); dernier = {}; usages = cnt(); plan = []; subst = []; relax = []
    u_theme = cnt(); u_mec = cnt(); u_suj = cnt(); u_enonce = cnt()
    for j in range(JOURS):
        rec_sujets = {s for jj in plan[-3:] for x in jj for s in x['sujets']}
        rec_cibles = {x['cible'] for jj in plan[-6:] for x in jj if x['cible']}
        rec_genres = {x['genre'] for jj in plan[-2:] for x in jj if x['genre']}
        jour = {}
        for pos in ORDRE:
            niv, pg = SLOTS[pos]
            def candidats(niv_, pg_, rel, ecart=ECART, maxu=MAX_USAGES, libre=False):
                return [q for q in PLEIN if usages[q['id']] < maxu and dernier.get(q['id'], -999) <= j - ecart and q['niveau'] == niv_ and (not pg_ or q['piege'])
                        and u_mec[q['mecanisme']] < BUDGET.get(q['mecanisme'], 10**6) and (libre or q['format'] != 'images' or u_enonce[q['question']] < BUDGET_ENONCE) and faisable(q, pos, jour, rec_sujets, rec_cibles, rec_genres, rel)]
            C, sub = candidats(niv, pg, 0), None
            if not C:
                for rel, txt in ((1, "même sujet que dans les 3 jours précédents"), (2, "3 questions du même thème"), (3, "même genre botanique à moins de 2 jours"), (4, "même mécanisme voisin")):
                    C = candidats(niv, pg, rel)
                    if C: sub = txt; break
            if not C and niv == 'facile': C, sub = candidats('intermediaire', 0, 3), "facile → intermédiaire accessible"
            if not C and niv == 'intermediaire' and pg: C, sub = candidats('intermediaire', 0, 3), "piège → intermédiaire ordinaire"
            if not C and niv == 'difficile': C, sub = candidats('intermediaire', 1, 3), "difficile → intermédiaire piège"
            if not C: C, sub = candidats(niv, pg, 4, libre=True), "énoncé de photos déjà très servi"
            if not C and niv == 'facile': C, sub = candidats('intermediaire', 0, 4, libre=True), "facile → intermédiaire accessible ; énoncé de photos déjà très servi"
            if not C: C, sub = candidats(niv, pg, 4, ecart=14, libre=True), "réutilisation à moins de 28 jours"
            if not C: C, sub = candidats(niv, pg, 4, maxu=3), "troisième passage"
            if not C:
                if os.environ.get('DEFIS_DEBUG'): print('échec', graine, 'jour', j + 1, 'pos', pos + 1, niv, pg)
                return None
            # inédites d'abord ; à égalité : questions recoupées avant celles tirées des données, thèmes et mécanismes les moins servis
            C.sort(key=lambda q: (usages[q['id']] > 0, u_theme[q['theme']] / CAPA[q['theme']] + 0.05 * u_mec[q['mecanisme']] / CAPA_M[q['mecanisme']] + 0.04 * max([u_suj[x] for x in q['sujets'] if x in SUJETS] or [0]), q['tier'], R.random()))
            q = dict(C[0]); q['position'] = pos + 1; q['place'] = niv + (' (piège)' if pg else ''); q['substitution'] = sub; q['reutilisation'] = usages[q['id']] > 0
            if sub: subst.append((j, pos + 1, sub))
            jour[pos] = q; dernier[q['id']] = j; usages[q['id']] += 1; u_theme[q['theme']] += 1; u_mec[q['mecanisme']] += 1
            for x in q['sujets']: u_suj[x] += 1
            if q['format'] == 'images': u_enonce[q['question']] += 1
        rang, ok = ordonner(jour, R)
        if not ok: subst.append((j, 0, "ordre : mécanismes ou formats voisins"))
        for n, q in enumerate(rang): q['position'] = n + 1
        plan.append(rang)
    return plan, subst

def equilibrer(jour, graine):
    FIXE = re.compile(r'^\d|^Environ|^Près|^Trois$|^Quatre$|^Cinq$|^Huit$|^Au printemps|^En été|^En automne|^En hiver|^Dès l|^Au début|^De la fin|^En plein')
    for x in jour:
        if x['format'] == 'images' or any(FIXE.match(c) for c in x['choix']): continue
        if cnt(y['bonne'] for y in jour)[x['bonne']] <= 3: continue
        for cible in sorted(range(4), key=lambda k: cnt(y['bonne'] for y in jour)[k]):
            if cible != x['bonne']:
                ch = list(x['choix']); ch[cible], ch[x['bonne']] = ch[x['bonne']], ch[cible]
                x['choix'] = ch; x['bonne'] = cible; x['ordre_modifie'] = True
                break

# ---------- sorties lisibles ----------
STAT_FR = {'validee': 'validée', 'relue': 'relue', 'donnees': 'données'}
def ecrire_md(plan, sortie, ctl, subst, pos_j, dom):
    tous = [x for j in plan for x in j]; uniques = {x['id']: x for x in tous}
    L = ['# Planning de 90 défis : du %s au %s\n' % (DEBUT.strftime('%d/%m/%Y'), (DEBUT + datetime.timedelta(days=JOURS - 1)).strftime('%d/%m/%Y')),
         "**Non publié** : le défi du jour et les séries en ligne ne sont pas touchés. Statut « validée » : relue et fait recoupé par recherche web (pages citées non ouvertes une à une) ; « données » : générée à partir des données sourcées de l'appli, non recoupée sur le web.\n",
         '## Contrôles\n', '| Contrôle | Résultat | Détail |\n|---|---|---|'] + [f"| {c['controle']} | {'✅' if c['ok'] else '⚠️'} | {c['detail']} |" for c in ctl]
    if subst: L.append('\nRègles relâchées (jour, question) : ' + ' ; '.join(f"J{j + 1} Q{p or '–'} ({t})" for j, p, t in subst))
    for j, jour in enumerate(sortie):
        L.append(f"\n## Jour {j + 1} : {datetime.date.fromisoformat(jour['date']).strftime('%a %d/%m/%Y')}\n")
        L.append('| # | Niveau | Thème | Format | Question | Bonne réponse | Statut | Source |\n|---|---|---|---|---|---|---|---|')
        for x in jour['questions']:
            rep = x['choix'][x['bonne']]; src = (x['sources'] or x['verification']['sources_recoupement'] or ['données de l\'appli'])[0]
            L.append(f"| {x['position']} | {x['niveau']}{' (piège)' if x['piege'] and x['niveau'] == 'intermediaire' else ''}{' ↻' if x.get('reutilisation') else ''} | {x['theme']} | {'photos' if x['format'] == 'images' else 'texte'} | "
                     f"{(x['question'] + (' « ' + x['texte'] + ' »' if x.get('texte') else '')).replace('|', '/')} | {rep} | {STAT_FR[x['statut']]} | {dom(src) if src.startswith('http') else src} |")
    open(os.path.join(DOSS, 'planning-90j.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n')

# ---------- contrôles, sorties ----------
def sortir(plan, subst, graine):
    ctl = []
    def regle(nom, ok, detail=''): ctl.append({'controle': nom, 'ok': bool(ok), 'detail': detail})
    tous = [x for j in plan for x in j]
    pos_j = collections.defaultdict(list)
    for j, J in enumerate(plan):
        for x in J: pos_j[x['id']].append(j)
    regle(f'{JOURS} jours de 10 questions', len(plan) == JOURS and all(len(j) == 10 for j in plan))
    regle("tous les statuts sont « validee », « relue » ou « donnees » (jamais à vérifier ni écartée)", all(x['statut'] in PLANIFIABLES for x in tous))
    ecarts = [b - a for v in pos_j.values() for a, b in zip(v, v[1:])]
    regle(f"questions rejouées : au moins {ECART} jours d'écart", all(e >= ECART for e in ecarts), f"{len(ecarts)} passage(s) en plus du premier ; écart minimal {min(ecarts) if ecarts else '—'} jours")
    regle(f"{MAX_USAGES} passages au plus par question", all(len(v) <= MAX_USAGES for v in pos_j.values()), f"{sum(len(v) > MAX_USAGES for v in pos_j.values())} question(s) à 3 passages")
    regle("quatre choix distincts et bonne réponse valide", all(len(set(x['choix'])) == 4 and 0 <= x['bonne'] < 4 for x in tous))
    regle("aucun doublon de question ou de fait dans un même défi", all(len({fait_id(x) for x in j}) == 10 and len({x['question'] + (x.get('texte') or '') for x in j}) == 10 for j in plan))
    regle("jamais deux fois la même plante cible, ni le même genre, dans un défi", all(len({x['cible'] for x in j if x['cible']}) == len([x for x in j if x['cible']]) and len({x['genre'] for x in j if x['genre']}) == len([x for x in j if x['genre']]) for j in plan))
    regle("aucun sujet répété dans un même défi", all(len([s for x in j for s in x['sujets']]) == len({s for x in j for s in x['sujets']}) for j in plan))
    def rep3(j): return {s for x in plan[j] for s in x['sujets']} & {s for jj in plan[max(0, j - 3):j] for x in jj for s in x['sujets']}
    rep = sum(len(rep3(j)) > 0 for j in range(JOURS))
    regle("un même sujet ne revient pas dans les 3 jours suivants", rep == 0, f"{rep} jour(s) concerné(s) (règle relâchée seulement si le stock manquait)")
    sj = cnt(s for j in plan for s in {s for x in j for s in x['sujets']} if s in SUJETS)
    regle("aucun sujet courant dans plus de 15 défis sur 90", max(sj.values()) <= 15, ', '.join(f'{k} ×{v}' for k, v in sj.most_common(6)))
    regle("2 thèmes identiques au plus par défi", all(max(cnt(x['theme'] for x in j).values()) <= 2 for j in plan), f"{sum(max(cnt(x['theme'] for x in j).values()) > 2 for j in plan)} défi(s) à 3")
    regle("au moins 5 thèmes différents par défi", all(len({x['theme'] for x in j}) >= 5 for j in plan), 'min ' + str(min(len({x['theme'] for x in j}) for j in plan)))
    regle("un seul mode « anecdote », « famille », « origine » ou « nom latin » par défi", all(max([cnt(x['mecanisme'] for x in j)[m] for m in CAP_MEC] or [0]) <= 1 for j in plan))
    regle("entre 2 et 5 questions en photos par défi", all(2 <= sum(x['format'] == 'images' for x in j) <= 5 for j in plan), str(sorted(cnt(sum(x['format'] == 'images' for x in j) for j in plan).items())))
    regle("jamais deux questions de même mécanisme côte à côte", all(a['mecanisme'] != b['mecanisme'] for j in plan for a, b in zip(j, j[1:])), f"{sum(a['mecanisme'] == b['mecanisme'] for j in plan for a, b in zip(j, j[1:]))} cas")
    regle("jamais trois questions de même format d'affilée", all(not (a['format'] == b['format'] == c['format']) for j in plan for a, b, c in zip(j, j[1:], j[2:])), f"{sum(a['format'] == b['format'] == c['format'] for j in plan for a, b, c in zip(j, j[1:], j[2:]))} cas")
    regle("photos disponibles pour toutes les plantes affichées", all(x['photos_ok'] is not False for x in tous))
    regle("aucune fuite forte du nom latin affiché", all(not x['fuite_nom_latin'] for x in tous))
    regle("indice faible par l'épithète latine : au plus 1 question par défi", all(sum(bool(x.get('indice_epithete')) for x in j) <= 1 for j in plan), f"{sum(bool(x.get('indice_epithete')) for x in tous)} question(s) concernée(s)")
    regle("chaque question a une source : lien cité, ou données sourcées de l'appli (statut « donnees »)", all(x['sources'] or x['verification']['sources_recoupement'] or x['statut'] != 'validee' for x in tous), f"{sum(1 for x in tous if not x['sources'] and x['statut'] != 'validee')} passages sans lien (données de l'appli ou connaissance de base) ; {sum(1 for x in tous if not x['sources'] and x['statut'] == 'validee')} avec recoupement seul")
    regle("explication ≤ 280 caractères", all(len(x['explication']) <= 280 for x in tous), f"max {max(len(x['explication']) for x in tous)}")
    regle("bonne réponse jamais à la même place plus de 5 fois dans un défi", all(max(cnt(x['bonne'] for x in j).values()) <= 5 for j in plan))
    pl = cnt(x['bonne'] for x in tous)
    regle("position de la bonne réponse équilibrée sur 90 jours (chaque place entre 20 % et 30 %)", all(0.2 <= pl[k] / len(tous) <= 0.3 for k in range(4)), str(dict(sorted(pl.items()))))
    nb_p = [sum(x['piege'] and x['niveau'] == 'intermediaire' for x in j) for j in plan]
    regle("au moins 2 pièges parmi les intermédiaires de chaque défi", min(nb_p) >= 2, f"{sum(n < 2 for n in nb_p)} défi(s) avec moins de 2")
    lv = [cnt(x['niveau'] for x in j) for j in plan]
    regle("format 4 faciles / 4 intermédiaires / 2 difficiles respecté", all(l['facile'] == 4 and l['intermediaire'] == 4 and l['difficile'] == 2 for l in lv), f"{len(subst)} règle(s) relâchée(s) ou substitution(s)")
    rejoues = [x for x in tous if x['deja_en_ligne'] and x['deja_en_ligne'][0] in JOUEES]
    regle("aucune question des séries jouées les 3 jours précédant le planning", not rejoues, f"séries {sorted(JOUEES)}")
    regle("information : questions déjà présentes dans les 300 séries en ligne", True, f"{sum(1 for x in tous if x['deja_en_ligne'])} passages sur {len(tous)}")
    # sorties
    dom = lambda u: urlparse(u).hostname.replace('www.', '') if urlparse(u).hostname else u
    sortie = []
    for j, jour in enumerate(plan):
        sortie.append({'date': (DEBUT + datetime.timedelta(days=j)).isoformat(), 'questions': [{k: x[k] for k in ['position', 'place', 'substitution', 'reutilisation', 'id', 'theme', 'niveau', 'piege', 'format', 'mecanisme', 'question', 'texte', 'choix', 'bonne', 'explication', 'sources', 'statut', 'origine', 'corrigee', 'sujets', 'indice_epithete', 'verification'] if k in x} for x in jour]})
    json.dump({'_lisez_moi': "Planning de 90 jours (non publié, ne remplace rien). « validee » = relue et recoupée par recherche web (pages citées non ouvertes une à une) ; « donnees » = générée à partir des données sourcées de l'appli, non recoupée sur le web.",
               'debut': DEBUT.isoformat(), 'graine': graine, 'relachements': subst, 'controles': ctl, 'jours': sortie},
              open(os.path.join(DOSS, 'planning-90j.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    def vers_dq(x):
        d = {'theme': x['theme'], 'niveau': {'facile': 'simple', 'difficile': 'difficile'}.get(x['niveau'], 'piege' if x['piege'] else 'intermediaire'), 'format': x['format'], 'question': x['question']}   # le jeu n'utilise pas « niveau » : simple métadonnée
        if x.get('texte'): d['texte'] = x['texte']
        d.update({'choix': x['choix'], 'bonne': x['bonne'], 'explication': x['explication'], 'sources': [u.replace(' ', '%20') for u in x['sources'][:2]]})
        if x.get('organe'): d['organe'] = x['organe']
        d['plantes'] = bool(x['plantes'])
        if x.get('latin'): d['latin'] = True
        if x.get('plante') or (x['format'] == 'images' and x['cible']): d['plante'] = x.get('plante') or x['cible']
        return d
    json.dump([[vers_dq(x) for x in j] for j in plan], open(os.path.join(DOSS, 'planning-90j-format-DQ.json'), 'w', encoding='utf8'), ensure_ascii=False)
    ecrire_md(plan, sortie, ctl, subst, pos_j, dom)
    print('relâchements :', dict(cnt(t for _, _, t in subst)))
    for c in ctl: print(('OK ' if c['ok'] else '!! ') + c['controle'], '|', c['detail'])
    return ctl, sortie

if __name__ == '__main__':
    meilleur = None
    NB = int(os.environ.get('DEFIS_GRAINES', 12))
    for g in ([int(os.environ['DEFIS_GRAINE'])] if os.environ.get('DEFIS_GRAINE') else range(NB)):
        r = tenter(g)
        if not r: continue
        plan, subst = r
        tous = [x for j in plan for x in j]
        sj = cnt(t for j in plan for t in {t for x in j for t in x['sujets'] if t in SUJETS})
        rep3 = sum(1 for j in range(1, JOURS) if {t for x in plan[j] for t in x['sujets']} & {t for jj in plan[max(0, j - 3):j] for x in jj for t in x['sujets']})
        score = (len(subst), rep3, max(sj.values()), sum(x['reutilisation'] for x in tous))
        if meilleur is None or score < meilleur[0]: meilleur = (score, plan, subst, g)
    if meilleur is None: sys.exit("Aucun planning de 90 jours ne respecte les contraintes avec la banque actuelle")
    _, plan, subst, graine = meilleur
    for j, jour in enumerate(plan): equilibrer(jour, j)
    sortir(plan, subst, graine)
