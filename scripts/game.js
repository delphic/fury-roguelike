const Fury = require('../fury/src/fury');
const TextMesh = require('./textmesh');
const Spawner = require('./spawner');
const GameMap = require('./gameMap');
const { vec2, vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	let canvas;
	let scene, uiScene, camera, uiCamera;
	let uiAtlas, dungeonAtlas;
	let world = {
		player: null,
		map: null,
		monsters: [],
		items: []
	};

	// temp variables
	let intentPos = vec2.create();

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
		let mapOrigin = vec3.fromValues(
			-Math.floor(0.5 * w) * dungeonAtlas.tileSize,
			-Math.floor(0.5 * h) * dungeonAtlas.tileSize,
			-16);
		world.map = GameMap.create({
			scene: scene,
			width: w,
			height: h,
			position: mapOrigin,
			atlas: dungeonAtlas,
			theme: {
				0: "stone_floor",
				1: "stone_wall"
			}
		});
		let builder = world.map.builder;
	
		let spawner = Spawner.create({ atlas: dungeonAtlas, scene: scene, mapOrigin: mapOrigin });
	
		world.player = spawner.spawnPlayer(builder.playerStart);
		camera.position[0] = world.player.position[0];
		camera.position[1] = world.player.position[1];

		for (let i = 0, l = builder.spawnPoints.length; i < l; i++) {
			world.monsters.push(spawner.spawnMonster(builder.spawnPoints[i], "goblin"));
		}

		world.items.push(spawner.spawnItem(builder.goal, "amulet", () => {
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

	let navigableTiles = [];

	exports.update = (elapsed) => {
		// Wait for input
		if (world.player.checkForInput(elapsed, intentPos)) {
			// Player turn!
			world.player.takeTurn(world, intentPos);
			
			camera.position[0] = world.player.position[0];
			camera.position[1] = world.player.position[1];

			let nav = world.map.playerNav.calculate(world.player.x, world.player.y, 1024);

			nav.getNavigableTileIndexSet(navigableTiles);

			// Monster turn!
			let takenIndices = [];
			for (let i = 0, l = world.monsters.length; i < l; i++) {
				let monster = world.monsters[i];
				takenIndices[monster.x + world.map.width * monster.y] = true;
			}
			for (let i = 0, l = world.monsters.length; i < l; i++) {
				let monster = world.monsters[i];
				let x = px = monster.x, y = py = monster.y;
				let navValue = nav.getValue(x, y, 0);
				if (navValue > 1 && navValue < 7) {
					// Move towards player until within 1 square
					if (nav.getValue(x+1, y, navValue) < navValue) {
						x += 1;
					} else if (nav.getValue(x-1, y, navValue) < navValue) {
						x -= 1;
					} else if (nav.getValue(x, y+1, navValue) < navValue) {
						y += 1;
					} else if (nav.getValue(x, y-1, navValue) < navValue) {
						y -= 1;
					}

					// Note: Monsters that move later can block monsters moving earlier
					// Could if there's a monster on the square you want, resolve that monsters turn first
					// and if still block check the other directions - still this doesn't happen much as 
					// monsters are spawned in ~ order of distance to the player
					if ((px != x || py != y) && !takenIndices[x + world.map.width * y]) {
						takenIndices[px + world.map.width * py] = false;
						takenIndices[x + world.map.width * y] = true;
						monster.position[0] = x * dungeonAtlas.tileSize + world.map.origin[0];
						monster.position[1] = y * dungeonAtlas.tileSize + world.map.origin[1];
						monster.x = x;
						monster.y = y;
					}
				}

			}
		}

		scene.render();
		uiScene.render();
	};

	return exports;
})();