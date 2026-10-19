#!/usr/bin/env python3
"""Banque révisée du Défi du jour et proposition de planning, SANS toucher au jeu ni aux séries en ligne.

Entrées (lecture seule) :
  donnees/defis-banque-controle.json   questions candidates d'origine et alertes automatiques (outils/defis_controle.py)
  donnees/defis-v2/revision.json       jugements de relecture : statut, niveau, piège, corrections, recoupement des faits
  donnees/defis-v2/nouvelles-questions.json   premier lot de nouvelles questions
  donnees/photos.json, donnees/defis-questions.json (séries en ligne, pour mesurer les recoupements)
Sorties (nouveaux fichiers, jamais ceux de production) :
  donnees/defis-v2/banque.json            banque révisée (une fiche par question relue, original conservé si corrigée)
  donnees/defis-v2/planning-14j.json      14 jours de 10 questions, avec sources et statut
  donnees/defis-v2/planning-14j-format-DQ.json   les mêmes séries au format de const DQ (pour un éventuel essai)
  donnees/defis-v2/planning-14j.md        version lisible, et contrôles du planning

Usage : python3 outils/defis_v2.py [AAAA-MM-JJ]   (premier jour du planning, défaut 2026-10-20)

Statuts : validee = relue et fait recoupé par recherche web (les pages citées n'ont PAS été ouvertes une à une) ;
a_verifier = relue mais fait non recoupé ou partiellement ; ecartee = ambiguë, triviale, fuite du nom latin, doublon ou fragile.
Seules les questions « validee » entrent dans le planning.
"""
import json, os, re, sys, random, unicodedata, hashlib, datetime, collections
from urllib.parse import urlparse

RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DOSS = os.path.join(RAC, 'donnees', 'defis-v2')
lire = lambda *p: json.load(open(os.path.join(RAC, *p), encoding='utf8'))
norm = lambda t: unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
DEBUT = datetime.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else datetime.date(2026, 10, 20)
JOURS = 14

ORIG = {q['id']: q for q in lire('donnees', 'defis-banque-controle.json')['questions']}
REV = lire('donnees', 'defis-v2', 'revision.json')
NOUV = lire('donnees', 'defis-v2', 'nouvelles-questions.json')['questions']
PHOTOS = lire('donnees', 'photos.json')['especes']
LIGNE = lire('donnees', 'defis-questions.json')['series']
fait_id = lambda q: hashlib.sha1((q['question'] + '|' + (q.get('texte') or '') + '|' + q['choix'][q['bonne']]).encode('utf8')).hexdigest()[:10]
EN_LIGNE = {fait_id(q): (j, p + 1) for j, s in enumerate(LIGNE) for p, q in enumerate(s)}

# ---------- sujets (pour éviter les redites d'une même plante ou d'un même thème proche) ----------
SUJETS = {'ginkgo': r'ginkgo', 'metaséquoia': r'm[ée]tas[ée]quoia|metasequoia', 'séquoia': r's[ée]quoia', 'robinier': r'robinier|robinia',
  'lierre': r'lierre', 'cornouiller': r'cornouiller|cornus', 'saule': r'saule|salix', 'tilleul': r'tilleul|tilia', 'marron': r'marron|aesculus',
  'chêne': r'ch[êe]ne|quercus', 'érable': r'[ée]rable|acer ', 'sapin': r'sapin|abies', 'argousier': r'argousier|hippophae', 'if': r'\bif\b|taxus',
  'houx': r'houx', 'fragon': r'fragon|ruscus', 'prunellier': r'prunell|prunus spinosa', 'perce-neige': r'perce-neige|galanthus', 'pin': r'\bpins?\b|pinus',
  'hortensia': r'hortensia|hydrangea', 'laurier': r'laurier', 'jasmin': r'jasmin', 'mimosa': r'mimosa|acacia dealbata', 'noyer': r'noyer|juglone',
  'ortie': r'ortie', 'abeille': r'abeille', 'bambou': r'bambou', 'figue': r'figuier|figue', 'genévrier': r'gen[ée]vri|genièvre', 'arum': r'gouet|arum',
  'cyprès': r'cypr[èe]s', 'pomme de terre': r'pomme de terre', 'pissenlit': r'pissenlit', 'vanille': r'vanille', 'poivre': r'poivre', 'rhubarbe': r'rhubarbe',
  'noisetier': r'noisetier|corylus', 'fraise': r'fraise|fraisier', 'cerisier': r'cerisier|prunus serotina', 'tournesol': r'tournesol', 'tomate': r'tomate',
  'séquoia géant': r'sequoiadendron', 'rose': r'rosier|\brose\b|rosa ', 'clématite': r'cl[ée]matite', 'hêtre': r'h[êe]tre|fagus', 'orme': r'\borme', 'frêne': r'fr[êe]ne|fraxinus',
  'amandier/abricot': r'amandier|abricot|amygdal', 'safran/crocus': r'safran|crocus', 'tulipe': r'tulipe', 'gui': r'\bgui\b', 'quinquina': r'quinquina|quinine'}
