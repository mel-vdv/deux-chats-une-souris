# deux-chats-une-souris
jeu multi-joueurs : 2 joueurs représentés par un avatar chat jaune et chat vert

***hébergement*** sur HEROKU : https://jeu-de-mel.herokuapp.com/ 
base de donnée: MONGO ATLAS

***but du jeu*** : 
attraper la souris avant l'autre joueur (en cliquant sur celle-ci)

***système de session*** : formulaire de saisie
gestion de la connexion-déconnection
gestion de l'inscription de nouveaux joueurs
gestion des scores:
1 clic sur la souris = 1 point sur 8
8 points = partie gagnée qui se cumule dans le tableau des scores visible par tous

***gestion du temps réél*** : pas de rechargement de la page, effet immédiat : recours au protocole websocket.
- mouvements des 2 chats : selon les mousemove du joueur 1 et du joueur 2
- mouvement de la souris: aléatoire
- addition des points immédiate, à chaque clic sur l'image de souris

***technologies utilisées***:
- front-end : javascipt, html5, css3 : validation W3C
- back : le fichier serveurJeu.js contient 2 serveurs:
  * serveur express
  * serveur socket.io : pour la gestion du 'temps réel'. Il communique avec le client socket de la balise script dans le head des 2 fichiers html
  
***gestion des données***:
création d'une base de données (recours à mongo atlas) intitulée "jeu"
elle contient 2 collections : "users" et "partie"

***compatibilité*** avec les navigateurs : chrome 10, firefox5, opera9, i.e.9, safari5
