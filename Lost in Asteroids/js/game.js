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
    this.game.load.spritesheet('player', 'Assets/spritesheets/player.png', 32, 32, 8);
    this.game.load.spritesheet('items', 'Assets/spritesheets/items.png', 32, 32, 16);
    this.game.load.spritesheet('enemies', 'Assets/spritesheets/enemies.png', 32, 32, 12);
    
    // Para carregar um arquivo do Tiled, o mesmo precisa estar no formato JSON
    this.game.load.tilemap('level1', 'Assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);

    // Para carregar os sons, basta informar a chave e dizer qual é o arquivo
    this.game.load.audio('jumpSound', 'Assets/sounds/jump.wav');
    this.game.load.audio('pickupSound', 'Assets/sounds/pickup.wav');
    this.game.load.audio('playerDeath', 'Assets/sounds/hurt3.ogg');
    this.game.load.audio('enemyDeath', 'Assets/sounds/hit2.ogg');
    this.game.load.audio('music', 'Assets/sounds/mystery.wav');
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
        
    // Inicializando jogador
    // Adicionando o sprite do jogador na posição (160, 64) usando o asset 'player'
    // Como estamos usando um spritesheet, é necessário informar qual sprite vamos usar
    // A contagem é da mesma forma do que nos tiles do mapa, mas o primeiro sprite recebe
    // o número 0 ao invés de 1.
    this.player = this.game.add.sprite(160, 64, 'player', 5);
    // Ajustando âncora do jogador (ponto de referência para posicionamento)
    this.player.anchor.setTo(0.5, 0.5);
    // Ativando física para o jogador
    this.game.physics.enable(this.player);
    // Ativando gravidade para o jogador
    // Como é positiva no eixo Y, o jogador terá uma gravidade "normal",
    // ou seja, irá acelerar para baixo
    this.player.body.gravity.y = 750;
    // Como o "mundo" é maior do que a área visível, é necessário que a câmera siga o jogador.
    // https://photonstorm.github.io/phaser-ce/Phaser.Camera.html#follow
    this.game.camera.follow(this.player);
    
    // Animações do jogador
    // Animações, no contexto do Phaser, nada mais são do que sequências de frames do spritesheet
    // Para criar uma animação, utilizamos animations.add()
    // Parâmetros: nome da animação, lista de quadros, quadros por segundo da animação
    // https://photonstorm.github.io/phaser-ce/Phaser.AnimationManager.html
    this.player.animations.add('walk', [0, 1, 2, 1], 6);
    this.player.animations.add('idle', [5, 5, 5, 5, 5, 5, 6, 5, 6, 5], 6);
    this.player.animations.add('jump', [4], 6);
    
    // Adicionando entradas
    // createCursorKeys() cria automaticamente mapeamentos para as 4 teclas de direção
    // https://photonstorm.github.io/phaser-ce/Phaser.Keyboard.html#createCursorKeys
    // Lista de teclas disponíveis: https://photonstorm.github.io/phaser-ce/Phaser.KeyCode.html
    this.keys = this.game.input.keyboard.createCursorKeys();
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
    this.pickupSound = this.game.add.audio('pickupSound');
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
    // Detecção de colisões
    // Todas as colisões entre os objetos do jogo são avaliadas com arcade.collide() ou 
    // arcade.overlap(). O Phaser irá automaticamente calcular a colisão dos objetos
    // Inicialmente, adicionando colisões do player com as paredes da fase, que é um layer:
    this.game.physics.arcade.collide(this.player, this.wallsLayer);

    // Adicionando colisões do jogador com outros elementos, onde há uma função de tratamento
    // Cada colisão terá um callback, que é o terceiro parâmetro, que irá fazer alguma coisa
    // sempre que essa quando essa colisão ocorrer; este callback receberá os 2 objetos que 
    // colidiram; veremos mais abaixo na implementação
    // Colisão com a lava - o jogador morre
    this.game.physics.arcade.collide(this.player, this.lavaLayer, this.lavaDeath, null, this);
   
    this.game.physics.arcade.overlap(this.player, this.oxPills, this.oxPillCollect, null, this);
    
    // Colisão com os morcegos - depende de como foi a colisão, veremos abaixo
    this.game.physics.arcade.overlap(this.player, this.bats, this.batCollision, null, this);
    
    // Adicionando colisão entre os morcegos e as paredes
    this.game.physics.arcade.collide(this.bats, this.wallsLayer);
    
    // Movimentação do player
    // Para detectar se uma das teclas referenciadas foi pressionada,
    // basta verificar a variável .isDown da mesma
    // Caso seja a tecla para a esquerda, ajustar uma velocidade negativa
    // ao eixo X, que fará a posição X diminuir e consequentemente o jogador
    // ir para a esquerda;
    if(this.keys.left.isDown){
        this.player.body.velocity.x = -150; // Ajustar velocidade
        // Se o jogador estiver virado para a direita, inverter a escala para que ele vire para o outro lado
        if(this.player.scale.x == 1) this.player.scale.x = -1;
        // Iniciando a animação 'walk'
        this.player.animations.play('walk');
    }
    // Se a tecla direita estiver pressionada (this.keys.right.isDown == true),
    // mover o sprite para a direita
    else if(this.keys.right.isDown){
        // se a tecla direita estiver pressionada
        this.player.body.velocity.x = 150;  // Ajustar velocidade
        // Se o jogador estiver virado para a direita, inverter a escala para que ele vire para o outro lado
        if(this.player.scale.x == -1) this.player.scale.x = 1;
        this.player.animations.play('walk');
    }
    else {
        // Ajustar velocidade para zero
        this.player.body.velocity.x = 0;
        this.player.animations.play('idle');
    }

    // Se o a barra de espaço ou a tecla cima estiverem pressionadas, e o jogador estiver com a parte de baixo tocando em alguma coisa
    if((this.jumpButton.isDown || this.keys.up.isDown) && (this.player.body.touching.down || this.player.body.onFloor())){
        // Adicione uma velocidade no eixo Y, fazendo o jogador pular
        this.player.body.velocity.y = -400;
        // Tocando o som de pulo
        this.jumpSound.play();
    }

    // Se o jogador não estiver no chão, inicie a animação 'jump'
    if(!this.player.body.touching.down && !this.player.body.onFloor()){
        this.player.animations.play('jump');
    }
    
    // Para cada morcego, verificar em que sentido ele está indo
    // Se a velocidade for positiva, a escala no eixo X será 1, caso
    // contrário -1
    this.bats.forEach(function(bat){
       if(bat.body.velocity.x != 0) {
           // Math.sign apenas retorna o sinal do parâmetro: positivo retorna 1, negativo -1
           bat.scale.x = 1 * Math.sign(bat.body.velocity.x);
       }
    });
    
    this.oxygen -= 0.01;
    this.oxText.text = "Oxygen: " + this.oxygen.toPrecision(2);
    
    if(this.oxygen <= 0)
        {
            this.music.stop(); 
            this.lose();
        }
}