def sujets(q):
    t = norm(q['question'] + ' ' + (q.get('texte') or '') + ' ' + q['explication'] + ' ' + ' '.join(q['choix'][q['bonne']:q['bonne'] + 1]))
    return sorted(k for k, rx in SUJETS.items() if re.search(norm(rx).replace('\\\\', '\\'), t))

def mecanisme(q):
    th, fm = q['theme'], q['format']
    if th == 'Anecdotes': return 'anecdote'
    if th == 'Familles': return 'famille'
    if fm == 'images' and 'indigène' in q['question']: return 'photo_origine'
    if fm == 'images': return 'photo_critere'
    return {'Fruits et toxicité': 'qcm_toxicite_fruit', 'Idées reçues': 'qcm_idee_recue', 'Usages et histoire': 'qcm_usage_histoire',
            'Vocabulaire': 'qcm_vocabulaire', 'Écologie': 'qcm_ecologie', 'Milieux': 'qcm_milieu', 'Saisons': 'qcm_saison'}.get(th, 'qcm_autre')

# épithètes latines qui se traduisent par un mot de l'énoncé : indice FAIBLE (il faut savoir le latin), plafonné à 1 par défi
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
    """photo + nom latin affiché : l'énoncé ou l'ensemble des choix laisse-t-il lire la réponse ?"""
    if q['format'] != 'images': return None
    rep = q['choix'][q['bonne']]; g, e = rep.split(' ')[0], (rep.split(' ')[1] if ' ' in rep else '')
    st = norm(q['question'])
    mots = [m for m in re.findall(r'[a-z]{5,}', st)]
    genres = collections.Counter(c.split(' ')[0] for c in q['choix'])
    if genres[g] == 1 and any(m[:5] == norm(g)[:5] for m in mots): return "genre du nom latin cité dans l'énoncé"
    if genres[g] == 1 and any(v >= 3 for v in genres.values()): return 'trois noms du même genre et un intrus'
    return None

# ---------- banque révisée ----------
CHAMPS = ['id', 'theme', 'format', 'question', 'texte', 'choix', 'bonne', 'plante', 'organe', 'explication', 'sources', 'modele']
banque = []
for i, r in REV.items():
    o = ORIG[i]
    q = {k: o.get(k) for k in CHAMPS}
    q['origine'] = o['origine']; q['en_ligne'] = o.get('en_ligne', False); q['deja_en_ligne'] = EN_LIGNE.get(fait_id(q))
    if r.get('correction'):
        q['original'] = {k: q[k] for k in r['correction']}; q.update(r['correction']); q['corrigee'] = True
    q.update({'statut': r['statut'], 'niveau': r['niveau'], 'piege': r['piege'], 'note_revue': r['note'], 'verification': r['verification']})
    banque.append(q)
for n in NOUV:
    q = dict(n); q['modele'] = 'nouvelle'; q['en_ligne'] = False; q['texte'] = None; q['plante'] = None; q['organe'] = None; q['note_revue'] = ''; q['deja_en_ligne'] = None
    banque.append(q)
