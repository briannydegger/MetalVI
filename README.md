# Metal VI

[Démo](https://warm-inlet-83097.herokuapp.com/)

# Cahier des charges

Ce projet est réalisé dans le cadre du cours Visualisation de L'Information (VI) du Master MSE de la HES-SO.

C'est un site web contenant une carte du monde avec comme aperçu sur chaque pays :

*   Le style de Metal le plus joué
*   Le nombre de groupes de Metal par million d'habitants

Il y a la possibilité de filtrer et de rechercher. On pourrait aussi accéder aux détails d'un pays en cliquant sur celui-ci (détails à définir).

Les données utilisées proviennent de l'API [http://em.wemakesites.net/](http://em.wemakesites.net/) qui récupère les données du site très utilisées dans le milieu :  [metal-archives](http://metal-archives.com/).

Le but du projet est d'avoir les genres de Metal par zone du monde et d'analyser quels pays accueillent le mieux cette musique.


# Objectif du projet

Visualiser les genres de Metal les plus joués par pays afin d'identifier :
- Lesquels accueillent le mieux cette musique (par exemple pour la programmation de tournée)
- Où trouver des groupes qui correspondent à mes goûts


# Fonctionnalités présentes dans le projet

1. Visualisation globale de la __*carte du monde*__ avec indication par nuance de gris de la __*quantité de groupes*__.
2. Possibilité pour l’utilisateur d’afficher le nombre de groupes par pays de façon __*relative*__ (par million d’habitants) ou __*absolue*__ (le nombre de groupes).
3. __*Filtrage*__ des informations affichées par __*genre*__ de Metal.
4. Visualisation de __*l’ensemble des groupes*__ d’un pays (filtrer ou non par genre) avec __*champs de recherche*__ et accès à leur __*description complète*__.


# Sources de données

Nous avions tout d'abord indiqué dans le cahier des charges la source de données suivante : [http://em.wemakesites.net/](http://em.wemakesites.net/).
Malheureusement, cette API s'est avérée avoir une limite très dérangeante. En effet, nous ne pouvons qu'extraire que 200 groupes par pays au maximum. Contacté, le créateur de cette source de données nous a indiqué que c'était dû à un problème technique dans son script de récupération (apparemment une limite du côté de metal-archives) auquel il n'a pas encore trouvé de solution.

Comme nous ne pouvions pas utiliser cette source de données, nous avons alors dû analyser le site [Ecyclopaedia Metallum](http://metal-archives.com/) et avons trouvé des appels faits à leur propre API. Grâce à ces appels, nous pouvions donc extraire les URL et les utiliser dans notre propre application. 
Malheureusement rien n'est jamais facile :). En effet, cette source de données possède aussi ses limitations. Nous ne pouvons obtenir les données que par paquets de 500. Heureusement, nous pouvons choisir la "page" et ainsi obtenir les 500 suivants et ainsi de suite. À partir de cette constatation, nous avons développé notre propre source de données avec un script de récupération des données sur metal-archives.

Autre source de données, [Rest Countries](http://restcountries.eu/) nous permet d'obtenir la population de chaque pays pour l'affichage relatif.

# Technologies

![](http://vi.master.minelli.me/technologies.png)

- node.js : Serveur web et outils d'exécution des scripts de récupération.
- HTML 5, CSS 3, JavaScript : Affichage du site internet du côté client.
- jQuery : jQuery est une bibliothèque JavaScript libre et multiplateforme créée pour faciliter l'écriture de scripts côté client dans le code HTML des pages web. [wikipedia](https://fr.wikipedia.org/wiki/JQuery)
- Bootstrap : Bootstrap est une collection d'outils utile à la création du design de sites et d'applications web. [wikipedia](https://fr.wikipedia.org/wiki/Bootstrap_(framework))
- MySQL : Gestionnaire de base de données utilisée pour stocker les données récupérée sur metal-archives.
- JQVMAP : Carte vectoriel cliquable (utilisé pour la carte du monde).
- jQuery Datatables : Tableau de données interactif utilisé pour l'affichage de la liste des groupes d'un pays.
- Popper.js : Gestionnaire de popup.

## Carte du monde

Pour le choix de l'outil pour la carte du monde, il a fallu en choisir une qui n'affiche pas les petits pays (comme Monaco ou le Liechtenstein, ou alors l'île Svalbard qui est inclus dans la Norvège). Car ceux-ci, ayant une faible population, le rapport groupe / population est trop élevé par rapport aux autres.

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

\-     |    Paramètres par défaut (Default)

✓   |    Respect

✓   |    Prévisibilité (Predictability)

✓   |    Réalité (Reality)

Comme cette liste le montre, nous respectons 15 des 17 règles de l'utilisabilité.

Nous n'avons pas pu cocher le point sur la réversibilité, car il n'y a aucun acte qui ait besoin d'être défait. Concernant les paramètres par défaut, il n'est que partiellement respecté, car des paramètres ou des états tel que le choix entre vue relative / absolue  ou l'infobulle disant de cliquer sur un pays (affiché qu'une seul fois) sont changeable, mais la valeur de ces paramètres / états n'est pas gardée entre les session. Un rafraichissement de la page entraine donc leur perte.
Quant au point non respecté, l'echec ne l'ait pas, car si un timeout a lieu lors du chargement de données rien n'ait fait pour le signaler à l'utilisateur ce qui le laisse dans l'attente des données qui n'arriveront pas.

# Tests utilisateurs

Nous avons pu effectuer des tests avec plusieurs personnes. Voici le contexte qui leur a été donné :

*Vous vous intéressez aux différents genres de Metal et vous vous demandez dans quels pays se trouve le plus de groupe de vos deux genres préférés, qui sont le Power Metal et le Symphonique Metal. Après une recherche Google vous tombez sur ce site. Est-ce que les informations recherchées sont comprises facilement ?*

Leur premier réflexe a été de jouer avec le changement de genre sur la gauche. Puis, la simplicité du site leur a permis de très vite comprendre les informations.

Toutefois, la majorité n'a pas compris qu'ils pouvaient cliquer sur les pays. Un message "Click for details !" a donc été rajouté dans la bulle et est retiré lorsque l'utilisateur a cliqué une fois sur un pays.

# Daltonisme
La quantité exprimée sur la map n'est pas un problème pour les daltoniens, car exprimé en nuance de gris.

Le seul autre endroit où des couleurs sont utilisées est dans la liste des groupes par pays. Les couleurs sont utilisées __*en plus*__ de l'information textuelle pour exprimer le statut ainsi que le nombre de commentaires sur les groupes. Les couleurs sont donc utilisées afin d'apporter un support visuel supplémentaire mais ne sont pas le seul moyen de visualiser l'information.

Malgré cela, nous nous sommes servi du service [Coblis Simulator](http://www.color-blindness.com/coblis-color-blindness-simulator/) afin de tester notre site pour les différents types de daltonisme et ainsi de choisir au mieux les couleurs. Il s'est avéré que les couleurs de base choisie dans Bootstrap sont efficaces pour éviter les problèmes de visualisation.

Le seul problème repéré est avec Achromatopsia (vue monochromique).

Voici quelques exemples :

![Vue normale](http://vi.master.minelli.me/ColorBlind_1.png)
Vue normale


![Protanomaly - Trichromatie Anormale : Faiblesse avec la couleur rouge (Red-Weak)](http://vi.master.minelli.me/ColorBlind_3.png)
Protanomaly - Trichromatie Anormale : Faiblesse avec la couleur rouge (Red-Weak)

![Tritanopia - Vue dichromatique : Ne vois pas la couleur bleu (Blue-Blind)](http://vi.master.minelli.me/ColorBlind_4.png)
Tritanopia - Vue dichromatique : Ne vois pas la couleur bleu (Blue-Blind)

![Achromatopsia - Vue monocrhomatique : Ne voit qu'en nuance de gris (Monochromacy)](http://vi.master.minelli.me/ColorBlind_5.png)
Achromatopsia - Vue monochromatique : Ne vois qu'en nuance de gris (Monochromacy)


# Améliorations
- Ajout de graphiques sur les détails des pays
    - Distribution des régions
    - Vue des groupes enregistrés actifs / séparés / etc.
    - Distribution des genres
- Ajout de statistiques au niveau mondial
- Gestion des erreurs de chargement des données

# Liens utiles

*   [API non utilisée](http://em.wemakesites.net/)
*   [Étude intéressante réalisée par Iain](http://www.degeneratestate.org/posts/2016/Apr/20/heavy-metal-and-natural-language-processing-part-1/)
*   [Map jQuery](https://jqvmap.com/)
*   [Map jQuery github](https://github.com/manifestinteractive/jqvmap)
*   [API de population](https://restcountries.eu/)
