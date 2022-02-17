const Fury = require('../../fury/src/fury');
const TextMesh = require('../textmesh');
const GameState = require('./gameState');
const { vec3 } = Fury.Maths;

module.exports = (function(){
    let exports = {};

    exports.create = (config) => {
        let { canvas, scene, uiScene, uiAtlas, changeState } = config;
        let state = {};

        let w = Math.floor(canvas.width / uiAtlas.tileSize);
        let h = Math.floor(canvas.height / uiAtlas.tileSize);

        let title, lore, instructions, enterText;

        let createText = (text, x, y) => {
            return TextMesh.create({ 
                text: text,
                scene: uiScene,
                atlas: uiAtlas,
                position: vec3.fromValues(x * uiAtlas.tileSize, y * uiAtlas.tileSize, 0),
                alignment: TextMesh.Alignment.center
            });
        };

        state.enter = () => {
            let cx = Math.floor(w/2);

            // TODO:
            // Add Color to title (Rink) and enter text
            // Add scale option to textMesh for Title -> x2

            title = createText("Fury Roguelike", cx, h-8);
            let y = Math.floor(h/2);
            lore = createText("Seek the Amulet of Power to save your town from the monsters!", cx, y+4);
            instructions = createText("Use the arrow keys to move and attack, and space to wait.", cx, y+2);
            enterText = createText("1. Enter Dungeon", cx, y-8);

            scene.render();
            uiScene.render();
        };

        state.exit = () => {
            title.remove();
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