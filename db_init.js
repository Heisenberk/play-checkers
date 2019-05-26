/* Fichier db_init.js qui va initialiser la base de donnees du site web */

// Constante permettant de se connecter a la base de donnees
var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: ".data/db.sqlite3"
    },
    debug: true,
});

// Constante permettant de hasher les mots de passe avant de les stocker
const bcrypt = require('bcrypt');

// Fonction de creation de la table users
async function createTableUsers() {  
  try{
    await knex.raw(`CREATE TABLE users (
    login varchar(255) PRIMARY KEY,
    password varchar(255) NOT NULL,
    nom varchar(255) NOT NULL,
    prenom varchar(255) NOT NULL,
    partiesGagnees MEDIUMINT UNSIGNED, 
    partiesPerdues MEDIUMINT UNSIGNED, 
    etat varchar(255) NOT NULL 
  )`);
  }
  catch(err){
     console.error('Erreur dans la création de la table users');  
  }
}

// Fonction de suppression de la table users
async function deleteTableUsers() {
   await knex.raw(`DROP TABLE IF EXISTS users`);
}

// Fonction de creation de la table cases
async function createTableCases() {  
  try{
    await knex.raw(`CREATE TABLE cases (
    x MEDIUMINT UNSIGNED,
    y MEDIUMINT UNSIGNED,
    couleur MEDIUMINT UNSIGNED,
    pion MEDIUMINT UNSIGNED,
    hote varchar(255) NOT NULL,
    adversaire varchar (255) NOT NULL,
    CONSTRAINT PK_Case PRIMARY KEY (x, y, hote, adversaire)
  )`);
  }
  catch(err){
     console.error('Erreur dans la création de la table Cases');  
  }
}

// Fonction de suppression de la table cases
async function deleteTableCases() {
   await knex.raw(`DROP TABLE IF EXISTS cases`);
}

// Fonction de suppression d'un tuple dans la table cases
async function deletePlateau(hote, adversaire){
  try{
    await knex.raw("DELETE FROM cases WHERE hote=? AND adversaire=?", [hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la suppression d\'un plateau dans la table users (deletePlateau)');  
  }
}

// Fonction d'insertion d'un tuple dans la table users
async function insertUser(login, password, nom, prenom){
  try{
    await knex.raw("INSERT INTO users VALUES (?, ?, ?, ?, 0, 0, ?)", [login, bcrypt.hashSync(password, 10), nom, prenom, "DECONNECTE"]);
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table users');  
  }
}

// Fonction de creation de la table avancements
async function createTableAvancements() {  
  try{
    await knex.raw(`CREATE TABLE avancements (
    hote varchar(255) NOT NULL,
    adversaire varchar (255) NOT NULL,
    tour varchar(255) NOT NULL,
    CONSTRAINT PK_Case PRIMARY KEY (hote, adversaire, tour)
  )`);
  }
  catch(err){
     console.error('Erreur dans la création de la table avancements');  
  }
}

// Fonction d'insertion d'un tuple dans la table avancements
async function insertAvancement(hote, adversaire){
  try{
    await knex.raw("INSERT INTO avancements VALUES (?, ?, ?)", [hote, adversaire, adversaire]);
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table avancements');  
  }
}

// Fonction de suppression d'un tuple dans la table avancements
async function deleteAvancement(hote, adversaire){
  try{
    await knex.raw("DELETE FROM avancements WHERE hote=? AND adversaire=?", [hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la suppression d\'un avancement dans la table avancements (deleteAvancementFini)');  
  }
}

// Fonction de suppression de la table avancements
async function deleteTableAvancements() {
   await knex.raw(`DROP TABLE IF EXISTS avancements`);
}

// Fonction d'accesseurs des utilisateurs de la table users
async function getUsers(){
  try{
    let rows = await knex('users');
    //let str="";
    let tab = []; 
    let i=0;
    for (var r of rows) {
      tab[i]=r.login; i++;
      tab[i]=r.password; i++;
      tab[i]=r.nom; i++;
      tab[i]=r.prenom; i++;
      tab[i]=r.partiesGagnees; i++;
      tab[i]=r.partiesPerdues; i++;
      tab[i]=r.etat; i++;
    }
    return tab;
  }
  catch(err){
     console.error('Erreur dans l\'affichage des éléments de la table');  
  }
}

// Fonction d'affichage des utilisateurs de la table users
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

// Fonction qui permet de mettre a CONNECTE un utilisateur
async function connectUser(login){
  try{ 
    var value = await knex.raw("UPDATE users SET etat = 'CONNECTE' WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users');  
  }
}

// Fonction qui teste si l'utilisateur est connecte ou non
async function testConnectUser(login){
  if (login === null) return "INVALID";
  try{ 
    var value = await knex.raw("SELECT users.etat FROM users WHERE users.login= ?", [login]);
    if (value.length == 1) {                   // Check if credentials matched
      if (value[0].etat === "CONNECTE") return "TRUE";
    } else {
      console.error('Erreur dans le test de connexion d\'un utilisateur dans la table users'); 
    }
    return "FALSE";
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users');  
  }
}

// Fonction qui deconnecte un utilisateur de la table users
async function disconnectUser(login){
  try{ 
    await knex.raw("UPDATE users SET etat = 'DECONNECTE' WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users');  
  }
}

// Fonction qui teste si un login existe
async function testLoginExist(login){
  try {
    var rows = await knex.raw('SELECT * FROM users WHERE login = ?', [login]);
    var test=false;
    for (var r of rows) {
      test=true;
    }
    return test;
  } catch (err) {
    console.log("Impossible de tester l'existence de ce tuple.");
  }
}

// Fonction principale de creation des tables et d'insertions des tuples par defaut
async function main(){
  await deleteTableCases();
  await createTableCases();
  
  await deleteTableUsers();
  await createTableUsers();
  
  await deleteTableAvancements();
  await createTableAvancements();

  await insertUser("darked691", "21502290", "Merimi", "Mehdi");
  await insertUser("Heisenberk", "21501810", "Caumes", "Clément");
  await insertUser("a", "a", "Dupont", "Charles");
  await insertUser("b", "b", "Dupond", "Felix");
  await insertUser("c", "c", "Toto", "Totoa");
  await insertUser("d", "d", "Tata", "Tatao");
  await insertUser("e", "e", "Momo", "Moma");
  await insertUser("f", "f", "Lilu", "Lou");

  await printUsers();

  await knex.destroy();
}

////////////////////////////////////////////////

main();














    


