#!/usr/bin/env bash
# Recette rapide : la recette complète et les contrôles principaux, l'un après l'autre (lancée aussi par .github/workflows/recette.yml).
# Échoue si un contrôle sort en erreur OU affiche une ligne « ÉCHEC » (certains anciens contrôles ne renvoient pas de code d'erreur).
# Demande playwright, @electric-sql/pglite et @supabase/supabase-js@2.117.3 (même version que SB_LIB dans index.html).
# Usage, depuis la racine du dépôt : NODE_PATH=$(npm root -g) bash outils/recette_rapide.sh
cd "$(dirname "$0")/.." || exit 1
CONTROLES="recette controle_memoire controle_niveaux controle_saisie controle_sources_cles controle_fige controle_reglages controle_herbier controle_entrainement controle_jeu controle_rangs controle_synonymes controle_anecdotes controle_defi controle_defi_planning controle_mesures controle_comptes controle_defi_compte controle_supabase_sql"
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
