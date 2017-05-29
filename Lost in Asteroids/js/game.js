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
    
    this.game.load.spritesheet('astronaut', 'Assets/spritesheets/astronaut.png', 96, 96, 24);
    this.game.load.spritesheet('player', 'Assets/spritesheets/player.png', 32, 32, 8);
    this.game.load.spritesheet('items', 'Assets/spritesheets/items.png', 32, 32, 16);
    this.game.load.spritesheet('enemies', 'Assets/spritesheets/enemies.png', 32, 32, 12);
    
    // Para carregar um arquivo do Tiled, o mesmo precisa estar no formato JSON
    this.game.load.tilemap('level1', 'Assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);

    // Para carregar os sons, basta informar a chave e dizer qual é o arquivo
    this.game.load.audio('jumpSound', 'Assets/sounds/jump.wav');
    this.game.load.audio('oxPillSound', 'Assets/sounds/ox_pill.ogg');
    this.game.load.audio('playerDeath', 'Assets/sounds/hurt3.ogg');
    this.game.load.audio('enemyDeath', 'Assets/sounds/hit2.ogg');
    this.game.load.audio('music', 'Assets/sounds/phantom_from_space.ogg');
}

GameState.prototype.create = function() { 
    // Inicializando sistema de física
    // o sistema Arcade é o mais simples de todos, mas também é o mais eficiente em termos de processamento.
    // https://photonstorm.github.io/phaser-ce/Phaser.Physics.Arcade.html
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

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
    this.lavaLayer = this.level1.createLayer('Lava');
    this.wallsLayer = this.level1.createLayer('Walls');
    
    // Mais informações sobre tilemaps:
    // https://photonstorm.github.io/phaser-ce/#toc14

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
    this.level1.setCollisionByExclusion([9, 10, 11, 12, 17, 18, 19, 20], true, this.wallsLayer);
    
    // Para o layer de lava é o caso oposto: poucos tiles colidem, então é mais fácil 
    // informar diretamente quais são.
    this.level1.setCollision([5, 6, 13], true, this.lavaLayer);
        
    this.astronaut = this.game.add.sprite(500,200, 'astronaut', 1);
    this.astronaut.anchor.setTo(0.5,0.5);
    this.game.physics.enable(this.astronaut);
    this.astronaut.body.gravity.y = 400;
    this.game.camera.follow(this.astronaut);
    // Corrigindo o bounding box do personagem
    this.astronaut.body.setSize(30,80, 35, 16);
    
    this.playerGun = this.game.add.sprite(300,200, 'astronaut', 12);
    this.playerGun.anchor.setTo(0.5, 0.6);
    
    this.astronaut.animations.add('idle', [0, 1, 2], 6);
    this.astronaut.animations.add('walk', [3, 4, 5], 6);
    this.astronaut.animations.add('walkb', [16, 17, 18], 6);
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
    
    // Grupo de diamantes
    this.oxPills = this.game.add.physicsGroup();
    this.level1.createFromObjects('Items', 'diamond', 'items', 5, true, false, this.oxPills);
    // Para cada objeto do grupo, vamos executar uma função
    this.oxPills.forEach(function(oxPill){
        // body.immovable = true indica que o objeto não é afetado por forças externas
        oxPill.body.immovable = true;
        // Adicionando animações; o parâmetro true indica que a animação é em loop
        oxPill.animations.add('spin', [4, 5, 6, 7, 6, 5], 6, true);
        oxPill.animations.play('spin');
    });

    // Grupo de morcegos:
    this.bats = this.game.add.physicsGroup();
    this.level1.createFromObjects('Enemies', 'bat', 'enemies', 8, true, false, this.bats);
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
    
    // Música de fundo - criada da mesma forma, mas com o parâmetro loop = true
    this.music = this.game.add.audio('music');
    this.music.loop = true;
    // Já iniciamos a música aqui mesmo pra ficar tocando ao fundo
    this.music.play();
    
    // HUD de score
    // A linha abaixo adiciona um texto na tela, e a próxima faz com o que o texto fique
    // fixo na câmera, dessa forma não vai se deslocar quando a câmera mudar
    this.oxText = this.game.add.text(50, 50, "Oxygen: 0", 
                            {font: "25px Arial", fill: "#ffffff"});
    this.oxText.fixedToCamera = true;
    
    this.ammoText = this.game.add.text(50, 100, "Ammo: 0", 
                            {font: "25px Arial", fill: "#ffffff"});
    this.ammoText.fixedToCamera = true;
    
    // Estado do jogo - Variáveis para guardar quaisquer informações pertinentes para as condições de 
    // vitória/derrota, ações do jogador, etc
    this.oxygen = 10;
    this.weaponAmmo = 0;
}

GameState.prototype.update = function() {
    
    this.updatingGun();
    
    this.game.physics.arcade.collide(this.astronaut, this.wallsLayer);

  
    this.game.physics.arcade.collide(this.astronaut, this.lavaLayer, this.lavaDeath, null, this);
   
    this.game.physics.arcade.overlap(this.astronaut, this.oxPills, this.oxPillCollect, null, this);
    
    this.game.physics.arcade.overlap(this.astronaut, this.bats, this.batCollision, null, this);
    
    this.game.physics.arcade.collide(this.bats, this.wallsLayer);
    
    if(this.keys.left.isDown){
        this.astronaut.body.velocity.x = -150;
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
        this.astronaut.body.velocity.x = 150;  
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
        this.astronaut.body.velocity.x = 0;
        this.astronaut.animations.play('idle');
    }

    if((this.jumpButton.isDown || this.keys.up.isDown) && (this.astronaut.body.touching.down || this.astronaut.body.onFloor())){
        this.astronaut.body.velocity.y = -400;
        this.jumpSound.play();
    }

    if(!this.astronaut.body.touching.down && !this.astronaut.body.onFloor()){
       this.astronaut.animations.play('jump');
    }
    
   
    this.bats.forEach(function(bat){
       if(bat.body.velocity.x != 0) {
           bat.scale.x = 1 * Math.sign(bat.body.velocity.x);
       }
    });
    
   this.updatingOxygen();
   
}

GameState.prototype.updatingOxygen = function()
{
     this.oxygen -= 0.01;
        this.oxText.text = "Oxygen: " + this.oxygen.toPrecision(2);

        if(this.oxygen <= 0)
            {
                this.music.stop(); 
                this.lose();
            }
}

GameState.prototype.updatingGun = function()
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

GameState.prototype.oxPillCollect = function(player, oxPill){
    
    this.oxygen += 5;
    if(this.oxygen > 99)
        {
            this.oxygen = 99;
        }
    
    this.oxPillSound.play();
    oxPill.kill();
}


GameState.prototype.batCollision = function(player, bat){
    
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


GameState.prototype.lavaDeath = function(player, lava){
    this.level1.setCollision([5, 6, 13], false, this.lavaLayer);
    this.music.stop();
    this.lose();
}

GameState.prototype.lose = function(){
    this.playerDeathSound.play();
    this.game.state.start('lose');
}


