const Fury = require('../fury/src/fury');
const TextMesh = require('./textmesh');
const State = require('./gameStates/gameState');

const { vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	let canvas;
	let scene, uiScene, camera, uiCamera;
	let uiAtlas, dungeonAtlas;

	let endStateMessage = null;

	let currentState;
	let inGameState = null;

	let createCameras = () => {
		// Main camera
		camera = Fury.Camera.create({
			type: Fury.Camera.Type.Orthonormal,
			near: 0.1,
			far: 100,
			height: canvas.height,
			ratio: canvas.width / canvas.height,
			position: vec3.fromValues(0.0, 0.0, 1.0)
		});

		// UI overlay camera - positions so 0,0 is bottom left
		uiCamera = Fury.Camera.create({
			type: Fury.Camera.Type.Orthonormal,
			near: 0.1,
			far: 100,
			height: canvas.height,
			ratio: canvas.width / canvas.height,
			position: vec3.fromValues(0.5 * canvas.width, 0.5 * canvas.height, 1.0),
			clear: false
		});
	};

	let createScenes = () => {
		scene = Fury.Scene.create({ camera: camera });
		uiScene = Fury.Scene.create({ camera: uiCamera });
	};

	let setRandomSeed = () => {
		let seed = Fury.Random.generateSeed();
		Fury.Random.setSeed(seed);
		console.log("Set seed to " + seed);
	};

	exports.init = (config) => {
		canvas = config.canvas;
		uiAtlas = config.uiAtlas;
		dungeonAtlas = config.dungeonAtlas;

		createCameras();
		createScenes();

		setRandomSeed();

		config.uiScene = uiScene;
		config.scene = scene;
		config.camera = camera;
		config.changeState = changeState;
		inGameState = (require('./gameStates/inGame')).create(config);

		changeState(State.inGame);
	};

	let createCenteredMessage = (text) => {
		// Larger text Atlas would nice for big messages
		return TextMesh.create({ 
			text: text,
			scene: uiScene,
			atlas: uiAtlas,
			position: vec3.fromValues(0.5 * canvas.width, 0.5 * canvas.height, 0),
			alignment: TextMesh.Alignment.center
		});
	};

	let changeState = (newState) => {
		switch (currentState) {
			case State.inGame:
				inGameState.exit();
				break;
			case State.victoryScreen:
			case State.lossScreen:
				if (endStateMessage) {
					endStateMessage.remove();
				}
				break;
		}
		switch (newState) {
			case State.inGame:
				inGameState.enter();
				break;
			case State.victoryScreen:
				endStateMessage = createCenteredMessage("You Win!");
				Fury.GameLoop.stop();
				window.setTimeout(restart, 3000);
				break;
			case State.lossScreen:
				endStateMessage = createCenteredMessage("You Lose!");
				Fury.GameLoop.stop();
				window.setTimeout(restart, 1000);
				break;
		}
		currentState = newState;
	};

	let restart = () => {
		inGameState.reset();
		setRandomSeed();
		Fury.GameLoop.start();
		changeState(State.inGame); 

	};

	exports.update = (elapsed) => {
		switch (currentState) {
			case State.inGame:
				inGameState.update(elapsed);
				break;
			default:
				scene.render();
				uiScene.render();
				break;
		}
	};

	return exports;
})();