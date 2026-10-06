# Plan de modifications — Le royaume des plantes

Document de pilotage. **Plan validé.** État : **étapes 1 à 5 terminées**, étapes 6 à 10 à faire.
Chaque remarque de ta réponse à l'audit est rattachée à une tâche (section « Traçabilité » en bas) pour que rien ne se perde.

## Règles de travail

- **Une étape à la fois**, jamais deux en parallèle sur le code (sauf l'étape 9, qui concerne les données).
- Avant chaque étape : copie de sauvegarde de `index.html`.
- À la fin de chaque étape : 8 simulations existantes + tests navigateur sur les tailles d'écran concernées + livraison du fichier + courte liste « ce qui a changé / ce que je n'ai pas pu vérifier ».
- Tu valides l'étape avant que je commence la suivante.
- Ce qui est marqué « ne pas modifier » ou « plus tard » est sorti du plan et listé tout en bas. Contrôle de chaque étape : `outils/controle_ids.py`, `outils/controle_parcours.py` et les 8 simulations.

---

## Vue d'ensemble

| Étape | Contenu | Poids | Dépend de |
|---|---|---|---|
| 1 | Socle : bugs et allègement sans effet visible — **fait** | Petit | — |
| 2 | Écran de jeu sur mobile : proportions, photo nette, zones tactiles — **fait** | Gros | 1 |
| 3 | Analyse « Réglages / Comment ça marche » + jeu d'illustrations (fin des emoji) — **fait** | Moyen | 2 |
| 4 | Réglages, aide, frise des niveaux, objectif réglable — **fait** | Moyen | 3 |
| 5 | Progrès et Herbier — **fait** | Petit | 4 |
| 6 | Mémoire : ralentir légèrement les niveaux 1 à 3 | Petit, avec simulation | 4 |
| 7 | Ordinateur et clavier | Gros | 2, 3 |
| 8 | File d'attente des photos et plafond du cache | Moyen | 1 |
| 9 | Contenu botanique : clés, fiabilisation, sourçage | Très gros, par lots | Peut démarrer dès que tu veux |
| 10 | Clôture : nettoyage, tests complets, mise à jour de l'audit | Moyen | 1 à 8 |

Ordre choisi : la mise en page mobile (2) vient avant tout le reste parce qu'elle détermine l'espace disponible ; les illustrations (3) arrivent avant les réglages (4) pour dessiner l'engrenage et les nouvelles icônes une seule fois ; l'ordinateur (7) vient après les icônes pour ne tester les tailles qu'une fois.

---

## Étape 1 — Socle — TERMINÉE

| ID | Tâche | Résultat |
|---|---|---|
| 1.1 | **T1** : animations. | `pop` (halo vert de la bonne réponse) est de nouveau la seule définition de ce nom ; une définition en double de `fade` et de `rise` retirée. Plus aucun nom d'animation défini deux fois. |
| 1.2 | **U9** : noms français en double. | « Chalef » devient **Chalef d'Ebbing** (Elaeagnus × submacrophylla) et **Chalef piquant** (Elaeagnus pungens) ; « Genêt d'Espagne » reste à Genista hispanica et Spartium junceum devient **Spartier à tiges de jonc**. 663 noms uniques dans le tableur et dans l'appli. Sources : EPPO, auJardin.info, INPN et Wikipédia FR ; les pages de Tela Botanica et de Jardin ! l'Encyclopédie n'ont pas remonté dans les recherches. |
| 1.3 | **T2** : données non lues. | Retirées de l'appli : table de clés de genre `G` (14 Ko), description / usages / critères / « à distinguer » / entretien de la fiche de genre, caractères et anecdote des familles. **Conservées dans le tableur.** Export désormais rejouable : `outils/export_donnees.py`. Appli : **776 Ko → 685 Ko**. Les données affichées sont identiques à l'ancienne version (comparaison champ par champ), sauf les trois noms et deux textes « À savoir » corrigés. |
| 1.3 bis | **T3** (prévue en étape 10) résolue au passage : plus aucune espèce n'est à la fois dans la table des fiches sourcées et dans celle des descriptions rédigées (21 → 0). | — |
| 1.4 | **T9** : identifiants générés par le JS. | 19 identifiants préfixés selon leur conteneur (`fam-`, `fch-`, `sh-`, `q-`, `pro-`, `herb-`). Contrôle réutilisable `outils/controle_ids.py` : 0 doublon dans 12 états de l'appli. |
| 1.5 | Outils de test. | `outils/controle_parcours.py` (7 vérifications dont le bouton des confusions, l'indice, l'erreur à deux espèces) et `outils/LISEZ-MOI.md`. |

Remarques : les anciennes simulations n° 4 et 5 appelaient une fonction supprimée depuis longtemps (`explain`) : elles sont abandonnées, remplacées par les contrôles ci-dessus.

---

## Étape 2 — Écran de jeu sur mobile — TERMINÉE

| ID | Tâche | Résultat |
|---|---|---|
| 2.1 | **U1** : mêmes proportions pour tous les exercices, catégories toujours cachées après réponse. | Un cadre unique (hauteur de l'écran moins l'en-tête et la barre d'onglets) pour le QCM, les 4 photos et la saisie. Contrôle sur 8 tailles d'écran × 3 exercices : catégories cachées dans les 24 cas, **même position de défilement pour les trois exercices**. |
| 2.2 | **M3** : photo + 4 options sans défilement sur 640 px. | Vérifié à 360×640 et 375×667 : photo à 38 % de la hauteur, 4 réponses entièrement visibles au-dessus de la barre d'onglets. |
| 2.3 | **M6** : adaptations d'écran. | Écrans courts (< 700 px de haut) : en-tête et onglets compacts (la ligne « encore N pour devenir… » est masquée) ; paysage téléphone : photo à gauche, réponses à droite ; tablette : le reste de l'espace va entre la photo et la question ; marges d'encoche (zones de sécurité) prises en compte. |
| 2.4 | **M1** : zones tactiles de 44 px sans alourdir. | Zone réactive agrandie par marges invisibles, dessin inchangé : 97 zones mesurées, toutes ≥ 44 px. Exception : les 14 barres de régularité (22 px de large, U6 non modifié). |
| 2.5 | **M2** : textes importants à 12 px. | Liste validée, 8 textes passés à 12 px : catégories, onglets, noms de l'Herbier, valeurs des conditions de culture, « encore N pour devenir… », « N acquises », « toutes les plantes mélangées », ligne de famille de la correction. Correction : la ligne de famille (`<small class="fm">`) restait à 11,5 px, car `small.fm` l'emportait sur `.fm`. Exception voulue : sous 360 px de large, les catégories passent à 11,5 px pour tenir sur une ligne. |
| 2.6 | **U2** : photo nette en correction. | Le voile est percé autour de la photo (ou de la grille des 4 photos) ; le glissement des photos fonctionne ; le voile redevient entier quand une fiche s'ouvre. |

Correction faite en passant : l'en-tête collant dépassait de 2 px de chaque côté (c'était mon élargissement de l'étape UX précédente), ce qui rendait la page défilable de quelques pixels en largeur. Il est maintenant exactement pleine largeur.

Contrôles ajoutés : `outils/controle_ecran_jeu.py` (24 cas), `outils/controle_zones_tactiles.py`.

---

## Étape 3 — Analyse « Réglages » + illustrations — TERMINÉE

Résultat : **option D retenue** (voir `analyse-reglages-aide.md`) : réglages en bas de Progrès et sur l'anneau d'objectif, « ? » inchangé. Icônes dessinées en place ; le dernier emoji (🌿, icône de l'onglet du navigateur) est remplacé par une feuille dessinée : plus aucun emoji dans le fichier.

| ID | Tâche | Livrable |
|---|---|---|
| 3.1 | **U8 — analyse** : où placer « Réglages » et faut-il déplacer « Comment ça marche » ? Je compare 3 options (engrenage dans l'en-tête à côté du « ? » ; quatrième onglet ; un seul bouton qui regroupe aide et réglages) selon la charge visuelle, la découverte par un débutant et l'usage au pouce. | Une page de recommandation avec 2 ou 3 maquettes, **avant toute construction**. |
| 3.2 | **Design 1 — inventaire des emoji** (voir liste ci-dessous) puis **création d'un jeu d'icônes dessinées** dans le style des rangs et catégories actuels (mêmes traits, mêmes verts). | Planche des icônes validée par toi. |
| 3.3 | Remplacement dans toute l'interface, avec le mode sombre et les libellés d'accessibilité. | Plus aucun emoji dans l'interface. |
| 3.4 | **Design 2** : la forme noire n'est pas constatée sur ton mobile → **aucune action**. | — |

Emoji trouvés dans l'interface (inventaire fait) :

| Où | Emoji |
|---|---|
| Barre d'onglets | 🌳 📖 📈 |
| Conditions de culture (fiche) | ☀️ 🌱 💧 🧪 ❄️ |
| Étiquettes de comparaison | ✅ ❌ |
| Badge « Acquise » | ✨ et ✓ |
| Mode entraînement (bandeau et message de fin) | 🎯 (3 occurrences) |
| Champ de recherche de l'herbier | 🔍 |
| Tuile sans photo (CSS) | 🌿 |
| Signes typographiques à harmoniser | ✕ de fermeture, ▾ ▴ des boutons « Plus de détails » |

---

## Étape 4 — Réglages et aide — TERMINÉE

Résultat :
- **4.1 / 4.8** : volet « Réglages » présenté comme le volet de correction (poignée, marges, séparations fines), ouvert depuis la ligne « Réglages » en bas de Progrès ou en touchant l'anneau d'objectif (aussi au clavier : Entrée ou Espace). Fermeture par la croix, Échap, un toucher à côté ou un glissement vers le bas. Le « ? » ne bouge pas ; Progrès a une ligne « Comment ça marche » qui ouvre la même aide. Aucun élément ajouté sur l'écran de jeu ; deux gestes au plus pour atteindre un réglage.
- **4.2** : objectif 20 / 30 / 40 / 60, **40 par défaut**. L'anneau (« / 40 »), la carte « Aujourd'hui », l'échelle de l'historique et la célébration lisent le réglage. Migration : une progression enregistrée sans réglage reçoit 40 et la vibration active, sans rien perdre. Les réglages sont dans la sauvegarde et survivent à la réinitialisation.
- **4.3** : l'aide affichait « 50 plantes par jour » alors que le code comptait 30 ; elle lit maintenant l'objectif.
- **4.4** : frise 1-2-3 apprentissage / 4 acquise / 5-6 entretien dans « Comment ça marche », lisible dès 320 px, avec trois lignes d'explication. Aucun niveau affiché en jeu.
- **4.5** : vibration active par défaut, interrupteur mémorisé ; il s'applique aux trois vibrations de l'appli (réponse, célébration, écran d'accueil).
- **4.6** : la carte « Sauvegarde » quitte Progrès. Dans le volet : « Sauvegarde » (Copier / Restaurer, dans le volet sans fenêtre du navigateur) et « Réinitialiser » avec confirmation dans le volet.
- **4.7** : la restauration contrôle la forme des données (plantes, niveaux 0 à 6, compteurs, historique, listes) avant d'écrire ; un texte invalide est refusé avec un message précis et « Rien n'a été modifié ».

Contrôle : `outils/controle_reglages.js` (26 vérifications dans Chromium, à 360×640 ; affichage vérifié à 320, 360 et 390 px, clair et sombre).

| ID | Tâche | Critère de réussite |
|---|---|---|
| 4.1 | **U8** : construire le volet Réglages selon la recommandation validée en 3.1, **sans alourdir l'interface**. | Au plus un point d'entrée ajouté ; trois gestes maximum pour atteindre un réglage. |
| 4.2 | **Audit mémoire 2** : objectif quotidien **de 40 exercices par défaut, réglable** (liste de choix courte). Anneau et barre du haut liés à ce réglage. Migration douce pour l'historique déjà enregistré. | Changer l'objectif met l'anneau, l'aide et les félicitations à jour. |
| 4.3 | **U5** : le texte d'aide lit la valeur de l'objectif (plus jamais de nombre écrit en dur). | Test : changer l'objectif change le texte. |
| 4.4 | **U3** : dans « Comment ça marche », **frise visuelle des niveaux** : niveaux 1-2-3 = apprentissage, niveau 4 = acquise, niveaux 5-6 = entretien, avec une explication en quelques lignes. **Pas d'indication du niveau en cours sur chaque réponse** ; on garde la mention « Acquise » comme aujourd'hui. | Frise lisible en dessous de 360 px de large ; aucun niveau affiché en jeu. |
| 4.5 | **M7** : vibration active par défaut, désactivable dans les réglages. | Interrupteur fonctionnel et mémorisé. |
| 4.6 | **Design 3** : **sauvegarde (copier / restaurer) et réinitialisation** dans les réglages ; la carte « Sauvegarde » quitte l'écran Progrès. Réinitialisation avec confirmation. | Plus de bouton de réinitialisation ailleurs. |
| 4.7 | **T11** : l'import (« Restaurer ») valide la forme des données avant de les écrire. | Un fichier invalide est refusé avec un message clair, sans abîmer l'état en cours. |
| 4.8 | Relocalisation éventuelle de « Comment ça marche » selon 3.1. | Cohérent avec la recommandation retenue. |

---

## Corrections avant l'étape 5 (retours sur les étapes 2 et 4) — FAITES

| N° | Demande | Résultat |
|---|---|---|
| C1 | Rien ne bouge en fond tant que la fiche est dépliée, hormis le défilement des photos. | Page figée (molette, touches, doigt) ; restent possibles le défilement des photos, celui du contenu de la fiche et les fenêtres ouvertes. Le glissement de la carte vers la question suivante est désactivé fiche dépliée. Fiche réduite en bandeau : le fond redevient libre. Le trou du flou ne se décale plus. |
| C2 | Photo toujours au même endroit en QCM et en écriture, jamais recouverte ; fiche jusqu'en bas de l'écran ; onglets de retour à « Question suivante ». | La fiche ne monte jamais au-dessus du bas de la photo (elle défile à l'intérieur) et descend jusqu'en bas de l'écran ; les onglets se retirent tant qu'elle est affichée. La carte est replacée sous l'en-tête d'un coup au moment de la réponse. En écriture, la photo ne bouge plus avant, pendant ni après la réponse. Téléphone en paysage : la fiche prend la place des réponses, à droite de la photo. |
| C3 | Écriture : barre de réponse juste sous la photo, consigne en dessous ; écran figé à l'ouverture du clavier. | Ordre : photo, barre de réponse, consigne, indice. Plus de défilement automatique au toucher de la barre ; si le clavier la cacherait, la photo raccourcit par le bas (son haut ne bouge pas). |
| C4 | 4 photos : tout l'arrière-plan reste flouté à l'apparition de la fiche. | Fait. |
| C5 | Fond entièrement flouté à l'ouverture des détails des fiches. | « Plus de détails » ferme le trou du flou ; les fenêtres de fiche étaient déjà entièrement floutées. |

Contrôles : `outils/controle_fige.js` (29 vérifications ; échoue sur l'ancienne version), `outils/controle_clavier.js` (clavier simulé, 4 tailles d'écran), avec un banc d'essai qui simule iNaturalist et les photos (`outils/banc_essai.js`, `outils/lance_exercice.js`).

---

## Étape 5 — Progrès et Herbier — TERMINÉE

Résultat : carte « Collection » retirée de Progrès ; dans chaque catégorie de l'Herbier, les acquises d'abord puis les non acquises, chacune par ordre alphabétique du nom latin (nom vernaculaire toujours sur l'image, disposition et pastille « + N à découvrir » inchangées). Contrôle : `outils/controle_herbier.js`.

Demandes ajoutées à cette étape :
- **Objectif quotidien** : choix de 10 à 100 par pas de 10 (40 par défaut), en deux lignes de cinq dans le volet Réglages. Un objectif enregistré hors de cette liste repasse à 40.
- **Progrès** : la ligne « Comment ça marche » est retirée ; l'aide reste sur le « ? » de l'en-tête. Seule la ligne « Réglages » reste en bas de Progrès.

| ID | Tâche | Critère de réussite |
|---|---|---|
| 5.1 | **U4** : supprimer la carte « Collection » de Progrès. | Plus de doublon avec l'Herbier. |
| 5.2 | **Herbier** : classement **par ordre alphabétique du nom latin**, en gardant le nom vernaculaire sur l'image. **Rien d'autre ne change** (disposition, pastille « + N à découvrir », titres). Les acquises restent en premier. | Dans chaque catégorie : acquises d'abord en ordre alphabétique latin, puis les non acquises en ordre alphabétique latin. Exemple : un *Abelia* non acquis ne passe jamais avant un *Betula* acquis. |

---

## Étape 6 — Mémoire

| ID | Tâche | Critère de réussite |
|---|---|---|
| 6.1 | **Audit mémoire 3** : ralentir **un tout petit peu** la progression des niveaux 1 à 3 **sans toucher au reste de l'algorithme** (niveaux 4 à 6, intervalles, tirage, exercices). Le rythme actuel convient : pas de principe de répétition espacée appliqué de façon agressive qui casserait le plaisir de jeu. Je propose deux variantes minimales, mesurées avec la simulation avant/après. | **Ralentissement de 10 à 15 % au maximum** (mesuré en nombre de questions pour atteindre « acquise ») ; rétention de la simulation inchangée ou meilleure ; tu choisis la variante sur des chiffres. |

---

## Étape 7 — Ordinateur et clavier

| ID | Tâche | Critère de réussite |
|---|---|---|
| 7.1 | **D1 / T5** : mise en page à deux colonnes au-dessus d'environ 900 px (photo d'un côté, réponses et correction de l'autre). | Plus de grand vide latéral à 1366 et 1920 px. |
| 7.2 | **D2** : photo limitée à environ 50 % de la hauteur de la fenêtre. | Photo + 4 options visibles sans défilement à 1366×800. |
| 7.3 | **D3** : la correction s'affiche **à côté** de la photo, plus au-dessus. | La photo reste visible pendant la lecture des clés. |
| 7.4 | **D4** : galerie de 3 à 4 photos plus grandes dans « Plus de détails ». | Photos agrandissables au clic. |
| 7.5 | **D5 / T6** : accessibilité clavier : focus visible partout, `Entrée` valide, touches 1 à 4 pour les QCM, libellés et `aria-live` pour la correction. | Parcours complet réalisable sans souris. |

---

## Étape 8 — Photos : file d'attente et cache

| ID | Tâche | Critère de réussite |
|---|---|---|
| 8.1 | **M9** : étudier puis, si c'est faisable, installer une **file d'attente de requêtes photos** : plante affichée en priorité, annulation des requêtes devenues inutiles, pause intelligente en cas de limite. | Mesure du nombre de requêtes par minute en usage rapide ; aucun écran « aucune image » dû à la limite dans mes scénarios. |
| 8.2 | **T8** : plafonner le cache des photos (par exemple 300 entrées, les plus anciennes sortent d'abord). | Le stockage local reste sous une limite fixée. |

---

## Étape 9 — Contenu botanique (long chantier, par lots)

| ID | Tâche | Critère de réussite |
|---|---|---|
| 9.1 | **Pédagogie 1** : fixer les règles de rédaction des clés : 3 à 5 critères, **visuels**, **discriminants**, courts ; la première clé doit séparer l'espèce de ses congénères présents dans le jeu ; pas de critère d'habitat ou de toxicité ; pas de mot isolé générique (« persistant », « alternes ») sauf s'il discrimine vraiment. | Règles validées par toi sur 10 espèces d'essai. |
| 9.2 | **Sources limitées** pour éviter un travail encyclopédique : **Tela Botanica** et **Jardin ! l'Encyclopédie** (nature.jardin.free.fr). Les autres sites (Info Flora, Kew, RHS, Missouri Botanical Garden, Floriscope…) ne sont consultés **que si l'information utile n'existe pas** sur ces deux sources. Chaque lot cite ses liens exacts dans le tableur. Points d'attention : les pages de Tela Botanica ne remontaient pas dans mes recherches, je testerai l'accès direct dès le premier lot d'essai. | Colonne « Sources des clés » renseignée pour chaque espèce revue, avec la mention de la source principale. |
| 9.3 | Ordre de traitement : (a) genres denses (Acer 16, Quercus 15, Prunus 15, Pinus 11…) ; (b) espèces dont les clés sont d'un seul mot ou très partagées (240 clés d'un mot, 67 clés partagées par 4 espèces ou plus) ; (c) le reste, par catégorie. | Lots de 20 espèces, validation après chaque lot. |
| 9.4 | Mise à jour du tableur puis de l'appli à chaque lot, avec relance des tests. | Aucun écran qui régresse. |
| 9.5 | **Charge mentale** : fiabiliser et sourcer les autres données (rusticité, écologie, descriptions, « À découvrir », familles et genres). Statut par champ dans le tableur : « sourcé / à recouper ». Pas de mention affichée dans l'appli tant que tu ne l'as pas demandé. | Taux de champs sourcés suivi dans le tableur. |

---

## Étape 10 — Clôture

| ID | Tâche | Critère de réussite |
|---|---|---|
| 10.1 | **T3** : déjà traitée en 1.3 bis. Vérification finale seulement. | 0 doublon. |
| 10.2 | **T4** : retirer les classes CSS devenues inutiles et la constante inutilisée. | Mesure avant/après. |
| 10.3 | **T10** : nettoyage structuré du code (regroupement des constantes, retrait des anciennes logiques). | Aucune simulation ne casse ; fichier plus court. |
| 10.4 | Passage complet : simulations, tests navigateur sur les tailles d'écran de référence (360×640, 375×667, 390×844, 412×915, 768×1024, 1366×800, 1920×1080). | Rapport de recette. |
| 10.5 | Mise à jour du rapport d'audit : « avant / après ». | Document final. |

---

## Décisions confirmées

1. **Objectif quotidien** : 40 exercices par jour par défaut, réglable.
2. **U2** : seule la photo reste nette ; le reste de la page garde son voile.
3. **U1** : le QCM sert de référence de hauteur pour tous les exercices.
4. **Herbier** : seul l'ordre change (alphabétique latin), séparément pour les acquises puis pour les non acquises.
5. **Emoji** : ✓, ✕, ▾ et ▴ sont aussi remplacés par des tracés dessinés.
6. **Points d'audit non retenus** : délai avant « acquise », intervalles plus longs, validation d'une faute de frappe (P1, P2, P3). Seul est prévu un léger ralentissement des niveaux 1 à 3, **10 à 15 % au maximum**, sans casser le plaisir de jeu.
7. **Sources** : réduites à Tela Botanica et Jardin ! l'Encyclopédie ; les autres seulement si l'information utile manque.
8. **Ordre des étapes** : celui de la vue d'ensemble.

---

## Traçabilité : chaque remarque et sa tâche

| Remarque | Décision | Tâche |
|---|---|---|
| U1 | À corriger | 2.1 |
| U2 | À corriger | 2.6 |
| U3 | À corriger — **fait** | 4.4 |
| U4 | À corriger — **fait** | 5.1 |
| U5 | À corriger — **fait** | 4.3 |
| U6 | Ne pas modifier | — |
| U7 | Ne pas modifier | — |
| U8 | À corriger (avec analyse) — **fait, option D** | 3.1, 4.1, 4.8 |
| U9 | À corriger — **fait** | 1.2 |
| M1 | À corriger sans alourdir | 2.4 |
| M2 | Textes importants seulement — **fait** | 2.5 |
| M3 | À corriger | 2.2 |
| M4 | OK, rien à faire | — |
| M5 | Ne pas modifier | — |
| M6 | À corriger | 2.3 |
| M7 | À corriger — **fait** | 4.5 |
| M8 | Plus tard | — |
| M9 | À étudier puis corriger | 8.1 |
| D1 | À développer | 7.1 |
| D2 | À modifier | 7.2 |
| D3 | À modifier | 7.3 |
| D4 | À modifier | 7.4 |
| D5 | À modifier | 7.5 |
| Pédagogie 1 | À faire | 9.1 à 9.4 |
| Mémoire 2 | À faire — **fait** | 4.2 |
| Mémoire 3 | À faire | 6.1 |
| Design 1 | À faire — **fait** | 3.2, 3.3 |
| Design 2 | Aucune action | 3.4 |
| Design 3 | À faire — **fait** | 4.6 |
| Herbier | À faire — **fait** | 5.2 |
| T1 | À modifier — **fait** | 1.1 |
| T2 | OK : ne pas exporter, conserver au tableur — **fait** | 1.3 |
| T3 | OK — **fait** | 1.3 bis (vérif. en 10.1) |
| T4 | OK | 10.2 |
| T5 | OK (voir D1) | 7.1 |
| T6 | OK | 7.5 |
| T7 | Plus tard | — |
| T8 | OK | 8.2 |
| T9 | OK — **fait** | 1.4 |
| T10 | OK | 10.3 |
| T11 | OK — **fait** | 4.7 |
| Charge mentale (données à fiabiliser et sourcer) | À faire | 9.5 |

### Sorties du plan

- **Ne pas modifier** : U6, U7, M5.
- **Plus tard** : M8 (mode hors connexion), T7 (service de cache hors ligne).
- **Aucune action** : Design 2 (forme noire non constatée), M4.
- **Non retenus de l'audit** : P1, P2, P3 (algorithme de mémoire), couverture des confusions (16 %), indication « fiche à recouper » dans l'interface.
