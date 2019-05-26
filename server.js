/* Fichier server.js qui gere le cote client de l'application */

/////////////////////////////////////////////////////////////////////
// Variables d'initialisation
/////////////////////////////////////////////////////////////////////

var http = require('http');
var ws = require('ws');
var express = require('express');
var bodyParser = require('body-parser');
var asyncError = require('express-async-errors');
var consolidate = require('consolidate');
var expressSession = require('express-session');
var nunjucks = require('nunjucks');
const bcrypt = require('bcrypt');
require('events').EventEmitter.defaultMaxListeners = Infinity;

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', consolidate.nunjucks);
app.set('view engine', 'nunjucks');

var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: ".data/db.sqlite3"
    },
    debug: true,
});

var session = require('express-session');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(express.static('public'));

var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var server = http.createServer(app);
var wsserver = new ws.Server({ 
    server: server,
});

//////////////////////////////////////////////////////////////////////////
// Fonctions de gestion de la base de donnees sur la table cases
//////////////////////////////////////////////////////////////////////////

const CASE_BLANCHE = 0;
const CASE_NOIRE = 1;

const SANS_PION = 0;
const PION_BLANC = 1;
const PION_NOIR = 2;
const DAME_BLANC = 3;
const DAME_NOIR = 4;

const TOUR_BLANC=1;
const TOUR_NOIR=2;

const AUCUN_GAGNANT=0;
const GAGNANT_NOIR=1;
const GAGNANT_BLANC=2;

const POSITION_INVALIDE=-1;

const CHOIX=1;
const DEPLACEMENT=2;

const JOUABLE=1;
const NON_JOUABLE=0;

const NON_CHOISI=0;
const CHOISI=1;
const DEPLACEMENT_FORCE=2;

const DEPLACEMENT_LONG_DAME=1;
const DEPLACEMENT_COURT_DAME=2;
const PRISE_OBLIGATOIRE=1;
const PRISE_FACULTATIVE=2;

// Classe CasePlateau representant une case du plateau et qui sera envoye
class CasePlateau {
  constructor(x, y, couleur, pion) {
    this.x=x;
    this.y=y;
    this.couleur=couleur;
    this.pion=pion;
  }
}

