"use strict"; 

//Atenção sempre: 
// - Letras maiúsculas e minúsculas: sempre usar os "cases" corretos;
// - Abrir e fechar parênteses: um esquecimento pode gerar um erro difícil de notar;
// - Abrir e fechar chaves: mesmo caso anterior
// - Sempre veja o console no navegador apertando F12 caso algo não funcione como deveria

//Um estado é sempre um objeto JavaScript, com no mínimo as 3 funções principais: preload, create e update
//As funções sempre começam com NomeDoObjeto.prototype 
var Level2State = function(game) {};

// preload: carregar todos os assets necessários para esta scene ou para as próximas
Level2State.prototype.preload = function() {
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
    this.game.load.image('splash', 'Assets/spritesheets/splash.png');
    
    
    
    // Para carregar um arquivo do Tiled, o mesmo precisa estar no formato JSON
    this.game.load.tilemap('level2', 'Assets/maps/level4.json', null, Phaser.Tilemap.TILED_JSON);

    // Para carregar os sons, basta informar a chave e dizer qual é o arquivo
    this.game.load.audio('jumpSound', 'Assets/sounds/jump.wav');
    this.game.load.audio('oxPillSound', 'Assets/sounds/ox_pill.ogg');
    this.game.load.audio('plasmaGunSound', 'Assets/sounds/plasma_gun.ogg');
    this.game.load.audio('playerDeath', 'Assets/sounds/hurt3.ogg');
    this.game.load.audio('enemyDeath', 'Assets/sounds/hit2.ogg');
    this.game.load.audio('music', 'Assets/sounds/phantom_from_space.ogg');
}

