# Nouveau jeu

## Vision

Un jeu PvP qui repart des quatre concepts au cœur du Pokémon compétitif : affronter un humain, décider en même temps que lui, construire son équipe à l'avance, et ne voir qu'une partie de l'équipe adverse. L'analyse de départ est dans le doc [pokemon](https://claude.ai/code/artifact/9c3fa014-6a1f-4f65-895d-13c9b1f6bc87).

**Parti pris : un duel mental, pas du pilotage d'équipe.** Le jeu vise le duel de prédiction épuré (yomi, information cachée), pas la sensation de manœuvrer une escouade — le pilotage d'équipe n'a pas de valeur ludique ici. C'est pourquoi un seul personnage agit par tour : ça garde le choix simultané lisible (une décision à anticiper, pas trois actions croisées). Les deux personnages qui n'agissent pas ne sont pas du temps mort : ils occupent des cases, menacent et ouvrent des options pour les tours suivants, comme des pièces d'échecs qui comptent même quand elles ne bougent pas.

## Les piliers retenus

| Pilier | Terme technique | Ce qu'on reprend de Pokémon |
| --- | --- | --- |
| PvP | Jeu à deux joueurs, adversaire adaptatif | La difficulté vient d'un humain qui s'adapte, pas d'une IA à résoudre |
| Choix simultané | Jeu à coups simultanés ; stratégie mixte ; yomi | Les deux joueurs choisissent à l'aveugle, puis le tour se résout : on prédit au lieu de réagir |
| Team building | Construction ; jeu en deux étapes ; métagame | On gagne en partie avant le match, en préparant une équipe contre tout le métagame |
| Info partielle sur l'équipe adverse | Information incomplète ; inférence | On voit une partie de l'équipe d'en face et on déduit le reste au fil du match |

## Format de combat

Base : le combat de *Darkest Dungeon*, où chaque camp aligne ses personnages sur des positions numérotées, chaque compétence ne s'utilise que depuis certaines positions et ne vise que certaines positions adverses, et où certaines compétences déplacent les personnages. On le réduit à un 3 contre 3, joué en choix simultanés.

| Règle | Décision | Ce que ça apporte aux piliers |
| --- | --- | --- |
| Plateau | Une ligne de 3 cases par camp | La position devient une ressource à gérer |
| Ciblage | Chaque attaque vise une case fixe, inscrite dans l'attaque (case d'en face, l'avant, toute la ligne, l'arrière…) : le joueur ne choisit jamais la cible, seulement l'attaque | La décision passe de « où je frappe » (réaction) à « quelle attaque je lance » (anticipation) ; si l'adversaire bouge, l'attaque touche ce qui occupe la case. Exige une vraie variété de schémas de ciblage, d'où des attaques organisées en familles par schéma |
| Mouvement | Certaines attaques déplacent (soi, un allié ou un ennemi : pousser, tirer, échanger) | Rotation et tempo : déplacer l'adversaire peut ruiner son prochain coup |
| Switch | Équipe de 4 : 3 sur le terrain, 1 au banc, caché jusqu'à son entrée. Le switch prend l'action du tour et passe avant les attaques ; le remplaçant prend la case du sortant, qui devient le nouveau remplaçant | Le remplaçant encaisse le coup prévu à sa place. Avec un seul remplaçant, le mind game porte sur quand switcher et qui sort ; le banc caché compense en information cachée, et il tourne en permanence |
| Activation | Un seul personnage agit par tour ; celui qui vient d'agir est fatigué et n'a accès qu'au move pool universel (voir Fatigue) | Chaque tour se résume à un choix : quel personnage, quelle attaque ; la case visée découle de l'attaque |
| Fatigue | Un personnage qui vient d'agir est fatigué au tour suivant. Il n'est ni bloqué ni passif : il occupe sa case, peut être frappé, déplacé ou soigné comme les autres, mais perd son move pool et bascule sur le move pool universel de repli | La fatigue devient une décision plutôt qu'une interdiction : faire agir le frais avec tout son arsenal, ou le fatigué avec des options réduites. Plus de temps mort, et l'adversaire sait qui est diminué |
| Ordre de résolution | Priorité de l'action d'abord, puis stat de Vitesse du monstre activé | Le tempo devient un pilier : agir avant l'adversaire décide si un déplacement esquive une attaque |
| Attaques | 4 par monstre, nombre à valider en test | 2 personnages frais × 4 attaques, plus le move pool universel du fatigué et les switchs : une douzaine de choix par tour, sans choix de case |

### Fatigue et move pool universel

**Décision : le fatigué agit, mais avec le move pool universel.** Ce répertoire de repli est partagé par tous les personnages fatigués. On le teste avec une attaque faible, en plus d'actions utilitaires (repositionnement, mise en garde) ; à retirer si l'attaque faible casse l'intérêt de la rotation. Cette règle remplace l'ancienne (« un personnage fatigué ne peut pas agir ») : elle supprime le temps mort tout en gardant le fatigué nettement diminué.

