# Contrôle automatique de la banque du Défi du jour

Généré par `outils/defis_controle.py`. **1991 questions candidates** ({'générée': 1821, 'en ligne': 13, 'rédigée': 157}), dont 300 déjà dans les séries en ligne.
Aucune question n'est validée par ce contrôle : « conserver » signifie seulement « aucune alerte automatique ». Les sources n'ont pas été consultées.

## Verdicts

| Verdict | Questions |
|---|---|
| conserver | 1260 |
| revoir | 543 |
| écarter | 188 |

## Alertes (nombre de questions concernées)

| Alerte | Certitude | Questions | Signification |
|---|---|---|---|
| SOURCE_HORS_LISTE | info | 696 | domaine de la source absent de la liste de références usuelles (ne dit rien de sa fiabilité) |
| EXPLICATION_PAUVRE | probable | 362 | l'explication ne fait que reformuler la réponse (rien de transférable à retenir) |
| REPONSE_DEVINABLE | probable | 235 | réponse la plus fréquente du modèle (printemps ou été : 97 % des réponses « quand fleurit ») |
| DOUBLON_GENRE | certaine | 188 | plusieurs questions de famille sur le même genre : on n'en garde qu'une (la mieux notée) |
| SURREPRESENTEE | info | 174 | la plante est déjà la bonne réponse de 3 questions mieux notées |
| DISTRACTEURS_FACILES | probable | 126 | choix de ports très différents (arbre, graminée, vivace…) ou familles sans rapport avec la plante |
| PIEGE_A_CONFIRMER | info | 86 | étiquette « piège » posée par le générateur, sans confusion documentée dans PAIRS |
| PHOTO_ORGANE | info | 82 | l'organe demandé (fleurs, fruits, feuillage) n'a pas de photo dédiée pour toutes les plantes : photo générale à la place |
| FORMULATION_MOIS | certaine | 66 | « de avril », « de août », « de octobre » : élision à corriger mécaniquement (non pénalisé : correction triviale) |
| ANECDOTE_LOCALE | info | 50 | anecdote liée à un lieu étranger précis : peu transférable (à juger) |
| INDICE_NOM | probable | 41 | le nom français de la bonne réponse laisse lire le genre ou l'épithète latine |
| PHOTO_REPLI | probable | 28 | une des plantes n'a pas de photo dans l'index : repli sur Wikipédia, rendu non garanti |
| INDICE_ORIGINE | probable | 26 | seule la bonne réponse n'a pas de nom exotique (Japon, japonica…) : on la trouve par élimination |
| SECURITE_TOXICITE | probable | 20 | affirme qu'une plante « n'est pas toxique » ou comestible : formulation de sécurité à relire |

## Par thème

| Thème | conserver | revoir | écarter | total | intérêt faible probable |
|---|---|---|---|---|---|
| Anecdotes | 433 | 23 | 0 | 456 | 5 |
| Familles | 170 | 20 | 188 | 378 | 0 |
| Fruits et toxicité | 24 | 11 | 0 | 35 | 0 |
| Idées reçues | 24 | 0 | 0 | 24 | 0 |
| Milieux | 35 | 85 | 0 | 120 | 0 |
| Noms latins | 222 | 125 | 0 | 347 | 125 |
| Saisons | 166 | 243 | 0 | 409 | 242 |
| Usages et histoire | 28 | 0 | 0 | 28 | 0 |
| Vocabulaire | 25 | 0 | 0 | 25 | 0 |
| Écologie | 133 | 36 | 0 | 169 | 26 |

## Par modèle de génération

| Modèle | conserver | revoir | écarter | total |
|---|---|---|---|---|
| anecdote_images | 143 | 13 | 0 | 156 |
| anecdote_qcm | 290 | 10 | 0 | 300 |
| famille_images | 124 | 1 | 160 | 285 |
| famille_qcm | 33 | 19 | 28 | 80 |
| feuillage_caduc | 67 | 0 | 0 | 67 |
| feuillage_persistant | 51 | 1 | 0 | 52 |
| floraison_hiver | 21 | 0 | 0 | 21 |
| floraison_saison | 0 | 242 | 0 | 242 |
| indigene | 106 | 36 | 0 | 142 |
| milieu_acide | 0 | 5 | 0 | 5 |
| milieu_calcaire | 3 | 24 | 0 | 27 |
| milieu_eau | 2 | 17 | 0 | 19 |
| milieu_ombre | 26 | 0 | 0 | 26 |
| milieu_secheresse | 4 | 39 | 0 | 43 |
| nom_latin_genre | 222 | 13 | 0 | 235 |
| nom_latin_simple | 0 | 112 | 0 | 112 |
| redigee | 168 | 2 | 0 | 170 |
| toxicite | 0 | 9 | 0 | 9 |

## Niveau supposé des questions à conserver

| Niveau supposé | conserver | revoir |
|---|---|---|
| simple | 212 | 194 |
| piege | 107 | 22 |
| difficile | 941 | 327 |

## Base pour un défi de qualité (à relire, aucune n'est validée)

1230 questions sans alerte, sans plante déjà surreprésentée et sans intérêt faible probable : **840** sourcées ou rédigées, **390** reposant sur les tables internes (familles, noms latins, floraisons : botanique à vérifier).

| Thème | simple | piège | difficile | total |
|---|---|---|---|---|
| Anecdotes | 113 | 0 | 319 | 432 |
| Familles | 38 | 9 | 119 | 166 |
| Fruits et toxicité | 5 | 10 | 9 | 24 |
| Idées reçues | 2 | 15 | 6 | 23 |
| Milieux | 0 | 0 | 35 | 35 |
| Noms latins | 0 | 0 | 220 | 220 |
| Saisons | 19 | 13 | 123 | 155 |
| Usages et histoire | 7 | 8 | 13 | 28 |
| Vocabulaire | 7 | 7 | 11 | 25 |
| Écologie | 16 | 31 | 75 | 122 |
| **Total** | 207 | 93 | 930 | 1230 |

Le niveau supposé vient de la notoriété de la plante ou du modèle de génération ; il n'a pas été mesuré sur des joueurs (`difficulte_mesuree` est vide).