// Tratamento da colisão entre o jogador e os diamantes
// As funções para esse fim sempre recebem os dois objetos que colidiram,
// e então podemos manipular tais objetos
GameState.prototype.oxPillCollect = function(player, oxPill){
    
    this.oxygen += 5;
    if(this.oxygen > 99)
        {
            this.oxygen = 99;
        }
    
    this.pickupSound.play(); // som de pegar o diamante
    oxPill.kill();
}

// Tratamento da colisão entre o jogador e os diamantes
GameState.prototype.batCollision = function(player, bat){
    // Se o jogador colidir por baixo e o morcego por cima, isso indica que o jogador pulou
    // em cima do morcego, nesse caso vamos "matar" o morcego
    if(player.body.touching.down && bat.body.touching.up){
        this.enemyDeathSound.play(); // tocando som de morte do morcego
        this.player.body.velocity.y = -200; // adicionando um pequeno impulso vertical ao jogador
        this.score += 100; // atualizando score
        bat.kill();
    }
    else 
    {
        this.oxygen -= 10;
        this.enemyDeathSound.play();
        bat.kill();
    }
}

// Tratamento da colisão entre o jogador e os diamantes
// Nesse caso, apenas desligamos a colisão com a lava para evitar chamar o evento
// repetidas vezes, e vamos para a condição de derrota
GameState.prototype.lavaDeath = function(player, lava){
    this.level1.setCollision([5, 6, 13], false, this.lavaLayer);
    this.music.stop(); // parando a música
    this.lose();
}

// Condição de derrota: guarde o score e siga para o próximo estado
GameState.prototype.lose = function(){
    Globals.score = this.score;
    this.playerDeathSound.play();
    this.game.state.start('lose');
}


