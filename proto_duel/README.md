# Prototype de duel

Duel 3 contre 3 en choix simultanés (Pokémon × Darkest Dungeon). Jouable dans le navigateur, clavier ou manettes, humain ou IA de chaque côté.

- `index.html` : la page — ouvrir dans un navigateur pour jouer
- `config.js` : toutes les règles et données du jeu
- `game.js` : le moteur, sans aucune valeur de jeu
- `docs/design.md` : document de design (vision, décisions, résultats de simulation)
- `docs/specs.md` : spécifications générées depuis la config (`node tools/specs.js > docs/specs.md`)
- `sim/` : simulations en série pour dégager la méta (`cd sim && npm i && node meta.js 20000`)

Dans le jeu, le bouton « Récapitulatif » affiche la table des types, les règles, les classes, équipements, accessoires et attaques.

## Publier sur GitHub Pages
Settings → Pages → Source : « Deploy from a branch » → branche `main`, dossier `/ (root)`.
