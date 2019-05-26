/* Fichier client.js qui gere le cote client de l'application */

//////////////////////////////////////////////////////////////////////////
// Constantes liees au jeu de dames
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
const DEPLACEMENT_FINI=3;
const ATTENTE=4;

const JOUABLE=1;
const NON_JOUABLE=0;

const NON_CHOISI=0;
const CHOISI=1;
const DEPLACEMENT_FORCE=2;

const DEPLACEMENT_LONG_DAME=1;
const DEPLACEMENT_COURT_DAME=2;
const PRISE_OBLIGATOIRE=1;
const PRISE_FACULTATIVE=2;

const NA_PAS_JOUE=1;
const JOUE=2;
const DEJA_JOUE=3;


//////////////////////////////////////////////////////////////////////////
// Structures et variables liées au jeu de dames
//////////////////////////////////////////////////////////////////////////

// Variables globales
var plateau;
var step;
var pos_pion_choisi_x = 0;
var pos_pion_choisi_y = 0;
var envoi;
var joue;

// structure d'une case d'un plateau
class Case {
  constructor(couleur, pion, jouable, choisi) {
    this.couleur = couleur;
    this.pion = pion;
    this.jouable = jouable;
    this.choisi = choisi;
  }
  
  setCouleur(couleur) {
   this.couleur=couleur; 
  }
  
  setPion(pion){
   this.pion=pion; 
  }
  
  setJouable(jouable){
   this.jouable=jouable; 
  }
  
  setChoisi(choisi){
   this.choisi=choisi; 
  }
}

//////////////////////////////////////////////////////////////////////////
// Fonctions liées au jeu de dames
//////////////////////////////////////////////////////////////////////////

// Fonction qui initialise le plateau du client
function initPlateau(){
  plateau = Array(10);
  for (var i = 0 ; i < 10 ; i++) {
    plateau[i] = Array(10);
    for (var j = 0 ; j < 10 ; j++) {
        if ((i%2==0)&& (j%2==0)) plateau[i][j]=new Case(CASE_BLANCHE, SANS_PION, NON_JOUABLE, NON_CHOISI);
        else if ((i%2==1)&& (j%2==1)) plateau[i][j]=new Case(CASE_BLANCHE, SANS_PION, NON_JOUABLE, NON_CHOISI);
        else plateau[i][j]=new Case(CASE_NOIRE, SANS_PION, NON_JOUABLE, NON_CHOISI);
    }
  }
  pos_pion_choisi_x = 0;
  pos_pion_choisi_y = 0;

  // Initialisation des pions noirs sur le plateau
  for(var i=0; i<=3;i++) {
    for(var j=0;j<10;j++){
      if ((i%2==0)&&(j%2==1)) plateau[i][j].pion=PION_NOIR; 
      if ((i%2==1)&&(j%2==0)) plateau[i][j].pion=PION_NOIR; 
    }
  }

  // Initialisation des pions blancs sur le plateau (qui commencent a jouer)
  for(var i=6; i<=9;i++) {
    for(var j=0;j<10;j++){
      if ((i%2==0)&&(j%2==1)) plateau[i][j].pion=PION_BLANC; 
      if ((i%2==1)&&(j%2==0)) plateau[i][j].pion=PION_BLANC; 
    
    }
  } 
}

// Fonction qui supprime le plateau du client
function deletePlateau(){
  for (var i = 0 ; i < 10 ; i++) {
    for (var j = 0 ; j < 10 ; j++) {
        if ((i%2==0)&& (j%2==0)) plateau[i][j]=new Case(CASE_BLANCHE, SANS_PION, NON_JOUABLE, NON_CHOISI);
        else if ((i%2==1)&& (j%2==1)) plateau[i][j]=new Case(CASE_BLANCHE, SANS_PION, NON_JOUABLE, NON_CHOISI);
        else plateau[i][j]=new Case(CASE_NOIRE, SANS_PION, NON_JOUABLE, NON_CHOISI);
    }
  }
  pos_pion_choisi_x = 0;
  pos_pion_choisi_y = 0;

  // Initialisation des pions noirs sur le plateau
  for(var i=0; i<=3;i++) {
    for(var j=0;j<10;j++){
      if ((i%2==0)&&(j%2==1)) plateau[i][j].pion=PION_NOIR; 
      if ((i%2==1)&&(j%2==0)) plateau[i][j].pion=PION_NOIR; 
    }
  }

  // Initialisation des pions blancs sur le plateau (qui commencent a jouer)
  for(var i=6; i<=9;i++) {
    for(var j=0;j<10;j++){
      if ((i%2==0)&&(j%2==1)) plateau[i][j].pion=PION_BLANC; 
      if ((i%2==1)&&(j%2==0)) plateau[i][j].pion=PION_BLANC; 
    
    }
  }
}

// Fonction qui met les pions du plateau a NON_JOUABLE
function setPionsNonJouables(){
  for(var i=0; i<10;i++) {
    for(var j=0;j<10;j++){
      plateau[i][j].jouable=NON_JOUABLE;
    }
  }
}

