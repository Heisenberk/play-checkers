Projet AWS 2019 : Jeu de Dames 
=================

Ce projet a été réalisé par Clément CAUMES et Mehdi MERIMI. Il est disponible à l'adresse suivante : [https://play-checkers.glitch.me/](https://play-checkers.glitch.me/).

Manuel utilisateur
------------

Pour commencer à jouer, il faut s'identifier ou créer un nouveau compte : 

![Page de connexion](https://cdn.glitch.com/c2e72f42-892d-412c-b0a7-e4afef051b24%2Fconnexion.PNG?1557929704633)

Après s'être identifié, on peut voir la liste des joueurs connectés, non connectés et occupés (actuellement
en train de jouer en multijoueur). Dans cet exemple, nous sommes connecté sur le compte de l'utilisateur **c**, les joueurs **a** et **d** sont occupés et **b** est connecté : 

![Menu](https://cdn.glitch.com/c2e72f42-892d-412c-b0a7-e4afef051b24%2Fmenu.PNG?1557929704772)

On peut défier un joueur connecté en cliquant sur le bouton *défier* à la droite du login du futur adversaire. Si vous défiez quelqu'un, le jeu commence. Les pions blancs sont en 
bas de la page et les pions noirs sont en hauts. Celui qui a défié est l'équipe noire et celui qui a été défié est l'équipe blanche (et donc commence).

Il y a un bouton *abandonner* si vous voulez quitter avant même de finir la partie. 

Lorsque c'est le tour du joueur, on peut voir apparaître son pseudo en bas de la page. On y voit également les pions jouables : 

![Tour 1](https://cdn.glitch.com/c2e72f42-892d-412c-b0a7-e4afef051b24%2Ftour1.PNG?1557929704972)

Après la sélection du pion à jouer, on peut y voir les déplacements possibles sélectionnables par le joueur : 

![Tour 2](https://cdn.glitch.com/c2e72f42-892d-412c-b0a7-e4afef051b24%2Ftour2.PNG?1557929705102)


Manuel technique
-------------------


- Lorsqu'un utilisateur crée un compte, le serveur vérifie que le login choisi n'est pas déjà utilisé par un autre joueur, puis le crée. 
- Lorsqu'un utilisateur se connecte, il entre son login et son mot de passe dans le formulaire dont le serveur vérifie son identité. 
- Après la vérification de son identité, le serveur le redirige vers la page */play*. Il y a ensuite un établissement d'une websocket entre le client et le serveur. 
Ainsi, le serveur va associer le login du client avec le websocket du client. A chaque mise à jour de l'état des websockets entre le serveur et les clients, le serveur va envoyer 
la liste de l'état des joueurs (connecté, déconnecté, occupé). Le client va afficher cette liste avec les boutons de *défi* si le joueur est disponible (non occupé et connecté). 
- Si un joueur défie un autre, celui-ci va envoyer un message d'**invitation** au serveur. Le serveur vérifie que les deux utilisateurs sont disponibles, crée le plateau associé à 
leur partie, les met en état d'*occupé* et envoie aux deux joueurs un message de **défi** avec de préciser les informations importantes (à qui est le tour, l'hôte, l'adversaire ...). 
- Lorsqu'un joueur reçoit un message **défi** de la part du serveur, le client va créer un plateau complet et l'afficher. Ensuite, le client enverra un message **invitationRecue** au serveur.
- Le jeu commence et le plateau envoie aux deux joueurs un message **play** avec le nom de l'hôte, l'adversaire et le nom du joueur qui doit jouer. 
- Le client qui doit jouer met à jour son plateau et déplace son pion. Ensuite, le client envoie un message **playDone** avec le déplacement effectué. 
- Le serveur reçoit le message et met à jour en conséquence son plateau. Puis, le serveur envoie le déplacement effectué sous la forme d'un message **play** 
au joueur qui doit maintenant joué.
et qui attendait au tour précédent. Et ainsi de suite, en répétant l'étape précédente et celle-ci. 
- A chaque fois que le serveur reçoit un nouveau déplacement, il vérifie sa validité et vérifie si il y a un gagnant. SSi le déplacement est invalide, s'il y a un abandon, si un joueur 
se déconnecte, le serveur enverra un message **error**. Si la partie est terminé, il enverra un message **défiFini**. 
- Si un client reçoit un message de la dernière étape, le jeu se termine et les deux joueurs redeviennent non-occupé sur le menu d'accueil.
