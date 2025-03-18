import Phaser from "phaser";

class BattleArena extends Phaser.Scene {
  constructor() {
    super({ key: "BattleArena" });
    this.gameIsOver = false;
  }

  preload() {
    // Load external images from the public/assets folder (ensure files are placed there)
    this.load.image("player", "assets/player_spaceship.png");
    this.load.image("enemy", "assets/enemy_spaceship.png");
    this.load.image("background", "assets/background.jpg");

    // For projectiles and star, we generate textures.
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Player projectile texture: white circle (10x10)
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture("projectile_up", 10, 10);

    // Enemy projectile texture: red circle (10x10)
    graphics.clear();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture("projectile_down", 10, 10);

    // Star texture (unused for now)
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture("star", 4, 4);
  }

  create() {
    // Remove any default margins and padding.
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    // Add the background image stretched to cover the full screen.
    this.add.image(0, 0, "background").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

    // Initialize game state.
    this.level = 1;
    this.playerSpeed = 250;
    this.baseShots = 1;
    this.playerShots = this.baseShots;
    this.playerDamage = 20;
    this.enemiesKilled = 0;
    this.enemiesKilledThisBar = 0;
    this.ultimateNeeded = 20;
    this.ultimateReady = false;
    this.ultimateActive = false;
    this.ultimateTimeLeft = 0;

    // Create groups.
    this.enemies = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    // Create the player at the bottom center using the loaded image.
    this.player = this.physics.add.sprite(
      this.scale.width / 2,
      this.scale.height - 60,
      "player"
    );
    this.player.setCollideWorldBounds(true);
    // Downscale player by 5×.
    this.player.setScale(0.17);
    this.player.health = 100;
    this.player.invulnerable = false;

    // Spawn initial enemies.
    this.spawnEnemies(this.level);

    // Input keys.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    // Upgrade selection keys.
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    // Dev mode keys.
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyU = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.devMode = false;
    this.devText = this.add.text(20, 140, "", { fontSize: "16px", fill: "#fff" });
    this.devText.setVisible(false);

    // Pause key.
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.isPaused = false;
    this.pauseOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x808080, 0.5)
      .setOrigin(0, 0)
      .setDepth(10)
      .setVisible(false);
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Game Paused\nPress P to Resume", {
      fontSize: "32px",
      fill: "#fff",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    this.isChoosingUpgrade = false;
    this.upgradeText = null;