// Fonction qui met les pions du plateau a NON_CHOISI
function setPionsNonChoisis(){
   for(var i=0; i<10;i++) {
      for(var j=0;j<10;j++){
          plateau[i][j].choisi=NON_CHOISI;
          pos_pion_choisi_x=POSITION_INVALIDE;
          pos_pion_choisi_y=POSITION_INVALIDE;
      }
  }
}

// Fonction qui teste si le pion a la position (i,j) est jouable ou non
function testJouable(i, j){
  
  // si le client est l'adversaire, c'est le blanc
  if(sessionStorage['login']===sessionStorage['adversaire']){
    if ((plateau[i][j].pion===PION_BLANC)||(plateau[i][j].pion===DAME_BLANC)){
      // pion haut droit
      if ((j<9)&&(i>0)){
        if (plateau[i-1][j+1].pion===SANS_PION){
          return true;
        }
      }
               
      // pion haut gauche
      if ((j>0)&&(i>0)){
        if (plateau[i-1][j-1].pion===SANS_PION){
          return true;
        }
      }
      
      // pion haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===PION_NOIR)){
          return true;
        }
      }
      
      // pion haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===PION_NOIR)){
          return true;
        }
      }
      
      // pion haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===DAME_NOIR)){
          return true;
        }
      }
      
      // pion haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===DAME_NOIR)){
          return true;
        }
      }
      
      // si c'est une dame (deplacement ou on veut)
      if (plateau[i][j].pion===DAME_BLANC){
        // pion bas droit
        if ((j<9)&&(i<9)){
          if (plateau[i+1][j+1].pion===SANS_PION){
            return true;
          }
        }
              
        // pion bas gauche
        if ((j>0)&&(i<9)){
          if (plateau[i+1][j-1].pion===SANS_PION){
            return true;
          }
        }
      
        // pion bas droit mangeable
        if ((j<8)&&(i<8)){
          if ((plateau[i+1][j+1].pion===PION_NOIR)&&(plateau[i+2][j+2].pion===SANS_PION)){
            return true;
          }
        }
              
        // pion bas gauche mangeable
        if ((j>1)&&(i<8)){
          if ((plateau[i+1][j-1].pion===PION_NOIR)&&(plateau[i+2][j-2].pion===SANS_PION)){
            return true;
          }
        }
        
        // dame bas droit mangeable
        if ((j<8)&&(i<8)){
          if ((plateau[i+1][j+1].pion===DAME_NOIR)&&(plateau[i+2][j+2].pion===SANS_PION)){
            return true;
          }
        }
              
        // dame bas gauche mangeable
        if ((j>1)&&(i<8)){
          if ((plateau[i+1][j-1].pion===DAME_NOIR)&&(plateau[i+2][j-2].pion===SANS_PION)){
            return true;
          }
        }
        
      }
    }
  }
          
  // si le client est l'hote, cest le pion noir
  if(sessionStorage['login']===sessionStorage['hote']){
    if ((plateau[i][j].pion===PION_NOIR)||(plateau[i][j].pion===DAME_NOIR)){
      // pion bas droit
      if ((j<9)&&(i<9)){
        if (plateau[i+1][j+1].pion===SANS_PION){
          return true;
        }
      }
              
      // pion bas gauche
      if ((j>0)&&(i<9)){
        if (plateau[i+1][j-1].pion===SANS_PION){
          return true;
        }
      }
      
      // pion bas droit mangeable
      if ((j<8)&&(i<8)){
        if ((plateau[i+1][j+1].pion===PION_BLANC)&&(plateau[i+2][j+2].pion===SANS_PION)){
          return true;
        }
      }
              
      // pion bas gauche mangeable
      if ((j>1)&&(i<8)){
        if ((plateau[i+1][j-1].pion===PION_BLANC)&&(plateau[i+2][j-2].pion===SANS_PION)){
          return true;
        }
      }
      
      // dame bas droit mangeable
      if ((j<8)&&(i<8)){
        if ((plateau[i+1][j+1].pion===DAME_BLANC)&&(plateau[i+2][j+2].pion===SANS_PION)){
          return true;
        }
      }
              
      // dame bas gauche mangeable
      if ((j>1)&&(i<8)){
        if ((plateau[i+1][j-1].pion===DAME_BLANC)&&(plateau[i+2][j-2].pion===SANS_PION)){
          return true;
        }
      }
      
      // si c'est une dame (deplacement ou on veut)
      if (plateau[i][j].pion===DAME_NOIR){
        // pion haut droit
        if ((j<9)&&(i>0)){
          if (plateau[i-1][j+1].pion===SANS_PION){
            return true;
          }
        }
               
        // pion haut gauche
        if ((j>0)&&(i>0)){
          if (plateau[i-1][j-1].pion===SANS_PION){
            return true;
          }
        }
      
        // pion haut droit mangeable
        if ((j<8)&&(i>1)){
          if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===PION_BLANC)){
            return true;
          }
        }
      
        // pion haut gauche mangeable
        if ((j>1)&&(i>1)){
          if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===PION_BLANC)){
            return true;
          }
        }
        
        // dame haut droit mangeable
        if ((j<8)&&(i>1)){
          if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===DAME_BLANC)){
            return true;
          }
        }
      
        // dame haut gauche mangeable
        if ((j>1)&&(i>1)){
          if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===DAME_BLANC)){
            return true;
          }
        }
        
      }
    }
  }
  return false;
}

