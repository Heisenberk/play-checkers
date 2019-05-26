/* Fichier db_init.js qui va initialiser la base de donnees du site web */

// Constante permettant de se connecter a la base de donnees
var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: ".data/db.sqlite3"
    },
    debug: true,
});

// Fonction qui met a jour l'etat deconnnecte de tous les joueurs pour la maintenance
async function disconnectUsers(){
  try{ 
    await knex.raw("UPDATE users SET etat = 'DECONNECTE' ");
  }
  catch(err){
    console.error('Erreur dans la connection des utilisateurs dans la table users (disconnectUsers)');  
  }
}

// Fonction qui affiche les utilisateurs de la table users
async function printUsers(){
  try{
    let rows = await knex('users');
    let str;
    for (var r of rows) {
      str="["+r.login+" "+r.password+" "+r.nom+" "+r.prenom+" "+r.partiesGagnees+" "+r.partiesPerdues+" "+r.etat+"]";
      console.log(str);
    }
  }
  catch(err){
     console.error('Erreur dans l\'affichage des éléments de la table');  
  }
}

// Fonction principale
async function main(){
  await printUsers();
  await disconnectUsers();
  await printUsers();
  await knex.destroy();
}

////////////////////////////////////////////////

main();














    