Level2State.prototype.create = function() { 
    
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    
    
    this.SHOT_DELAY = 1000; // milliseconds (10 bullets/3 seconds)
    this.BULLET_SPEED = 400; // pixels/second
    this.NUMBER_OF_BULLETS = 20;
    this.GRAVITY = 400; // pixels/second/second
    
    
    
    // Para carregar o mapa do Tiled para o Phaser, 3 estágios são necessários:
    // 1 - Criar um objeto com o arquivo do Tiled carregado no preload()
    this.level2 = this.game.add.tilemap('level2');
    // 2 - Adicionar as imagens correspondentes aos tilesets do Tiled dentro do Phaser
    // "tiles" é o nome do tileset dentro do Tiled
    // "mapTiles" é o nome da imagem com os tiles, carregada no preload()
    this.level2.addTilesetImage('tiles', 'mapTiles');
    
    // 3 - Criar os layers do mapa
    // A ordem nesse caso é importante, então os layers que ficarão no "fundo" deverão ser
    // criados primeiro, e os que ficarão na "frente" por último;
    
    
    //this.bgLayer = this.level2.createLayer('BG');
    
    
    
    //Background
    this.backgroundParallax = this.game.add.tileSprite(0, 
        this.game.height - this.game.cache.getImage('parallax-bg').height, 
        this.game.width, 
        this.game.cache.getImage('parallax-bg').height, 
        'parallax-bg'
    );
    
    
    this.iceLayer = this.level2.createLayer('Ice');
    this.lavaLayer = this.level2.createLayer('Lava');
    this.wallsLayer = this.level2.createLayer('Walls');
    
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
    
    
    this.level2.setCollisionByExclusion([17, 18, 30, 36, 42, 43, 44, 45, 49, 50, 51,      58, 59, 60,    64, 65, 66], true, this.wallsLayer);
    this.level2.setCollisionByExclusion([17, 18, 30, 36, 42, 43, 44, 45, 49, 50, 51,      58, 59, 60,    64, 65, 66], true, this.iceLayer);
    
    // Para o layer de lava é o caso oposto: poucos tiles colidem, então é mais fácil 
    // informar diretamente quais são.
    this.level2.setCollision([58, 59, 60,    64, 65, 66], true, this.lavaLayer);
    
    
    this.astronaut = this.game.add.sprite(500,200, 'astronaut', 1);
    this.astronaut.anchor.setTo(0.5,0.5);
    this.game.physics.enable(this.astronaut);
    this.astronaut.body.gravity.y = 400;
    this.game.camera.follow(this.astronaut);
    // Corrigindo o bounding box do personagem
    this.astronaut.body.setSize(30,80, 35, 16);
    
    /*
    this.bullet = this.game.add.sprite(500,200, 'plasmaBullets', 1);
    this.bullet.anchor.setTo(0.5,0.5);
    this.game.physics.enable(this.bullet);
    this.bullet.body.setSize(32,32, 15, 15);*/
    
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
    
    // Adicionando objetos do Tiled, utilizando grupos
    // Um grupo é como se fosse um array de sprites, mas com várias facilidades adicionais, 
    // como por exemplo alterar atributos e facilitar detectar colisões com objetos do grupo
    // Especificamente, estamos criando physicsGroups, que já armazenam objetos com física ativada
    // https://photonstorm.github.io/phaser-ce/Phaser.GameObjectFactory.html#physicsGroup
    
    // Criando objetos que foram criados em um layer de objetos do Tiled
    // Parâmetros do createFromObjects():
    // nome do layer do Tiled de onde vamos criar os objetos
    // nome dos objetos do Tiled que serão criados
    // nome do spritesheet carregado no preload() com os objetos
    // frame do spritesheet, basta setar para um dos frames do objeto em questão
    // true, false - estes dois parâmetros podem ficar com estes valores
    // grupo - qual grupo do Phaser devemos adicionar esses objetos
    
    this.oxPills = this.game.add.physicsGroup();
    this.level2.createFromObjects('Items', 'diamond', 'items', 5, true, false, this.oxPills);
    // Para cada objeto do grupo, vamos executar uma função
    this.oxPills.forEach(function(oxPill){
        // body.immovable = true indica que o objeto não é afetado por forças externas
        oxPill.body.immovable = true;
        // Adicionando animações; o parâmetro true indica que a animação é em loop
        oxPill.animations.add('spin', [0,1,2], 6, true);
        oxPill.animations.play('spin');
    });

    // Grupo de morcegos:
    this.bats = this.game.add.physicsGroup();
    this.level2.createFromObjects('Enemies', 'bat', 'enemies', 8, true, false, this.bats);
    this.bats.forEach(function(bat){
        bat.anchor.setTo(0.5, 0.5);
        bat.body.immovable = true;
        bat.animations.add('fly', [8, 9, 10], 6, true);
        bat.animations.play('fly');
        // Velocidade inicial do inimigo
        bat.body.velocity.x = 100;
        // bounce.x=1 indica que, se o objeto tocar num objeto no eixo x, a força deverá
        // ficar no sentido contrário; em outras palavras, o objeto é perfeitamente elástico
        bat.body.bounce.x = 1;
    });

    // Criando assets de som com this.game.add.audio()
    // O parâmetro é o nome do asset definido no preload()
    this.jumpSound = this.game.add.audio('jumpSound');
    this.oxPillSound = this.game.add.audio('oxPillSound');
    this.playerDeathSound = this.game.add.audio('playerDeath');
    this.enemyDeathSound = this.game.add.audio('enemyDeath');
    this.plasmaGunSound = this.game.add.audio('plasmaGunSound');
    
    // Música de fundo - criada da mesma forma, mas com o parâmetro loop = true
    this.music = this.game.add.audio('music');
    this.music.loop = true;
    // Já iniciamos a música aqui mesmo pra ficar tocando ao fundo
    this.music.play();
    
    // HUD de score
    // A linha abaixo adiciona um texto na tela, e a próxima faz com o que o texto fique
    // fixo na câmera, dessa forma não vai se deslocar quando a câmera mudar
    this.oxText = this.game.add.text(50, 50, "Oxygen: 0", 
                            {font: "25px Roboto", fill: "#ffffff"});
    this.oxText.fixedToCamera = true;
    
    this.ammoText = this.game.add.text(50, 100, "Ammo: 0", 
                            {font: "25px Roboto", fill: "#ffffff"});
    this.ammoText.fixedToCamera = true;
    
    // Estado do jogo - Variáveis para guardar quaisquer informações pertinentes para as condições de 
    // vitória/derrota, ações do jogador, etc
    this.oxygen = 10;
    this.weaponAmmo = 0;
    
    
    this.explosionGroup = this.game.add.group();
    
    //create particle
    this.particleEmitter = this.game.add.emitter(0, 0, 15);
    // Utilizando o asset particle para compor as partículas
    this.particleEmitter.makeParticles('splash');
    
    

}

