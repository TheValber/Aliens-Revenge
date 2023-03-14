/*
 * Aliens Revenge
 * Mai 2021 - Juin 2021
 * Bernier Valentin - Trinh Jean-Pascal
 */


"use strict";



// Classe du joueur
class Player {
  constructor(game_size) {
    this.x = Math.floor(game_size[0] / 2); // Milieu
    this.y = game_size[1] - 250;
    this.direction = [0, 1];
    this.speed = 1.5;
    this.reload = 0; // Temps restant avant le prochain tir
    this.reload_max = 48; // Temps entre deux tirs (centièmes de secondes)
    this.life = 5;
    this.max_missiles = 10; // Missiles maximum dans la zone de jeu
    this.missile_damage = 0; // Degats ajoutés aux missiles
  }

  // Dessine le joueur (triangle)
  draw(context) {
    context.fillStyle = "#FACADE";
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(this.x - 15, this.y + 30);
    context.lineTo(this.x + 15, this.y + 30);
    context.lineTo(this.x, this.y);
    context.fill();
    context.stroke();
  }

  // Détecte les collisions entre le joueur et les limites du canva
  collision_wall(game_size) {
    if (this.x <= 15) { // Gauche
      this.direction = [1, 0];
    } else if (this.y <= 0) { // Haut
      this.direction = [0, 1];
    } else if (this.x >= game_size[0] - 15) { // Droite
      this.direction = [-1, 0];
    } else if (this.y >= game_size[1] - 30) { // Bas
      this.direction = [0, -1];
    }
  }

  // Dessine la barre de vies (suite de parallélogrammes)
  life_bar(context, game_size) {
    context.fillStyle = "red";
    context.strokeStyle = "white";
    context.lineWidth = 2;
    for (let i = 0; i < this.life; i++) { // Pour chaque vie
      context.beginPath();
      context.moveTo(game_size[0] - 10 - 55 * i, game_size[1] - 5);
      context.lineTo(game_size[0] - 60 - 55 * i, game_size[1] - 5);
      context.lineTo(game_size[0] - 55 - 55 * i, game_size[1] - 25);
      context.lineTo(game_size[0] - 5 - 55 * i, game_size[1] - 25);
      context.lineTo(game_size[0] - 10 - 55 * i, game_size[1] - 5);
      context.fill();
      context.stroke();
    }
  }

  // Gère la collision avec les missiles du joueur et des aliens
  collision_missiles(missiles, alien_missiles) {
    // Missiles du joueur
    for(let i = 0; i < missiles.length; i++) {
      if (point_in_triangle(missiles[i].x, missiles[i].y, this.x, this.y, this.x - 15, this.y + 30, this.x + 15, this.y + 30)) {
        missiles[i].dead = true;
        this.life -= 1;
      }
    }
    // Missiles des aliens
    for(let i = 0; i < alien_missiles.length; i++) {
      if (point_in_triangle(alien_missiles[i].x, alien_missiles[i].y, this.x, this.y, this.x - 15, this.y + 30, this.x + 15, this.y + 30)) {
        alien_missiles[i].dead = true;
        this.life -= 1;
      }
    }
  }
}



// Classe qui gère les missiles du joueur
class Missile {
  constructor(x, y, player_speed, player_dir, damage) {
    this.x = x;
    this.y = y - 5;
    this.speed = [player_speed * player_dir[0] * 0.5, -player_speed + player_speed * player_dir[1] - 0.5]; // Calcul de la vitesse par défaut
    this.dead = false; // Bouléen indiquant si le missile doit être supprimé de l'écran de jeu

    // Définit le type de missile en fonction de la direction du joueur
    if (player_dir[1] == 1) { // Vers le bas
      this.type = "mine";
      this.radius = 6;
      this.color = "orange";
      this.damage = 3 + damage;
    } else if (player_dir[1] == -1){ // Vers le haut
      this.type = "missile";
      this.radius = 4;
      this.color = "red";
      this.damage = 2 + damage;
    } else { // Sur les côtés
      this.type = "shot";
      this.radius = 2;
      this.color = "yellow";
      this.damage = 1 + damage;
    }
  }

  // Dessine le missile (cercle de rayon "radius")
  draw(context) {
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    context.fill();
  }

  // Gère les collisions entre le missile et les bords de la fenêtre
  collision_wall(game_size) {
    if (this.x <= this.radius) { // Limite gauche
      this.speed[0] = -this.speed[0];
    }
    if (this.x >= game_size[0] - this.radius) { // Limite droite
      this.speed[0] = -this.speed[0];
    }
    if (this.y <= -this.radius) { // Limite haut : Destruction du missile
      return true;
    }
    return false;
  }

  // Gère la vitesse du missile
  speed_management() {
    // Le missile conserve 99.5% de sa vitesse à chaque appel de la fonction
    this.speed[0] *= 0.995;
    this.speed[1] *= 0.995;
    // Si le missile est trop lent, on le détruit
    if ((this.speed[1] >= - 0.1 && this.type != "mine") || this.speed[1] >= - 0.005) {
      return true;
    }
    return false;
  }
}



// Classe qui gère les étoiles en fond d'écran
class Background_Star {
  constructor(game_size) {
    this.x = Math.floor(game_size[0] * Math.random()); // Position en x aléatoire
    this.y = -1; // Position en y juste au dessus de l'écran
    this.speed = 1 + Math.floor(2 * Math.random()); // Vitesse aléatoire (1 ou 2)
    // Définit la taille en fonction de la vitesse
    if (this.speed == 1) {
      this.width = 2;
    } else {
      this.width = 1;
    }
  }