// Fonction qui calcule quels sont les pions jouables ou non et les met en JOUABLE
function setPionsJouables(){
  for(var i=0; i<10;i++) {
        for(var j=0;j<10;j++){
          if (testJouable(i, j)==true) plateau[i][j].jouable=JOUABLE;
      }
    }
}

// Fonction qui deplace le pion deplace en (x,y) pour le mettre en (i,j) (informations donnees par le serveur)
function deplacePionServeur(x, y, i, j, joueurAncienTour){
  
  // on teste si le deplacement du serveur est correct
  if(joueurAncienTour===sessionStorage['adversaire']){
    if((plateau[x][y].pion!=PION_BLANC)&&(plateau[x][y].pion!=DAME_BLANC)){
      console.log("Probleme de connexion, le serveur a envoye plusieurs fois le meme deplacement");
      return;
    }
  }
  else if(joueurAncienTour===sessionStorage['hote']){
    if((plateau[x][y].pion!=PION_NOIR)&&(plateau[x][y].pion!=DAME_NOIR)){
      console.log("Probleme de connexion, le serveur a envoye plusieurs fois le meme deplacement");
      return;
    }
  }
  
  plateau[i][j].pion=plateau[x][y].pion;
  plateau[x][y].pion=SANS_PION;
  
  // cas de transformation en une dame blanche
  if(joueurAncienTour===sessionStorage['adversaire']){
    if (i===0){
      plateau[i][j].pion=DAME_BLANC; 
    }
  }
  // cas de transformation en une dame noire
  if(joueurAncienTour===sessionStorage['hote']){
    if (i===9){
      plateau[i][j].pion=DAME_NOIR; 
    }
  }
  
  // cas deplacement haut gauche où on mange
  if ((x>i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i+1][j+1].pion=SANS_PION;
  }
  
  // cas deplacement haut droit où on mange
  if ((x>i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i+1][j-1].pion=SANS_PION; 
  }
  
  // cas déplacement bas gauche où on mange 
  if ((x<i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i-1][j+1].pion=SANS_PION; 
  }
  
  // cas déplacement bas droit où on mange 
  if ((x<i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i-1][j-1].pion=SANS_PION; 
  }
}

// Fonction qui deplace le pion place en (x,y) pour le mettre en (i,j)
function deplacePion(x, y, i, j){
  plateau[i][j].pion=plateau[x][y].pion;
  plateau[x][y].pion=SANS_PION;
  
  // cas de transformation en une dame blanche
  if(sessionStorage['login']===sessionStorage['adversaire']){
    if (i===0){
      plateau[i][j].pion=DAME_BLANC; 
    }
  }
  // cas de transformation en une dame noire
  if(sessionStorage['login']===sessionStorage['hote']){
    if (i===9){
      plateau[i][j].pion=DAME_NOIR; 
    }
  }
  
  // cas deplacement haut gauche où on mange
  if ((x>i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i+1][j+1].pion=SANS_PION;
  }
  
  // cas deplacement haut droit où on mange
  if ((x>i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i+1][j-1].pion=SANS_PION; 
  }
  
  // cas déplacement bas gauche où on mange 
  if ((x<i)&&(y>j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i-1][j+1].pion=SANS_PION; 
  }
  
  // cas déplacement bas droit où on mange 
  if ((x<i)&&(y<j)&&(Math.abs(x-i)>1)&&(Math.abs(y-j)>1)){
    plateau[i-1][j-1].pion=SANS_PION; 
  }
}

