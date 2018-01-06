# Metal VI

# Cahier des charges

Ce projet est réalisé dans le cadre du cours Visualisation de L'information du Master MSE de la HES-SO.

C'est un site Web contenant une carte du monde avec comme aperçu sur chaque pays :

*   Le style de Metal le plus joué
*   Le nombre de groupe de Metal par million d'habitants

Il y a la possibilité de filtrer et de rechercher. On pourrait aussi accéder aux détails d'un pays en cliquant sur celui-ci (détails à définir).

Les données utilisées proviennent de l'API [http://em.wemakesites.net/](http://em.wemakesites.net/) qui récupère les données du site très utilisé dans le milieu :  [metal-archives](http://metal-archives.com/).

Le but du projet est d'avoir les genres de Metal par zone du monde et d'analyser quels pays accueillent le mieux cette musique.


# Objectif du projet

Visualiser les genres de Metal le plus joué par pays afin d'identifier :
- Lesquels acceuillent le mieux cette musiques (pour par exemple la programmation de tournée)
- Où trouver des groupes qui correspondent à mes goûts


# Fonctionnalités présentes dans le projet

1. Visualisation globale de la __*carte du monde*__ avec indication èar nuance de gris de la __*quantité de groupe*__.
2. Possibilité pour l’utilisateur d’afficher le nombre de groupe par pays de façon __*relative*__ (par million d’habitant) ou __*absolue*__ (le nombre de groupe).
3. __*Filtrage*__ des information affichées par __*genre*__ de Metal.
4. Visualisation de __*l’ensemble des groupes*__ d’un pays (filtrer ou non par genre) avec __*champs de recherche*__ et accès à leur __*description complète*__


# Sources de données

Nous avions tout d'abord indiqué dans le cahier des charges la source de données suivante : [http://em.wemakesites.net/](http://em.wemakesites.net/).
Malheureusement, cette API c'est avéré avoir une limite très dérengeante. En effet, nous ne pouvons qu'extraire que 200 groupes par pays au maximum. Contacté, le créateur de cette source de données nous a indiqué que c'était du à un problème technique dans son script de récupération (apparement une limite du côté de metal-archive) auquel il n'a pas encore trouvé de solution.

