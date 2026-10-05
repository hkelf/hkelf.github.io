# Spécifications du prototype

> Généré automatiquement depuis `config.js` (`node tools/specs.js > docs/specs.md`). Ne pas modifier à la main.
> Schémas de cases : ■ = case concernée, ordre avant → centre → arrière.

## Règles

- **Équipe** : 3 sur le terrain, 1 au banc (caché), 4 attaques par perso, 1 exemplaire(s) max par classe.
- **Tour** : chaque joueur choisit en secret un perso et une attaque, ou un switch. Résolution par priorité, puis Vitesse, puis départage (hasard).
- **Dégâts** = max(1, (Puissance + 1 si même élément que l’équipement + Attaque − Défense) × affinité) + 1 si la cible est fatiguée. Affinité ×2 / ÷2 (arrondi inferieur). Attaque et Défense selon le canal. Une case visée plusieurs fois = plusieurs coups.
- **Fatigue** : le perso qui a agi n’a que le move pool universel au tour suivant (seuil : 1 perso(s) debout). Switch fatiguant : non. Banc efface la fatigue : oui.
- **Switch** : priorité 10, le premier du banc prend la case du sortant. Bloqué par Racines : oui.
- **K.O.** : remplacement automatique oui ; plateau rétrécissant oui ; limite de tours aucune.
- **Positions de lancement** : actives ; échec si déplacé avant d’agir : oui ; repli universel si aucune attaque possible : oui.
- **Setup / debuff** : plafond ±2 par stat, effacés au banc : oui.

### Report des ciblages sur plateau réduit

| Case visée | 3 cases | 2 cases | 1 cases |
| --- | --- | --- | --- |
| avant | avant | avant | avant |
| centre | centre | avant | avant |
| arrière | arrière | arrière | avant |

## Table des types

Ligne = élément de l’attaque, colonne = élément de l’équipement du défenseur.

| Att. ↓ / Déf. → | 木 Bois | 火 Feu | 土 Terre | 金 Métal | 水 Eau |
| --- | --- | --- | --- | --- | --- |
| **木 Bois** | · | ÷2 | ×2 | ÷2 | ×2 |
| **火 Feu** | ×2 | · | ÷2 | ×2 | ÷2 |
| **土 Terre** | ÷2 | ×2 | · | ÷2 | ×2 |
| **金 Métal** | ×2 | ÷2 | ×2 | · | ÷2 |
| **水 Eau** | ÷2 | ×2 | ÷2 | ×2 | · |

## Classes

| Classe | PV | Att P | Déf P | Att M | Déf M | Vit | Canal | Équipements | Move pool (défaut en gras) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Gardien** | 18 | 2 | 3 | 0 | 2 | 2 | P | Armure de roche, Lame d’acier | **Rempart**, **Séisme**, **Éboulement**, **Racines**, Brasier, Vague, Cuirasse, Grondement |
| **Assassin** | 9 | 4 | 1 | 1 | 1 | 9 | P | Lame d’acier, Voile d’onde | **Lame**, **Fléchette**, **Estoc**, Tranchant, Courant, **Glissade**, Aiguiser, Fendre |
| **Arcaniste** | 11 | 0 | 1 | 4 | 2 | 5 | M | Brassard ardent, Écorce vivante | **Brasier**, **Flamme**, **Embrasement**, **Braise**, Drain, Secousse, Attiser, Brûlure |
| **Tacticien** | 13 | 2 | 2 | 2 | 2 | 6 | P | Voile d’onde, Armure de roche | **Vague**, **Courant**, **Remous**, Glissade, **Racines**, Secousse, Marée porteuse, Brume |
| **Druide** | 14 | 0 | 1 | 2 | 3 | 4 | M | Écorce vivante, Voile d’onde | **Sève**, **Régénération**, **Drain**, **Racines**, Courant, Séisme, Floraison, Spores |

## Équipements

| Équipement | Élément | Modificateurs | Classes |
| --- | --- | --- | --- |
| **Écorce vivante** | Bois | PV +3, Vit -1 | Arcaniste, Druide |
| **Brassard ardent** | Feu | Att P +1, Att M +1, Déf P -1 | Arcaniste |
| **Armure de roche** | Terre | Déf P +1, Déf M +1, Vit -1 | Gardien, Tacticien |
| **Lame d’acier** | Métal | Att P +1, Vit +1, Déf M -1 | Gardien, Assassin |
| **Voile d’onde** | Eau | Déf M +1, Vit +1, Att P -1 | Assassin, Tacticien, Druide |

## Accessoires

| Accessoire | Modificateurs | Effet |
| --- | --- | --- |
| **Aucun** | — | — |
| **Talisman de survie** | — | survit à 1 PV (1×, si PV ≥ 100 %) |
| **Fiole** | — | annule Racines (1×) |
| **Gant de focus** | Vit +2 | bloqué sur sa 1re attaque jusqu’à sa sortie |
| **Orbe de rage** | — | +1 dégât par coup, −1 PV par attaque |
| **Bandage** | — | +1 PV en fin de tour |
| **Amulette pure** | — | annule une baisse de stats (1×) |

