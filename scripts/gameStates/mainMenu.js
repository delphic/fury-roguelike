const Fury = require('../../fury/src/fury');
const { TextMesh } = Fury;
const GameState = require('./gameState');
const { vec3, vec4 } = Fury.Maths;

module.exports = (function(){
    let exports = {};

    let rink = vec4.fromValues(1.0, 0.0, 0.4, 1.0);
    let lime = vec4.fromValues(0.0, 1.0, 0.0, 1.0);

    exports.create = (config) => {
        let { canvas, scene, uiScene, uiAtlas, changeState } = config;
        let state = {};

        let w = Math.floor(canvas.width / uiAtlas.tileWidth);
        let h = Math.floor(canvas.height / uiAtlas.tileHeight);

        let title, titleUnderline, lore, instructions, enterText;

        let createText = (text, x, y, color) => {
            return TextMesh.create({ 
                text: text,
                scene: uiScene,
                atlas: uiAtlas,
                position: vec3.fromValues(x * uiAtlas.tileWidth, y * uiAtlas.tileHeight, 0),
                alignment: TextMesh.Alignment.center,
                color: color
            });
        };

        state.enter = () => {
            let cx = Math.floor(w/2);

            title = createText("Fury Roguelike", cx, h-8, rink);
            titleUnderline = createText("══════════════", cx, h-9, rink);
            let y = Math.floor(h/2);
            lore = createText("Seek the Amulet of Power to save your town from the monsters!", cx, y+5);
            instructions = createText("Use the arrow keys to move and attack, and space to wait.", cx, y+1);
            enterText = createText("1. Start Quest", cx, y-8, lime);

            scene.render();
            uiScene.render();
        };

        state.exit = () => {
            title.remove();
            titleUnderline.remove();
            lore.remove();
            instructions.remove();
            enterText.remove()
        };

        state.update = () => {
            if (Fury.Input.keyUp("1")) {
                changeState(GameState.inGame);
            }
        };

        return state;
    };

    return exports;
})();