Comme nous ne pouvions pas utiliser cette source de données, nous avons alors du analysé le site [Ecyclopaedia Metallum](http://metal-archives.com/) et avons trouvé des appels fait à leur propre API. Grâce a ces appels, nous pouvions donc extraire les URL et les utiliser dans notre propre application. 
Malheureusement rien n'est jamais facile :) En effet, cette source de donnée aussi possède ses limitations. Nous ne pouvons obtenir les données que par paquets de 500. Heureusement, nous pouvons choisir la "page" et ainsi obtenir les 500 suivant et ainsi de suite. A partir de cette constatation, nous avons développé notre propre source de donnée avec un script de récupération des données sur metal-archive.

Autre source de donnée, [Rest Countries](http://restcountries.eu/) nous permet d'obtenir la population de chaque pays pour l'affichage relatif.


# Technologies

![](http://vi.master.minelli.me/technologies.png)

- node.js : Serveur web et outils d'éxecution des scripts de récupération.
- HTML 5, CSS 3, Javascript : Affichage du site internet du côté client.
- jQuery : jQuery est une bibliothèque JavaScript libre et multiplateforme créée pour faciliter l'écriture de scripts côté client dans le code HTML des pages web. [wikipedia](https://fr.wikipedia.org/wiki/JQuery)
- Bootstrap : Bootstrap est une collection d'outils utile à la création du design de sites et d'applications web. [wikipedia](https://fr.wikipedia.org/wiki/Bootstrap_(framework))
- MySQL : Gestionnaire de base de données utilisé pour stoquer les données récupérée sur metal-archives.
- JQVMAP : Carte vectoriel cliquable (utilisé pour la carte du monde).
- jQuery Datatables : Tableau de données interactif utilisé pour l'affichage de la liste des groupes d'un pays.
- Popper.js : Gestionnaire de popup.


# Utilisabilité 
✓   |    Félicité (Bliss) 

✓   |    Distraction

✓   |    Déroulement (Flow)

✓   |    Documentation (inutile)

✓   |    Peu de surprise (Least surprise)

✓   |    Transparence (Transparency)

✓   |    Ne dépend pas de mode (Modelessness)

✓   |    Seven

\-     |    Réversibilité (Reversibility)

✓   |    Confirmation

x    |    Échec (Failure)

✓   |    Silence

✓   |    Automatisation (Automation)

✓   |    Paramètres par défaut (Default)

✓   |    Respect

✓   |    Prévisibilité (Predictability)

x    |    Réalité (Reality)

Comme cette liste le montre, nous respectons 15 des 17 règles de l'utilisabilité.

Nous n'avons pas peu cocher le point sur la réversibilité car il n'y a aucun acte qui ai besoin d'être défait.
Quand aux points non respecté, celui sur l'erreur ne l'ai pas car, si un timeout a lieu lors du chargement de données rien n'ai fait pour le signaler à l'utilisateur ce qui le laisse dans l'attente des données qui n'arriverons pas. Pour le point "réalité", il n'est pas cocher car, nous n'avons pas vraiment effectué de test utilisateur.

# Daltonisme
La quantité exprimée sur la map n'est pas un problème pour les daltonien car exprimé en nuance de gris.

Le seul autre endroit ou des couleurs sont utilisé est dans la liste des groupes par pays. Les couleurs sont utilisé __*en plus*__ de l'information textuel pour exprimé le statut ainsi que le nombre de commentaires sur les groupes. Les couleurs sont donc utilisé afin d'apporter un support visuel supplémentaire mais ne sont pas le seul moyen de visualiser l'information.

Malgré cela, nous nous somme servi du service [Coblis Simulator](http://www.color-blindness.com/coblis-color-blindness-simulator/) afin de tester notre site pour les différent type de daltonisme et ainsi de choisir au mieu les couleurs. Il c'est avéré que les couleurs de base choisie dans Bootstrap sont éfficace pour eviter les problèmes de visualisation.

Le seul problème repéré est avec Achromatopsia (vue monochromique).

Voici quelques éxamples :

![Vue normale](http://vi.master.minelli.me/ColorBlind_1.png)
Vue normale


![Protanomaly - Trichromatie Anormale : Faiblesse avec la couleur rouge (Red-Weak)](http://vi.master.minelli.me/ColorBlind_3.png)
Protanomaly - Trichromatie Anormale : Faiblesse avec la couleur rouge (Red-Weak)

![Tritanopia - Vue dichromatique : Ne vois pas la couleur bleu (Blue-Blind)](http://vi.master.minelli.me/ColorBlind_4.png)
Tritanopia - Vue dichromatique : Ne vois pas la couleur bleu (Blue-Blind)

![Achromatopsia - Vue monocrhomatique : Ne voit qu'en nuance de gris (Monochromacy)](http://vi.master.minelli.me/ColorBlind_5.png)
Achromatopsia - Vue monocrhomatique : Ne voit qu'en nuance de gris (Monochromacy)


# Améliorations
- Ajout de graphiques sur les détails des pays
    - Distribution des régions
    - Vue des groupes enregistré actif / séparé / etc.
    - Disctribution des genres
- Ajout de statistiques au niveau mondial
- Gestion des erreurs de chargement des données
- Pré-chargement dans notre propre base de données de plus d'informations afin de réduire le temps d'attente




# Liens utiles

*   [API non utilisée](http://em.wemakesites.net/)
*   [Étude réalisée par Iain](http://www.degeneratestate.org/posts/2016/Apr/20/heavy-metal-and-natural-language-processing-part-1/)
*   [Map jQuery](https://jqvmap.com/)
*   [Map jQuery github](https://github.com/manifestinteractive/jqvmap)
*   [API de population](https://restcountries.eu/)
