"use strict"; //sempre começar o arquivo com essa linha

//Atenção sempre: 
// - Letras maiúsculas e minúsculas: sempre usar os "cases" corretos;
// - Abrir e fechar parênteses: um esquecimento pode gerar um erro difícil de notar;
// - Abrir e fechar chaves: mesmo caso anterior
// - Sempre veja o console no navegador apertando F12 caso algo não funcione como deveria

//Um estado é sempre um objeto JavaScript, com no mínimo as 3 funções principais: preload, create e update
//As funções sempre começam com NomeDoObjeto.prototype 
var LoseState = function(game) {};

// preload: carregar todos os assets necessários para esta scene ou para as próximas
LoseState.prototype.preload = function() {

    this.game.load.image('gameover', 'Assets/images/gameover.png');
    this.game.load.audio('music', 'Assets/sounds/static_motion.ogg');
}

// create: instanciar e inicializar todos os objetos dessa scene
LoseState.prototype.create = function() {
    
     this.mainTitle = this.game.add.sprite(0, 0, 'gameover');
    
    // Adicionando textos
    this.gameOverText = this.game.add.text(520, 100, "GAME OVER", {font: "50px Roboto", fill: "#ffffff"});
    this.gameOverText.anchor.setTo(0.5, 0.5);
    
    this.tryAgainText = this.game.add.text(520, 200, "PRESS ENTER TO TRY AGAIN", {font: "35px Roboto", fill: "#ffffff"});
    this.tryAgainText.anchor.setTo(0.5, 0.5);
    // Capturando tecla enter para uso posterior
    this.returnKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    
    this.music = this.game.add.audio('music');
    this.music.loop = true;
    this.music.play();
}

// update: o que fazer a cada quadro por segundo
LoseState.prototype.update = function() {
    // Detectar se a tecla foi pressionada
    if(this.returnKey.isDown){
        this.music.stop();
        this.game.state.start(Globals.myLevel);
    }
}