  // Dessine l'étoile (point blanc) et la déplace
  animate(context) {
    context.fillStyle = "white";
    context.fillRect(this.x, this.y, this.width, this.width);
    this.y += this.speed;
  }

  // Détecte la sortie de l'écran d'une étoile pour la supprimer
  collision_wall(game_size) {
    if (this.y >= game_size[1]) {
      return true;
    }
    return false;
  }
}



// Classe qui gère les aliens classiques
class Alien_Classic {
  constructor(x, y, speed, life, life_max, size) {
    this.type = "classic";
    this.size = size;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.life = life;
    this.life_max = life_max;
    this.collision_on = false; // Collisions activées/désactivées
    // Fonction qui définit la couleur d'un alien en fonction de ses vies restantes et maximales
    this.color = function(){
      if (this.life_max == 1) {
        return "rgb(0, 155, 0)";
      }
      return "rgb(0, " + (55 + (this.life - 1) * 200 / (this.life_max - 1)) + ", 0)";
    };
  }

  // Dessine un alien (carré)
  draw(context) {
    context.fillStyle = this.color();
    context.fillRect(this.x, this.y, this.size, this.size);
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.size, this.size);
  }

  // Détecte la collision entre un alien et les bords du canva
  collision_wall(game_size) {
    // Active les collisions quand l'alien entre pour la première fois dans la zone de jeu
    if (!this.collision_on && this.x > 0 && this.x < game_size[0] && this.y > 0 && this.y < game_size[1] - this.size) {
      this.collision_on = true;
    }
    if (this.collision_on && this.x <= 0) { // Limite gauche
      this.speed[0] = Math.abs(this.speed[0]);
    }
    if (this.collision_on && this.x >= game_size[0] - this.size) { // Limite droite
      this.speed[0] = - Math.abs(this.speed[0]);
    }
    if (this.collision_on && this.y <= 0) { // Limite haut
      // Augmente la vitesse de 10% si la vitese est inférieur à 20
      if(Math.abs(this.speed[0]) < 20 && Math.abs(this.speed[1]) < 20) {
        this.speed[0] = this.speed[0] * 1.1;
        this.speed[1] = Math.abs(this.speed[1]) * 1.1;
      } else {
        this.speed[1] = Math.abs(this.speed[1]);
      }
      
    }
    if (this.collision_on && this.y >= game_size[1] - this.size) { // Limite bas
      // Augmente la vitesse de 10% si la vitese est inférieur à 20
      if(Math.abs(this.speed[0]) < 10 && Math.abs(this.speed[1]) < 10) {
        this.speed[0] = this.speed[0] * 1.1;
        this.speed[1] = - Math.abs(this.speed[1]) * 1.1;
      } else {
        this.speed[1] = - Math.abs(this.speed[1]);
      }
    }
  }

  // Détecte la collision entre un alien et les missiles du joueur
  collision_missiles(missiles, score) {
    for(let i = 0; i < missiles.length; i++) { // Pour chaque missile
      if (missiles[i].x + missiles[i].radius >= this.x &&
          missiles[i].x - missiles[i].radius <= this.x + this.size &&
          missiles[i].y + missiles[i].radius >= this.y &&
          missiles[i].y - missiles[i].radius <= this.y + this.size) {
        missiles[i].dead = true; // Le missile devra être supprimé
        this.life -= missiles[i].damage; // Retire la vie de l'alien en fonction des dégâts du missile
        score += 10 * missiles[i].damage; // Ajoute du score en fonction des dégâts du missile
      }
    }
    return score;
  }

  // Gère la collision entre l'alien et le joueur
  collision_player(player) {
    // Points du carré (alien) dans le triangle (joueur)
    if (point_in_triangle(this.x, this.y + this.size, player.x, player.y, player.x - 15, player.y + 30, player.x + 15, player.y + 30) ||
        point_in_triangle(this.x + this.size, this.y + this.size, player.x, player.y, player.x - 15, player.y + 30, player.x + 15, player.y + 30) ||
        point_in_triangle(this.x + this.size, this.y, player.x, player.y, player.x - 15, player.y + 30, player.x + 15, player.y + 30) ||
        point_in_triangle(this.x + this.size, this.y + this.size, player.x, player.y, player.x - 15, player.y + 30, player.x + 15, player.y + 30) ||
        // Points du triangle (joueur) dans le carré (alien)
        (player.x >= this.x && player.x <= this.x + this.size && player.y >= this.y && player.y <= this.y + this.size) ||
        (player.x - 15 >= this.x && player.x - 15 <= this.x + this.size && player.y + 30 >= this.y && player.y + 30 <= this.y + this.size) ||
        (player.x + 15 >= this.x && player.x + 15 <= this.x + this.size && player.y + 30 >= this.y && player.y + 30 <= this.y + this.size)) {
      this.life = 0; // L'alien meurt
      player.life -= 1; // Le joueur perd une vie
    }
  }
}