**À tester : le fatigué subit +1 dégât par coup reçu**, appliqué après le multiplicateur d'affinité. Comme les attaques visent des cases fixes, cette vulnérabilité ne se joue pas au ciblage mais au positionnement : si mon fatigué est sur une case que l'adversaire va frapper, je veux l'en sortir (déplacement, switch) ; l'adversaire, lui, peut chercher à pousser ou tirer mon fatigué sur la case qu'il va frapper. La fatigue, les attaques à case fixe et les actions de déplacement se répondent alors. Malus volontairement léger : avec les one-shots déjà possibles, un malus plus fort ferait double punition.

**À tester : le switch sauve le fatigué.** Un personnage fatigué peut sortir par switch, et le remplaçant entre frais. Le switch devient la sortie de secours d'un fatigué menacé sur une case frappée, ce qui renforce le jeu de positionnement ; le prix reste l'action du tour.

**Décision : condition de victoire.** Le premier joueur qui n'a plus aucun personnage debout a perdu.

**Fin de match.** Avec le move pool universel, un personnage seul et fatigué peut encore agir : le blocage d'un tour sur deux disparaît. Si ça ne suffit pas, l'option de repli est un seuil : la fatigue ne s'applique que tant qu'au moins deux personnages sont debout.

**Décision : après un K.O., le remplaçant entre automatiquement** sur la case libérée, en fin de tour. Conséquences : le banc caché se révèle au premier K.O., et le switch n'est plus possible ensuite, faute de remplaçant.

### Plateau rétrécissant

**À tester : le plateau rétrécit avec l'équipe.** 3 cases à 3 personnages, 2 cases à 2, 1 case à 1. Plus de cases vides ni de trous à gérer.

**Redirection des ciblages.** Quand le plateau rétrécit, les schémas de ciblage se reportent sur les cases restantes. Principe posé : à 2 cases, un ciblage central vise le front. Reste à établir la correspondance complète de chaque schéma pour 2 cases puis 1 case.

**Décision : une attaque multi-cases frappe plusieurs fois sur plateau réduit.** Chaque case visée est redirigée, et quand plusieurs arrivent sur la même case, les coups s'additionnent. Ex. une attaque de ligne, à 2 cases : avant ×2, arrière ×1 ; à 1 case : ×3. L'équilibre passe par deux contreparties : les attaques de zone sont plus faibles à chaque coup, et la Défense s'applique à chaque coup séparément (formule additive), donc une Défense élevée compense.

**À tester : correspondance des ciblages et mouvements sur plateau réduit.**

| Cas | 3 cases | 2 cases | 1 case |
| --- | --- | --- | --- |
| Avant | avant | avant | la case |
| Centre | centre | avant | la case |
| Arrière | arrière | arrière | la case |
| En face (relatif au lanceur) | même rang | rang du lanceur, puis redirection (centre → avant) | la case |

Ciblage relatif, lanceur à 2 cases contre une cible à 3 : avant → avant, arrière → arrière ; le centre adverse est un angle mort (voir plus bas).

| Mouvement | 2 cases | 1 case |
| --- | --- | --- |
| Pousser | avant → arrière ; déjà à l'arrière : ne bouge pas, est touché | aucun mouvement, l'effet de l'attaque s'applique seul |
| Tirer | arrière → avant ; déjà à l'avant : ne bouge pas | idem |
| Échanger | les deux permutent | idem |

**Transition.** Le plateau rétrécit en fin de tour, avec l'entrée du remplaçant ; les attaques encore à résoudre ce tour se jouent sur l'ancien plateau. Les survivants gardent leur ordre : le plus avancé prend l'avant.

**Angle mort des ciblages relatifs.** Une attaque à ciblage relatif au lanceur (ex. « je frappe la case en face de la mienne ») peut, à 2 cases, ne jamais pouvoir toucher une case donnée, faute de position correspondante côté lanceur. Ce n'est pas un défaut à corriger dans les règles : le personnage a 3 autres attaques parmi ses 4, qui comblent le trou. C'est une contrainte de construction (éviter 4 attaques au même angle mort), à garder en tête au moment de dessiner les move pools.

## Contrôles : écran partagé façon Pokémon Stadium

**Décision : un seul écran, le secret porté par le geste et non par l'information.** Pensé pour le jeu en local, côte à côte dans un salon. Les deux joueurs voient tout l'état du jeu (terrain, personnages, attaques disponibles) ; seule l'intention reste cachée, le temps de la saisie. Pas de pass-and-play ni d'écran de transition.

| Geste | Effet |
| --- | --- |
| Gâchette gauche | Choisit le personnage de gauche |
| Gâchette droite | Choisit le personnage de droite |
| Aucune gâchette | Choisit le personnage du milieu |
| Un des 4 boutons | Choisit l'attaque (4 par personnage ; pour le fatigué, celles du move pool universel) |

Chaque joueur saisit une seule combinaison gâchette + bouton, en même temps que l'adversaire, puis le tour se révèle. C'est pour garder ce geste unique que le joueur ne choisit pas la case visée. Switch : la gâchette désigne qui sort, et la gâchette haute (bumper) déclenche le switch ; avec un banc d'un seul personnage, il n'y a pas de remplaçant à choisir.

## Statistiques

