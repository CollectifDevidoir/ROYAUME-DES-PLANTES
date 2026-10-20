#!/usr/bin/env bash
# Recette rapide : la recette complète et les contrôles principaux, l'un après l'autre (lancée aussi par .github/workflows/recette.yml).
# Échoue si un contrôle sort en erreur OU affiche une ligne « ÉCHEC » (certains anciens contrôles ne renvoient pas de code d'erreur).
# Demande playwright, @electric-sql/pglite et @supabase/supabase-js@2.117.3 (même version que SB_LIB dans index.html).
# Usage, depuis la racine du dépôt : NODE_PATH=$(npm root -g) bash outils/recette_rapide.sh [groupe… ou contrôle…]
#   ex. : bash outils/recette_rapide.sh moteur   ou   bash outils/recette_rapide.sh controle_memoire controle_saisie
cd "$(dirname "$0")/.." || exit 1
# quatre groupes, lancés en parallèle par la CI (.github/workflows/recette.yml) ; sans argument, tous à la suite
GROUPE_recette="recette controle_ordinateur controle_clavier_ordi"
GROUPE_comptes="controle_comptes controle_defi_compte controle_supabase_sql controle_jeu controle_mesures controle_coulisses"
GROUPE_gestes="controle_defi controle_defi_planning controle_fige controle_fluidite controle_entrainement controle_premier controle_categories controle_volets controle_clavier"
GROUPE_moteur="controle_memoire controle_niveaux controle_saisie controle_couleurs controle_sources_cles controle_distracteurs controle_reglages controle_herbier controle_rangs controle_familles_completes controle_synonymes controle_anecdotes controle_confusion controle_equilibre_modes controle_familles controle_famille_ordi controle_illustrations controle_noir"
if [ $# -gt 0 ]; then CONTROLES=""; for g in "$@"; do v="GROUPE_$g"; CONTROLES="$CONTROLES ${!v:-$g}"; done
else CONTROLES="$GROUPE_recette $GROUPE_comptes $GROUPE_gestes $GROUPE_moteur"; fi
ech=""
for c in $CONTROLES; do
  echo "::group::$c"
  sortie=$(node "outils/$c.js" 2>&1); code=$?
  echo "$sortie" | grep -v '^\[agent-proxy\]'
  echo "::endgroup::"
  if [ $code -ne 0 ] || echo "$sortie" | grep -q '^ÉCHEC'; then ech="$ech $c"; echo "ÉCHEC du contrôle $c"; else echo "OK   $c"; fi
done
if [ -n "$ech" ]; then echo "RECETTE RAPIDE : échec de$ech"; exit 1; fi
echo "RECETTE RAPIDE : tout est OK"