## Attaques

| Attaque | Élément | Classes | Puiss. | Prio. | Cible | Depuis | Effets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Sève** | Bois | Druide | — | — | allié devant (soi si à l’avant) | □■■ centre, arrière | soigne 3 |
| **Régénération** | Bois | Druide | — | — | soi | toutes | soigne 1 au début des 2 prochains tours |
| **Racines** | Bois | Gardien, Tacticien, Druide | 2 | — | ■□□ avant | ■■□ avant, centre | racines (1 tour) |
| **Drain** | Bois | Arcaniste, Druide | 2 | — | en face | toutes | draine 50 % |
| **Brasier** | Feu | Gardien, Arcaniste | 4 | — | ■□□ avant | ■■□ avant, centre | — |
| **Flamme** | Feu | Arcaniste | 3 | — | en face | □■■ centre, arrière | — |
| **Embrasement** | Feu | Arcaniste | 5 | — | ■□□ avant | ■□□ avant | contrecoup 1 |
| **Braise** | Feu | Arcaniste | 3 | — | □■□ centre | □■■ centre, arrière | — |
| **Séisme** | Terre | Gardien, Druide | 1 | — | ■■■ toute la ligne | ■■□ avant, centre | — |
| **Éboulement** | Terre | Gardien | 2 | — | ■■□ avant + centre | ■□□ avant | — |
| **Secousse** | Terre | Arcaniste, Tacticien | 1 | — | ■□■ avant + arrière | toutes | — |
| **Rempart** | Terre | Gardien | — | — | soi | ■■□ avant, centre | Déf P/M +2 (1 tour), inamovible |
| **Lame** | Métal | Assassin | 3 | — | □□■ arrière | ■■□ avant, centre | — |
| **Estoc** | Métal | Assassin | 2 | +1 | en face | ■■□ avant, centre | — |
| **Fléchette** | Métal | Assassin | 1 | +1 | □□■ arrière | □■■ centre, arrière | — |
| **Tranchant** | Métal | Assassin | 2 | — | □■■ centre + arrière | ■■□ avant, centre | — |
| **Vague** | Eau | Gardien, Tacticien | 2 | — | ■□□ avant | ■■□ avant, centre | pousse de 1 |
| **Courant** | Eau | Assassin, Tacticien, Druide | 1 | — | □□■ arrière | □■■ centre, arrière | tire de 1 |
| **Remous** | Eau | Tacticien | 1 | — | ■□■ avant + arrière | toutes | échange les deux cases visées |
| **Glissade** | Eau | Assassin, Tacticien | — | +1 | soi | toutes | se déplace (arriereSinonAvant) |
| **Attiser** | Feu | Arcaniste | — | — | soi | toutes | lanceur : Att P +1, Att M +1 jusqu’au banc |
| **Aiguiser** | Métal | Assassin | — | — | soi | toutes | lanceur : Att P +1, Vit +1 jusqu’au banc |
| **Cuirasse** | Terre | Gardien | — | — | soi | ■■□ avant, centre | lanceur : Déf P +1, Déf M +1 jusqu’au banc |
| **Floraison** | Bois | Druide | — | — | soi | toutes | lanceur : Att M +1 jusqu’au banc ; soigne 2 |
| **Marée porteuse** | Eau | Tacticien | — | — | allié devant (soi si à l’avant) | □■■ centre, arrière | allieDevant : Vit +2 jusqu’au banc |
| **Brûlure** | Feu | Arcaniste | 2 | — | ■□□ avant | ■■□ avant, centre | cibles : Att P -1 jusqu’au banc |
| **Fendre** | Métal | Assassin | 2 | — | en face | ■■□ avant, centre | cibles : Déf P -1 jusqu’au banc |
| **Grondement** | Terre | Gardien | — | — | ■■■ toute la ligne | toutes | cibles : Att P -1 jusqu’au banc |
| **Spores** | Bois | Druide | — | — | en face | toutes | cibles : Vit -2 jusqu’au banc |
| **Brume** | Eau | Tacticien | — | — | □■■ centre + arrière | □■■ centre, arrière | cibles : Att M -1 jusqu’au banc |

### Move pool universel

| Attaque | Élément | Classes | Puiss. | Prio. | Cible | Depuis | Effets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Coup** | Neutre | universel | 1 | — | en face | toutes | — |
| **Avancer** | Neutre | universel | — | — | soi | toutes | se déplace (avant) |
| **Reculer** | Neutre | universel | — | — | soi | toutes | se déplace (arriere) |
| **Garde** | Neutre | universel | — | +2 | soi | toutes | Déf P/M +1 (0 tour) |

## Contrôles

| Joueur | Perso gauche | Perso droite | Attaques | Switch |
| --- | --- | --- | --- | --- |
| Joueur 1 | `Q` | `E` | `1` `2` `3` `4` | `W` |
| Joueur 2 | `U` | `O` | `7` `8` `9` `0` | `I` |

Manettes : gâchettes 6/7, boutons A B X Y, switch sur les boutons 4/5.