Les stats doivent servir le format : Vitesse pour l'ordre de résolution, PV et Défense pour encaisser à la place d'un autre après un switch. Quatre stats suffisent pour démarrer ; les deux optionnelles ne valent le coup que si elles créent de vrais choix.

| Stat | Rôle | Statut |
| --- | --- | --- |
| PV | Combien de coups le monstre encaisse avant d'être K.O. | Socle |
| Attaque | Puissance des attaques ; dédoublée en Attaque physique et Attaque magique (Intelligence) | Socle |
| Défense | Réduit les dégâts reçus ; dédoublée en Défense physique et Défense magique | Socle |
| Vitesse | Décide qui agit en premier, à priorité égale | Socle (déjà décidé) |
| Double canal (Attaque/Défense physique et spéciale, comme Pokémon) | Crée des matchups sans système de types : un monstre solide d'un côté, fragile de l'autre | Retenu — en plus des affinités (profil interne de chaque monstre, répartition cachée) |
| Esquive ou Précision (comme Darkest Dungeon) | Ajoute du hasard sur chaque coup | Optionnelle, à éviter si on veut un jeu sans hasard |

**Décision : 6 stats (PV, Vitesse, Attaque physique, Défense physique, Attaque magique/Intelligence, Défense magique) et les affinités.** On adopte le double canal physique/magique EN PLUS des affinités : les affinités règlent les matchups entre monstres, le double canal donne à chaque monstre un profil interne (solide en physique mais fragile en magique, ou l'inverse), avec une répartition qui peut rester cachée. Deux attaques ET deux défenses sont indispensables : une seule défense commune viderait le canal de son intérêt côté encaissement. Chaque attaque porte deux étiquettes indépendantes, son affinité et son canal, comme dans Pokémon, d'où le dilemme : frapper l'affinité avantageuse, ou viser la faiblesse de canal. À vérifier en test que affinités et canal ne font pas doublon (les deux servent à rendre le switch payant).

Pour garder les dégâts lisibles malgré les stats, une formule additive avec de petits nombres est une piste :

```latex
\text{Dégâts} = \max\left(1,\ (\text{Puissance} + \text{Attaque} - \text{Défense}) \times \text{Affinité}\right)
```

Avec ce calcul, une forte Défense neutralise presque les attaques faibles, ce qui crée des rôles nets ; une formule multiplicative ferait des écarts plus doux.

**Échelle des chiffres : petits nombres à la *Paper Mario* (piste).** Dans Paper Mario, les dégâts valent Attaque moins Défense, avec des valeurs à un chiffre : chaque point compte et le calcul se fait de tête. C'est exactement la formule additive ci-dessus.

| Valeur | Fourchette proposée |
| --- | --- |
| PV | 8 à 20 |
| Attaque | 0 à 4 |
| Défense | 0 à 3 |
| Puissance d'une attaque | 1 à 4 |
| Vitesse | 1 à 10, plus large pour limiter les égalités |
| Affinité | ×2 si avantage, ÷2 arrondi à l'inférieur si désavantage (minimum 1 par la formule) |

Points forts : calcul instantané, toute la réflexion va à la prédiction, et chaque bonus de +1 pèse vraiment. Points faibles : l'équilibrage se fait par paliers (une Défense de 3 réduit au minimum de 1 dégât toute attaque faible d'un monstre à faible Attaque), les répartitions cachées se devinent vite, et les monstres se ressemblent plus.

## Équipement et accessoires