// Classe qui gère les aliens qui tirent
class Alien_Shooter extends Alien_Classic {
  constructor(x, y, speed, life, life_max, size, reload_max, missile_speed) {
    super(x, y, speed, life, life_max, size); // Constructeur des aliens classiques
    this.type = "shooter";
    // Fonction qui définit la couleur des aliens en fonction de leurs vies restantes et maximales
    this.color = function(){
      if (this.life_max == 1) {
        return "rgb(0, 155, 155)";
      }
      this.shade = (55 + (this.life - 1) * 200 / (this.life_max - 1));
      return "rgb(0, " + this.shade + ", " + this.shade + ")";
    };
    this.reload = 0; // Temps avant le prochain tir
    this.reload_max = reload_max; // Temps entre deux tirs (centièmes de seconde)
    this.missile_speed = missile_speed;
  }
}



// Classe qui gère les missiles tirés par les aliens
class Alien_Shooter_Missiles {
  constructor(x, y, alien_size, speed) {
    // Centre de l'alien
    this.x = x + alien_size / 2;
    this.y = y + alien_size / 2;
    this.speed = speed;
    this.dead = false;
    this.radius = 4;
  }

  // Dessine le missile (cercle)
  draw(context) {
    context.fillStyle = "aqua";
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    context.fill();
  }

  // Gère la collision entre les missiles et les limites du canva
  collision_wall(game_size) {
    if (this.x <= this.radius) { // Limite gauche
      this.speed[0] = -this.speed[0];
    }
    if (this.x >= game_size[0] - this.radius) { // Limite droite
      this.speed[0] = -this.speed[0];
    }
    if (this.y >= game_size[1] + this.radius) { // Limite Bas (détruit les missiles)
      return true;
    }
    if (this.y <= 0 - this.radius) { // Limite Bas (détruit les missiles)
      return true;
    }
    return false;
  }

  // Gère la vitesse des missiles aliens
  speed_management() {
    // Le missile garde 99.5% de sa vitesse à chaque appel de la fonction
    this.speed[0] *= 0.995;
    this.speed[1] *= 0.995;
    // Destruction du missile si il est trop lent
    if (Math.abs(this.speed[0]) <= 0.1 && Math.abs(this.speed[1]) <= 0.1) {
      return true;
    }
    return false;
  }
}



// Détecte si un point P est dans le triangle ABC
function point_in_triangle(xP, yP, xA, yA, xB, yB, xC, yC) {
  let area_triangle = Math.abs((xB-xA)*(yC-yA) - (xC-xA)*(yB-yA)); // Calcul de l'aire de ABC (x2)
  let area1 = Math.abs((xA-xP)*(yB-yP) - (xB-xP)*(yA-yP)); // PAB
  let area2 = Math.abs((xB-xP)*(yC-yP) - (xC-xP)*(yB-yP)); // PBC
  let area3 = Math.abs((xC-xP)*(yA-yP) - (xA-xP)*(yC-yP)); // PAC
  return (area1 + area2 + area3 == area_triangle); // Renvoie true si les 3 aires sont égales à la grande
}


// Affiche le compteur de missiles restants
function missile_count(context, max_missiles, nb_missiles, color, game_size) {
  // Compteur numérique
  context.fillStyle = color;
  context.font = "40px fantasy";
  context.textAlign = "center";
  context.fillText(max_missiles - nb_missiles, 38, game_size[1] - 24);

  // Cercle complet si tous les missiles sont disponibles, cerlce vide si aucun missile restant
  context.strokeStyle = color;
  context.lineWidth = 7;
  context.beginPath();
  context.arc(38, game_size[1] - 40, 30, 0, Math.PI * (max_missiles - nb_missiles) / (max_missiles / 2));
  context.stroke();
}


// Gère le fond d'écran avec les étoiles
function move_stars(stars, game_size, context) {
  // 10% de chance de créer une nouvelle étoile
  if (Math.floor(10 * Math.random()) == 0) {
    stars.push(new Background_Star(game_size));
  }

  for(let i = 0; i < stars.length; i++) {
    stars[i].animate(context); // Déplace les étoiles
    if (stars[i].collision_wall(game_size)) { // Détruit les étoiles si elles sortent en bas de l'écran
      stars.splice(i, 1);
    }
  }
}


// Transforme le score du format numérique XX au str "000000XX"
function score_to_string(score) {
  if (score >= 9999999999) { // Score maximal
    return "9999999999";
  }
  let score_to_display = "";
  for (let i = 0; i < 10 - score.toString().length; i++) {
    score_to_display += "0";
  }
  score_to_display += score;
  return score_to_display;
}


// Affiche le score et le meilleur score sur l'écran
function display_score(score, high_score, context, game_size) {
  context.fillStyle = "white";
  context.font = "30px fantasy";
  context.textAlign = "left";

  context.fillText(score_to_string(score), 5, 30); // Score
  context.fillText(score_to_string(high_score), game_size[0] - 164, 30); // Meilleur score
}


// Affiche la vague actuelle
function display_wave(wave, game_size, context) {
  context.fillStyle = "white";
  context.font = "30px fantasy";
  context.textAlign = "right";

  context.fillText("Wave " + (wave + 1), game_size[0] - 5, game_size[0] - 35);
}


