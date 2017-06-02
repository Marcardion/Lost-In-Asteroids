"use strict"; //sempre começar o arquivo com essa linha

//Atenção sempre: 
// - Letras maiúsculas e minúsculas: sempre usar os "cases" corretos;
// - Abrir e fechar parênteses: um esquecimento pode gerar um erro difícil de notar;
// - Abrir e fechar chaves: mesmo caso anterior
// - Sempre veja o console no navegador apertando F12 caso algo não funcione como deveria

//Um estado é sempre um objeto JavaScript, com no mínimo as 3 funções principais: preload, create e update
//As funções sempre começam com NomeDoObjeto.prototype 
var CreditsState = function(game) {};

CreditsState.prototype.preload = function() 
{
    this.game.load.image('creditsImage', 'Assets/images/credits.png');
    this.game.load.audio('music', 'Assets/sounds/static_motion.ogg');
}

// create: instanciar e inicializar todos os objetos dessa scene
CreditsState.prototype.create = function() {
   
    this.mainTitle = this.game.add.sprite(0, 0, 'creditsImage');
    
    // Capturando tecla enter para uso posterior
    this.returnKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    
    this.music = this.game.add.audio('music');
    this.music.loop = true;
    this.music.play();
    
}

// update: o que fazer a cada quadro por segundo
CreditsState.prototype.update = function() {
    // Detectar se a tecla foi pressionada
    if(this.returnKey.isDown){
        this.music.stop();
        this.game.state.start('title');
    }
}