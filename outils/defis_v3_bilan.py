#!/usr/bin/env python3
"""Bilan chiffré de la banque v3 et du planning de 90 jours (lit donnees/defis-v3/banque.json et planning-90j.json, n'écrit que bilan-90j.md)."""
import json, os, collections
cnt = collections.Counter
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'donnees', 'defis-v3')
B = json.load(open(os.path.join(D, 'banque.json'), encoding='utf8')); P = json.load(open(os.path.join(D, 'planning-90j.json'), encoding='utf8'))
Q = B['questions']; plan = [x for j in P['jours'] for x in j['questions']]
NIV = ['facile', 'intermediaire', 'difficile']
L = ['# Bilan : banque v3 et planning de 90 jours\n']
st = cnt(q['statut'] for q in Q)
L += ['## Banque (fiches conservées)\n', '| Statut | Questions | Sens |\n|---|---|---|',
      f"| validée | {st['validee']} | relue, fait recoupé par recherche web (pages citées non ouvertes une à une) |",
      f"| relue | {st['relue']} | relue, fait de connaissance courante, non recoupé par recherche |",
      f"| données | {st['donnees']} | générée à partir des données sourcées de l'appli, cohérente avec elles, non recoupée sur le web |",
      f"| à vérifier | {st['a_verifier']} | non planifiée |", f"| écartée | {st['ecartee']} | non planifiée |",
      f"\nOrigine des validées et relues : rédigées avant {sum(1 for q in Q if q['statut'] in ('validee', 'relue') and q['origine'] != 'nouvelle')} (dont {sum(1 for q in Q if q.get('corrigee'))} corrigées), nouvelles {sum(1 for q in Q if q['statut'] in ('validee', 'relue') and q['origine'] == 'nouvelle')} "
      f"(dont {sum(1 for q in Q if q['origine'] == 'nouvelle' and q['verification']['recoupement'] == 'une source ou détail à relire')} appuyées sur une seule source à relire).\n"]
pl = [q for q in Q if q['statut'] in ('validee', 'relue', 'donnees')]
th = sorted({q['theme'] for q in pl}, key=lambda t: -sum(q['theme'] == t for q in pl))
L += ['### Stock planifiable par thème et niveau (questions distinctes)\n', '| Thème | Facile | Intermédiaire (dont pièges) | Difficile | Total |\n|---|---|---|---|---|']
for t in th:
    c = [[q for q in pl if q['theme'] == t and q['niveau'] == n] for n in NIV]
    L.append(f"| {t} | {len(c[0])} | {len(c[1])} ({sum(q['piege'] for q in c[1])}) | {len(c[2])} | {sum(map(len, c))} |")
c = [[q for q in pl if q['niveau'] == n] for n in NIV]
L.append(f"| **Total** | **{len(c[0])}** | **{len(c[1])} ({sum(q['piege'] for q in c[1])})** | **{len(c[2])}** | **{len(pl)}** |\n")
u = cnt(x['id'] for x in plan)
L += ['## Planning : 900 passages\n', f"- Questions distinctes utilisées : **{len(u)}** ; inédites jouées une seule fois : {sum(v == 1 for v in u.values())} ; rejouées une fois (au moins 28 jours plus tard) : {sum(v == 2 for v in u.values())} ; passages de rejeu : {sum(v - 1 for v in u.values())} sur 900.",
      f"- Statut des passages : validée {sum(x['statut'] == 'validee' for x in plan)}, relue {sum(x['statut'] == 'relue' for x in plan)}, données {sum(x['statut'] == 'donnees' for x in plan)}.",
      f"- Questions nouvelles (rédigées dans cette phase) : {sum(x['origine'] == 'nouvelle' for x in plan)} passages ; corrigées : {sum(bool(x.get('corrigee')) for x in plan)} ; photos : {sum(x['format'] == 'images' for x in plan)} ; pièges : {sum(x['piege'] for x in plan)}.",
      f"- Déjà présentes dans les 300 séries en ligne : {sum(1 for x in plan if x['id'] in {q['id'] for q in Q if q.get('deja_en_ligne')})} passages.\n"]
L += ['| Thème | Passages | Part |\n|---|---|---|'] + [f"| {t} | {n} | {100 * n / 900:.0f} % |" for t, n in cnt(x['theme'] for x in plan).most_common()]
lv = cnt(x['niveau'] for x in plan)
L += ['', f"Niveaux : facile {lv['facile']}, intermédiaire {lv['intermediaire']}, difficile {lv['difficile']} (cible 360 / 360 / 180).", '',
      '| Mécanisme | Passages |\n|---|---|'] + [f"| {m} | {n} |" for m, n in cnt(x['mecanisme'] for x in plan).most_common()]
rel = P['relachements']
L += ['', '## Écarts au format, signalés\n']
by = cnt(t for _, _, t in rel)
for t, n in by.most_common(): L.append(f"- {t} : {n} fois" + (f" (jours : {', '.join(str(j + 1) for j in sorted({j for j, _, tt in rel if tt == t}))})" if n < 40 else ''))
L.append('\nContrôles : ' + ' ; '.join(f"{'OK' if c['ok'] else 'ÉCART'} — {c['controle']}" for c in P['controles'] if not c['ok']) if any(not c['ok'] for c in P['controles']) else '\nTous les contrôles passent.')
L += ['', f"{sum(c['ok'] for c in P['controles'])} contrôles sur {len(P['controles'])} sans écart ; détail dans planning-90j.md."]
open(os.path.join(D, 'bilan-90j.md'), 'w', encoding='utf8').write('\n'.join(L) + '\n'); print('\n'.join(L))
