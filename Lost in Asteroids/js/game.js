"use strict"; 

//Atenção sempre: 
// - Letras maiúsculas e minúsculas: sempre usar os "cases" corretos;
// - Abrir e fechar parênteses: um esquecimento pode gerar um erro difícil de notar;
// - Abrir e fechar chaves: mesmo caso anterior
// - Sempre veja o console no navegador apertando F12 caso algo não funcione como deveria

//Um estado é sempre um objeto JavaScript, com no mínimo as 3 funções principais: preload, create e update
//As funções sempre começam com NomeDoObjeto.prototype 
var GameState = function(game) {};

// preload: carregar todos os assets necessários para esta scene ou para as próximas
GameState.prototype.preload = function() {
    // Para carregar um sprite, basta informar uma chave e dizer qual é o arquivo
    this.game.load.image('mapTiles', 'Assets/spritesheets/tiles.png');

    // Para carregar um spritesheet, é necessário saber a altura e largura de cada sprite, e o número de sprites no arquivo
    // No caso do player.png, os sprites são de 32x32 pixels, e há 8 sprites no arquivo
    
    this.game.load.image('parallax-bg', 'Assets/spritesheets/background_parallax.png');
    this.game.load.spritesheet('astronaut', 'Assets/spritesheets/astronaut.png', 96, 96, 24);
    this.game.load.spritesheet('enemy', 'Assets/spritesheets/enemy.png', 96, 96, 7);
    this.game.load.spritesheet('player', 'Assets/spritesheets/player.png', 32, 32, 8);
    this.game.load.spritesheet('plasmaBullets', 'Assets/spritesheets/plasma_bullet.png', 64, 64, 7);
    this.game.load.spritesheet('items', 'Assets/spritesheets/pickupItems.png', 32, 32, 6);
    this.game.load.spritesheet('enemies', 'Assets/spritesheets/enemies.png', 32, 32, 12);
    this.game.load.spritesheet('tiles', 'Assets/spritesheets/tiles.png', 32, 32, 66);    
    this.game.load.image('splash', 'Assets/spritesheets/splash.png');
    this.game.load.image('oxImage', 'Assets/images/energy.png');
    this.game.load.image('ammoImage', 'Assets/images/gem.png');
    
    
    
    
    // Para carregar um arquivo do Tiled, o mesmo precisa estar no formato JSON
    this.game.load.tilemap('level1', 'Assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);

    // Para carregar os sons, basta informar a chave e dizer qual é o arquivo
    this.game.load.audio('jumpSound', 'Assets/sounds/jump.wav');
    this.game.load.audio('oxPillSound', 'Assets/sounds/ox_pill.ogg');
    this.game.load.audio('ammoPickupSound', 'Assets/sounds/ammo_pickup.ogg');
    this.game.load.audio('plasmaGunSound', 'Assets/sounds/plasma_gun.ogg');
    this.game.load.audio('playerDeath', 'Assets/sounds/hurt3.ogg');
    this.game.load.audio('enemyDeath', 'Assets/sounds/hit2.ogg');
    this.game.load.audio('music', 'Assets/sounds/phantom_from_space.ogg');
}

GameState.prototype.create = function() { 
    
    Globals.myLevel = 'game';
    
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    
    
    this.SHOT_DELAY = 1000; // milliseconds (10 bullets/3 seconds)
    this.BULLET_SPEED = 400; // pixels/second
    this.NUMBER_OF_BULLETS = 20;
    this.GRAVITY = 400; // pixels/second/second
    
    
    
    // Para carregar o mapa do Tiled para o Phaser, 3 estágios são necessários:
    // 1 - Criar um objeto com o arquivo do Tiled carregado no preload()
    this.level1 = this.game.add.tilemap('level1');
    // 2 - Adicionar as imagens correspondentes aos tilesets do Tiled dentro do Phaser
    // "tiles" é o nome do tileset dentro do Tiled
    // "mapTiles" é o nome da imagem com os tiles, carregada no preload()
    this.level1.addTilesetImage('tiles', 'mapTiles');
    
    // 3 - Criar os layers do mapa
    // A ordem nesse caso é importante, então os layers que ficarão no "fundo" deverão ser
    // criados primeiro, e os que ficarão na "frente" por último;
    
    
    this.bgLayer = this.level1.createLayer('BG');
    
    //Background
    this.backgroundParallax = this.game.add.tileSprite(0, 
        this.game.height - this.game.cache.getImage('parallax-bg').height, 
        this.game.width, 
        this.game.cache.getImage('parallax-bg').height, 
        'parallax-bg'
    );
    
    this.backgroundParallax.fixedToCamera = true;
    
    this.iceLayer = this.level1.createLayer('Ice');
    this.lavaLayer = this.level1.createLayer('Lava');
    this.wallsLayer = this.level1.createLayer('Walls');
    
    // Redimensionando o tamanho do "mundo" do jogo
    this.wallsLayer.resizeWorld();
    
    
    // Para que possamos detectar colisões dos objetos com os layers do mapa, primeiro precisamos
    // informar quais tiles deverão efetivamente ter um colisor, para cada layer.
    // Esta contagem é feita olhando o tileset no Tiled, sendo que o tile mais à esquerda da
    // primeira linha do tileset terá valor 1, o próximo na linha valor 2, e assim por diante,
    // continuando a contagem na próxima linha, até o último tile da última linha.
    
    // Neste caso, ao invés de dizermos quais tiles devem colidir, estamos dizendo quais tiles não
    // devem colidir, pois há mais tiles que colidem do que tiles sem colisão.
    // Os parâmetros são a lista dos tiles, "true" indicando que a colisão deve ser ativada,
    // e o nome do layer.
    
    this.level1.setCollisionByExclusion([17, 18, 30, 36, 42, 43, 44, 45, 49, 50, 51,      58, 59, 60,    64, 65, 66], true, this.wallsLayer);
    this.level1.setCollisionByExclusion([17, 18, 30, 36, 42, 43, 44, 45, 49, 50, 51,      58, 59, 60,    64, 65, 66], true, this.iceLayer);
    
    // Para o layer de lava é o caso oposto: poucos tiles colidem, então é mais fácil 
    // informar diretamente quais são.
    this.level1.setCollision([58, 59, 60,    64, 65, 66], true, this.lavaLayer);
    
    this.astronaut = this.game.add.sprite(100,900, 'astronaut', 1);
    this.astronaut.anchor.setTo(0.5,0.5);
    this.game.physics.enable(this.astronaut);
    this.astronaut.body.gravity.y = 400;
    this.game.camera.follow(this.astronaut);
    // Corrigindo o bounding box do personagem
    this.astronaut.body.setSize(30,80, 35, 16);
    
   
    
     this.bulletPool = this.game.add.group();
    for(var i = 0; i < this.NUMBER_OF_BULLETS; i++) {
        // Create each bullet and add it to the group.
        var bullet = this.game.add.sprite(0, 0, 'plasmaBullets', 1);
        this.bulletPool.add(bullet);

        // Set its pivot point to the center of the bullet
        bullet.anchor.setTo(0.5, 0.5);

        // Enable physics on the bullet
        this.game.physics.enable(bullet, Phaser.Physics.ARCADE);
        
        bullet.body.setSize(32,32, 15, 15);
        
        
        
        bullet.animations.add('spark', [0, 1, 2, 3, 4], 6, true);
        bullet.animations.play('spark');
        
        
        
        
        bullet.body.gravity.y = this.GRAVITY;

        // Set its initial state to "dead".
        bullet.kill();
    }
    
   
    
    this.playerGun = this.game.add.sprite(300,200, 'astronaut', 12);
    this.playerGun.anchor.setTo(0.5, 0.6);
    
    this.astronaut.animations.add('idle', [0, 1, 2], 6);
    this.astronaut.animations.add('walk', [3, 4, 5], 8);
    this.astronaut.animations.add('walkb', [16, 17, 18], 8);
    this.astronaut.animations.add('jump', [9, 10, 11], 6);
    //COLOCAR DEATH AQUI DEPOIS
    
    
    //this.keys = this.game.input.keyboard.createCursorKeys();
        this.keys = {
            up: this.game.input.keyboard.addKey(Phaser.Keyboard.W),
            down: this.game.input.keyboard.addKey(Phaser.Keyboard.S),
            left: this.game.input.keyboard.addKey(Phaser.Keyboard.A),
            right: this.game.input.keyboard.addKey(Phaser.Keyboard.D),
                    };
    this.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    // Criando objetos que foram criados em um layer de objetos do Tiled
    // Parâmetros do createFromObjects():
    // nome do layer do Tiled de onde vamos criar os objetos
    // nome dos objetos do Tiled que serão criados
    // nome do spritesheet carregado no preload() com os objetos
    // frame do spritesheet, basta setar para um dos frames do objeto em questão
    // true, false - estes dois parâmetros podem ficar com estes valores
    // grupo - qual grupo do Phaser devemos adicionar esses objetos
    
    this.oxPills = this.game.add.physicsGroup();
    this.level1.createFromObjects('Items', 'oxPill', 'items', 5, true, false, this.oxPills);
    // Para cada objeto do grupo, vamos executar uma função
    this.oxPills.forEach(function(oxPill){
        // body.immovable = true indica que o objeto não é afetado por forças externas
        oxPill.body.immovable = true;
        // Adicionando animações; o parâmetro true indica que a animação é em loop
        oxPill.animations.add('spin', [0,1,2], 6, true);
        oxPill.animations.play('spin');
    });
    
    this.ammoPickups = this.game.add.physicsGroup();
    this.level1.createFromObjects('Items', 'ammo', 'items', 5, true, false, this.ammoPickups);
    // Para cada objeto do grupo, vamos executar uma função
    this.ammoPickups.forEach(function(ammoPickup){
        // body.immovable = true indica que o objeto não é afetado por forças externas
        ammoPickup.body.immovable = true;
        // Adicionando animações; o parâmetro true indica que a animação é em loop
        ammoPickup.animations.add('spin', [3,4,5], 6, true);
        ammoPickup.animations.play('spin');
    });
    
    this.endGameGoal = this.game.add.physicsGroup();
    this.level1.createFromObjects('Items', 'endGoal', 'tiles', 23, true, false, this.endGameGoal);
    // Para cada objeto do grupo, vamos executar uma função
    this.endGameGoal.forEach(function(goal){
        
        goal.body.immovable = true;
    });

    // Criando assets de som com this.game.add.audio()
    // O parâmetro é o nome do asset definido no preload()
    this.jumpSound = this.game.add.audio('jumpSound');
    this.oxPillSound = this.game.add.audio('oxPillSound');
    this.ammoPickupSound = this.game.add.audio('ammoPickupSound');
    this.playerDeathSound = this.game.add.audio('playerDeath');
    this.enemyDeathSound = this.game.add.audio('enemyDeath');
    this.plasmaGunSound = this.game.add.audio('plasmaGunSound');
    
    // Música de fundo - criada da mesma forma, mas com o parâmetro loop = true
    this.music = this.game.add.audio('music');
    this.music.loop = true;
    this.music.play();
    
    // HUD de score
    // A linha abaixo adiciona um texto na tela, e a próxima faz com o que o texto fique
    // fixo na câmera, dessa forma não vai se deslocar quando a câmera mudar
    
    this.oxImage = this.game.add.sprite(50, 50, 'oxImage');
    this.oxImage.fixedToCamera = true;
    
    this.oxText = this.game.add.text(130, 70, "0", 
                            {font: "25px Roboto", fill: "#ffffff"});
    this.oxText.fixedToCamera = true;
    
    
    
    this.ammoImage = this.game.add.sprite(45, 120, 'ammoImage');
    this.ammoImage.fixedToCamera = true;
    this.ammoText = this.game.add.text(130, 140, "0", 
                            {font: "25px Roboto", fill: "#ffffff"});
    this.ammoText.fixedToCamera = true;
    
    // Estado do jogo - Variáveis para guardar quaisquer informações pertinentes para as condições de 
    // vitória/derrota, ações do jogador, etc
    this.oxygen = 10;
    this.weaponAmmo = 0;
    this.reloadtimer = 0;
    
    
    this.explosionGroup = this.game.add.group();
    
    //create particle
    this.particleEmitter = this.game.add.emitter(0, 0, 20);
    // Utilizando o asset particle para compor as partículas
    this.particleEmitter.makeParticles('splash');
    
    

}

GameState.prototype.update = function() {
    
   // this.game.debug.body(this.bullet);
   // this.game.debug.body(this.astronaut);

    this.updatingGun();
    
    this.game.physics.arcade.collide(this.astronaut, this.wallsLayer);
    this.game.physics.arcade.collide(this.astronaut, this.iceLayer);

    this.game.physics.arcade.collide(this.astronaut, this.lavaLayer, this.lavaDeath, null, this);
   
    this.game.physics.arcade.overlap(this.astronaut, this.oxPills, this.oxPillCollect, null, this);
    this.game.physics.arcade.overlap(this.astronaut, this.ammoPickups, this.ammoCollect, null, this);
    this.game.physics.arcade.overlap(this.astronaut, this.endGameGoal, this.loadNextLevel, null, this);
    
     this.game.physics.arcade.collide(this.bulletPool, this.wallsLayer, function(bullet, walls) {
        // Create an explosion
        this.getExplosion(bullet);
        
        bullet.kill();
         
    }, null, this);
    
     this.game.physics.arcade.collide(this.bulletPool, this.iceLayer, function(bullet, walls) {
        // Create an explosion
        this.getExplosion(bullet);

        this.particleEmitter.x = bullet.x;
        this.particleEmitter.y = bullet.y; 
        this.particleEmitter.start(true, 1000, false, 500);
         
         this.level1.removeTile(walls.x, walls.y, this.iceLayer);
        // map.removeTile(walls.x, walls.y, this.iceLayer).destroy();
         
         
         bullet.kill();
         
    }, null, this);
    
     this.bulletPool.forEachAlive(function(bullet) {
        bullet.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
    }, this);
    
    if (this.game.input.activePointer.isDown) {
        if(this.weaponAmmo > 0)
            {
               this.shootBullet(); 
            }
    }
    
    if(this.keys.left.isDown){
        this.astronaut.body.velocity.x = -150;
    }
    else if(this.keys.right.isDown){
        this.astronaut.body.velocity.x = 150;  
    }
    else {
        this.astronaut.body.velocity.x = 0;
    }

    if((this.jumpButton.isDown || this.keys.up.isDown) && (this.astronaut.body.touching.down || this.astronaut.body.onFloor())){
        this.astronaut.body.velocity.y = -400;
        this.jumpSound.play();
    }
    
    this.playerAnimations();

    this.updatingOxygen();
   
}

GameState.prototype.playerAnimations = function()
{
     if(!this.astronaut.body.touching.down && !this.astronaut.body.onFloor()){
       this.astronaut.animations.play('jump');
    }
    else if(this.keys.left.isDown){
        if(this.astronaut.scale.x == -1)
            {
               this.astronaut.animations.play('walk'); 
            }
        else
            {
               this.astronaut.animations.play('walkb');  
            }
    }
    else if(this.keys.right.isDown){
        if(this.astronaut.scale.x == -1)
            {
               this.astronaut.animations.play('walkb'); 
            }
        else
            {
               this.astronaut.animations.play('walk');  
            }
    }
    else {
        this.astronaut.animations.play('idle');
    }
}

GameState.prototype.updatingOxygen = function()
{
     this.oxygen -= 0.01;
        this.oxText.text = this.oxygen.toPrecision(2);

        if(this.oxygen <= 0)
            {
                this.music.stop(); 
                this.lose();
            }
    
        this.reloadWeapon();
}

GameState.prototype.reloadWeapon = function()
{
    this.reloadtimer += 0.01;
    if(this.reloadtimer >= 10)
        {
            this.weaponAmmo += 1;
            if(this.weaponAmmo > 99)
             {
            this.weaponAmmo = 99;
             }
    
            this.ammoText.text = this.weaponAmmo.toPrecision(2);
    
            this.ammoPickupSound.play();
            
            this.reloadtimer = 0;
        }
}

GameState.prototype.updatingGun = function()
{
    this.playerGun.x = this.astronaut.x;
    this.playerGun.y = this.astronaut.y;
    
    if(this.game.input.activePointer.worldX < this.playerGun.x)
        {
            this.playerGun.scale.y = -1;
            this.astronaut.scale.x = -1;
        }
    else
        {
            this.playerGun.scale.y = 1;
            this.astronaut.scale.x = 1;
        }
    this.playerGun.rotation = this.game.physics.arcade.angleToPointer(this.playerGun);
}

GameState.prototype.oxPillCollect = function(player, oxPill){
    
    this.oxygen += 5;
    if(this.oxygen > 99)
        {
            this.oxygen = 99;
        }
    
    this.oxPillSound.play();
    oxPill.kill();
}

GameState.prototype.ammoCollect = function(player, ammo){
    
    this.weaponAmmo += 8;
    if(this.weaponAmmo > 99)
        {
            this.weaponAmmo = 99;
        }
    
    this.ammoText.text = this.weaponAmmo.toPrecision(2);
    
    this.ammoPickupSound.play();
    ammo.kill();
}

GameState.prototype.shootBullet = function() {
    // Enforce a short delay between shots by recording
    // the time that each bullet is shot and testing if
    // the amount of time since the last shot is more than
    // the required delay.
    if (this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
    if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
    this.lastBulletShotAt = this.game.time.now;

    // Get a dead bullet from the pool
    var bullet = this.bulletPool.getFirstDead();

    // If there aren't any bullets available then don't shoot
    if (bullet === null || bullet === undefined) return;

    // Revive the bullet
    // This makes the bullet "alive"
    bullet.revive();

    // Bullets should kill themselves when they leave the world.
    // Phaser takes care of this for me by setting this flag
    // but you can do it yourself by killing the bullet if
    // its x,y coordinates are outside of the world.
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;

    // Set the bullet position to the gun position.
    bullet.reset(this.playerGun.x, this.playerGun.y);
    bullet.rotation = this.playerGun.rotation;

    // Shoot it in the right direction
    bullet.body.velocity.x = Math.cos(bullet.rotation) * this.BULLET_SPEED;
    bullet.body.velocity.y = Math.sin(bullet.rotation) * this.BULLET_SPEED;
    
    this.plasmaGunSound.play();
    this.weaponAmmo -= 1;
    this.ammoText.text = this.weaponAmmo.toPrecision(2);
};

GameState.prototype.getExplosion = function(bullet) {
    // Get the first dead explosion from the explosionGroup
    
    
    
    var explosion = this.explosionGroup.getFirstDead();
    
    // If there aren't any available, create a new one
    if (explosion === null) {
        explosion = this.game.add.sprite(0, 0, 'plasmaBullets');
        
        
        
        explosion.anchor.setTo(0.5, 0.5);

        // Add an animation for the explosion that kills the sprite when the
        // animation is complete
        
        
        
        var animation = explosion.animations.add('boom', [5, 6], 12, false);
        animation.killOnComplete = true;

        // Add the explosion sprite to the group
        this.explosionGroup.add(explosion);
    }

    // Revive the explosion (set it's alive property to true)
    // You can also define a onRevived event handler in your explosion objects
    // to do stuff when they are revived.
    explosion.revive();

    // Move the explosion to the given coordinates
    explosion.x = bullet.x;
    explosion.y = bullet.y;

    // Set rotation of the explosion at random for a little variety
    explosion.angle = this.game.rnd.integerInRange(0, 360);

    // Play the animation
    explosion.animations.play('boom');

    
    
    // Return the explosion itself in case we want to do anything else with it
    return explosion;
};


GameState.prototype.lavaDeath = function(player, lava){
    this.level1.setCollision([5, 6, 13], false, this.lavaLayer);
   
    this.lose();
}

GameState.prototype.lose = function(){
    this.music.stop();
    this.playerDeathSound.play();
    this.game.state.start('lose');
}

GameState.prototype.loadNextLevel = function(){
    this.music.stop();
    this.game.state.start('level2');
}


