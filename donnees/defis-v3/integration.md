> **Mise à jour du 20/10/2026.** Le planning n'est plus dans `index.html` : il est dans `donnees/defis.json`, chargé par l'appli à l'ouverture du défi ; `index.html` ne garde que `const DQPI={debut,n}`. `outils/defis_integrer.py --ecrire` écrit ces deux éléments. Le reste de ce document décrit l'intégration d'origine (`const DQP` dans le fichier).

# Intégrer le planning de 90 jours en production (sans écraser le défi déjà publié)

**Rien de ceci n'a été fait.** `index.html`, `donnees/defis-questions.json` et les 30 séries en ligne (`const DQ`) sont inchangés. À exécuter seulement après accord.

## Principe
- La table `DQ` (30 séries, cycle actuel) n'est jamais modifiée.
- On ajoute une table à côté, `const DQP={debut:'AAAA-MM-JJ',s:[90 séries]}`, et on remplace la seule ligne `const dfSerie=…` :
  `dfSerie(date)` renvoie la série planifiée si la date tombe dans les 90 jours, sinon, comme aujourd'hui, `DQ[dfNum(date)]` (jours avant le début, et jours après le 90ᵉ : le cycle de 30 reprend tout seul).
- Les réponses enregistrées (`st.df` : date, réponses, propositions) et le serveur (`defis` : jour, score, suite de 10 chiffres) ne dépendent pas du contenu des questions : comptes, classements, statistiques, amis ne changent pas.
- Le champ `niveau` des questions (simple / intermediaire / piege / difficile) n'est lu nulle part dans le jeu : simple métadonnée.

## Étapes
1. **Date de début.** Le planning fourni commence le 2026-10-20. Le premier jour doit être **postérieur au jour de mise en ligne** (la série d'un jour déjà commencé ne doit jamais changer). Si la mise en ligne a lieu après le 19/10, régénérer à la nouvelle date :
   `DEFIS_GRAINES=40 python3 outils/defis_v3.py AAAA-MM-JJ` (3 minutes ; `DEFIS_GRAINE=23` rejoue le tirage retenu), puis `python3 outils/defis_v3_bilan.py`. Relire `planning-90j.md` et `bilan-90j.md`.
2. **Essai à blanc** : `python3 outils/defis_integrer.py` (affiche ce qui serait fait, n'écrit rien).
3. **Écriture** : `python3 outils/defis_integrer.py --ecrire` (insère `const DQP` après `const DQ`, remplace `const dfSerie`).
4. **Contrôles** (Playwright, voir `outils/LISEZ-MOI.md`) :
   - `NODE_PATH=$(npm root -g) node outils/controle_defi_planning.js` : 90 séries bien formées, chaque jour lit sa série, jours avant/après = cycle de 30, un défi planifié joué de bout en bout (date simulée) ;
   - `node outils/controle_defi.js` et `node outils/controle_defi_compte.js` : le défi actuel et les comptes fonctionnent toujours ; `node outils/recette.js` : recette générale.
   (Ces contrôles ont été passés sur une copie d'`index.html` avec le planning intégré : tout est bon ; la copie n'est pas dans le dépôt.)
5. **Mise en ligne** (GitHub Pages) **avant minuit, heure de Paris, la veille du premier jour du planning**.
6. **Retour arrière** : annuler le commit d'intégration (`git revert`), ou retirer la ligne `const DQP=…` et remettre `const dfSerie=d=>DQ.length?DQ[dfNum(d)]:null;`. Les 30 séries d'origine reprennent aussitôt.
7. **Après les 90 jours** : le cycle de 30 séries reprend automatiquement ; prévoir un nouveau planning (`outils/defis_v3.py` à la date suivante, avec de nouvelles questions) avant la fin.

## Précautions
- Ne pas intégrer un planning dont la première date est aujourd'hui ou passée.
- `outils/defis_questions.py --ecrire` ne touche que `const DQ=` : il ne casse pas `DQP`, mais ne le met pas à jour non plus.
- `index.html` grossit d'environ 0,5 Mo (1,34 → 1,86 Mo) : si cela gêne, ne garder dans `DQP` que les 30 prochains jours et en ajouter plus tard.
