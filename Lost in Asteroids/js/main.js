// Objeto para armazenar as variávels "globais" do jogo
var Globals = { 
    score: 0
};

// main.js: Neste arquivo criamos uma instância de Phaser.Game e 
// determinamos quais scenes farão parte do jogo
// logo após iniciamos a primeira scene

// Criação do objeto principal do Phaser: Phaser.game
// parâmetros: largura, altura, tipo de renderização, ID do div
var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'phaser-canvas');

// Adicionando os states do nosso jogos no objeto game
// Os states já deverão ter sido criados anteriormente
game.state.add('game', GameState);
game.state.add('level2', Level2State);
game.state.add('title', TitleState);
game.state.add('win', WinState);
game.state.add('lose', LoseState);
game.state.add('credits', CreditsState);

// Iniciando primeiro estado do jogo
game.state.start('title');