// Fonction qui calcule les deplacements forces pour le joueur
function calculDeplacementForce(){
  
  // recherche du pion choisi
  let i, j;
  for(var k=0; k<10;k++) {
    for(var l=0;l<10;l++){
      if (plateau[k][l].choisi===CHOISI){
        i=k; j=l;
      }
    }
  }
   
  // si c'est le tour des blancs
  if(sessionStorage['login']===sessionStorage['adversaire']){
      // pion haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===PION_NOIR)){
          plateau[i-2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
      
      // pion haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===PION_NOIR)){
          plateau[i-2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      } 
    
      // dame haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===DAME_NOIR)){
          plateau[i-2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
      
      // dame haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===DAME_NOIR)){
          plateau[i-2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      } 
      
      if (plateau[i][j].pion===DAME_BLANC){
        // pion bas droit mangeable
        if ((j<8)&&(i<8)){
          if ((plateau[i+1][j+1].pion===PION_NOIR)&&(plateau[i+2][j+2].pion===SANS_PION)){
            plateau[i+2][j+2].choisi=DEPLACEMENT_FORCE;
          }
        }
              
        // pion bas gauche mangeable
        if ((j>1)&&(i<8)){
          if ((plateau[i+1][j-1].pion===PION_NOIR)&&(plateau[i+2][j-2].pion===SANS_PION)){
            plateau[i+2][j-2].choisi=DEPLACEMENT_FORCE;
          }
        }
        
        // dame bas droit mangeable
        if ((j<8)&&(i<8)){
          if ((plateau[i+1][j+1].pion===DAME_NOIR)&&(plateau[i+2][j+2].pion===SANS_PION)){
            plateau[i+2][j+2].choisi=DEPLACEMENT_FORCE;
          }
        }
              
        // dame bas gauche mangeable
        if ((j>1)&&(i<8)){
          if ((plateau[i+1][j-1].pion===DAME_NOIR)&&(plateau[i+2][j-2].pion===SANS_PION)){
            plateau[i+2][j-2].choisi=DEPLACEMENT_FORCE;
          }
        }
      }

      // deplacement haut droit
      if ((j<9)&&(i>0)){
        if (plateau[i-1][j+1].pion===SANS_PION){
          plateau[i-1][j+1].choisi=DEPLACEMENT_FORCE;
        }
      }
               
      // deplacement haut gauche
      if ((j>0)&&(i>0)){
        if (plateau[i-1][j-1].pion===SANS_PION){
          plateau[i-1][j-1].choisi=DEPLACEMENT_FORCE;
        }
      }
    
    if (plateau[i][j].pion===DAME_BLANC){
      // deplacement bas droit
      if ((j<9)&&(i<9)){
        if (plateau[i+1][j+1].pion===SANS_PION){
          plateau[i+1][j+1].choisi=DEPLACEMENT_FORCE;
        }
      }
              
      // deplacement bas gauche
      if ((j>0)&&(i<9)){
        if (plateau[i+1][j-1].pion===SANS_PION){
          plateau[i+1][j-1].choisi=DEPLACEMENT_FORCE;
        }
      }  
    }
  }
  
  // si c'est le tour des noirs
  else if(sessionStorage['login']===sessionStorage['hote']){
      // pion bas droit mangeable
      if ((j<8)&&(i<8)){
        if ((plateau[i+1][j+1].pion===PION_BLANC)&&(plateau[i+2][j+2].pion===SANS_PION)){
          plateau[i+2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
              
      // pion bas gauche mangeable
      if ((j>1)&&(i<8)){
        if ((plateau[i+1][j-1].pion===PION_BLANC)&&(plateau[i+2][j-2].pion===SANS_PION)){
          plateau[i+2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      }
    
    // dame bas droit mangeable
      if ((j<8)&&(i<8)){
        if ((plateau[i+1][j+1].pion===DAME_BLANC)&&(plateau[i+2][j+2].pion===SANS_PION)){
          plateau[i+2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
              
      // dame bas gauche mangeable
      if ((j>1)&&(i<8)){
        if ((plateau[i+1][j-1].pion===DAME_BLANC)&&(plateau[i+2][j-2].pion===SANS_PION)){
          plateau[i+2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      }
    
    if (plateau[i][j].pion===DAME_NOIR){
      // pion haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===PION_BLANC)){
          plateau[i-2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
      
      // pion haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===PION_BLANC)){
          plateau[i-2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      } 
      
      // dame haut droit mangeable
      if ((j<8)&&(i>1)){
        if ((plateau[i-2][j+2].pion===SANS_PION)&&(plateau[i-1][j+1].pion===DAME_BLANC)){
          plateau[i-2][j+2].choisi=DEPLACEMENT_FORCE;
        }
      }
      
      // dame haut gauche mangeable
      if ((j>1)&&(i>1)){
        if ((plateau[i-2][j-2].pion===SANS_PION)&&(plateau[i-1][j-1].pion===DAME_BLANC)){
          plateau[i-2][j-2].choisi=DEPLACEMENT_FORCE;
        }
      } 
    }
    
      // deplacement bas droit
      if ((j<9)&&(i<9)){
        if (plateau[i+1][j+1].pion===SANS_PION){
          plateau[i+1][j+1].choisi=DEPLACEMENT_FORCE;
        }
      }
              
      // deplacement bas gauche
      if ((j>0)&&(i<9)){
        if (plateau[i+1][j-1].pion===SANS_PION){
          plateau[i+1][j-1].choisi=DEPLACEMENT_FORCE;
        }
      }
    
    if (plateau[i][j].pion===DAME_NOIR){
      // deplacement haut droit
      if ((j<9)&&(i>0)){
        if (plateau[i-1][j+1].pion===SANS_PION){
          plateau[i-1][j+1].choisi=DEPLACEMENT_FORCE;
        }
      }
               
      // deplacement haut gauche
      if ((j>0)&&(i>0)){
        if (plateau[i-1][j-1].pion===SANS_PION){
          plateau[i-1][j-1].choisi=DEPLACEMENT_FORCE;
        }
      }
    }
  }
  
}

// Fonction qui change l'affichage des pions en fonction qu'ils sont jouables, a utiliser, etc... et de l'étape de jeu
function setPions(){
  if (step===CHOIX){
    setPionsNonChoisis();
    setPionsJouables();
  }
  else if (step===DEPLACEMENT){
    setPionsNonJouables();
  }
  else if(step===DEPLACEMENT_FINI){
    setPionsNonChoisis();
    setPionsNonJouables();
  }
}

// Fonction qui deplace les pions du jeu de dames en fonction de la position choisie (column, line)
function play(column, line){
  
  // si c'est le tour du blanc
  if(sessionStorage['login']===sessionStorage['adversaire']){
    
    if (step===CHOIX){
      if (testJouable(line, column)==true){
        plateau[line][column].choisi=CHOISI;
        sessionStorage['column_avant']=column;
        sessionStorage['line_avant']=line;
        console.log("CHOIX:"+sessionStorage['column_avant']+" "+sessionStorage['line_avant']);
        pos_pion_choisi_x=line;
        pos_pion_choisi_y=column;
        step=DEPLACEMENT;
        calculDeplacementForce();
      }
        return 1;
    }
    if (step===DEPLACEMENT){
      if (plateau[line][column].choisi===DEPLACEMENT_FORCE){
        deplacePion(pos_pion_choisi_x, pos_pion_choisi_y, line, column);
        step=DEPLACEMENT_FINI;
        sessionStorage['column_apres']=column;
        sessionStorage['line_apres']=line;
        console.log("DEPLACEMENT:"+sessionStorage['column_apres']+" "+sessionStorage['line_apres']);
      }
      
      return 1;
    }
  }
  
  // si c'est le tour du noir
  else if(sessionStorage['login']===sessionStorage['hote']){
    if (step===CHOIX){
      if (testJouable(line, column)==true){
        plateau[line][column].choisi=CHOISI;
        sessionStorage['column_avant']=column;
        sessionStorage['line_avant']=line;
        console.log("CHOIX:"+sessionStorage['column_avant']+" "+sessionStorage['line_avant']);
        pos_pion_choisi_x=line;
        pos_pion_choisi_y=column;
        step=DEPLACEMENT;
        calculDeplacementForce();
      }
      return 1;
    }
    if (step===DEPLACEMENT){
      if (plateau[line][column].choisi===DEPLACEMENT_FORCE){
        deplacePion(pos_pion_choisi_x, pos_pion_choisi_y, line, column);
        step=DEPLACEMENT_FINI;
        sessionStorage['column_apres']=column;
        sessionStorage['line_apres']=line;
        console.log("DEPLACEMENT:"+sessionStorage['column_apres']+" "+sessionStorage['line_apres']);
      }
      return 1;
    }
  }

}

// fonction qui fait l'affichage du plateau
function render(hote, adversaire, tour){
  
  let div = $('#plat');
  div.innerHTML='';
  let tab = append(div,'table');
  tab.setAttribute('id', "table-plat");
  
  let test = false;

  for (var i = 0 ; i < 10 ; i++) {
    test=false;
    let tr = append(tab,'tr');
    tr.setAttribute('id', "tr-plat");

    for (var j = 0 ; j < 10 ; j++) {
        let td = append(tr,'td');
        test=false;
        if(plateau[i][j].couleur === CASE_BLANCHE){
          td.className = 'caseBlanche';
        }
        else if (plateau[i][j].couleur === CASE_NOIRE){
          // s'il faut afficher les pions possibles à choisir
          if ((plateau[i][j].pion===PION_BLANC)&&(plateau[i][j].jouable === JOUABLE)) td.className = 'pion1Jouable';
          else if ((plateau[i][j].pion===PION_NOIR)&&(plateau[i][j].jouable === JOUABLE)) td.className = 'pion2Jouable';
          else if ((plateau[i][j].pion===DAME_BLANC)&&(plateau[i][j].jouable === JOUABLE)){
            td.className = 'dame1Jouable';
            test=true;
          }
          else if ((plateau[i][j].pion===DAME_NOIR)&&(plateau[i][j].jouable === JOUABLE)){
            td.className = 'dame2Jouable';
            test=true;
          }
          
          // s'il faut afficher les pions possibles à choisir
          else if ((plateau[i][j].pion===PION_BLANC)&&(plateau[i][j].choisi === CHOISI)) td.className = 'pion1Choisi';
          else if ((plateau[i][j].pion===PION_NOIR)&&(plateau[i][j].choisi === CHOISI)) td.className = 'pion2Choisi';
          else if ((plateau[i][j].pion===DAME_BLANC)&&(plateau[i][j].choisi === CHOISI)){
            td.className = 'dame1Choisi';
            test=true;
          }
          else if ((plateau[i][j].pion===DAME_NOIR)&&(plateau[i][j].choisi === CHOISI)){
            td.className = 'dame2Choisi';
            test=true;
          }
          
          else if (plateau[i][j].choisi === DEPLACEMENT_FORCE) td.className = 'caseJeuForce';
          
          //s'il faut afficher les pions
          else if (plateau[i][j].pion === DAME_BLANC){
            td.className = 'dame1';
            test=true;
          }
          else if (plateau[i][j].pion === DAME_NOIR){
            td.className = 'dame2';
            test=true;
          }
          else if (plateau[i][j].pion === PION_BLANC) td.className = 'pion1'; 
          else if (plateau[i][j].pion === PION_NOIR) td.className = 'pion2'; 
          
          else td.className = 'caseNoire';
          
        }
      td.dataset.column = j;
      td.dataset.line = i;
      td.setAttribute('id', "td-plat");
      if (test===false) td.innerHTML=' ';
    }
  }
  
  // affichage a qui le tour
  let affichageTour=$('#tour');
  let coul;
  if (tour===hote) coul = "NOIR";
  else coul = "BLANC";
  let innerHTMLTour = "Tour du joueur "+coul+" "+tour;
  affichageTour.innerHTML=innerHTMLTour;
  
}

//////////////////////////////////////////////////////////////////////////
// Fonctions liées aux websockets
//////////////////////////////////////////////////////////////////////////

// Initialisation de la websocket
var ws = new WebSocket('wss://' + location.host);

var $ = document.querySelector.bind(document);
var $ = (s) => document.querySelector(s);

// Fonction permettant de modifier le DOM
function append(parent, balise) {
  return parent.appendChild(document.createElement(balise));
}

// Fonction qui va ouvrir une websocket avec le serveur
ws.addEventListener('open', function(e) {
  
  // Ecoute des mises a jour de la table des joueurs connectes
  ws.addEventListener('message', function(e) {
        
    // reception des donnees envoyes par le serveur
    let receive=JSON.parse(e.data);
    
    // affichage pour le débugguage
    console.log('received:', e.data);
    
    // si le joueur demarre défi on stocke en sessionStorage les participants du jeu et on affiche le plateau
    if (receive['type']==='defi'){
      
      if(joue===NA_PAS_JOUE) joue=JOUE;
      else joue=DEJA_JOUE;
        
      plateau = null;
      initPlateau();
      
      console.log("le joueur "+receive['hote']+" attaque le joueur "+receive['adversaire']); 
      sessionStorage['hote'] = receive['hote'];
      sessionStorage['adversaire'] = receive['adversaire'];
      ws.send(JSON.stringify({ type: 'invitationRecue', who: sessionStorage['login'], hote: receive['hote'], adversaire: receive['adversaire'] }));
      
      // suppression du bouton deconnexion
      let parent = document.body;
      let boutonDeconnexion = document.getElementById('boutonDeconnexion');
      let tabUsers = document.getElementById('users');
      parent.removeChild(boutonDeconnexion);
      parent.removeChild(tabUsers);
      
      // creation du titre du jeu
      let div = document.createElement("div");
      div.setAttribute('id', "avancement");
      document.body.appendChild(div);
      let tab = append(div,'table');
      tab.className = 'tabAvancement';
      let tr = append(tab,'tr');
      let tdBlanc = append(tr,'td');
      tdBlanc.className = 'avancementBlanc';
      tdBlanc.innerHTML=sessionStorage['adversaire'];
      let tdVs = append(tr,'td');
      tdVs.className = 'avancementVs';
      tdVs.innerHTML='    VS    ';
      let tdNoir = append(tr,'td');
      tdNoir.className = 'avancementNoir';
      tdNoir.innerHTML=sessionStorage['hote'];
      
      // creation du plateau
      let plat = document.createElement("div");
      plat.setAttribute('id', "plat");
      document.body.appendChild(plat);
      
      // creation du nom du joueur a qui est le tour
      let divTour = document.createElement("div");
      divTour.setAttribute('id', "tour");
      document.body.appendChild(divTour);
      
    }
    
    // si le joueur est en train de jouer avec un autre joueur
    if (receive['type']==='play'){
      envoi=false;
      let col; let line;
      step=CHOIX;
      
      // si c'est le tour du client, il doit jouer pour choisir le pion et le deplacer
      if (receive['tour']===sessionStorage['login']){
        // si c'est au tour du client de jouer et que l'adversaire a joue avant, on recupere les donnees du serveur
        if(receive['deplacement']==="maj")  {
          let joueurAncienTour;
          if(sessionStorage['login']===sessionStorage['hote']) joueurAncienTour = sessionStorage['adversaire'];
          else joueurAncienTour = sessionStorage['hote']; 
          
          console.log("le joueur adverse a fait un deplacement de ("+receive['x_avant']+","+receive['y_avant']+") vers ("+receive['x_apres']+","+receive['y_apres']+")");
          
          deplacePionServeur(receive['x_avant'], receive['y_avant'], receive['x_apres'], receive['y_apres'], joueurAncienTour);
        }
        setPions();
        
      }
      
      // si ce n'est pas le tour du client, le client ne fait rien
      else{
        step=ATTENTE;
        envoi=false;
      }
      
      // affichage initial
      render(receive['hote'], receive['adversaire'], receive['tour']);
      
      // au moment du clic de l'utilisateur sur le plateau
      document.querySelector('#plat').addEventListener('click',function(e) {
        
        // stockage de la case choisie par l'utilisateur
        col = parseInt(event.target.dataset.column);
        line = parseInt(event.target.dataset.line);
        
        play(col, line); 
        
        setPions();
        render(receive['hote'], receive['adversaire'], receive['tour']); 
        
        if ((step===DEPLACEMENT_FINI)&&(envoi===false)) {
          ws.send(JSON.stringify({ type: 'playDone', who: sessionStorage['login'], hote: receive['hote'], adversaire: receive['adversaire'], 
                                  column_avant: sessionStorage['column_avant'], line_avant: sessionStorage['line_avant'], 
                                  column_apres: sessionStorage['column_apres'], line_apres: sessionStorage['line_apres']}));

          let prochainTour;
          if (sessionStorage['login']===receive['hote']) prochainTour=receive['adversaire'];
          else prochainTour=receive['hote'];
          render(receive['hote'], receive['adversaire'], prochainTour); 
          envoi=true;
        }
        else render(receive['hote'], receive['adversaire'], receive['tour']); 
        
      });   
    }
    
    // si le joueur recoit defiFini, le jeu se termine car l'autre a abandonne ou l'autre a gagne
    if (receive['type']==='defiFini'){
      
      joue=DEJA_JOUE;
      
      // si un des joueurs a abandonne
      if(receive['nature']==="abandon"){
        if(sessionStorage['login']===receive['who']) alert("Vous avez abandonne la partie en cours! Vous avez perdu.");
        else alert("Votre adversaire a eu peur de vous! Vous avez gagne.");
      }
      
      // si un des joueurs a gagne et que l'autre a perdu
      else if(receive['nature']==="over"){
        console.warn("Le gagnant est "+receive['who']);
        if(sessionStorage['login']===receive['who']) alert("Vous avez perdu la partie!");
        else alert("Vous avez gagne la partie!");
      }
      
      deletePlateau();
      sessionStorage.removeItem('hote');
      sessionStorage.removeItem('adversaire');
      sessionStorage.removeItem('column_avant');
      sessionStorage.removeItem('line_avant');
      sessionStorage.removeItem('column_apres');
      sessionStorage.removeItem('line_apres');
    }
    
    // si le joueur recoit error, le jeu se termine car un des joueurs a fait un deplacement invalide
    if (receive['type']==='error'){
      
      joue=DEJA_JOUE;
      
      // si un des joueurs a fait un deplacement invalide on arrete le jeu
      if(receive['nature']==="deconnexion"){
        alert("Erreur : "+receive['content']);
      }
      
      // si un des joueurs a fait un deplacement invalide on arrete le jeu
      if(receive['nature']==="deplacement invalide"){
        alert("Erreur : "+receive['content']);
        sessionStorage.removeItem('login');
      }
      
      // si un des utilisateurs fait une action incorrecte
      if(receive['nature']==='action incorrecte'){
        alert("Erreur : "+receive['content']);
        window.location="/logout";
      }
      
      // si un des utilisateurs a tente de modifier ses sessionStorage
      if(receive['nature']==='usurpation identite'){        
        alert("Erreur : "+receive['content']);
        window.location="/logout";
      }
      
      deletePlateau();
      sessionStorage.removeItem('hote');
      sessionStorage.removeItem('adversaire');
      sessionStorage.removeItem('column_avant');
      sessionStorage.removeItem('line_avant');
      sessionStorage.removeItem('column_apres');
      sessionStorage.removeItem('line_apres');

    }
    
    // si l'utilisateur est dans le menu avec le tableau des joueurs connectes
    if ((sessionStorage['hote']===undefined)&&(sessionStorage['adversaire']===undefined)){
      
      if (joue===undefined) joue=NA_PAS_JOUE;
      
      // si le defi etait fini il faut reafficher la liste des joueurs connectes
      if ((receive['type']==='defiFini')||(receive['type']==="error")){
        let parent = document.body;
        
        // suppression du bouton abandon
        let boutonAbandon = document.getElementById('boutonAbandon');
        parent.removeChild(boutonAbandon);
        
        // suppression de l'affichage X VS Y
        let avancementTab = document.getElementById('avancement');
        parent.removeChild(avancementTab);
        
        // suppression du plateau
        let plateauAffichage = document.getElementById('plat');
        parent.removeChild(plateauAffichage);
        
        // suppression de l'affichage 
        let tourAffichage = document.getElementById('tour');
        parent.removeChild(tourAffichage);
                            
        let f = document.createElement("form");
        f.setAttribute('id',"boutonDeconnexion");
        f.setAttribute('method',"post");
        f.setAttribute('action',"/logout");
        
        let s = document.createElement("input"); 
        s.setAttribute('class',"button-deconnexion");
        s.setAttribute('type',"submit");
        s.setAttribute('value',"Se déconnecter");

        f.appendChild(s);
        parent.appendChild(f);
        
        let br = document.createElement("br");
        parent.appendChild(br);
        
        let span = document.createElement("span"); 
        span.setAttribute('id', "users");
        parent.appendChild(span);
        
      }
      
      let div = $('#users');
      div.innerHTML='';
      let tab = append(div,'table');
      tab.className = 'tabUsers'; 
      tab.setAttribute('id', "tab-users");
      let k=0;
      
     // ecriture dynamique du DOM avec les donnees envoyees par le serveur
     for (var i = 0 ; i < (receive.length/4)+1 ; i++) {
      let tr = append(tab,'tr');
      
      if(i===0) tr.setAttribute('id', "tr-titleUsers");
      else if(receive[k+1]===sessionStorage['login']) tr.setAttribute('id', "tr-clientEnJeu");
      else tr.setAttribute('id', "tr-users");

      for (var j = 0 ; j < 5 ; j++) {
        let td = append(tr,'td');
        td.innerHTML='';
        td.setAttribute('id', "td-users");
        // titres du tableau
        if ((i===0)&&(j===0)) td.innerHTML='Statut';
        else if ((i===0)&&(j===1)) td.innerHTML='Login';
        else if ((i===0)&&(j===2)) td.innerHTML='Win';
        else if ((i===0)&&(j===3)) td.innerHTML='Lose';
        else if ((i===0)&&(j===4)) td.innerHTML='Défier';
        
        // contenu du tableau
        else{
  
          // dessin des logos deconnecte, connecte et occupe
          if (j%5===0){
            if (receive[k]==='DECONNECTE') td.className = 'deconnecte'; 
            else if (receive[k]==='CONNECTE') td.className = 'connecte'; 
            else if (receive[k]==='OCCUPE') td.className = 'occupe'; 
            else td.innerHTML = ' ';
            k++;
          }
          
          // affichage des boutons pour défier
          else if (j%5===4){
            if ((receive[k-4]!='DECONNECTE')&&(receive[k-4]!='OCCUPE')&&(receive[k-3]!=sessionStorage['login'])){
              let f = document.createElement("button");
              f.innerHTML = 'Defi';
              td.appendChild(f);
              f.dataset.adversaire = receive[k-3];
              f.dataset.hote = sessionStorage['login'];
            }
            else {
              td.innerHTML = ' ';
            }

          }
          else{
            if ((j%5===1)&&(receive[k]===sessionStorage['login'])){
              td.innerHTML = receive[k];
              
            }
            else td.innerHTML = receive[k];
            k++;
          }
          
        }
      }
    }
   
   }
   
   // si l'utilisateur est en train de faire une partie de jeu
   else {
     let div = $('#boutonAbandon');
     div.innerHTML='';
     let boutonAbandon = document.createElement("button");
     boutonAbandon.innerHTML = 'Abandon';
     div.appendChild(boutonAbandon);
   }
    
    // permet de reafficher et de remettre les addEventListener sur les boutons "defier"
    if(joue===DEJA_JOUE){
     window.location="/play"; 
    }
  });

  // si l'utilisateur clique sur le bouton defier
  document.querySelector('#users').addEventListener('click',function(e) {
    let adversaire = event.target.dataset.adversaire;
    let hote = event.target.dataset.hote;
    if ((adversaire!=undefined)&&(hote!=undefined)){
      // on envoie au serveur un message invitation
      ws.send(JSON.stringify({ type: 'invitation', hote: hote, adversaire: adversaire }));
    }
  });
  
  // si l'utilisateur clique sur le bouton abandon pendant la partie
  document.querySelector('#boutonAbandon').addEventListener('click',function(e) {
    if ((sessionStorage['hote']!=undefined)&&(sessionStorage['adversaire']!=undefined)){
      // on envoie au serveur un message abandon
      ws.send(JSON.stringify({ type: 'abandon', who: sessionStorage['login'], hote: sessionStorage['hote'], adversaire: sessionStorage['adversaire'] }));
      deletePlateau();
      sessionStorage.removeItem('hote');
      sessionStorage.removeItem('adversaire');
      sessionStorage.removeItem('column_avant');
      sessionStorage.removeItem('line_avant');
      sessionStorage.removeItem('column_apres');
      sessionStorage.removeItem('line_apres');
    }
  });
  
});