// Fonction qui ajoute une case dans la table cases
async function insertCase(x, y, couleur, pion, hote, adversaire){
  try{
    await knex.raw("INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?)", [x, y, couleur, pion, hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table cases (insertCase)'); 
    console.error(err);
  }
}

// Fonction qui met a jour la nature du pion 
async function setPion(pion, x, y, hote, adversaire){
  try{ 
    await knex.raw("UPDATE cases SET pion = ? WHERE cases.x= ? AND cases.y= ? AND cases.hote= ? AND cases.adversaire= ?", [pion, x, y, hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la modif d\'une case dans la table Cases (setPion)');  
  }
}

// Fonction qui va creer le plateau de jeu
async function createPlateau(hote, adversaire){
  try{
    // initialisation des couleurs des cases
    for ( let i = 0 ; i < 10 ; i++ ) {
      for ( let j = 0 ; j < 10 ; j++ ) {
        if ((i%2==0)&& (j%2==0)) await insertCase(i, j, CASE_BLANCHE, SANS_PION, hote, adversaire);
        else if ((i%2==1)&& (j%2==1)) await insertCase(i, j, CASE_BLANCHE, SANS_PION, hote, adversaire);
        else await insertCase(i, j, CASE_NOIRE, SANS_PION, hote, adversaire);
      }
    }
    
    // Initialisation des pions noirs sur le plateau
    for(let i=0; i<=3;i++) {
      for(let j=0;j<10;j++){
        if ((i%2==0)&&(j%2==1)) await setPion(PION_NOIR, i, j, hote, adversaire);
        if ((i%2==1)&&(j%2==0)) await setPion(PION_NOIR, i, j, hote, adversaire);
      }
    }

    // Initialisation des pions blancs sur le plateau (qui commencent a jouer)
    for(var i=6; i<=9;i++) {
      for(var j=0;j<10;j++){
        if ((i%2==0)&&(j%2==1)) await setPion(PION_BLANC, i, j, hote, adversaire);
        if ((i%2==1)&&(j%2==0)) await setPion(PION_BLANC, i, j, hote, adversaire);
    
      }
    }
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table cases (createPlateau)');  
  }
}

// Fonction qui va supprimer le plateau de jeu
async function deletePlateau(hote, adversaire){
  try{
    await knex.raw("DELETE FROM cases WHERE hote=? AND adversaire=?", [hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la suppression d\'un plateau dans la table users (deletePlateau)');  
  }
}

// Fonction qui renvoie AUCUN_GAGNANT, GAGANT_NOIR, GAGNANT_BLANC en fonction de l'etat du jeu et renvoie le nom du gagnant
async function testVictoire(hote, adversaire){
  try{
    let pionsBlancs = await knex.raw("SELECT cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=? AND cases.pion=?", [hote, adversaire, PION_BLANC]);
    let damesBlancs = await knex.raw("SELECT cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=? AND cases.pion=?", [hote, adversaire, DAME_BLANC]);
    let pionsNoirs = await knex.raw("SELECT cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=? AND cases.pion=?", [hote, adversaire, PION_NOIR]);
    let damesNoirs = await knex.raw("SELECT cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=? AND cases.pion=?", [hote, adversaire, DAME_NOIR]);
    
    let compteBlancs = pionsBlancs.length + damesBlancs.length;
    let compteNoirs = pionsNoirs.length + damesNoirs.length;
    if(compteBlancs===0) return GAGNANT_NOIR;
    else if(compteNoirs===0) return GAGNANT_BLANC;
    else return AUCUN_GAGNANT;
  }
  catch(err){
     console.error('Erreur dans le getter des cases du plateau (testVictoire)');  
  }
}

// Fonction qui renvoie la liste des utilisateurs
async function getPion(i, j, hote, adversaire){
  try{
    var rows = await knex.raw("SELECT cases.pion FROM cases WHERE cases.x=? AND cases.y=? AND cases.hote= ? AND cases.adversaire=?", [i, j, hote, adversaire]);
    if (rows.length != 1) {  
      return null;
    } 
    let pion;
    for (var r of rows) {      
      pion=r.pion;
    }
    return pion;
  }
  catch(err){
     console.error('Erreur dans le setter du pion du plateau de la table cases (getPion)');  
  }
}

// Fonction qui renvoie toutes les cases du plateau de jeu
async function getPlateau(hote, adversaire){
  try{
    var rows = await knex.raw("SELECT cases.x, cases.y, cases.couleur, cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=?", [hote, adversaire]);
    let plat = {}; 
    let i=0; let k=0;
    if (rows.length != 100) {                   
      return null;
    } 
    for (var r of rows) {      
      plat[k]=new CasePlateau(r.x, r.y, r.couleur, r.pion);
      k++;
    }
    return plat;
  }
  catch(err){
     console.error('Erreur dans le setter du plateau de la table cases');  
  }
}

// Fonction qui affiche sur le terminal le plateau
async function affichePlateau(hote, adversaire){
  try{
    var rows = await knex.raw("SELECT cases.x, cases.y, cases.couleur, cases.pion FROM cases WHERE cases.hote= ? AND cases.adversaire=?", [hote, adversaire]);
    let i=0; let k=0;
    if (rows.length != 100) {                   
      return null;
    } 
    let str=""; let u=0;
    for (var r of rows) {   
      if((u!=0)&&(u%10)===0) str+="\n";
      str+=r.pion;
      
      u++;
    }
    console.log(str);
  }
  catch(err){
     console.error('Erreur dans l\'affichage du plateau de la table cases');  
  }
}

// Fonction qui deplace le pion place en (x,y) pour le mettre en (i,j)
async function deplacePion(x, y, i, j, login, hote, adversaire){
  
  let naturePionDepart = await getPion(x, y, hote, adversaire);
  
  // on met le nouveau pion a la nouvelle place
  if(naturePionDepart!=null) await setPion(naturePionDepart, i, j, hote, adversaire);
  await setPion(SANS_PION, x, y, hote, adversaire);
  
  // cas de transformation en une dame blanche
  if(login===adversaire){
    if (i===0){
      await setPion(DAME_BLANC, i, j, hote, adversaire);
    }
  }
  // cas de transformation en une dame noire
  if(login===hote){
    if (i===9){
      await setPion(DAME_NOIR, i, j, hote, adversaire);
    }
  }
  
  // cas deplacement haut gauche où on mange
  if ((x>i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    await setPion(SANS_PION, Math.abs(i+1), Math.abs(j+1), hote, adversaire);
  }
  
  // cas deplacement haut droit où on mange
  if ((x>i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    await setPion(SANS_PION, Math.abs(i+1), Math.abs(j-1), hote, adversaire);
  }
  
  // cas déplacement bas gauche où on mange 
  if ((x<i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    await setPion(SANS_PION, Math.abs(i-1), Math.abs(j+1), hote, adversaire);
  }
  
  // cas déplacement bas droit où on mange 
  if ((x<i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    await setPion(SANS_PION, Math.abs(i-1), Math.abs(j-1), hote, adversaire);
  }
}

//////////////////////////////////////////////////////////////////////////
// Fonctions de gestion de la base de donnees sur la table avancements
//////////////////////////////////////////////////////////////////////////

// Fonction qui insere dans la table avancements
async function insertAvancement(hote, adversaire){
  try{
    await knex.raw("INSERT INTO avancements VALUES (?, ?, ?)", [hote, adversaire, adversaire]);
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table avancements');  
    console.error(err);
  }
}

// Fonction qui renvoie un tableau avec le nom de l'hote et son adversaire
async function testeUserJoue(login){
  try{ 
    let rows1 = await knex.raw("SELECT avancements.hote, avancements.adversaire FROM avancements WHERE avancements.hote= ? ", [login]);
    if (rows1.length === 1) {                  
      let tour;
      for (var r of rows1) {      
        return [r.hote, r.adversaire];
      }
    } 
    let rows2 = await knex.raw("SELECT avancements.hote, avancements.adversaire FROM avancements WHERE avancements.adversaire= ? ", [login]);
    if (rows2.length === 1) {                  
      let tour;
      for (var r of rows2) {      
        return [r.hote, r.adversaire];
      }
    } 
    return null;
  }
  catch(err){
    console.error('Erreur dans la modif du tour dans la table avancements (setTourAvancement)');  
  }
}

// Fonction qui met a jour le tour du jeu en cours
async function setTourAvancement(hote, adversaire, tour){
  try{ 
    await knex.raw("UPDATE avancements SET tour = ? WHERE avancements.hote= ? AND avancements.adversaire= ? ", [tour, hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la modif du tour dans la table avancements (setTourAvancement)');  
  }
}

// Fonction qui renvoie le tour de l'avancement en jeu
async function getTourAvancement(hote, adversaire){
  try{
    var rows = await knex.raw("SELECT avancements.tour FROM avancements WHERE avancements.hote= ? AND avancements.adversaire=?", [hote, adversaire]);
    if (rows.length != 1) {                   
      return null;
    } 
    let tour;
    for (var r of rows) {      
      tour = r.tour;
    }
    return tour;
  }
  catch(err){
     console.error('Erreur dans le setter du tour de la table avancements (getTourAvancement)');  
  }
}

//Fonction qui supprime un tuple de la table avancements
async function deleteAvancement(hote, adversaire){
  try{
    await knex.raw("DELETE FROM avancements WHERE hote=? AND adversaire=?", [hote, adversaire]);
  }
  catch(err){
    console.error('Erreur dans la suppression d\'un avancement dans la table avancements (deleteAvancementFini)');  
  }
}

//////////////////////////////////////////////////////////////////////////
// Fonctions de gestion de la base de donnees sur la table users
//////////////////////////////////////////////////////////////////////////

// Fonction d'insertion de tuple dans users
async function insertUser(login, password, nom, prenom){
  try{
    await knex.raw("INSERT INTO users VALUES (?, ?, ?, ?, 0, 0, ?)", [login, bcrypt.hashSync(password, 10), nom, prenom, "DECONNECTE"]);
  }
  catch(err){
    console.error('Erreur dans l\'insertion dans la table users');  
  }
}

// Fonction d'insertion de tuple dans users
async function testUserExists(login){
  try{
    let rows = await knex.raw("SELECT users.* FROM users WHERE users.login = ?", [login]);
    if (rows.length >= 1) {                   
      return true;
    } 
    else return false;
  }
  catch(err){
    console.error('Erreur dans le test d\'existance du tuple dans la table users');  
  }
}

// Fonction qui met a jour l'etat CONNECTE du joueur
async function connectUser(login){
  try{ 
    await knex.raw("UPDATE users SET etat = 'CONNECTE' WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (connectUser)');  
  }
}

// Fonction qui met a jour l'etat deconnnecte du joueur
async function disconnectUser(login){
  try{ 
    await knex.raw("UPDATE users SET etat = 'DECONNECTE' WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (disconnectUser)');  
  }
}

// Fonction qui met a jour l'etat occupe du joueur
async function busyUser(login){
  try{ 
    await knex.raw("UPDATE users SET etat = 'OCCUPE' WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (busyUser)');  
  }
}

// Fonction qui incremente le nombre de victoires pour le login
async function incrementeVictoires(login){
  try{ 
    await knex.raw("UPDATE users SET partiesGagnees = partiesGagnees+1 WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (incrementeVictoires)');  
  }
}

// Fonction qui incremente le nombre de defaites pour le login
async function incrementeDefaites(login){
  try{ 
    await knex.raw("UPDATE users SET partiesPerdues = partiesPerdues+1 WHERE users.login= ?", [login]);
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (incrementeDefaites)');  
  }
}

// Fonction qui teste si l'utilisateur est connecte
async function testConnectUser(login){
  if (login === null) return "INVALID";
  try{ 
    var value = await knex.raw("SELECT users.etat FROM users WHERE users.login= ?", [login]);
    if (value.length == 1) { 
      if (value[0].etat === "CONNECTE") return "TRUE";
    } else {
      console.error('Erreur dans le test de connexion d\'un utilisateur dans la table users'); 
    }
    return "FALSE";
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (testConnectUser)');  
  }
}

// Fonction qui teste si l'utilisateur est connecte
async function testOccupeUser(login){
  if (login === null) return "INVALID";
  try{
    var value = await knex.raw("SELECT users.etat FROM users WHERE users.login= ?", [login]);
    if (value.length == 1) {
      if (value[0].etat === "OCCUPE") return "TRUE";
    } else {
      console.error('Erreur dans le test de connexion-occupe d\'un utilisateur dans la table users'); 
    }
    return "FALSE";
  }
  catch(err){
    console.error('Erreur dans la connection-occupe d\'un utilisateur dans la table users (testOccupeUser)');  
    console.error(err);
  }
}

// Fonction qui teste si le tuple login-password existe dans la table users
async function testValueExist(login, password){
  try {
    var rows = await knex.raw('SELECT * FROM users WHERE login=?', [login]);
    var test=false;
    for (var r of rows) {
      if (await bcrypt.compareSync(password, r.password)){
       test=true; 
      }
    }
    return test;
  } catch (err) {
    console.log("Impossible de tester l'existence de ce tuple dans users.");
  }
}

// Fonction qui teste si l'utilisateur existe
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

// Fonction qui renvoie la liste des utilisateurs
async function getUsers(){
  try{
    let rows = await knex('users');
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
     console.error('Erreur dans l\'affichage des éléments de la table users');  
  }
}

// Fonction qui recupere les donnees de l'utilisateur
async function getInfosUser(login){
  if (login === null) return null;
  try{ 
    var value = await knex.raw("SELECT users.etat, users.login, users.partiesGagnees, users.partiesPerdues FROM users WHERE users.login= ?", [login]);
    if (value.length == 1) { 
      return value;
    } else {
      console.error('Erreur dans le select d\'un utilisateur dans la table users'); 
    }
    return null;
  }
  catch(err){
    console.error('Erreur dans la connection d\'un utilisateur dans la table users (getInfosUser)');  
  }
}

// Fonction qui renvoie la liste des utilisateurs avec uniquement le login, le nombre de parties gagnées et perdues et l'état
async function getInfosMenu(){
  try{
    let rows = await knex.raw("SELECT users.etat, users.login, users.partiesGagnees, users.partiesPerdues FROM users");
    let tab = []; 
    let i=0;
    
    for (var r of rows) {
        tab[i]=r.etat; i++;
        tab[i]=r.login; i++;
        tab[i]=r.partiesGagnees; i++;
        tab[i]=r.partiesPerdues; i++;
    }
    return tab;
  }
  catch(err){
     console.error('Erreur dans l\'affichage des éléments de la table users (getInfosMenu)');  
  }
}

// Fonction qui renvoie la liste des utilisateurs avec uniquement le login, le nombre de parties gagnées et perdues et l'état
async function getUsersLoginPartiesEtat(){
  try{
    let rows = await knex('users');
    let tab = []; 
    let i=0;
    for (var r of rows) {
      tab[i]=r.etat; i++;
      tab[i]=r.login; i++;
      tab[i]=r.partiesGagnees; i++;
      tab[i]=r.partiesPerdues; i++;
    }
    return tab;
  }
  catch(err){
     console.error('Erreur dans l\'affichage des éléments de la table users');  
  }
}

// Fonction qui affiche la liste des utilisateurs
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


//////////////////////////////////////////////////////////////////////////
// Fonctions de verification du jeu du client
//////////////////////////////////////////////////////////////////////////

// Fonction qui renvoie true si le pion en (i,j) est le pion du client et false sinon
async function testePionValide(i, j, login, hote, adversaire){
  
  let naturePion = await getPion(i, j, hote, adversaire);
  if (naturePion===null) return false;
  // le joueur est un noir
   if(login===hote){
     if (naturePion===PION_NOIR) return true;
     else if(naturePion===DAME_NOIR) return true;
  }
  // le joueur est un blanc
  else {
     if (naturePion===PION_BLANC) return true;
     else if(naturePion===DAME_BLANC) return true;
  }
  return false;
}

// Fonction qui teste si le pion a la position (i,j) est jouable ou non
async function testePionJouable(i, j, login, hote, adversaire){
  
  // si le client est l'adversaire, c'est le blanc
  if(login===adversaire){
    
    let pionIJ=await getPion(i, j, hote, adversaire);
    
      if ((pionIJ===PION_BLANC)||(pionIJ===DAME_BLANC)){
        // pion haut droit
        if ((j<9)&&(i>0)){
          let pion1 = await getPion(i-1, j+1, hote, adversaire);
          if(pion1!=null){
            if(pion1===SANS_PION) return true;
          }
        }
               
        // pion haut gauche
        if ((j>0)&&(i>0)){
          let pion2 = await getPion(i-1, j-1, hote, adversaire);
          if(pion2!=null){
             if(pion2===SANS_PION) return true;
          }
        }
      
        // pion haut droit mangeable
        if ((j<8)&&(i>1)){
          let pion3, pion4;
          pion3 = await getPion(i-2, j+2, hote, adversaire);
          pion4 = await getPion(i-1, j+1, hote, adversaire); 
          if ((pion3!=null)&&(pion4!=null)){
            if ((pion3===SANS_PION)&&(pion4===PION_NOIR)) return true;
          }
        }
      
        // pion haut gauche mangeable
        if ((j>1)&&(i>1)){
          let pion5, pion6;
          pion5 = await getPion(i-2, j-2, hote, adversaire);
          pion6 = await getPion(i-1, j-1, hote, adversaire); 
          if((pion5===SANS_PION)&&(pion6===PION_NOIR)) return true;
        }
      
        // pion haut droit mangeable
        if ((j<8)&&(i>1)){
          let pion7, pion8;
          pion7 = await getPion(i-2, j+2, hote, adversaire);
          pion8 = await getPion(i-1, j+1, hote, adversaire);
          if ((pion7===SANS_PION)&&(pion8===DAME_NOIR)) return true;
        }
      
        // pion haut gauche mangeable
        if ((j>1)&&(i>1)){
          let pion9, pion10;
          pion9 = await getPion(i-2, j-2, hote, adversaire);
          pion10 = await getPion(i-1, j-1, hote, adversaire);
          if((pion9===SANS_PION)&&(pion10===DAME_NOIR)) return true;
        }
      
        // si c'est une dame (deplacement ou on veut)
        if (pionIJ===DAME_BLANC){
          // pion bas droit
          if ((j<9)&&(i<9)){
            let pion11 = await getPion(i+1, j+1, hote, adversaire);
            if (pion11===SANS_PION) return true;    
          }
              
          // pion bas gauche
          if ((j>0)&&(i<9)){
            let pion12 = await getPion(i+1, j-1, hote, adversaire);
            if (pion12===SANS_PION) return true;
          }
      
          // pion bas droit mangeable
          if ((j<8)&&(i<8)){
            let pion13 = await getPion(i+1, j+1, hote, adversaire);
            let pion14 = await getPion(i+2, j+2, hote, adversaire);
            if((pion13===PION_NOIR)&&(pion14===SANS_PION)) return true;
          }
              
          // pion bas gauche mangeable
          if ((j>1)&&(i<8)){
            let pion15 = await getPion(i+1, j-1, hote, adversaire);
            let pion16 = await getPion(i+2, j-2, hote, adversaire); 
            if((pion15===PION_NOIR)&&(pion16===SANS_PION)) return true;
          }
        
          // dame bas droit mangeable
          if ((j<8)&&(i<8)){
            let pion17 = await getPion(i+1, j+1, hote, adversaire);
            let pion18 = await getPion(i+2, j+2, hote, adversaire);
            if ((pion17==DAME_NOIR)&&(pion18===SANS_PION)) return true;
          }
              
          // dame bas gauche mangeable
          if ((j>1)&&(i<8)){
            let pion19 = await getPion(i+1, j-1, hote, adversaire);
            let pion20 = await getPion(i+2, j-2, hote, adversaire);
            if((pion19===DAME_NOIR)&&(pion20===SANS_PION)) return true;
          }
        }
      }
  }
          
  // si le client est l'hote, cest le pion noir
  if(login===hote){
    
    let pionIJ=await getPion(i, j, hote, adversaire);
    
    if((pionIJ===PION_NOIR)||(pionIJ===DAME_NOIR)){
      // pion bas droit
      if ((j<9)&&(i<9)){
        let pion1 = await getPion(i+1, j+1, hote, adversaire);
        if(pion1===SANS_PION) return true;
      }
              
      // pion bas gauche
      if ((j>0)&&(i<9)){
        let pion2 = await getPion(i+1, j-1, hote, adversaire);
        if(pion2===SANS_PION) return true;
      }
      
      // pion bas droit mangeable
      if ((j<8)&&(i<8)){
        let pion3 = await getPion(i+1, j+1, hote, adversaire);
        let pion4 = await getPion(i+2, j+2, hote, adversaire);
        if((pion3===PION_BLANC)&&(pion4===SANS_PION)) return true;
      }
              
      // pion bas gauche mangeable
      if ((j>1)&&(i<8)){
        let pion5 = await getPion(i+1, j-1, hote, adversaire);
        let pion6 = await getPion(i+2, j-2, hote, adversaire);
        if((pion5===PION_BLANC)&&(pion6===SANS_PION)) return true;
      }
      
      // dame bas droit mangeable
      if ((j<8)&&(i<8)){
        let pion7 = await getPion(i+1, j+1, hote, adversaire);
        let pion8 = await getPion(i+2, j+2, hote, adversaire);
        if((pion7===DAME_BLANC)&&(pion8===SANS_PION)) return true;
      }
              
      // dame bas gauche mangeable
      if ((j>1)&&(i<8)){
        let pion9 = await getPion(i+1, j-1, hote, adversaire);
        let pion10 = await getPion(i+2, j-2, hote, adversaire);
        if((pion9===DAME_BLANC)&&(pion10===SANS_PION)) return true;
      }
      
      // si c'est une dame (deplacement ou on veut)
      if (pionIJ===DAME_NOIR){
        // pion haut droit
        if ((j<9)&&(i>0)){
          let pion11 = await getPion(i-1, j+1, hote, adversaire);
          if (pion11===SANS_PION) return true;
        }
               
        // pion haut gauche
        if ((j>0)&&(i>0)){
          let pion12 = await getPion(i-1, j-1, hote, adversaire);
          if (pion12===SANS_PION) return true;
        }
      
        // pion haut droit mangeable
        if ((j<8)&&(i>1)){
          let pion13 = await getPion(i-2, j+2, hote, adversaire);
          let pion14 = await getPion(i-1, j+1, hote, adversaire);
          if((pion13===SANS_PION)&&(pion14===PION_BLANC)) return true;
        }
      
        // pion haut gauche mangeable
        if ((j>1)&&(i>1)){
          let pion15 = await getPion(i-2, j-2, hote, adversaire);
          let pion16 = await getPion(i-1, j-1, hote, adversaire);
          if ((pion15===SANS_PION)&&(pion16===PION_BLANC)) return true;
        }
        
        // dame haut droit mangeable
        if ((j<8)&&(i>1)){
          let pion17 = await getPion(i-2, j+2, hote, adversaire);
          let pion18 = await getPion(i-1, j+1, hote, adversaire);
          if((pion17===SANS_PION)&&(pion18===DAME_BLANC)) return true;
        }
      
        // dame haut gauche mangeable
        if ((j>1)&&(i>1)){
          let pion19 = await getPion(i-2, j-2, hote, adversaire);
          let pion20 = await getPion(i-1, j-1, hote, adversaire);
          if((pion19===SANS_PION)&&(pion20===DAME_BLANC)) return true;
        }
      }
    }
  }
  
  return false;
} 

// Fonction qui teste si le deplacement est valide 
async function testeDeplacementPossible(x_avant, y_avant, x_apres, y_apres, login, hote, adversaire){
  
  // si la case ou va aller le pion est deja occupe : c'est invalide
  let caseArrivee=await getPion(x_apres, y_apres, hote, adversaire);
  if (caseArrivee!=SANS_PION){
    return false;
  }
  
  // si on fait des sauts de pions bizarres : c'est invalide
  if((Math.abs(x_avant - x_apres)>2)||(Math.abs(y_avant - y_apres)>2)){
    return false;
  }
  
  // test si le deplacement est coherent par rapport a la nature du pion deplace
  let pionIJ=await getPion(x_avant, y_avant, hote, adversaire);
  if (pionIJ===PION_NOIR){
    if((x_avant - x_apres)>0) return false;
  }
  if (pionIJ===PION_BLANC){
    if((x_avant - x_apres)<0) return false;
  }
  
  // sinon c'est un deplacement valide
  return true;
}

// Fonction qui teste si un deplacement est valide (fonction du serveur de verifier cela)
async function testeDeplacementValide(x_avant, y_avant, x_apres, y_apres, login, hote, adversaire){
  if ((await testePionValide(y_avant, x_avant, login, hote, adversaire))===false){
    console.error("Pion deplace invalide");
    return false;
  }
  if ((await testePionJouable(y_avant, x_avant, login, hote, adversaire))===false){
    console.error("Pion deplace non jouable");
    return false;
  }
  if ((await testeDeplacementPossible(y_avant, x_avant, y_apres, x_apres, login, hote, adversaire))===false){
    console.error("Deplacement impossible du pion");
    return false;
  }
  
  return true;
}

//////////////////////////////////////////////////////////////////////////
// Fonctions de gestion des chemins possibles du site web
//////////////////////////////////////////////////////////////////////////

// liste des utilisateurs connectes et utilisant une websocket
var connected_users = {};
var ws_users = {};
var ws_connexion = {};

// Classe Player representant le client connecte au serveur
class Player {
  constructor(name) {
    this.name = name;      
  }
}

// Chemin vers la page d'accueil du jeu de dames
app.get('/', async function(request, response) {
  request.session.login=null;
  await printUsers();
  response.redirect('/connexion');  

});

// Page de connexion de l'application
app.get('/connexion', function(request, response) {
  response.sendFile(__dirname + '/views/connexion.html');
});

// Chemin vers la reponse de la requete post de login de la page d'accueil
app.post('/login', async function(request, response) {
  
  // si l'utilisateur veut se connecter 2 fois sur le meme compte
  if (connected_users[request.body.login]!=undefined){
    response.render('message.html', { 'type' : "Warning", 'content' : "Ce login est deja en ligne"});
  }
  
  // si l'utilisateur est bien reconnu, il se connecte
  else if (await testValueExist(request.body.login, request.body.password)==true){
    request.session.login = request.body.login;
    response.redirect('/play');
  }
  
  // si l'utilisateur n'est pas reconnu
  else {
    response.render('message.html', { 'type' : "Error", 'content' : "Login et/ou Mot de passe incorrect(s)"});
  }
});

// Chemin vers la reponse de la requete post de signin de la page d'accueil
app.post('/signin', async function(request, response) {

  // teste si le nouvel utilisateur a un login deja existant
  if(await testUserExists(request.body.login)===true){
    response.render('message.html', { 'type' : "Error", 'content' : "Login deja existant"});
  }
  else {
    // insertion dans la bdd
    await insertUser(request.body.login, request.body.password, request.body.nom, request.body.prenom); 
    response.render('message.html', { 'type' : "Informations", 'content' : "Nouvel utilisateur cree"});
  }
  
});

// Page pour se deconnecter par une requete POST
app.post('/logout', function(request, response) {
  request.session.login=null;
  response.render('message.html', { 'type' : "Informations", 'content' : "Deconnexion"});
});

// Page pour se deconnecter par une requete GET
app.get('/logout', function(request, response) {
  request.session.login=null;
  response.render('message.html', { 'type' : "Informations", 'content' : "Deconnexion"});
});

// Page qui va afficher la lite des joueurs avec les boutons pour defier les joueurs connectes
app.get('/play', async function(request, response) {
  
  if (request.session.login) {  
      response.sendFile(__dirname + '/views/play.html');
  } else {
    response.redirect('/connexion'); 
  }
  
  // connexion websocket
  wsserver.on('connection', async function connection(ws) {

    // on cree une fonction permettant de mettre a jour la table des utilisateurs du jeu et envoie en broadcast la mise a jour
    async function update(){
      await printUsers();
      console.warn(JSON.stringify(connected_users));
      wsserver.clients.forEach(async function (client) {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(await getInfosMenu()));
        }
      }); 
    }
    
    // Si il s'agit de la premiere connection, on enregistre l'utilisateur parmi ceux connectes
    var myuser = null;
    if ((await testOccupeUser(request.session.login)==="FALSE")&&(await testConnectUser(request.session.login)==="FALSE")){ 
      myuser = new Player(request.session.login);
      connected_users[request.session.login] = myuser;
      ws_users[request.session.login] = ws;
      console.warn(request.session.login+" connecté");
      await connectUser(request.session.login);
      await update();
    }
    
    // Si un utilisateur se deconnecte on le met a l'etat deconnecte
    ws.on('close', async function(data) {
      if (myuser!=null){
        console.warn(myuser.name + " déconnecté"); 
        let nomDeconnecte = myuser.name;
        delete connected_users[myuser.name];
        delete ws_users[myuser.name];
        await disconnectUser(myuser.name);
        myuser = null;
        request.session.login = null;
        
        // si le joueur qui se deconnecte etait en train de jouer, on fait abandonner la partie
        let tab = await testeUserJoue(nomDeconnecte);
        if(tab!=null){
          let nomGagnant, nomPerdant;
          nomPerdant = nomDeconnecte;
          if(nomPerdant===tab[0]) nomGagnant=tab[1];
          else nomGagnant=tab[0];
          
          // on augmente le nombre de defaites pour celui qui a perdu
          await incrementeDefaites(nomPerdant); 
                
          // on augmente le nombre de victoires de celui qui a gagne
          await incrementeVictoires(nomGagnant);
          
          // on supprime le plateau de jeu
          await deletePlateau(tab[0], tab[1]);
          
          // on met les deux joueurs en mode connecte car ils ont fini le defi
          await connectUser(nomGagnant);
          
          // on supprime le tuple correspondant au jeu qui vient de se terminer
          await deleteAvancement(tab[0], tab[1]); 
          
          // on envoie une erreur si un des joueurs s'est deconnecte
          if(ws_users[nomGagnant]!=undefined) ws_users[nomGagnant].send(JSON.stringify({ type: 'error', nature: 'deconnexion', content: 'Votre adversaire s\'est deconnecte... Vous avez donc gagne! '}));
        }
        await update();
      }
    });
    
    // reception des messages envoyes par les clients
    ws.on('message', async function(message) {
      
      if(myuser!=null){
        let dataParsed = JSON.parse(message);
        
        // si le serveur recoit une invitation, il l'envoie a l'hote et a l'adversaire pour se preparer
        if (dataParsed['type']==="invitation"){
          if ((connected_users[dataParsed['adversaire']]!= undefined)&&(connected_users[dataParsed['hote']]!= undefined)){
            
            // si il y a une usurpation d'identite
            if(ws_users[dataParsed['hote']]!=ws){
              ws.send(JSON.stringify({ type: 'error', nature: 'usurpation identite', content: 'Vous ne pouvez pas utiliser le compte d\'un autre utilisateur'}));
            }
            // si il n'y a aucun probleme
            else{
              if ((await testConnectUser(dataParsed['adversaire'])==="TRUE")&&(await testConnectUser(dataParsed['hote'])==="TRUE")){
                console.warn("Invitation envoye par "+ dataParsed['hote']);
                if ((ws_users[dataParsed['adversaire']] != undefined)&&(ws_users[dataParsed['hote']] != undefined)){
                    
                    // changement d'etat des joueurs 
                    await busyUser(dataParsed['adversaire']);
                    await busyUser(dataParsed['hote']);
                    await update();
                    
                    // creation du plateau et informations sur le jeu en cours
                    await createPlateau(dataParsed['hote'], dataParsed['adversaire']);
                    await insertAvancement(dataParsed['hote'], dataParsed['adversaire']); 
                  
                    // envoi aux joueurs concernes les defis
                    if(ws_users[dataParsed['adversaire']]!=undefined) ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'defi', hote: dataParsed['hote'], adversaire: dataParsed['adversaire']}));
                    if(ws_users[dataParsed['hote']]!=undefined) ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'defi', hote: dataParsed['hote'], adversaire: dataParsed['adversaire']}));
                  
                }
              }
            }
          } 
          
          // si il y a un probleme on deconnecte le joueur (car il vient d'effectuer une action INTERDITE en manipulant les sessionStorage)
          else {
            delete connected_users[dataParsed['hote']];
            delete ws_users[dataParsed['hote']];
            await disconnectUser(dataParsed['hote']);
            delete connected_users[dataParsed['adversaire']];
            delete ws_users[dataParsed['adversaire']];
            await disconnectUser(dataParsed['adversaire']);
            await update();
            ws.send(JSON.stringify({ type: 'error', nature: 'action incorrecte', content: 'Une action incorrecte a ete realisee'}));
          }
        }
        
        // si le serveur recoit invitRecue, il envoie play ou wait en fonction du joueur qui commence (premier tour)
        if (dataParsed['type']==="invitationRecue"){
          if ((connected_users[dataParsed['adversaire']]!= undefined)&&(connected_users[dataParsed['hote']]!= undefined)){
              ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'play', hote: dataParsed['hote'], adversaire: dataParsed['adversaire'], tour: dataParsed['adversaire']}));
              ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'play', hote: dataParsed['hote'], adversaire: dataParsed['adversaire'], tour: dataParsed['adversaire']}));
          }
        }
        
        // si le serveur recoit le deplacement fait par l'utilisateur
        if(dataParsed['type']==="playDone"){
          let tourJoueur=await getTourAvancement(dataParsed['hote'], dataParsed['adversaire']);
          let userJoue = dataParsed['who'];
          
          // si le joueur qui envoie un playDone et que cest son tour de jouer, on peut analyser son jeu pour l'envoyer a son adversaire (sinon on ignore car ce n'est pas son tour de jouer)
          if(tourJoueur===userJoue){
            
            // si il y a une usurpation d'identite
            let testUsurpation = true;
            if(ws_users[dataParsed['hote']]===ws) testUsurpation=false; 
            if(ws_users[dataParsed['adversaire']]===ws) testUsurpation=false; 
            if((ws_users[dataParsed['who']]!=ws)||(testUsurpation===true)){
              ws.send(JSON.stringify({ type: 'error', nature: 'usurpation identite', content: 'Vous ne pouvez pas jouer sur un autre plateau'}));
            }
            
            else { // aucune usurpation d'identite
               // on verifie que le deplacement est valide
              let testValide = await testeDeplacementValide(parseInt(dataParsed['column_avant']), parseInt(dataParsed['line_avant']), parseInt(dataParsed['column_apres']), parseInt(dataParsed['line_apres']), dataParsed['who'], dataParsed['hote'], dataParsed['adversaire']);

              // si le deplacement est valide, on modifie la base de donnees et on l'envoie a l'autre joueur
              if(testValide===true){
              
                // on change le tour
                let prochainTour;
                if (dataParsed['hote']===tourJoueur) prochainTour=dataParsed['adversaire'];
                else if (dataParsed['adversaire']===tourJoueur) prochainTour=dataParsed['hote'];
                await setTourAvancement(dataParsed['hote'], dataParsed['adversaire'], prochainTour);
                console.warn("Le joueur "+dataParsed['who']+" a deplace un pion de ("+dataParsed['column_avant']+","+dataParsed['line_avant']+") a ("+dataParsed['column_apres']+","+dataParsed['line_apres']+")" ); 
              
                // deplacement du pion
                await deplacePion(parseInt(dataParsed['line_avant']), parseInt(dataParsed['column_avant']), parseInt(dataParsed['line_apres']), parseInt(dataParsed['column_apres']), dataParsed['who'], dataParsed['hote'], dataParsed['adversaire']);
                await affichePlateau(dataParsed['hote'], dataParsed['adversaire']);
                           
                // envoi de la mise a jour de l'etat du plateau au joueur qui n'a pas joue
                ws_users[prochainTour].send(JSON.stringify({ type: 'play', hote: dataParsed['hote'], adversaire: dataParsed['adversaire'], tour: prochainTour, deplacement: "maj", 
                                                             x_avant: parseInt(dataParsed['line_avant']), y_avant: parseInt(dataParsed['column_avant']), 
                                                             x_apres: parseInt(dataParsed['line_apres']), y_apres: parseInt(dataParsed['column_apres'])}));
              
                ws_users[tourJoueur].send(JSON.stringify({ type: 'play', hote: dataParsed['hote'], adversaire: dataParsed['adversaire'], tour: prochainTour}));
              
                // si il y a un vainqueur, on avertit les deux joueurs pour qu'ils quittent
                let testVainqueur = await testVictoire(dataParsed['hote'], dataParsed['adversaire']);
              
                // si il y a un vainqueur et un perdant
                if(testVainqueur!=AUCUN_GAGNANT){
                  console.warn("Le vainqueur est "+ testVainqueur);
                  let nomGagnant, nomPerdant;
                
                  if(testVainqueur===GAGNANT_NOIR){
                    nomGagnant = dataParsed['hote'];
                    nomPerdant = dataParsed['adversaire'];
                    // on envoie le nom du perdant
                    ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'defiFini', nature: 'over', who: nomPerdant}));
                    ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'defiFini', nature: 'over', who: nomPerdant}));
                  }
                  else if (testVainqueur===GAGNANT_BLANC){
                    nomGagnant = dataParsed['adversaire'];
                    nomPerdant = dataParsed['hote'];
                    // on envoie le nom du perdant
                    ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'defiFini', nature: 'over', who: nomPerdant}));
                    ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'defiFini', nature: 'over', who: nomPerdant}));
                  }
                
                  // on augmente le nombre de defaites pour celui qui a perdu
                  await incrementeDefaites(nomPerdant); 
                
                  // on augmente le nombre de victoires de celui qui a gagne
                  await incrementeVictoires(nomGagnant);
                  let userHote = dataParsed['hote'];
                  let userAdversaire = dataParsed['adversaire'];
          
                  // on supprime le plateau de jeu
                  await deletePlateau(dataParsed['hote'], dataParsed['adversaire']);
          
                  // on met les deux joueurs en mode connecte car ils ont fini le defi
                  await connectUser(dataParsed['hote']);
                  await connectUser(dataParsed['adversaire']);
          
                  // on supprime le tuple correspondant au jeu qui vient de se terminer
                  await deleteAvancement(dataParsed['hote'], dataParsed['adversaire']); 
                  await update();
                }
              }
            
              // si le deplacement est invalide, on envoie un code d'erreur et on fait quitter la partie 
              else {
          
                console.warn("Deplacement invalide de la part du joueur "+dataParsed['who']);
                // on supprime le plateau de jeu
                await deletePlateau(dataParsed['hote'], dataParsed['adversaire']);
            
                // on met les deux joueurs en mode connecte car ils ont fini le defi
                await connectUser(dataParsed['hote']);
                await connectUser(dataParsed['adversaire']);
          
                // on supprime le tuple correspondant au jeu qui vient de se terminer
                await deleteAvancement(dataParsed['hote'], dataParsed['adversaire']); 
                await update();
          
                // on envoie aux deux joueurs le message pour quils quittent le jeu
                ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'error', nature: 'deplacement invalide', content: 'Le joueur '+ dataParsed['who'] +' a realise un deplacement invalide'}));
                ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'error', nature: 'deplacement invalide', content: 'Le joueur '+ dataParsed['who'] +' a realise un deplacement invalide'}));
              
              }
            }
          }
        }
        
        // si le serveur recoit un abandon, il met a jour le nombre de victoires et de defaites, les remet en connecte et informe que le jeu est fini pour les deux joueurs
        if (dataParsed['type']==="abandon"){
          
          // si il y a une usurpation d'identite
          let testUsurpation = true;
          if(ws_users[dataParsed['hote']]===ws) testUsurpation=false; 
          if(ws_users[dataParsed['adversaire']]===ws) testUsurpation=false; 
          
          // en cas d'usurpation d'identite
          if((ws_users[dataParsed['who']]!=ws)||(testUsurpation===true)){
            ws.send(JSON.stringify({ type: 'error', nature: 'usurpation identite', content: 'Vous ne pouvez pas abandonner au nom d\'un autre utilisateur'}));
          }
          
          // si il n'y a pas de probleme
          else {
            // on augmente le nombre de defaites pour celui qui a perdu
            let userAbandon = dataParsed['who'];
            await incrementeDefaites(userAbandon); 
            let userHote = dataParsed['hote'];
            let userAdversaire = dataParsed['adversaire'];
          
            // on supprime le plateau de jeu
            await deletePlateau(dataParsed['hote'], dataParsed['adversaire']);
          
            // on augmente le nombre de victoires de celui qui n'a pas abandonne
            if (userAbandon===userHote) await incrementeVictoires(userAdversaire);
            else if (userAbandon===userAdversaire) await incrementeVictoires(userHote);
          
            // on met les deux joueurs en mode connecte car ils ont fini le defi
            await connectUser(userHote);
            await connectUser(userAdversaire);
          
            // on supprime le tuple correspondant au jeu qui vient de se terminer
            await deleteAvancement(userHote, userAdversaire); 
            await update();
          
            // on envoie aux deux joueurs le message pour quils affichent le tableau des users
            ws_users[dataParsed['adversaire']].send(JSON.stringify({ type: 'defiFini', nature: 'abandon', who: userAbandon}));
            ws_users[dataParsed['hote']].send(JSON.stringify({ type: 'defiFini', nature: 'abandon', who: userAbandon}));
          }        
        } 
      }
    });
  });
  
  // gestion des pings pour que les utilisateurs connectes ne se deconnectent pas automatiquement
  setInterval(() => {
      let temp = Object.values(ws_users);
       for(let i = 0 ; i < temp.length ; i++){
         temp[i].ping();
       }
    }, 40000);
});

server.listen(process.env.PORT);

