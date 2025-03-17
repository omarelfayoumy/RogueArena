import Phaser from "phaser";

class BattleArena extends Phaser.Scene {
  constructor() {
    super({ key: "BattleArena" });
    this.playerInvulnerable = false;
  }

  preload() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Player texture: green square
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture("player", 40, 40);

    // Enemy texture: white square (will tint when damaged)
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture("enemy", 40, 40);

    // Player projectile texture: white circle
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture("projectile_up", 10, 10);

    // Enemy projectile texture: red circle
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
    // Set background color to black.
    this.cameras.main.setBackgroundColor("#000000");

    // Initialize game state.
    this.level = 1;
    this.playerHealth = 100;
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

    // Create the player at the bottom center.
    this.player = this.physics.add.sprite(
      this.scale.width / 2,
      this.scale.height - 60,
      "player"
    );
    this.player.setCollideWorldBounds(true);

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
    this.isChoosingUpgrade = false;
    this.upgradeText = null;

    // HUD.
    this.playerHealthText = this.add.text(20, 20, `Health: ${this.playerHealth}`, { fontSize: "18px", fill: "#fff" });
    this.levelText = this.add.text(20, 50, `Level: ${this.level}`, { fontSize: "18px", fill: "#fff" });
    this.ultimateBarText = this.add.text(20, 80, `Ultimate: 0/${this.ultimateNeeded}`, { fontSize: "18px", fill: "#fff" });
    this.add.text(20, 110, "Press SPACE to shoot. Press X to use ultimate when ready.", { fontSize: "14px", fill: "#fff" });

    // Collision detection.
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.hitPlayer, null, this);

    // Update enemy AI every second.
    this.time.addEvent({
      delay: 1000,
      callback: this.updateAllEnemiesAI,
      callbackScope: this,
      loop: true,
    });
  }

  update(time, delta) {
    // If player's health is 0 or below, trigger game over.
    if (this.playerHealth <= 0 && this.player && this.player.active) {
      this.gameOver();
      return;
    }

    if (this.isChoosingUpgrade) {
      this.checkUpgradeChoice();
      return;
    }
    if (!this.player || !this.player.active) return;

    // Ultimate activation.
    if (Phaser.Input.Keyboard.JustDown(this.keyX) && this.ultimateReady && !this.ultimateActive) {
      this.activateUltimate();
    }

    // Player movement (2D).
    this.player.setVelocity(0);
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    }

    // Shooting.
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shootPlayerProjectiles();
    }

    // Ultimate bar update.
    if (!this.ultimateActive && this.ultimateReady) {
      this.ultimateBarText.setText("Ultimate: Ready! Press X");
    }
  }

  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const xPos = Phaser.Math.Between(50, this.scale.width - 50);
      const enemy = this.physics.add.sprite(xPos, 80, "enemy");
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1); // Bounce off screen edges.
      enemy.setData("health", 100);
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
      if (this.enemies.countActive(true) === 0) {
        this.nextLevel();
      }
    }
  }

  hitPlayer(projectile, player) {
    if (projectile.hasHit) return;
    projectile.hasHit = true;
    projectile.destroy();

    if (this.ultimateActive) return;
    if (this.playerInvulnerable) return;

    this.playerHealth -= 10;
    this.playerHealthText.setText(`Health: ${this.playerHealth}`);
    console.log("Player hit; current health:", this.playerHealth);

    // Start temporary invulnerability.
    this.playerInvulnerable = true;
    // Flash the player to indicate a hit.
    this.flashPlayer();
    this.time.delayedCall(500, () => {
      this.playerInvulnerable = false;
      console.log("Player invulnerability ended.");
    });

    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  // Flash the player sprite 3 times.
  flashPlayer() {
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      ease: "Linear",
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.player.setAlpha(1);
      }
    });
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
    this.upgradeText = this.add.text(
      this.scale.width / 2 - 150,
      this.scale.height / 2 - 40,
      "Choose an Upgrade:\n1) +5 Damage\n2) +50 Speed\n3) +1 Projectile",
      { fontSize: "20px", fill: "#fff" }
    );
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
  }

  updateAllEnemiesAI() {
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.active) {
        this.enemyAIMove(enemy);
      }
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
    const hp = enemy.getData("health");
    if (hp > 75) {
      enemy.setTint(0xffffff);
    } else if (hp > 50) {
      enemy.setTint(0xffcccc);
    } else if (hp > 25) {
      enemy.setTint(0xff7777);
    } else {
      enemy.setTint(0xff0000);
    }
  }

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

  gameOver() {
    // Explicitly ensure we do not destroy the player if health is above 0.
    if (this.playerHealth > 0) {
      console.log("GameOver not triggered because player health is above 0");
      return;
    }
    if (this.player && this.player.active) {
      this.player.destroy();
      this.add.text(
        this.scale.width / 2 - 100,
        this.scale.height / 2,
        "Game Over!",
        { fontSize: "48px", fill: "#fff" }
      );
      this.scene.pause();
    }
  }
}

export default BattleArena;