Level2State.prototype.update = function() {
    
   // this.game.debug.body(this.bullet);
   // this.game.debug.body(this.astronaut);

    this.updatingGun();
    
    this.game.physics.arcade.collide(this.astronaut, this.wallsLayer);
    this.game.physics.arcade.collide(this.astronaut, this.iceLayer);

    this.game.physics.arcade.collide(this.astronaut, this.lavaLayer, this.lavaDeath, null, this);
   
    this.game.physics.arcade.overlap(this.astronaut, this.oxPills, this.oxPillCollect, null, this);
    
    this.game.physics.arcade.overlap(this.astronaut, this.bats, this.batCollision, null, this);
    
     this.game.physics.arcade.collide(this.bulletPool, this.wallsLayer, function(bullet, walls) {
        // Create an explosion
        this.getExplosion(bullet);

        // Kill the bullet
        //bullet.kill();
        
         //bullet animation
    //    bullet.animations.play('explosion');
        
       /* this.particleEmitter.x = bullet.x;
        this.particleEmitter.y = bullet.y; 
        this.particleEmitter.start(true, 1000, false, 1000);
         */
         
         
         bullet.kill();
        //bullet.physics == null;
       // bullet.body.immovable = true;
         
         
    }, null, this);
    
    
    
     this.game.physics.arcade.collide(this.bulletPool, this.iceLayer, function(bullet, walls) {
        // Create an explosion
        this.getExplosion(bullet);

        // Kill the bullet
        //bullet.kill();
        
         //bullet animation
    //    bullet.animations.play('explosion');
        
        this.particleEmitter.x = bullet.x;
        this.particleEmitter.y = bullet.y; 
        this.particleEmitter.start(true, 1000, false, 500);
         
         this.level2.removeTile(walls.x, walls.y, this.iceLayer);
        // map.removeTile(walls.x, walls.y, this.iceLayer).destroy();
         
         
         bullet.kill();
         
        //bullet.physics == null;
       // bullet.body.immovable = true;
         
         
    }, null, this);
    
    
    
     this.bulletPool.forEachAlive(function(bullet) {
        bullet.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
    }, this);
    
    if (this.game.input.activePointer.isDown) {
        this.shootBullet();
    }
    
    this.game.physics.arcade.collide(this.bats, this.wallsLayer);
    
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

    
   
    this.bats.forEach(function(bat){
       if(bat.body.velocity.x != 0) {
           bat.scale.x = 1 * Math.sign(bat.body.velocity.x);
       }
    });
    
   this.updatingOxygen();
   
}

Level2State.prototype.playerAnimations = function()
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

Level2State.prototype.updatingOxygen = function()
{
     this.oxygen -= 0.01;
        this.oxText.text = "Oxygen: " + this.oxygen.toPrecision(2);

        if(this.oxygen <= 0)
            {
                this.music.stop(); 
                this.lose();
            }
}

Level2State.prototype.updatingGun = function()
{
    this.playerGun.x = this.astronaut.x;
    this.playerGun.y = this.astronaut.y;
    
    if(this.game.input.activePointer.x < this.playerGun.x)
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

Level2State.prototype.oxPillCollect = function(player, oxPill){
    
    this.oxygen += 5;
    if(this.oxygen > 99)
        {
            this.oxygen = 99;
        }
    
    this.oxPillSound.play();
    oxPill.kill();
}

Level2State.prototype.shootBullet = function() {
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
};

Level2State.prototype.getExplosion = function(bullet) {
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

Level2State.prototype.batCollision = function(player, bat){
    
    if(player.body.touching.down && bat.body.touching.up){
        this.enemyDeathSound.play(); 
        this.astronaut.body.velocity.y = -200;
        bat.kill();
    }
    else 
    {
        this.oxygen -= 10;
        this.enemyDeathSound.play();
        bat.kill();
    }
}


Level2State.prototype.lavaDeath = function(player, lava){
    this.level2.setCollision([5, 6, 13], false, this.lavaLayer);
    this.music.stop();
    this.lose();
}

Level2State.prototype.lose = function(){
    this.playerDeathSound.play();
    this.game.state.start('lose');
}




