#!/usr/bin/env python3
"""Fichiers de lecture des questions du Défi du jour (donnees/defis-v3/) : lecture-planning-90j.md (jour par jour) et lecture-banque.md (par thème et niveau).
Lit banque.json et planning-90j.json, n'écrit que ces deux fichiers."""
import json, os, datetime, collections
RAC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(RAC, 'donnees', 'defis-v3')
B = json.load(open(os.path.join(D, 'banque.json'), encoding='utf8'))['questions']
P = json.load(open(os.path.join(D, 'planning-90j.json'), encoding='utf8'))
PH = json.load(open(os.path.join(RAC, 'donnees', 'photos.json'), encoding='utf8'))['especes']
STAT = {'validee': 'validée (recoupée par recherche web)', 'relue': 'relue (non recoupée)', 'donnees': 'issue des données de l\'appli (non recoupée)', 'a_verifier': 'à vérifier', 'ecartee': 'écartée'}
JOURS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
NIV = {'facile': 'facile', 'intermediaire': 'intermédiaire', 'difficile': 'difficile'}
def choix(q):
    out = []
    for k, c in enumerate(q['choix']):
        nom = c
        if (q['format'] == 'images' or q.get('plantes')) and c in PH and PH[c][1]: nom = f"{PH[c][1]} (*{c}*)"
        elif q.get('latin'): nom = f"*{c}*"
        out.append(f"- {'**✅ ' if k == q['bonne'] else ''}{'ABCD'[k]}. {nom}{'**' if k == q['bonne'] else ''}")
    return out
def fiche(q, titre, jours=None):
    L = [titre, '']
    L.append(f"{q['question']}" + (f"\n> « {q['texte']} »" if q.get('texte') else '') + ('\n\n*(question en photos : 4 photos, nom latin dessous)*' if q['format'] == 'images' else ''))
    L += [''] + choix(q) + ['']
    L.append(f"**Explication :** {q['explication']}")
    src = q.get('sources') or (q.get('verification') or {}).get('sources_recoupement') or []
    L.append('**Source :** ' + (', '.join(f"<{u.replace(' ', '%20')}>" for u in src[:2]) if src else "données sourcées de l'appli" if q['statut'] == 'donnees' else "connaissance de base (aucune source citée)"))
    L.append(f"*{STAT[q['statut']]}{' · corrigée' if q.get('corrigee') else ''}{' · une seule source, à relire' if (q.get('verification') or {}).get('recoupement') == 'une source ou détail à relire' else ''} · id {q['id']}{' · jours ' + ', '.join(map(str, jours)) if jours else ''}*\n")
    return L
# --- planning ---
used = collections.defaultdict(list)
for j, jour in enumerate(P['jours']):
    for x in jour['questions']: used[x['id']].append(j + 1)
L = ['# Les 90 défis du jour, question par question\n',
     f"Du {datetime.date.fromisoformat(P['debut']).strftime('%d/%m/%Y')} au {(datetime.date.fromisoformat(P['debut']) + datetime.timedelta(days=89)).strftime('%d/%m/%Y')} · 10 questions par jour · bonne réponse en gras avec ✅. **Non publié.**",
     "↻ = question déjà vue plus tôt dans le planning (rejeu au moins 28 jours après).\n", '## Sommaire\n']
L += [f"- [Jour {j + 1} : {datetime.date.fromisoformat(d['date']).strftime('%d/%m')}](#jour-{j + 1})" for j, d in enumerate(P['jours'])] + ['']
for j, jour in enumerate(P['jours']):
    L += [f'<a id="jour-{j + 1}"></a>', f"## Jour {j + 1} : {JOURS_FR[datetime.date.fromisoformat(jour['date']).weekday()]} {datetime.date.fromisoformat(jour['date']).strftime('%d/%m/%Y')}\n"]
    for x in jour['questions']:
        niv = NIV[x['niveau']] + (' (piège)' if x['piege'] and x['niveau'] == 'intermediaire' else '')
        L += fiche(x, f"### J{j + 1} · Q{x['position']} · {niv} · {x['theme']} · {'photos' if x['format'] == 'images' else 'texte'}{' · ↻' if x.get('reutilisation') else ''}")
open(os.path.join(D, 'lecture-planning-90j.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n')
# --- banque ---
pl = [q for q in B if q['statut'] in ('validee', 'relue', 'donnees')]
L = ['# La banque de questions du Défi du jour\n', f"{len(pl)} questions planifiables, rangées par thème puis niveau. Les « jours » renvoient au planning de 90 jours. Les questions à vérifier ou écartées sont en fin de fichier.\n"]
ordre = {'validee': 0, 'relue': 1, 'donnees': 2}
for t in sorted({q['theme'] for q in pl}):
    L.append(f"## {t}\n")
    for n in ('facile', 'intermediaire', 'difficile'):
        qs = sorted([q for q in pl if q['theme'] == t and q['niveau'] == n], key=lambda q: (ordre[q['statut']], q['id']))
        if not qs: continue
        L.append(f"### {t} · {NIV[n]} ({len(qs)})\n")
        for q in qs: L += fiche(q, f"#### {q['question'][:90]}{'…' if len(q['question']) > 90 else ''}{' · piège' if q['piege'] and n == 'intermediaire' else ''}", used.get(q['id']))
rest = [q for q in B if q['statut'] in ('a_verifier', 'ecartee')]
L.append(f"## Non retenues ({len(rest)})\n")
for q in sorted(rest, key=lambda q: (q['statut'], q['id'])):
    L += fiche(q, f"#### [{'à vérifier' if q['statut'] == 'a_verifier' else 'écartée'}] {q['question'][:90]}") + ([f"Motif : {q['note_revue']}\n"] if q.get('note_revue') else [])
open(os.path.join(D, 'lecture-banque.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n')
print(len(P['jours']) * 10, 'questions du planning ;', len(pl), 'planifiables ;', len(rest), 'non retenues')