// Affiche l'écran de game over
function game_over(context, score, game_size, player, stars, high_score, wave_list, wave) {
  context.fillStyle = "red";

  // Fond rouge avec de la transparence
  context.globalAlpha = 0.3;
  context.fillRect(0, 0, game_size[0], game_size[1]);
  context.globalAlpha = 1;

  context.strokeStyle = "white";
  context.textAlign = "center";

  context.font = "125px fantasy";
  context.lineWidth = 3;
  context.fillText("Game Over", game_size[0] / 2, 400);
  context.strokeText("Game Over", game_size[0] / 2, 400);

  // Affiche le score
  context.font = "50px fantasy";
  context.lineWidth = 2;
  context.fillText("Score : " + score, game_size[0] / 2, 500);
  context.strokeText("Score : " + score, game_size[0] / 2, 500);

  // Retourne au menu principal après 6 secondes d'attente
  setTimeout(function() {
    main_menu(context, game_size, player, stars, high_score, wave_list, wave);
  }, 6000);
}


// Fonctions qui créent des aliens en fonction des données passées en paramètre (formation, quantité, taille, vitesse...)


// Génère des aliens sur les deux côtés
function position_sides(alien_data, aliens, game_size, wave_modifier) {
  // Défini le nombre de rangées d'alien en fonction de leur quantité
  let nb_line = 1 + Math.floor(alien_data.quantity / (1000 / alien_data.size));

  for (let line = 0; line < nb_line; line++) { // Pour chaque ligne
    for(let i = 0; i < Math.floor(alien_data.quantity / 2) / nb_line; i++) { // Pour chaque alien dans la ligne

      if (alien_data.type == "classic") { // Aliens classiques
        // Lignes de gauche
        aliens.push(new Alien_Classic(-alien_data.size - (alien_data.size * 1.5) * line, // Position X
                                      10 + i * (500 / (alien_data.quantity / 2 / nb_line - 1)), // Position Y
                                      [alien_data.speed[0], alien_data.speed[1]], // Vitesse
                                      alien_data.life(wave_modifier), // Vies
                                      alien_data.life_max, // Vies maximales
                                      alien_data.size // Taille
                                      ));
        // Lignes de droite
        aliens.push(new Alien_Classic(game_size[0] + (alien_data.size * 1.5) * line,
                                      10 + i * (500 / (alien_data.quantity / 2 / nb_line - 1)),
                                      [-alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") { // Aliens qui tirent
        aliens.push(new Alien_Shooter(-alien_data.size - (alien_data.size * 1.5) * line,
                                      10 + i * (500 / (alien_data.quantity / 2 / nb_line - 1)),
                                      [alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload, // Temps entre deux tirs
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]] // Vitesse des missiles
                                      ));
        aliens.push(new Alien_Shooter(game_size[0] + (alien_data.size * 1.5) * line,
                                      10 + i * (500 / (alien_data.quantity / 2 / nb_line - 1)),
                                      [-alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [-alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
}


// Génère des aliens en haut de l'écran
function position_top_rect(alien_data, aliens, game_size, wave_modifier) {
  let nb_line = 1 + Math.floor(alien_data.quantity / (game_size[0] / (alien_data.size * (1 + (alien_data.quantity - 1) / (2 * alien_data.quantity)))));

  for (let line = 0; line < nb_line; line++) {
    for(let i = 0; i < Math.floor(alien_data.quantity / nb_line); i++) {

      if (alien_data.type == "classic") {
        aliens.push(new Alien_Classic(10 + i * ((game_size[0] - 20 - alien_data.size) / (Math.floor(alien_data.quantity / nb_line) - 1)),
                                      -alien_data.size - (alien_data.size * 1.5) * line,
                                      [alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") {
        aliens.push(new Alien_Shooter(10 + i * ((game_size[0] - 20 - alien_data.size) / (Math.floor(alien_data.quantity / nb_line) - 1)),
                                      -alien_data.size - (alien_data.size * 1.5) * line,
                                      [alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
}


// Génère des aliens dans un coin de l'écran choisi
function position_cross(alien_data, aliens, game_size, wave_modifier) {
  // Coin supérieur gauche
  if (alien_data.pos_param == "top_left") {
    for(let i = 0; i < alien_data.quantity; i++) {
      if (alien_data.type == "classic") {
        aliens.push(new Alien_Classic(-alien_data.size - (i * alien_data.size * 1.5),
                                      -alien_data.size - (i * alien_data.size * 1.5),
                                      [alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") {
        aliens.push(new Alien_Shooter(-alien_data.size - (i * alien_data.size * 1.5),
                                      -alien_data.size - (i * alien_data.size * 1.5),
                                      [alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
  // Coin supérieur droit
  else if (alien_data.pos_param == "top_right") {
    for(let i = 0; i < alien_data.quantity; i++) {
      if (alien_data.type == "classic") {
        aliens.push(new Alien_Classic(game_size[0] + (i * alien_data.size * 1.5),
                                      -alien_data.size - (i * alien_data.size * 1.5),
                                      [-alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") {
        aliens.push(new Alien_Shooter(game_size[0] + (i * alien_data.size * 1.5),
                                      -alien_data.size - (i * alien_data.size * 1.5),
                                      [-alien_data.speed[0], alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
  // Coin inférieur gauche
  else if (alien_data.pos_param == "bottom_left") {
    for(let i = 0; i < alien_data.quantity; i++) {
      if (alien_data.type == "classic") {
        aliens.push(new Alien_Classic(-alien_data.size - (i * alien_data.size * 1.5),
                                      game_size[1] + (i * alien_data.size * 1.5),
                                      [alien_data.speed[0], -alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") {
        aliens.push(new Alien_Shooter(-alien_data.size - (i * alien_data.size * 1.5),
                                      game_size[1] + (i * alien_data.size * 1.5),
                                      [alien_data.speed[0], -alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
  // Coin inférieur droit
  else if (alien_data.pos_param == "bottom_right") {
    for(let i = 0; i < alien_data.quantity; i++) {
      if (alien_data.type == "classic") {
        aliens.push(new Alien_Classic(game_size[0] + (i * alien_data.size * 1.5),
                                      game_size[1] + (i * alien_data.size * 1.5),
                                      [-alien_data.speed[0],
                                      -alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size
                                      ));
      } else if (alien_data.type == "shooter") {
        aliens.push(new Alien_Shooter(game_size[0] + (i * alien_data.size * 1.5),
                                      game_size[1] + (i * alien_data.size * 1.5),
                                      [-alien_data.speed[0], -alien_data.speed[1]],
                                      alien_data.life(wave_modifier),
                                      alien_data.life_max,
                                      alien_data.size,
                                      alien_data.reload,
                                      [alien_data.missile_speed[0], alien_data.missile_speed[1]]
                                      ));
      }
    }
  }
}


// Appelle les fonctions de création d'alien en fonction de la formation choisie
function create_aliens(wave, wave_list, aliens, game_size) {
  let wave_modifier = Math.floor(wave / wave_list.length);
  let wave_data = wave_list[wave - (wave_modifier * wave_list.length)];

  for (let i = 0; i < wave_data.length; i++) {

    // Modifie quelques caractéristiques de la vague si ce n'est pas la première fois qu'elle apparaît
    if (wave_modifier != 0) {
      wave_data[i].quantity = Math.ceil(wave_data[i].quantity * 1.1); // 10% d'aliens supplémentaire
      if(Math.abs(wave_data[i].speed[0]) < 10 && Math.abs(wave_data[i].speed[1]) < 10) {
        wave_data[i].speed = [wave_data[i].speed[0] * 1.1, wave_data[i].speed[1] * 1.1]; // 10% de vitesse gagnée
      }
      wave_data[i].life_max += wave_data[i].life_plus; // Vie maximale en plus
    }

    if (wave_data[i].position == "sides") {
      position_sides(wave_data[i], aliens, game_size, wave_modifier);
    } else if (wave_data[i].position == "top_rect") {
      position_top_rect(wave_data[i], aliens, game_size, wave_modifier);
    } else if (wave_data[i].position == "cross") {
      position_cross(wave_data[i], aliens, game_size, wave_modifier);
    }
  }
}


// A une certaine probabilité de donner un bonus au joueur
function bonus_item(player) {
  let lucky_number = Math.floor(2000 * Math.random());

  if (lucky_number <= 0) { // 0.05 % ---> + 1 dégât de missile
    player.missile_damage += 1;
    return "Damage +";
  } else if (lucky_number <= 5 && player.life < 10) { // 0.25 % ---> + 1 vie
    player.life += 1;
    return "Life +";
  } else if (lucky_number <= 15 && player.speed < 3) { // 0.5 % ---> + 0.1 de vitesse
    player.speed += 0.05;
    return "Speed +";
  } else if (lucky_number <= 35 && player.reload_max > 3) { // 1 % ---> - 1 de temps de rechargement
    player.reload_max -= 1;
    return "Reload -";
  } else if (lucky_number <= 65 && player.max_missiles < 99) { // 1.5 % ---> + 1 missile
    player.max_missiles += 1;
    return "Missile +";
  }
  return false;
}


// Affiche à l'écran les bonus obtenus
function display_bonus(bonus, x, y, context) {
  context.fillStyle = "white";
  context.font = "15px fantasy";
  context.textAlign = "center";
  for (let i = 0; i < bonus.length; i++) {
    context.fillText(bonus[i], x, -10 + y - 17 * i);
  }
}


// Gère le menu principal
function main_menu(context, game_size, player, stars, high_score, wave_list, wave) {
  player = new Player(game_size);

  wave = 0;
  
  // Paramètres de vitesse et de taille pour le texte qui bouge sur le menu
  let start_text_size = 20;
  let start_text_speed = 0.05;

  let push_to_start = function(event) {
    let key = event.code;
    if (key == "Space") { // Appui sur Espace
      window.removeEventListener("keydown", push_to_start); // Arrête d'attendre l'appui sur espace pour démarer le jeu
      window.clearInterval(start_screen); // Arrête la boucle du menu
      game(context, game_size, player, stars, high_score, wave_list, wave); // Démarre la partie
    }
  };
  
  window.addEventListener("keydown", push_to_start); // Attends l'appui sur espace (avec la fonction push_to_start) pour démarer le jeu

  // Boucle du menu principal
  let start_screen = window.setInterval(function() {
    // Efface tout
    context.fillStyle = "black";
    context.fillRect(0, 0, game_size[0], game_size[1]);

    // Déplace les étoiles de fond
    move_stars(stars, game_size, context);

    // Dessine le joueur
    player.draw(context);

    // Affiche le meilleur score
    context.fillStyle = "white";
    context.font = "30px fantasy";
    context.textAlign = "left";
    context.fillText(score_to_string(high_score), game_size[0] - 164, 30);

    // Titre
    context.textAlign = "center";
    context.font = "100px fantasy";
    context.fillText("Aliens Revenge", game_size[0] / 2, 350);

    // Texte qui indique comment lancer le jeu
    context.font = start_text_size + "px fantasy";
    context.fillText("Press SPACE to start", game_size[0] / 2, game_size[1] - 50);

    // Anime le texte ci-dessus
    if (start_text_size <= 20) {
      start_text_speed = 0.05;
    } else if (start_text_size >= 25) {
      start_text_speed = -0.05;
    }
    start_text_size += start_text_speed;

  }, 10);
}


// Execution du code au lancement de la fenêtre
window.onload = function() {
  // Récupération du canva
  let game_area = document.getElementById("game_area");
  let context = game_area.getContext("2d");
  const game_size = [game_area.width, game_area.height]; // Taille de la zone de jeu

  let high_score = 0;

  let player;
  let stars = [];

  /*
  Tableau des vagues d'aliens
  Une vague est représentée par un tableau de dictionnaires
  Chaque dictionnaire représente un type d'ennemi avec des caractéristiques uniques pour chaque vague
  C'est ce tableau qui sera lu par le programme pour définir comment créer les aliens à chaque vague
  */
  let wave_list = [
    // Vague 1
    [{
      type: "classic",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.1],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 2
    [{
      type: "classic",
      quantity: 12,
      position: "sides",
      speed: [0.5, 0.08],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 3
    [{
      type: "classic",
      quantity: 14,
      position: "cross",
      pos_param: "top_left",
      speed: [0.3, 0.3],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 4
    [{
      type: "classic",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.1],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
        type: "classic",
        quantity: 10,
        position: "sides",
        speed: [0.5, 0.08],
        size: 30,
        life_max: 1,
        life_plus: 2,
        life: function(modifier) {
          return 1 + Math.floor((1 + modifier * 2) * Math.random());
        }
    }],
    // Vague 5
    [{
      type: "classic",
      quantity: 12,
      position: "cross",
      pos_param: "top_left",
      speed: [0.3, 0.3],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
        type: "classic",
        quantity: 12,
        position: "cross",
        pos_param: "top_right",
        speed: [0.3, 0.3],
        size: 30,
        life_max: 1,
        life_plus: 2,
        life: function(modifier) {
          return 1 + Math.floor((1 + modifier * 2) * Math.random());
        }
    }],
    // Vague 6
    [{
      type: "classic",
      quantity: 10,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.3, 0.3],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
        type: "classic",
        quantity: 10,
        position: "cross",
        pos_param: "bottom_right",
        speed: [0.3, 0.3],
        size: 30,
        life_max: 1,
        life_plus: 2,
        life: function(modifier) {
          return 1 + Math.floor((1 + modifier * 2) * Math.random());
        }
    },{
      type: "classic",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.1],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 7
    [{
      type: "shooter",
      quantity: 20,
      position: "top_rect",
      speed: [0, 0.1],
      size: 40,
      missile_speed: [0, 2],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
   // Vague 8
    [{
      type: "shooter",
      quantity: 12,
      position: "cross",
      pos_param: "top_left",
      speed: [0.5, 0.5],
      size: 40,
      missile_speed: [0, 1],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 12,
      position: "cross",
      pos_param: "top_right",
      speed: [0.5, 0.5],
      size: 40,
      missile_speed: [0, 1],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 12,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.5, 0.5],
      size: 40,
      missile_speed: [0, 1],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 12,
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.5, 0.5],
      size: 40,
      missile_speed: [0, 1],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 9
    [{
      type: "classic",
      quantity: 50,
      position: "top_rect",
      speed: [0, 0.05],
      size: 20,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 20,
      position: "sides",
      speed: [0.1, 0],
      size: 40,
      missile_speed: [1, 1],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 10
    [{
      type: "classic",
      quantity: 20,
      position: "cross",
      pos_param: "bottom_left",
      speed: [1, 1],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 20,
      position: "cross",
      pos_param: "bottom_right",
      speed: [1, 1],
      size: 30,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 6,
      position: "sides",
      speed: [3, 0],
      size: 10,
      missile_speed: [0, 3],
      reload: 128,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    }],
    // Vague 11
    [{
      type: "shooter",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.03],
      size: 30,
      missile_speed: [5, 2.5],
      reload: 80,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.03],
      size: 30,
      missile_speed: [-5, 2.5],
      reload: 80,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 6,
      position: "sides",
      speed: [3, 0.5],
      size: 10,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    }],
    // Vague 12
    [{
      type: "classic",
      quantity: 6,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.5, 0.5],
      size: 225,
      life_max: 12,
      life_plus: 4,
      life: function(modifier) {
        return 1 + Math.floor((12 + 4 * modifier) * Math.random());
      }
    },{
      type: "classic",
      quantity: 6,
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.5, 0.5],
      size: 225,
      life_max: 12,
      life_plus: 4,
      life: function(modifier) {
        return 1 + Math.floor((12 + 4 * modifier) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 10,
      position: "top_rect",
      speed: [0, 0.1],
      missile_speed: [0, 5],
      reload: 512,
      size: 55,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    }],
    // Vague 13
    [{
      type: "classic",
      quantity: 15,
      position: "cross",
      pos_param: "top_left",
      speed: [0.75, 0.375],
      size: 20,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 15,
      position: "cross",
      pos_param: "top_right",
      speed: [0.375, 0.75],
      size: 20,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 15,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.375, 0.75],
      size: 20,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 15,
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.75, 0.375],
      size: 20,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    }],
    // Vague 14
    [{
      type: "classic",
      quantity: 10, 
      position: "top_rect",
      speed: [0, 0.4],
      size: 25,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 10, 
      position: "sides",
      speed: [0.2, 0],
      size: 20,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 5, 
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.5, 0.5],
      size: 15,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 5, 
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.5, 0.5],
      size: 15,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 5, 
      position: "cross",
      pos_param: "top_right",
      speed: [0.5, 0.5],
      size: 15,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 5, 
      position: "cross",
      pos_param: "top_left",
      speed: [0.5, 0.5],
      size: 15,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 10, 
      position: "top_rect",
      speed: [0, 0.3],
      size: 25,
      missile_speed: [0, 2],
      reload: 512,
      life_max: 1,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((1 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 10, 
      position: "sides",
      speed: [0.1, 0],
      size: 20,
      missile_speed: [0.7, 0.7],
      reload: 16,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 5, 
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.2, 0.2],
      size: 15,
      missile_speed: [0.5, 1],
      reload: 512,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 5, 
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.2, 0.2],
      size: 15,
      missile_speed: [-0.5, 1],
      reload: 512,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 5, 
      position: "cross",
      pos_param: "top_left",
      speed: [0.1, 0.1],
      size: 15,
      missile_speed: [0.5, 1],
      reload: 512,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 5, 
      position: "cross",
      pos_param: "top_right",
      speed: [0.1, 0.1],
      size: 15,
      missile_speed: [-0.5, 1],
      reload: 512,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    }],
    // Vague 15
    [{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_left",
      speed: [0.03, 0.03],
      missile_speed: [0, 3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_right",
      speed: [0.03, 0.03],
      missile_speed: [0, 3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.03, 0.03],
      missile_speed: [0, -3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.03, 0.03],
      missile_speed: [0, -3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_left",
      speed: [0.03, 0.03],
      missile_speed: [3, 0],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_right",
      speed: [0.03, 0.03],
      missile_speed: [-3, 0],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_left",
      speed: [0.03, 0.03],
      missile_speed: [3, 3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "top_right",
      speed: [0.03, 0.03],
      missile_speed: [-3, 3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "bottom_left",
      speed: [0.03, 0.03],
      missile_speed: [3, -3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "shooter",
      quantity: 8,
      position: "cross",
      pos_param: "bottom_right",
      speed: [0.03, 0.03],
      missile_speed: [-3, -3],
      reload: 512,
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 1,
      position: "cross",
      pos_param: "top_left",
      speed: [0.03, 0.03],
      size: 400,
      life_max: 100,
      life_plus: 20,
      life: function(modifier) {
        return 1 + Math.floor((100 + 20 * modifier) * Math.random());
      }
    },{
      type: "classic",
      quantity: 1,
      position: "cross",
      pos_param: "top_right",
      speed: [0.03, 0.03],
      size: 400,
      life_max: 100,
      life_plus: 20,
      life: function(modifier) {
        return 1 + Math.floor((100 + 20 * modifier) * Math.random());
      }
    },{
      type: "classic",
      quantity: 20,
      position: "sides",
      speed: [1, 0.05],
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    },{
      type: "classic",
      quantity: 10,
      position: "top_rect",
      speed: [0, 1],
      size: 30,
      life_max: 2,
      life_plus: 2,
      life: function(modifier) {
        return 1 + Math.floor((2 + modifier * 2) * Math.random());
      }
    }]
  ];

  let wave;
  
  // Affiche le menu principal
  main_menu(context, game_size, player, stars, high_score, wave_list, wave);
};


// Fonction principale qui gère le fonctionnement du jeu
function game(context, game_size, player, stars, high_score, wave_list, wave) {

  let key_down = {ArrowLeft: false,
                  ArrowUp: false,
                  ArrowRight: false,
                  ArrowDown: false,
                  Space: false};

  let score = 0;
  let wave_end = true;

  let item_got = false;
  let item_list = [];

  let missiles = [];
  let missile_count_color = "white";

  let aliens = [];
  create_aliens(wave, wave_list, aliens, game_size); // Génère les aliens

  let alien_missiles = [];
  
  // Détecte les appuis sur des touches
  let keyboard_down = function(event) {
    let key = event.code;
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Space"].includes(key)) {
      key_down[key] = true;
    }
  };

  // Détecte le relachement des touches
  let keyboard_up = function(event) {
    let key = event.code;
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Space"].includes(key)) {
      key_down[key] = false;
    }
  };

  let keyboard_detection = function() {
    if (key_down.ArrowUp) { // Déplacement en haut
      player.direction = [0, -1];
    } else if (key_down.ArrowDown) { // Déplacement en bas
      player.direction = [0, 1];
    } else if (key_down.ArrowLeft) { // Déplacement à gauche
      player.direction = [-1, 0];
    } else if (key_down.ArrowRight) { // Déplacement à droite
      player.direction = [1, 0];
    }
    // Si appui sur Espace ET assez de missiles restants ET temps de rechargement écoulé (voir classe Player)
    if (key_down.Space && missiles.length < player.max_missiles && player.reload <= 0) {
      missiles.push(new Missile(player.x, player.y, player.speed, player.direction, player.missile_damage)); // Créé un nouveau missile
      player.reload = player.reload_max; // Réinitialise le temps de rechargement
    }
  }

  window.addEventListener("keydown", keyboard_down);
  window.addEventListener("keyup", keyboard_up);

  // Boucle du jeu
  let game_loop = window.setInterval(function() {

    // Efface tout
    context.fillStyle = "black";
    context.fillRect(0, 0, game_size[0], game_size[1]);

    // Déplace les étoiles de fond
    move_stars(stars, game_size, context);

    // Déplace le joueur dans la bonne direction
    player.x += player.speed * player.direction[0];
    player.y += player.speed * player.direction[1];
    // Diminue le temps de rechargement des missiles du joueur
    player.reload -= 1;

    // Réalise des actions en fonction des touches pressées les touches pressées
    keyboard_detection()

    // Gère les collisions du joueur avec les murs et ses missiles
    player.collision_wall(game_size);
    player.collision_missiles(missiles, alien_missiles);

    // Affiche le joueur
    player.draw(context);

    // Si le joueur a utilisé TOUS ses missiles
    if (missiles.length == player.max_missiles) {
      player.reload = 8 * player.reload_max; // Définit un long temps de rechargement
      missile_count_color = "red"; // Change la couleur du compteur en rouge
    }
    // Réinitialise la couleur du compteur de missiles
    if (player.reload <= 0) {
      missile_count_color = "white";
    }

    // Pour chaque alien
    for(let i = 0; i < aliens.length; i++) {
      aliens[i].draw(context); // Le dessine
      
      aliens[i].x += aliens[i].speed[0]; // Le déplace
      aliens[i].y += aliens[i].speed[1];

      // Si l'alien peut tirer
      if (aliens[i].type == "shooter") {
        aliens[i].reload -= 1; // Diminue son temps de rechargement
        // Tire si son temps de rechargement est écoulé
        if (aliens[i].reload <= 0) {
          alien_missiles.push(new Alien_Shooter_Missiles(aliens[i].x, aliens[i].y, aliens[i].size, [aliens[i].missile_speed[0], aliens[i].missile_speed[1]]));
          aliens[i].reload = aliens[i].reload_max;
        }
      }

      // Gére ses collisions avec les murs, les missiles du joueur et le joueur
      aliens[i].collision_wall(game_size);
      score = aliens[i].collision_missiles(missiles, score);
      aliens[i].collision_player(player);
      // Si l'alien n'a plus de vies, ajoute 100 au score
      if (aliens[i].life <= 0) {
        score += 100;
        item_got = bonus_item(player);
        if (item_got != false) { // Donne un bonus
          item_list.push(item_got);
          setTimeout(function() {
            item_list.shift();
          }, 2000);
        } 
      }
    }

    // Garde uniquement les aliens avec plus de 0 vies
    aliens = aliens.filter(function(alien) {return alien.life > 0;});
    
    // Pour chaque missile d'alien
    for(let i = 0; i < alien_missiles.length; i++) {
      alien_missiles[i].draw(context); // L'affiche

      alien_missiles[i].x += alien_missiles[i].speed[0]; // Le déplace
      alien_missiles[i].y += alien_missiles[i].speed[1];

      // Gère sa vitesse et ses collisions avec les murs
      if (alien_missiles[i].collision_wall(game_size) || alien_missiles[i].speed_management()) {
        alien_missiles[i].dead = true;
      }
    }

    // Garde uniquement les missiles aliens qui ne sont pas "morts"
    alien_missiles = alien_missiles.filter(function(alien_missile) {return !alien_missile.dead;});

    // Pour chaque missile du joueur
    for(let i = 0; i < missiles.length; i++) {
      missiles[i].draw(context);
      missiles[i].x += missiles[i].speed[0];
      missiles[i].y += missiles[i].speed[1];
      if (missiles[i].collision_wall(game_size) || missiles[i].speed_management()) {
        missiles[i].dead = true;
      }
    }

    missiles = missiles.filter(function(missile) {return !missile.dead;});

    // Affiche le bonus obtenu
    display_bonus(item_list, player.x, player.y, context);

    // Affiche le compteur de missiles
    missile_count(context, player.max_missiles, missiles.length, missile_count_color, game_size);
    // Affiche la barre de vies
    player.life_bar(context, game_size);

    // Actualise le meilleur score si il est inférieur au score actuel
    if (score > high_score) {
      high_score = score;
    }
    // Affiche le score
    display_score(score, high_score, context, game_size);

    // Affiche la vague actuelle
    display_wave(wave, game_size, context);

    // Si le joueur n'a plus de vies
    if (player.life <= 0) {
      window.removeEventListener("keydown", keyboard_down); // Arrête de détecter l'appui sur des touches
      window.removeEventListener("keyup", keyboard_up); // Arrête de détecter le relachement des touches
      window.clearInterval(game_loop); // Arrête la boucle de jeu
      game_over(context, score, game_size, player, stars, high_score, wave_list, wave); // Affiche l'écran de game over
    }

    // Si il n'y a plus d'alien
    if (aliens.length <= 0 && wave_end) {
      wave_end = false;
      // Passe à la vague suivante après 5 secondes d'attente
      setTimeout(function() {
        wave += 1;
        create_aliens(wave, wave_list, aliens, game_size);
        wave_end = true;
      }, 5000);
    }

  }, 10);
}