for q in banque:
    q['mecanisme'] = mecanisme(q); q['sujets'] = sujets(q); q['fuite_nom_latin'] = fuite_nom_latin(q); q['indice_epithete'] = fuite_epithete(q)
    q['photos_ok'] = all(c in PHOTOS and PHOTOS[c][5] for c in q['choix']) if q['format'] == 'images' else None
    q['cible'] = q['choix'][q['bonne']] if q['format'] == 'images' else q.get('plante')
cnt = collections.Counter
stat = cnt(q['statut'] for q in banque)
json.dump({'_lisez_moi': "Banque révisée (questions relues + premier lot de nouvelles). Les originaux restent dans defis-banque-controle.json et defis-redigees.json ; "
           "les corrections sont listées dans « original » (valeurs d'avant). « validee » = relue et fait recoupé par recherche web, pages citées non ouvertes une à une.",
           'bilan': {'statut': dict(stat), 'niveau_valide': dict(cnt(q['niveau'] for q in banque if q['statut'] == 'validee')),
                     'piege_valide': sum(q['piege'] for q in banque if q['statut'] == 'validee')}, 'questions': banque},
          open(os.path.join(DOSS, 'banque.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

# ---------- planning ----------
SLOTS = [('facile', 0), ('facile', 0), ('intermediaire', 0), ('facile', 0), ('intermediaire', 1), ('difficile', 0), ('intermediaire', 1), ('facile', 0), ('intermediaire', 0), ('difficile', 0)]
JOUEES = {((DEBUT - datetime.timedelta(days=k) - datetime.date(2026, 1, 1)).days) % len(LIGNE) for k in (1, 2, 3)}   # séries des 3 jours qui précèdent le planning
PLEIN = [q for q in banque if q['statut'] == 'validee' and q['photos_ok'] is not False and not q['fuite_nom_latin'] and len(q['explication']) <= 280
         and not (q['deja_en_ligne'] and q['deja_en_ligne'][0] in JOUEES)]
CAP_MEC = {'anecdote': 1, 'famille': 1, 'photo_origine': 1}   # un seul par défi
CAP_DEF = {'photo_critere': 4}   # sinon 2 par défi
def faisable(q, jour, deja_jour, hist, recents, relache=0):
    if sum(x['theme'] == q['theme'] for x in deja_jour) >= (3 if relache >= 2 else 2): return False
    if sum(x['mecanisme'] == q['mecanisme'] for x in deja_jour) >= CAP_MEC.get(q['mecanisme'], CAP_DEF.get(q['mecanisme'], 2)): return False
    if set(q['sujets']) & {s for x in deja_jour for s in x['sujets']}: return False
    if q['cible'] and q['cible'] in {x['cible'] for x in deja_jour}: return False
    if relache < 1 and set(q['sujets']) & recents: return False
    if q['format'] == 'images' and sum(x['format'] == 'images' for x in deja_jour) >= 5: return False
    if q['format'] == 'qcm' and sum(x['format'] == 'qcm' for x in deja_jour) >= 6: return False
    if q.get('indice_epithete') and sum(bool(x.get('indice_epithete')) for x in deja_jour) >= 1: return False
    return True
ECHECS = collections.Counter()
ECART = 9   # une question déjà jouée ne peut revenir qu'au bout de 9 jours (réutilisation espacée, seulement si le stock inédit manque)
ORDRE = [5, 9, 4, 6, 0, 1, 3, 7, 2, 8]   # on place d'abord les niveaux rares (difficiles, pièges), puis les faciles
def tenter(graine):
    R = random.Random(graine); dernier = {}; plan = []; subst = []
    usage_theme = cnt()
    for j in range(JOURS):
        recents = {s for jj in plan[-3:] for x in jj for s in x['sujets']}   # un sujet ne revient pas dans les 3 jours suivants
        jour = {}
        for pos in ORDRE:
            niv, pg = SLOTS[pos]; deja = list(jour.values())
            def candidats(niv_, pg_, rel=0):
                return [q for q in PLEIN if dernier.get(q['id'], -99) <= j - ECART and q['niveau'] == niv_ and (not pg_ or q['piege']) and faisable(q, j, deja, plan, recents, rel)]
            C, sub = candidats(niv, pg), None
            if not C and niv == 'facile': C, sub = candidats('intermediaire', 0), "facile → intermédiaire accessible"
            if not C and niv == 'intermediaire' and pg: C, sub = candidats('intermediaire', 0), "piège → intermédiaire ordinaire"
            if not C and niv == 'difficile': C, sub = candidats('intermediaire', 1), "difficile → intermédiaire piège"
            for rel, txt in ((1, "même sujet que dans les 3 jours précédents"), (2, "3 questions du même thème")):
                if not C: C, sub = candidats(niv, pg, rel), (sub + ' ; ' if sub else '') + txt
            if not C:
                ECHECS[(j, pos + 1)] += 1
                return None
            R.shuffle(C)
            C.sort(key=lambda q: (q['id'] in dernier, usage_theme[q['theme']], -(q['origine'] == 'nouvelle'), R.random()))
            q = dict(C[0]); q['position'] = pos + 1; q['place'] = niv + (' (piège)' if pg else ''); q['substitution'] = sub
            if sub: subst.append((j, pos + 1, sub))
            q['reutilisation'] = dernier.get(q['id']) is not None
            jour[pos] = q; dernier[q['id']] = j; usage_theme[q['theme']] += 1
        plan.append([jour[k] for k in range(10)])
    return plan, subst
meilleur = None
for g in range(600):
    r = tenter(g)
    if not r: continue
    plan, subst = r
    th = cnt(x['theme'] for j in plan for x in j)
    rp = cnt(s for j in plan for s in {s for x in j for s in x['sujets']})
    score = (len(subst), sum(x.get('reutilisation', False) for jj in plan for x in jj), max(rp.values()), sum(v - 1 for v in rp.values()), max(th.values()) - min(th.values()))
    if meilleur is None or score < meilleur[0]: meilleur = (score, plan, subst, g)
if meilleur is None: sys.exit("Aucun planning de 14 jours ne respecte les contraintes avec les questions validées")
_, plan, subst, graine = meilleur

FIXE = re.compile(r'^\d|^Environ|^Près|^Trois$|^Quatre$|^Cinq$|^Huit$|^Au printemps|^En été|^En automne|^En hiver|^Dès l|^Au début|^De la fin|^En plein')
def equilibrer(jour, graine):
    R = random.Random(graine); cibles = [0, 1, 2, 3] * 3; R.shuffle(cibles)
    for x in jour:
        if x['format'] == 'images' or any(FIXE.match(c) for c in x['choix']): continue
        if cnt(y['bonne'] for y in jour)[x['bonne']] <= 3: continue
        for cible in sorted(range(4), key=lambda k: cnt(y['bonne'] for y in jour)[k]):
            if cible != x['bonne']:
                ch = list(x['choix']); ch[cible], ch[x['bonne']] = ch[x['bonne']], ch[cible]
                x['choix'] = ch; x['bonne'] = cible; x['ordre_modifie'] = True
                break
for j, jour in enumerate(plan): equilibrer(jour, j)

# ---------- contrôles du planning ----------
ctl = []
def regle(nom, ok, detail=''): ctl.append({'controle': nom, 'ok': bool(ok), 'detail': detail})
tous = [x for j in plan for x in j]
regle('14 jours de 10 questions', len(plan) == JOURS and all(len(j) == 10 for j in plan))
reut = [x for x in tous if x.get('reutilisation')]
regle("aucune question en double dans le planning, hors réutilisation espacée d'au moins 9 jours", all(j2 - j1 >= ECART for i1, j1 in [(x['id'], jj) for jj, J in enumerate(plan) for x in J] for i2, j2 in [(x['id'], jj) for jj, J in enumerate(plan) for x in J] if i1 == i2 and j2 > j1), f"{len(reut)} question(s) rejouée(s) après au moins 9 jours")
regle("aucune question « à vérifier » ou écartée", all(x['statut'] == 'validee' for x in tous))
regle("quatre choix distincts et bonne réponse valide", all(len(set(x['choix'])) == 4 and 0 <= x['bonne'] < 4 for x in tous))
regle("jamais deux fois la même plante cible dans un défi", all(len({x['cible'] for x in j if x['cible']}) == len([x for x in j if x['cible']]) for j in plan))
regle("aucun sujet répété dans un même défi", all(len([s for x in j for s in x['sujets']]) == len({s for x in j for s in x['sujets']}) for j in plan))
rep = cnt(s for j in plan for s in {s for x in j for s in x['sujets']})
regle("aucun sujet dans plus de 4 défis sur 14", max(rep.values()) <= 4, ', '.join(f'{k} ×{v}' for k, v in rep.most_common(6)))
regle("2 thèmes identiques au plus par défi", all(max(cnt(x['theme'] for x in j).values()) <= 2 for j in plan))
regle("au moins 5 thèmes différents par défi", all(len({x['theme'] for x in j}) >= 5 for j in plan), 'min ' + str(min(len({x['theme'] for x in j}) for j in plan)))
regle("un seul mode « anecdote », « famille » ou « origine » par défi", all(max([cnt(x['mecanisme'] for x in j)[m] for m in CAP_MEC] or [0]) <= 1 for j in plan))
regle("entre 2 et 5 questions en photos par défi", all(2 <= sum(x['format'] == 'images' for x in j) <= 5 for j in plan), str(sorted({sum(x['format'] == 'images' for x in j) for j in plan})))
regle("photos disponibles pour toutes les plantes affichées", all(x['photos_ok'] is not False for x in tous))
regle("aucune fuite forte du nom latin affiché (énoncé ou intrus évident)", all(not x['fuite_nom_latin'] for x in tous))
regle("indice faible par l'épithète latine : au plus 1 question par défi", all(sum(bool(x.get('indice_epithete')) for x in j) <= 1 for j in plan), f"{sum(bool(x.get('indice_epithete')) for x in tous)} question(s) concernée(s) sur 140")
regle("chaque question a au moins une source (citée ou issue du recoupement)", all(x['sources'] or x['verification']['sources_recoupement'] for x in tous), f"{sum(1 for x in tous if not x['sources'])} sans source citée dans les données d'origine (recoupement seul)")
regle("explication ≤ 280 caractères", all(len(x['explication']) <= 280 for x in tous), f"max {max(len(x['explication']) for x in tous)}")
regle("bonne réponse jamais à la même place 6 fois dans un défi", all(max(cnt(x['bonne'] for x in j).values()) <= 5 for j in plan), str(sorted({max(cnt(x['bonne'] for x in j).values()) for j in plan})))
regle("au moins 2 pièges parmi les intermédiaires de chaque défi", all(sum(x['piege'] and x['niveau'] == 'intermediaire' for x in j) >= 2 for j in plan))
lvl = [cnt(x['niveau'] for x in j) for j in plan]
regle("format 4 faciles / 4 intermédiaires / 2 difficiles respecté", all(l['facile'] == 4 and l['intermediaire'] == 4 and l['difficile'] == 2 for l in lvl), f"{len(subst)} substitution(s)")
joues = JOUEES
rejoues = [x for x in tous if x['deja_en_ligne'] and x['deja_en_ligne'][0] in joues]
regle("aucune question des séries jouées les 3 jours précédents", not rejoues, f"{len(rejoues)} reprise(s) ; séries {sorted(joues)}")
regle("information : questions déjà présentes dans les 300 séries en ligne (non rejouées avant le retour du cycle)", True, f"{sum(1 for x in tous if x['deja_en_ligne'])} sur {len(tous)}")

# ---------- sorties ----------
dom = lambda u: urlparse(u).hostname.replace('www.', '') if urlparse(u).hostname else u
out = []
for j, jour in enumerate(plan):
    out.append({'date': (DEBUT + datetime.timedelta(days=j)).isoformat(), 'questions': [{k: x[k] for k in ['position', 'place', 'substitution', 'id', 'theme', 'niveau', 'piege', 'format', 'mecanisme', 'question', 'texte', 'choix', 'bonne', 'explication', 'sources', 'statut', 'origine', 'corrigee', 'sujets', 'indice_epithete', 'verification'] if k in x} for x in jour]})
json.dump({'_lisez_moi': "Proposition de planning (non publiée, ne remplace rien). Statut « validee » = relue et fait recoupé par recherche web ; les pages citées n'ont pas été ouvertes une à une.",
           'debut': DEBUT.isoformat(), 'graine': graine, 'substitutions': subst, 'controles': ctl, 'jours': out},
          open(os.path.join(DOSS, 'planning-14j.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
LEG = {'facile': 'simple', 'intermediaire': 'piege', 'difficile': 'difficile'}
def vers_dq(x):
    d = {'theme': x['theme'], 'niveau': 'piege' if x['piege'] else LEG[x['niveau']], 'format': x['format'], 'question': x['question']}
    if x.get('texte'): d['texte'] = x['texte']
    d.update({'choix': x['choix'], 'bonne': x['bonne'], 'explication': x['explication'], 'sources': x['sources'][:2]})
    if x.get('organe'): d['organe'] = x['organe']
    if x['format'] == 'images': d['plantes'] = True
    if x.get('plante'): d['plante'] = x['plante']
    return d
json.dump([[vers_dq(x) for x in j] for j in plan], open(os.path.join(DOSS, 'planning-14j-format-DQ.json'), 'w', encoding='utf8'), ensure_ascii=False)

L = ['# Proposition de planning : 14 prochains défis\n',
     f"Du {DEBUT.strftime('%d/%m/%Y')} au {(DEBUT + datetime.timedelta(days=JOURS - 1)).strftime('%d/%m/%Y')}. **Non publié** : le défi du jour et les séries en ligne ne sont pas touchés.",
     "Statut de toutes les questions ci-dessous : *validée* = relue, fait recoupé par recherche web. **Les pages citées comme sources n'ont pas été ouvertes une à une** (accès direct bloqué) : la colonne « Recoupement » liste les pages remontées par la recherche.\n",
     '## Contrôles du planning\n', '| Contrôle | Résultat | Détail |\n|---|---|---|']
for c in ctl: L.append(f"| {c['controle']} | {'✅' if c['ok'] else '⚠️'} | {c['detail']} |")
if subst: L.append('\nSubstitutions de niveau : ' + ' ; '.join(f"jour {j + 1} question {p} ({s})" for j, p, s in subst))
th = cnt(x['theme'] for x in tous)
L += ['\n## Répartition sur 14 jours\n', '| Thème | Questions |\n|---|---|'] + [f'| {k} | {v} |' for k, v in th.most_common()]
L += ['', '| Niveau | Questions |\n|---|---|'] + [f'| {k} | {v} |' for k, v in cnt(x['niveau'] for x in tous).items()]
L.append(f"\nPièges : {sum(x['piege'] for x in tous)} questions ; photos : {sum(x['format'] == 'images' for x in tous)} ; nouvelles questions : {sum(x['origine'] == 'nouvelle' for x in tous)} ; corrigées : {sum(bool(x.get('corrigee')) for x in tous)}.")
for j, jour in enumerate(out):
    L.append(f"\n## Jour {j + 1} : {datetime.date.fromisoformat(jour['date']).strftime('%A %d/%m/%Y')}\n")
    L.append('| # | Niveau | Thème | Format | Question | Bonne réponse | Source citée | Recoupement |\n|---|---|---|---|---|---|---|---|')
    for x in jour['questions']:
        rep = x['choix'][x['bonne']]
        L.append(f"| {x['position']} | {x['place']}{' *' if x.get('substitution') else ''} | {x['theme']} | {'photos' if x['format'] == 'images' else 'texte'} | {x['question'].replace('|', '/')} | {rep} | "
                 f"{', '.join(dom(u) for u in x['sources'][:2]) or '—'} | {', '.join(dom(u) for u in x['verification']['sources_recoupement'][:2]) or '—'} |")
open(os.path.join(DOSS, 'planning-14j.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n')
print('statuts de la banque :', dict(stat), '; niveaux validés :', dict(cnt(q['niveau'] for q in banque if q['statut'] == 'validee')), '; pièges validés :', sum(q['piege'] for q in banque if q['statut'] == 'validee'))
print('pool planning :', len(PLEIN), '; graine', graine, '; substitutions', subst)
for c in ctl: print(('OK ' if c['ok'] else '!! ') + c['controle'], c['detail'])
