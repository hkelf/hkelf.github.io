# CLAUDE.md — contexte pour Claude Code

Prototype de jeu PvP : duel 3 contre 3 en choix simultanés (Pokémon compétitif × Darkest Dungeon), HTML/JS sans build ni dépendance côté navigateur. Langue du projet : français (code, config, docs, messages de commit).

## Fichiers
- `index.html` : page (CSS inclus), charge `config.js` puis `game.js`.
- `config.js` : **toutes** les valeurs de jeu (règles, éléments, ciblages, attaques et effets, équipements, accessoires, classes, équipes par défaut, contrôles, poids de l'IA, délais). Source de vérité de l'équilibrage.
- `game.js` : moteur, UI, IA, entrées clavier/manette, page récapitulatif, éditeur de config intégré. Ne contient aucune valeur de jeu.
- `sim/` : simulations en série (Node + jsdom) : `cd sim && npm i && node meta.js 20000`. Écrit `meta.json` (ignoré par git).
- `tools/specs.js` : régénère `docs/specs.md` depuis `config.js`.
- `docs/design.md` : document de design (vision, piliers, décisions, pistes, résultats de simulation, questions ouvertes). Export d'un Claude Doc ; peut être en retard sur l'original.
- `docs/specs.md` : spécifications générées (ne pas éditer à la main).

## Règles de travail
- Toute nouvelle valeur de jeu va dans `config.js`, jamais en dur dans `game.js`. Un nouveau mécanisme = un nouveau type d'effet documenté dans les commentaires de `config.js`, géré dans `game.js`, décrit dans `effectLines`/`moveDesc` (infobulles, récap) et dans `tools/specs.js`.
- Après chaque changement de `config.js` : `node tools/specs.js > docs/specs.md`.
- Après un changement d'équilibrage : relancer `sim/meta.js` et résumer l'effet (taux de victoire par classe, élément, accessoire, attaque ; équipes dominantes).
- L'IA est gloutonne (dégâts immédiats + poids réglés à la main) : elle ne fait pas de yomi. Ne pas surinterpréter les simulations sur le setup, le contrôle ou le placement.
- Vérifier la syntaxe avec `node --check game.js config.js`.

## Publication
GitHub Pages depuis `main`, racine du dépôt (`.nojekyll` présent).