**Décision : chaque personnage porte UN seul équipement, plus un accessoire.** L'équipement est la grande pièce d'identité : il porte à la fois le profil de stats (bonus/malus, à la place des EV et des natures) ET l'affinité. Ex. une armure de glace donne une répartition de stats et l'affinité glace, avec sa faiblesse au feu. Un seul équipement par personnage : donc une seule affinité, pas de cumul ni de double affinité par empilement. L'accessoire reste à part : il reprend le rôle des objets tenus de Pokémon, un effet spécial. **Chaque classe ne peut porter que certains types d'équipement** (comme un mage qui ne peut pas prendre l'armure lourde) : ça ferme les combinaisons cassées à la source, rend les classes distinctes, et borne les affinités qu'une classe peut avoir, ce qui nourrit la déduction adverse. Tout se choisit au Building.

### Équipement : le profil de stats

Avec de petits nombres, chaque +1 compte : les équipements doivent rester sur un budget serré, avec des contreparties, comme les natures (+10 % d'un côté, −10 % de l'autre).

| Exemple d'équipement | Effet | Rôle |
| --- | --- | --- |
| Lame lourde | +2 Attaque, −2 Vitesse | Frappeur lent |
| Armure | +2 Défense, −1 Vitesse | Encaisseur pour les switchs |
| Bottes | +3 Vitesse | Agir en premier |
| Talisman équilibré | +1 Attaque, +1 Défense | Polyvalent |

### Accessoire : l'effet spécial

| Exemple d'accessoire | Effet | Équivalent Pokémon |
| --- | --- | --- |
| Talisman de survie | Survit à 1 PV une fois, s'il avait tous ses PV | Ceinture Force |
| Fiole | Soigne un état une fois | Baie Prine |
| Gant de focus | +Vitesse, mais le monstre ne peut utiliser qu'une seule attaque jusqu'à sa sortie | Mouchoir Choix |
| Orbe de rage | +1 dégât par attaque, perd 1 PV à chaque attaque | Orbe Vie |
| Bandage | Regagne 1 PV à chaque tour | Restes |

Le Gant de focus prend un sens nouveau avec la fatigue : bloqué sur une attaque, le personnage n'a que le move pool universel un tour sur deux et devient très prévisible. Ce genre d'interaction entre accessoires et règles du jeu est à rechercher.

## Classes et spécialisations

**Décision : chaque monstre a une classe, et une spécialisation choisie dans celle-ci.** C'est l'équivalent du talent de Pokémon, rebaptisé pour ce jeu. La classe est l'identité permanente et passive du monstre, son grand rôle (ex. mur, assassin, contrôleur) ; elle est intrinsèque, elle n'est pas un objet. La spécialisation affine ce rôle : comme un Pokémon a un talent parmi les deux ou trois de son espèce, le monstre choisit une spécialisation parmi celles de sa classe.

**Move pool : chaque classe a son propre répertoire d'attaques.** Comme une espèce de Pokémon apprend un répertoire précis, la classe définit la liste d'attaques dans laquelle le personnage pioche ses 4. C'est la signature mécanique de la classe : une classe assassin aura des attaques qui frappent l'arrière, une classe mur des attaques qui tiennent la position (chaque attaque garde son schéma de ciblage fixe, son affinité et son canal). Double bénéfice : pour la construction, 4 attaques à choisir dans un pool plus large ; pour l'information cachée, l'adversaire connaît le pool de la classe mais pas lesquelles des 4 ont été prises. Au total, une classe = un rôle + une spécialisation + des équipements autorisés + un move pool.

La classe et la spécialisation donnent des effets passifs, toujours actifs, qui modifient une règle pour ce monstre (ex. ne subit pas tel état, renforce sa tenue de position, récompense une frappe à l'arrière). Elles ne coûtent aucune action.

Aucun doublon avec l'accessoire : la classe est ce que le monstre EST (intrinsèque, passif, scelle l'archétype), l'accessoire est ce qu'il PORTE (équipé, interchangeable, souvent consommable ou conditionnel). Les deux nourrissent l'information cachée : l'adversaire doit deviner à la fois la spécialisation et l'accessoire.

## Alternatives au système de types (pistes)

Dans Pokémon, les types servent surtout à une chose : rendre le switch payant, en faisant entrer un monstre qui résiste au coup prévu. Toute alternative doit garder cette fonction, avec moins que 18 types et 324 interactions.

| Alternative | Principe | Avantage | Limite | Jeu de référence |
| --- | --- | --- | --- | --- |
| Petit cycle d'affinités | 3 à 5 affinités, chacune forte contre une autre | Lisible, garde le switch payant | Peut devenir mécanique si le cycle est trop court | Triangle des armes de Fire Emblem |
| Canaux de dégâts | Chaque attaque a un canal (ex. physique, magique, poison) ; chaque monstre a des résistances par canal | Peu de catégories, beaucoup de profils possibles | Moins d'identité qu'un « type » | Résistances de Darkest Dungeon |
| Mots-clés | Des traits précis créent des immunités ciblées (ex. Volant : ignore les attaques au sol) | Chaque contre est clair et fort | Liste à équilibrer à la main | Mots-clés de Magic |
| Avantage par position | La case compte : les attaques de mêlée ne touchent que l'avant, l'arrière résiste à certains coups | Exploite le plateau, propre au jeu | Ne crée pas d'identité par monstre | Rangs de Darkest Dungeon |
| Postures | Chaque monstre a 2 formes (ex. offensive/défensive) et en change, en choix simultané | Renforce la prédiction : la faiblesse change d'un tour à l'autre | Ajoute une décision à chaque tour | Formes d'Exagide (Pokémon) |

Ces pistes se combinent : un petit cycle d'affinités pour l'identité des monstres, plus l'avantage par position pour exploiter le plateau, garderait le switch payant sans la lourdeur des 18 types.

**Décision : un système d'affinités réduit, 7 au maximum.** Avec 7 affinités, on passe à 49 interactions au lieu de 324. Un cycle simple (chacune bat la suivante) serait trop pauvre à 7 ; une structure équilibrée où chaque affinité bat 3 autres et perd contre 3 autres garde le jeu symétrique, mais il faut tester si elle reste lisible.

**Décision : chaque affinité a une personnalité mécanique**, pas seulement une place dans le tableau des forces et faiblesses. Comme les attaques Ténèbres de Pokémon portent presque toujours un effet secondaire, une affinité peut pencher vers les attaques de ligne et le contrôle de position, une autre vers les gros coups frontaux, une autre vers le déplacement.

**Archétypes.** Une affinité, un profil de stats (physique ou magique), une famille d'attaques favorite et un style de jeu forment ensemble un archétype cohérent. Exemples : un assassin magique Ténèbres qui frappe l'arrière avec effet secondaire ; un mur physique qui tient la position.

**Ordre de travail :** d'abord la personnalité des 7 affinités et la structure de leurs forces et faiblesses, puis les familles d'attaques qui en découlent, puis les archétypes de personnages. On va du général au particulier ; partir des attaques donnerait un catalogue sans fil conducteur.

### Les 5 éléments (base du prototype)

**Décision : 5 affinités, les cinq éléments chinois (wu xing).** Chacun en bat 2 et perd contre 2, via les deux cycles traditionnels : le cycle de contrôle (Bois bat Terre, Terre bat Eau, Eau bat Feu, Feu bat Métal, Métal bat Bois) et le cycle d'épuisement, où l'enfant épuise la mère (Feu bat Bois, Terre bat Feu, Métal bat Terre, Eau bat Métal, Bois bat Eau). 25 interactions, structure équilibrée et thème cohérent.

| Élément | Bat | Perd contre | Personnalité mécanique |
| --- | --- | --- | --- |
| Bois | Terre, Eau | Métal, Feu | Croissance : soin, régénération, endurance |
| Feu | Métal, Bois | Eau, Terre | Gros coups frontaux, une case, forte puissance |
| Terre | Eau, Feu | Bois, Métal | Stabilité : tenir la position, attaques de zone faibles par coup |
| Métal | Bois, Terre | Feu, Eau | Tranchant : vitesse, priorité, frappe à l'arrière |
| Eau | Feu, Métal | Terre, Bois | Fluidité : déplacement (pousser, tirer, échanger) |

Chaque élément couvre un pilier du jeu (durée, dégâts, zone, tempo, position), et les archétypes en découlent : soigneur Bois, frappeur Feu, mur Terre, assassin Métal, contrôleur Eau. **Décision : multiplicateur ×2 en avantage, ÷2 en désavantage**, identique pour les deux cycles.

### Familles d'attaques par élément (à tester)

4 familles par élément. Puissance de 1 à 4. Le canal (physique ou magique) reste libre : chaque famille peut exister dans les deux versions.

| Élément | Famille | Cible | Puiss. | Effet |
| --- | --- | --- | --- | --- |
| Bois | Sève | allié en face | – | soigne 3 |
| Bois | Régénération | soi | – | soigne 1 au début des 2 prochains tours |
| Bois | Racines | avant | 2 | la cible ne peut pas être déplacée ni switcher au tour suivant |
| Bois | Drain | en face | 2 | le lanceur récupère la moitié des dégâts infligés |
| Feu | Brasier | avant | 4 | aucun |
| Feu | Flamme | en face | 3 | aucun |
| Feu | Embrasement | avant | 4+1 | contrecoup : le lanceur subit 1 |
| Feu | Braise | centre | 3 | aucun |
| Terre | Séisme | toute la ligne | 1 | aucun |
| Terre | Éboulement | avant + centre | 2 | aucun |
| Terre | Secousse | extrémités | 1 | aucun |
| Terre | Rempart | soi | – | Défense +2 et immunité aux déplacements jusqu'au prochain tour |
| Métal | Lame | arrière | 3 | aucun |
| Métal | Estoc | en face | 2 | priorité +1 |
| Métal | Fléchette | arrière | 1 | priorité +1 |
| Métal | Tranchant | centre + arrière | 2 | aucun |
| Eau | Vague | avant | 2 | pousse la cible |
| Eau | Courant | arrière | 1 | tire la cible vers l'avant |
| Eau | Remous | avant + arrière | 1 | échange les deux cibles |
| Eau | Glissade | soi | – | échange avec un allié, priorité +1 |

Synergies attendues : l'Eau pousse un fatigué sur une case menacée, puis le Feu frappe ; Racines bloque le switch de sauvetage ; Rempart contre l'Eau. Point de vigilance : le Feu n'a quasiment pas d'effet secondaire, sa personnalité est la puissance brute. Vérifier en test qu'il n'est ni fade ni dominant.

### Archétypes du prototype (à tester)

Rappel : **un personnage n'a pas d'élément**. Son affinité défensive vient de son équipement ; les attaques portent chacune leur propre élément. Un archétype = classe (stats de base + move pool) + éléments d'équipement autorisés + 4 attaques par défaut. L'élément des attaques peut différer de celui de l'équipement, ce qui alimente l'information cachée.

| Classe | Rôle | PV | Att. P | Déf. P | Att. M | Déf. M | Vit. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Gardien | mur | 18 | 2 | 3 | 0 | 2 | 2 |
| Assassin | frappe à l'arrière | 9 | 4 | 1 | 1 | 1 | 9 |
| Arcaniste | gros coups magiques | 11 | 0 | 1 | 4 | 2 | 5 |
| Tacticien | contrôle de position | 13 | 2 | 2 | 2 | 2 | 6 |
| Druide | soin et endurance | 14 | 0 | 1 | 2 | 3 | 4 |

| Classe | Équipements autorisés | Move pool | 4 attaques par défaut |
| --- | --- | --- | --- |
| Gardien | Terre, Métal | Rempart, Séisme, Éboulement, Racines, Brasier, Vague | Rempart, Éboulement, Racines, Séisme |
| Assassin | Métal, Eau | Lame, Fléchette, Estoc, Tranchant, Courant, Glissade | Lame, Fléchette, Estoc, Glissade |
| Arcaniste | Feu, Bois | Brasier, Flamme, Embrasement, Braise, Drain, Secousse | Brasier, Flamme, Braise, Embrasement |
| Tacticien | Eau, Terre | Vague, Courant, Remous, Glissade, Racines, Secousse | Vague, Courant, Remous, Racines |
| Druide | Bois, Eau | Sève, Régénération, Drain, Racines, Courant, Séisme | Sève, Régénération, Drain, Racines |

Chaque élément est accessible en équipement à au moins deux classes. Stats de base à équilibrer en test ; les modificateurs de stats apportés par l'équipement restent à définir.

**À tester : bonus d'élément (équivalent du STAB).** Une attaque du même élément que l'équipement du lanceur gagne +1 de Puissance, avant le multiplicateur d'affinité : `max(1, (Puissance + 1 + Attaque − Défense) × Affinité)`. Contrepartie à surveiller : le bonus pousse à aligner équipement et attaques, ce qui rend l'élément des attaques plus facile à deviner.

**Parti pris : les one-shots sont voulus.** Le cumul bonus d'élément + avantage ×2 + forte Attaque peut mettre K.O. en un coup. C'est souhaité : un mauvais positionnement ou un mauvais matchup doit pouvoir se payer cash, ce qui donne tout son poids au switch et au placement.

### Variante écartée : triple canal sans affinités

On supprime les affinités : chaque attaque appartient à un des 3 canaux (ex. Force, Magie, Précision), et chaque monstre a une Défense par canal. Les stats deviennent PV, Attaque, Vitesse et 3 Défenses, soit 6 stats comme dans Pokémon.

| Ce qui change | Effet |
| --- | --- |
| Les matchups deviennent des écarts de stats, pas des multiplicateurs | Plus de ×2 ni d'immunité : un switch réduit les dégâts au lieu de les annuler, donc moins de coups décisifs |
| Le switch reste payant | On fait entrer le monstre dont la Défense couvre le canal prévu |
| Risque de coup évident | Si les 3 Défenses adverses sont visibles, on frappe toujours la plus basse : il faut cacher la répartition (pilier info partielle) ou limiter les canaux par position |
| Lien possible avec le plateau | Chaque canal lié à une portée : Force touche l'avant, Précision n'importe quelle case, Magie l'arrière ou une zone. Position et canal remplacent alors les types |
| Identité des monstres | Plus faible qu'avec des affinités ; à compenser par le thème et les compétences |

Pour que les écarts de Défense pèsent autant qu'un avantage de type, la formule de dégâts doit les amplifier, par exemple dégâts × 100 / (100 + Défense) comme l'armure de League of Legends. Avec cette formule, 100 de Défense divise les dégâts par deux.

### Variante écartée : affinités sans Attaque ni Défense

L'inverse de la variante précédente : on garde les affinités et on supprime Attaque et Défense. Un monstre n'a plus que PV et Vitesse ; les dégâts d'une attaque sont sa puissance, multipliée par l'avantage d'affinité.

| Ce qui change | Effet |
| --- | --- |
| Les dégâts deviennent exacts et calculables | Avec de petits nombres (ex. 3 à 8 PV, attaques de 1 à 3), on sait à l'avance si un coup met K.O. : toute la difficulté passe dans la prédiction, pas dans le calcul |
| Les affinités portent toute la défense | Seul levier pour rendre un switch payant : elles doivent être fortes (résistances nettes, immunités) |
| L'identité vient des compétences | Portée, cases utilisables, mouvements et puissance des 4 attaques définissent le rôle, comme une pièce d'échecs |
| Moins d'optimisation au Building | Pas de répartition de stats à cacher : l'information partielle doit venir d'ailleurs (banc, attaques, affinité cachée) |
| Les bonus et malus changent de forme | Plus de « −1 Défense » : on passe par des états (bouclier, vulnérable, marqué) |
| Moins de granularité | Peu de valeurs possibles, donc des monstres plus proches les uns des autres et plus d'égalités |

Jeux de référence : *Into the Breach* (PV et dégâts à un chiffre, tout est prévisible) et *Hearthstone* (Attaque et PV seulement, pas de Défense).

## Prototype jouable

Premier prototype HTML/JS : [Prototype de duel](https://claude.ai/artifact/QGizcaXEyacDW6t9GsQPBE). Construction des deux équipes (classe, équipement, accessoire, 4 attaques, canal P/M par attaque, ordre = positions + banc), puis combat sur un écran partagé, clavier ou deux manettes, avec option IA pour le joueur 2. Options : bonus d'élément, +1 dégât sur le fatigué, banc visible pour tester.

**Configuration.** Toutes les valeurs de jeu vivent dans un fichier dédié, `config.js` : règles (tailles du terrain et du banc, redirections, plateau rétrécissant, départage, formule de dégâts, fatigue, switch, limite de tours), éléments et cycle d'avantages, ciblages, attaques et leurs effets paramétrés, move pool universel, équipements, accessoires, classes, équipes par défaut, touches et manettes, poids de l'IA, délais d'animation. La version en ligne embarque ce fichier et propose un éditeur intégré (JSON) pour tester des variantes sans rien installer.

**Hypothèses prises pour le prototype (à valider ou corriger) :**

- Move pool universel : Coup (en face, Puissance 1, sans élément), Avancer, Reculer (échange avec l'allié voisin), Garde (Déf +1 ce tour, priorité +2).
- Switch : priorité maximale ; ne fatigue personne, le remplaçant entre frais et le sortant perd sa fatigue au banc.
- Égalité de priorité et de Vitesse : tirage au sort.
- Pousser et tirer : une case de déplacement (échange avec le voisin) ; bloqué si l'un des deux est enraciné ou sous Rempart.
- Sève vise l'allié devant le lanceur, soi s'il est à l'avant ; Glissade échange avec l'allié derrière, devant si le lanceur est à l'arrière.
- Embrasement « 4+1 » lu comme Puissance 5 avec contrecoup 1.
- Racines et Rempart durent jusqu'à la fin du tour suivant.
- Équipements : un par élément, modificateurs provisoires (Écorce vivante +3 PV −1 Vit ; Brassard ardent +1 Att P/M −1 Déf P ; Armure de roche +1 Déf P/M −1 Vit ; Lame d'acier +1 Att P +1 Vit −1 Déf M ; Voile d'onde +1 Déf M +1 Vit −1 Att P).
- Gâchettes : gauche et droite à l'écran ; à 2 cases, sans gâchette = l'avant.
- Orbe de rage : +1 dégât par coup (après affinité), −1 PV par attaque ; Gant de focus : Vit +2.
- Équipement et accessoires visibles par les deux joueurs ; seul le banc est caché.

### Simulations : méta de la configuration actuelle

Banc d'essai : 20 000 parties entre équipes aléatoires, puis 3 runs d'algorithme génétique (48 équipes, 35 générations), puis validation des meilleures équipes. IA contre IA, l'IA étant gloutonne (elle maximise les dégâts immédiats avec un peu de hasard, sans anticiper l'adversaire). **Limite majeure : le yomi est absent**, donc la méta mesure la force brute des chiffres, pas la valeur du jeu de prédiction ni du positionnement.

| Mesure | Résultat |
| --- | --- |
| Équilibre J1 / J2 | 50,3 % / 49,7 %, nuls 0,2 %, 8 tours en moyenne |
| Classes (victoires) | Gardien 64,8 %, Arcaniste 49,6 %, Assassin 48,9 %, Tacticien 44,9 %, Druide 41,8 % |
| Éléments d'équipement | Métal 59,8 %, Terre 58,1 %, Feu 48,2 %, Bois 47,5 %, Eau 40,3 % |
| Équipement par classe | Gardien + roche 67,6 % ; Assassin + acier 57,6 % contre + onde 40,1 % |
| Accessoires | resserrés : Bandage 52,5 % à Gant 48,1 % |
| Position de départ | quasi sans effet (Gardien 63,6 % à 65,5 % selon la case) |

**Méta émergente** (les 3 runs convergent) : 2 Gardiens + 2 Assassins en Lame d'acier, Gardien Armure de roche à l'avant, Bandage sur les Gardiens, attaques physiques. Variante qui résiste : Gardien + Arcaniste Brassard ardent + Assassin (+ Druide). Les meilleures équipes gagnent 94 à 99 % contre l'aléatoire ; entre elles, les scores vont de 27 % à 73 %, donc un début de non-transitivité.

**Pistes d'équilibrage (à tester, rien de tranché) :** affaiblir le Gardien (PV 18 → 15 ou Déf P 3 → 2) ; retirer le −1 Att P du Voile d'onde, qui plombe les classes physiques en Eau ; renforcer Druide et Tacticien, mais seulement après avoir une IA qui exploite le positionnement, sinon on corrige un biais de l'IA ; donner plus de poids aux accessoires ; vérifier pourquoi la position de départ ne compte presque pas.

Scripts : dossier `sim/` du prototype (Node + jsdom).

**Décision : clause de classe.** Comme la clause d'espèce de Pokémon, une équipe ne peut aligner qu'une seule fois chaque classe (`regles.maxParClasse`, réglable ; 0 = sans limite). Avec 5 classes et 4 places, l'équipe laisse donc toujours une classe de côté.

**Méta avec la clause (15 000 parties + 3 runs génétiques) :** l'écart se resserre nettement. Classes de 47,5 % (Druide) à 54,4 % (Gardien), contre 41,8 % à 64,8 % avant. Les équipes dominantes deviennent variées : Tacticien en Armure de roche à l'avant, Gardien, Druide en Écorce vivante, et Assassin en Lame d'acier ou Arcaniste. Bandage reste l'accessoire le plus pris. Entre les meilleures équipes, les scores vont de 33 % à 77 % : la méta tourne, sans équipe absolue. Toujours faibles : tout équipement Eau (Voile d'onde 37,6 % à 43,8 %), et le Gant de focus.

**À tester : positions de lancement (à la Darkest Dungeon).** Certaines attaques ne s'utilisent que depuis certaines cases (`depuis` dans la config ; absent = de partout). Trois règles accompagnent : sur plateau réduit, la redirection s'applique aussi au lanceur (une attaque « depuis le centre » devient utilisable depuis l'avant à 2 cases) ; si le lanceur a été déplacé avant d'agir, l'attaque échoue, ce qui donne une deuxième fonction aux attaques de déplacement ; un perso frais sans aucune attaque utilisable depuis sa case bascule sur le move pool universel, comme un fatigué. Répartition proposée : mêlée à l'avant (Embrasement, Éboulement), frappes et contrôle de l'avant ou du centre (Brasier, Séisme, Racines, Rempart, Lame, Estoc, Tranchant, Vague), tirs et soins du centre ou de l'arrière (Flamme, Braise, Fléchette, Courant, Sève) ; le reste sans restriction.

**Effet mesuré (12 000 parties + 3 runs génétiques) :** la position de départ compte enfin. Gardien à l'avant 58,9 % contre 47,1 % à l'arrière, Tacticien à l'arrière 57,0 % contre 43,4 % au centre, Druide à l'arrière 54,0 % contre 42,1 % au centre (avant la règle, l'écart par classe ne dépassait pas 2 points). Les classes se resserrent encore (47,9 % à 52,3 %), et les équipes dominantes s'organisent en formation : Assassin ou Gardien devant, Gardien ou Arcaniste au centre, Tacticien ou Druide derrière. Environ un échec « hors position » toutes les trois parties.

**À tester : setup et debuff.** Hausses et baisses de stats en paliers de ±1, plafonnées à ±2 par stat (`regles.modificateurs`), effacées quand le perso part au banc, comme dans Pokémon : le switch devient aussi un nettoyage. Avec la fatigue, un setup coûte cher (le tour suivant, le perso n'a que le move pool universel), donc il paie au plus tôt deux tours plus tard. Une attaque de puissance 0 qui vise l'adversaire n'inflige que son effet. Nouvel accessoire : Amulette pure, qui annule une baisse.

| Attaque | Élément | Classe | Cible | Effet |
| --- | --- | --- | --- | --- |
| Attiser | Feu | Arcaniste | soi | Att P +1, Att M +1 |
| Aiguiser | Métal | Assassin | soi | Att P +1, Vit +1 |
| Cuirasse | Terre | Gardien | soi (avant, centre) | Déf P +1, Déf M +1 |
| Floraison | Bois | Druide | soi | Att M +1, soigne 2 |
| Marée porteuse | Eau | Tacticien | allié devant (depuis centre, arrière) | Vit +2 |
| Brûlure | Feu | Arcaniste | avant, puissance 2 | Att P −1 |
| Fendre | Métal | Assassin | en face, puissance 2 | Déf P −1 |
| Grondement | Terre | Gardien | toute la ligne, puissance 0 | Att P −1 |
| Spores | Bois | Druide | en face, puissance 0 | Vit −2 |
| Brume | Eau | Tacticien | centre + arrière, puissance 0 | Att M −1 |

**Effet mesuré (12 000 parties + 3 runs génétiques) :** les nouvelles attaques se placent toutes dans la moyenne (47 à 50 %), sans casser l'équilibre des classes (47,9 % à 52,0 %). Les parties s'allongent de 8 à 10,7 tours. Dans les équipes dominantes : Aiguiser sur deux Assassins sur trois, Brume sur la moitié des Tacticiens, Fendre, Cuirasse et Marée porteuse régulièrement ; Attiser et Brûlure presque jamais, l'Arcaniste ayant quitté la méta. Amulette pure faible (48,4 %). Réserve : la valeur d'un setup dépend de la planification, que l'IA gloutonne approche par des poids réglés à la main (`ia.setupParPoint`, `ia.debuffParPoint`).

## Questions ouvertes

- [ ] Banc : tranché (1 personnage, caché). Reste à décider ce que l'adversaire voit de l'équipe avant le match.
- [ ] Switch et fatigue : tranché à tester (le fatigué peut sortir, le remplaçant entre frais). Reste à voir en test si le switch du fatigué devient trop systématique.
- [ ] Fatigue : un switch ou une attaque de mouvement fatigue-t-il aussi ? Que contient exactement le move pool universel ? Faut-il un seuil de fatigue en fin de match ?
- [ ] Plateau rétrécissant : valider en test la correspondance des ciblages et mouvements. Règle anti-blocage (limite de tours ?) à trancher.
- [ ] Vitesse : comment trancher une égalité ?
- [ ] Information partielle : quelle part montrer, en plus du banc ?
- [ ] Quelles autres couches de Pokémon garder : état du terrain, coordination, hasard ?
- [ ] Affinités : base du prototype tranchée (5 éléments chinois, ×2 / ÷2). Reste à décider s'il faut une affinité neutre.
- [ ] Formule de dégâts : décision provisoire — additive (Puissance + Attaque − Défense) pour démarrer le prototype, car le calcul se fait de tête et toute la difficulté va à la prédiction ; à valider en test, avec la formule multiplicative façon Pokémon comme repli si les effets de seuil sont trop brutaux.
- [ ] Équipement et accessoire : visibles par l'adversaire, ou découverts en match ?
- [ ] Unicité : un même équipement ou accessoire peut-il apparaître deux fois dans l'équipe (en VGC, chaque objet est unique) ?
- [ ] Budget des équipements : combien de points au total, et contrepartie obligatoire ?