    // HUD.
    this.playerHealthText = this.add.text(20, 20, `Health: ${this.player.health}`, { fontSize: "18px", fill: "#fff" });
    this.levelText = this.add.text(20, 50, `Level: ${this.level}`, { fontSize: "18px", fill: "#fff" });
    this.ultimateBarText = this.add.text(20, 80, `Ultimate: 0/${this.ultimateNeeded}`, { fontSize: "18px", fill: "#fff" });
    this.add.text(20, 110, "Press SPACE to shoot. Press X to use ultimate when ready. Press P to Pause. Press R to Restart.",
      { fontSize: "14px", fill: "#fff" }
    );

    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.hitEnemy, null, this);

    this.time.addEvent({
      delay: 1000,
      callback: this.updateAllEnemiesAI,
      callbackScope: this,
      loop: true,
    });

    // Global restart listener: if the game is over (scene paused) and R is pressed, restart.
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "r" && this.gameIsOver) {
        this.scene.restart();
      }
    });
  }

  update(time, delta) {
    // Pause toggle.
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      if (this.isPaused) {
        this.isPaused = false;
        this.physics.resume();
        this.pauseOverlay.setVisible(false);
        this.pauseText.setVisible(false);
      } else {
        this.isPaused = true;
        this.physics.pause();
        this.pauseOverlay.setVisible(true);
        this.pauseText.setVisible(true);
        return;
      }
    }
    if (this.isPaused) return;

    // Dev mode toggle and adjustments.
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.devMode = !this.devMode;
      if (this.devText) {
        this.devText.setVisible(this.devMode);
      }
    }
    if (this.devMode) {
      if (Phaser.Input.Keyboard.JustDown(this.keyU)) { this.playerSpeed += 10; }
      if (Phaser.Input.Keyboard.JustDown(this.keyJ)) { this.playerSpeed = Math.max(50, this.playerSpeed - 10); }
      if (Phaser.Input.Keyboard.JustDown(this.keyI)) { this.playerDamage += 1; }
      if (Phaser.Input.Keyboard.JustDown(this.keyK)) { this.playerDamage = Math.max(1, this.playerDamage - 1); }
      if (Phaser.Input.Keyboard.JustDown(this.keyO)) { this.baseShots += 1; this.playerShots = this.baseShots; }
      if (Phaser.Input.Keyboard.JustDown(this.keyL)) { this.baseShots = Math.max(1, this.baseShots - 1); this.playerShots = this.baseShots; }
      if (this.devText) {
        this.devText.setText(
          "Dev Mode:\nSpeed: " + this.playerSpeed +
          "\nDamage: " + this.playerDamage +
          "\nProjectiles: " + this.baseShots
        );
      }
    }

    if (this.gameIsOver) return;
    if (!this.player || !this.player.active) return;

    this.checkProjectilePlayerCollision();

    if (this.player.health <= 0) {
      this.fadeOutAndDestroyPlayer();
      return;
    }

    if (this.isChoosingUpgrade) {
      this.checkUpgradeChoice();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyX) && this.ultimateReady && !this.ultimateActive) {
      this.activateUltimate();
    }

    this.player.setVelocity(0);
    if (this.cursors.left.isDown) { this.player.setVelocityX(-this.playerSpeed); }
    else if (this.cursors.right.isDown) { this.player.setVelocityX(this.playerSpeed); }
    if (this.cursors.up.isDown) { this.player.setVelocityY(-this.playerSpeed); }
    else if (this.cursors.down.isDown) { this.player.setVelocityY(this.playerSpeed); }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) { this.shootPlayerProjectiles(); }

    if (!this.ultimateActive && this.ultimateReady) {
      this.ultimateBarText.setText("Ultimate: Ready! Press X");
    }
  }

  checkProjectilePlayerCollision() {
    const playerBounds = this.player.getBounds();
    this.enemyProjectiles.getChildren().forEach((proj) => {
      if (!proj.active) return;
      const projBounds = proj.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, projBounds)) {
        this.hitPlayer(proj, this.player);
      }
    });
  }

  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const xPos = Phaser.Math.Between(50, this.scale.width - 50);
      const enemy = this.physics.add.sprite(xPos, 80, "enemy");
      enemy.setScale(0.1);
      enemy.setFlipY(true);
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1);
      enemy.setData("health", 50);
      enemy.setTint(0xffffff);
      this.enemies.add(enemy);
    }
  }

  shootPlayerProjectiles() {
    if (!this.player.active) return;
    const offsetStep = 10;
    const startX = this.player.x - ((this.playerShots - 1) * offsetStep) / 2;
    for (let i = 0; i < this.playerShots; i++) {
      const xPos = startX + i * offsetStep;
      const proj = this.playerProjectiles.create(xPos, this.player.y - 20, "projectile_up");
      proj.setVelocityY(-400);
      proj.hasHit = false;
    }
  }

  shootEnemyProjectile(enemy) {
    if (!enemy.active) return;
    const proj = this.enemyProjectiles.create(enemy.x, enemy.y + 20, "projectile_down");
    proj.setVelocityY(300);
    proj.hasHit = false;
    proj.body.setAllowGravity(false);
  }

  hitEnemy(projectile, enemy) {
    if (projectile.hasHit) return;
    projectile.hasHit = true;
    projectile.destroy();
    let hp = enemy.getData("health");
    hp -= this.playerDamage;
    enemy.setData("health", hp);
    this.updateEnemyColor(enemy);
    if (hp <= 0) {
      enemy.destroy();
      this.enemiesKilled++;
      this.enemiesKilledThisBar++;
      if (this.enemiesKilledThisBar >= this.ultimateNeeded) {
        this.ultimateReady = true;
        this.enemiesKilledThisBar = this.ultimateNeeded;
      }
      if (!this.ultimateActive) {
        this.ultimateBarText.setText(`Ultimate: ${this.enemiesKilledThisBar}/${this.ultimateNeeded}`);
      }
      if (this.enemies.countActive(true) === 0) { this.nextLevel(); }
    }
  }

  hitPlayer(projectile, player) {
    if (projectile.texture.key !== "projectile_down") return;
    if (projectile.hasHit) return;
    projectile.hasHit = true;
    projectile.destroy();

    if (this.ultimateActive || player.invulnerable) return;

    player.health -= 10;
    this.playerHealthText.setText(`Health: ${player.health}`);
    console.log("Player hit; current health:", player.health);

    if (player.health > 0) {
      player.invulnerable = true;
      this.blinkPlayer(player);
      this.time.delayedCall(500, () => {
        player.invulnerable = false;
        console.log("Player invulnerability ended.");
      });
    } else {
      this.fadeOutAndDestroyPlayer();
    }
  }

  blinkPlayer(player) {
    this.tweens.add({
      targets: player,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => { player.setAlpha(1); }
    });
  }

  fadeOutAndDestroyPlayer() {
    if (!this.player || !this.player.active) return;
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.player.destroy();
        this.showGameOver();
      }
    });
  }

  showGameOver() {
    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "Game Over!\nPress R to Play Again",
      { fontSize: "48px", fill: "#fff", align: "center" }
    ).setOrigin(0.5);
    this.scene.pause();
    this.gameIsOver = true;
  }

  nextLevel() {
    this.level++;
    this.levelText.setText(`Level: ${this.level}`);
    this.spawnEnemies(this.level);
    if ((this.level - 1) % 5 === 0 && this.level > 1) {
      this.promptUpgrade();
    }
  }

  promptUpgrade() {
    this.isChoosingUpgrade = true;
    this.physics.pause();
    this.upgradeText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 40,
      "Choose an Upgrade:\n1) +5 Damage\n2) +50 Speed\n3) +1 Projectile",
      { fontSize: "20px", fill: "#fff", align: "center" }
    ).setOrigin(0.5);
  }

  checkUpgradeChoice() {
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.playerDamage += 5;
      this.finishUpgradeChoice();
    } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.playerSpeed += 50;
      this.finishUpgradeChoice();
    } else if (Phaser.Input.Keyboard.JustDown(this.key3)) {
      this.baseShots += 1;
      this.playerShots = this.baseShots;
      this.finishUpgradeChoice();
    }
  }

  finishUpgradeChoice() {
    this.isChoosingUpgrade = false;
    if (this.upgradeText) {
      this.upgradeText.destroy();
      this.upgradeText = null;
    }
    this.physics.resume();
  }

  updateAllEnemiesAI() {
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.active) { this.enemyAIMove(enemy); }
      if (enemy.x < enemy.width / 2) { enemy.x = enemy.width / 2; }
      else if (enemy.x > this.scale.width - enemy.width / 2) { enemy.x = this.scale.width - enemy.width / 2; }
    });
  }

  enemyAIMove(enemy) {
    const shootChance = Math.min(0.3 + 0.05 * (this.level - 1), 0.8);
    const rand = Math.random();
    if (rand < shootChance) {
      this.shootEnemyProjectile(enemy);
    } else if (rand < shootChance + 0.3) {
      const moveLeft = Math.random() < 0.5;
      enemy.setVelocityX(moveLeft ? -150 : 150);
      this.time.delayedCall(500, () => {
        if (enemy.active) enemy.setVelocityX(0);
      });
    } else {
      enemy.setVelocityX(0);
    }
  }

  updateEnemyColor(enemy) {
    let hp = enemy.getData("health");
    if (hp === 50) { enemy.setTint(0xffffff); }
    else if (hp > 40) { enemy.setTint(0xffcccc); }
    else if (hp > 30) { enemy.setTint(0xff9999); }
    else if (hp > 20) { enemy.setTint(0xff6666); }
    else if (hp > 0) { enemy.setTint(0xff3333); }
    else { enemy.setTint(0x000000); }
  }

  // Ultimate functions.
  activateUltimate() {
    this.ultimateActive = true;
    this.ultimateReady = false;
    this.enemiesKilledThisBar = 0;
    this.ultimateTimeLeft = 30;
    this.playerShots = this.baseShots + 2;
    this.ultimateBarText.setText(`ULTIMATE ACTIVE: ${this.ultimateTimeLeft}s`);
    this.ultimateTimer = this.time.addEvent({
      delay: 1000,
      repeat: 29,
      callback: () => {
        this.ultimateTimeLeft--;
        if (this.ultimateTimeLeft > 0) {
          this.ultimateBarText.setText(`ULTIMATE ACTIVE: ${this.ultimateTimeLeft}s`);
        } else {
          this.deactivateUltimate();
        }
      }
    });
  }

  deactivateUltimate() {
    this.ultimateActive = false;
    this.playerShots = this.baseShots;
    this.ultimateBarText.setText(`Ultimate: 0/${this.ultimateNeeded}`);
  }

  // Restart function (DO NOT TOUCH THIS FUNCTION).
  restartGame() {
    this.gameIsOver = false;
    this.scene.restart();
  }
}

export default BattleArena;
