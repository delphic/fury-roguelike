const Fury = require('../fury/src/fury');
const TextMesh = require('./textmesh');
const Spawner = require('./spawner');
const GameMap = require('./gameMap');
const { vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	let canvas;
	let scene, uiScene, camera, uiCamera;
	let uiAtlas, dungeonAtlas;
	let player, map, monsters = [], items = [];

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

	exports.init = (config) => {
		canvas = config.canvas;
		uiAtlas = config.uiAtlas;
		dungeonAtlas = config.dungeonAtlas;

		createCameras();
		createScenes();

		let w = 40, h = 20;

		let pos = vec3.fromValues(
			-Math.floor(0.5 * w) * dungeonAtlas.tileSize,
			-Math.floor(0.5 * h) * dungeonAtlas.tileSize,
			-16);
		map = GameMap.create({
			scene: scene,
			width: w,
			height: h,
			position: pos,
			atlas: dungeonAtlas,
			theme: {
				0: "stone_floor",
				1: "stone_wall"
			}
		});
	
		let spawner = Spawner.create({ atlas: dungeonAtlas, scene: scene, mapOrigin: pos });
	
		player = spawner.spawnPlayer(map.builder.playerStart);
		for (let i = 0, l = map.builder.spawnPoints.length; i < l; i++) {
			monsters.push(spawner.spawnMonster(map.builder.spawnPoints[i], "goblin"));
		}
		items.push(spawner.spawnItem(map.builder.goal, "amulet", () => {
			TextMesh.create({ 
				text: "You Win!",
				scene: uiScene,
				atlas: uiAtlas,
				position: vec3.fromValues(0.5 * canvas.width, 0.5 * canvas.height, 0),
				alignment: TextMesh.Alignment.center
			});
			Fury.GameLoop.stop();
			window.setTimeout(() => { window.location = window.location }, 1000);
		}));
	
		TextMesh.create({ 
			text: "Fury Roguelike",
			scene: uiScene,
			atlas: uiAtlas,
			position: vec3.fromValues(0.5 * canvas.width, canvas.height - 2 * uiAtlas.tileSize, 0),
			alignment: TextMesh.Alignment.center
		});
	};

	exports.update = (elapsed) => {
		player.update(elapsed, map, monsters, items);
	
		camera.position[0] = player.position[0];
		camera.position[1] = player.position[1];

		scene.render();
		uiScene.render();
	};

	return exports;
})();