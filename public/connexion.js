/* Fichier connexion.js qui permet de stocker cote client le login qu'il a tapé lors de la connexion */

// fonction qui permet d'initialiser le sessionStorage de login des la premiere connexion du client
function getLogin(){    
  sessionStorage['login'] = document.getElementById("login").value;
}