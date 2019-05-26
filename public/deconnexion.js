/* Fichier deconnexion.js qui permet de gerer correctement les sessionStorage a la deconnexion */

// fonction qui permet de supprimer les sessionStorage a la deconnexion de l'utilisateur
function deconnect(){  
  sessionStorage.removeItem('hote');
  sessionStorage.removeItem('adversaire');
  sessionStorage.removeItem('column_avant');
  sessionStorage.removeItem('line_avant');
  sessionStorage.removeItem('column_apres');
  sessionStorage.removeItem('line_apres');
  sessionStorage.removeItem('login');
}

deconnect();

