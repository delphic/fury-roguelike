const Fury = require('../../fury/src/fury');
const Hud = require('../hud');
const Spawner = require('../spawner');
const GameMap = require('../gameMap');
const GameState = require('./gameState');
const BuilderType = require('../mapBuilder/builderType');
const { vec2, vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	let navigableTiles = [];

	let itemsByIndex = [];
	let monstersByIndex = [];
	let visibilitySet = [];

	let updateFogOfWar = (world) => {
		for (let i = 0, l = visibilitySet.length; i < l; i++) {
			let index = visibilitySet[i];
			let x = index % world.map.width;
			let y = Math.floor(index / world.map.width);
			world.map.setTileActive(x, y, false);
		}

		// Build monster and item by index arrays - should probably
		// have this on world and could hide the indexing
		monstersByIndex.length = 0;
		for (let i = 0, l = world.monsters.length; i < l; i++) {
			let monster = world.monsters[i]; 
			monster.sceneObject.active = false;
			monstersByIndex[monster.x + world.map.width * monster.y] = monster;
		}

		itemsByIndex.length = 0;
		for (let i = 0, l = world.items.length; i < l; i++) {
			let item = world.items[i];
			item.sceneObject.active = false;
			itemsByIndex[item.x + world.map.width * item.y] = item;
		}

		world.map.buildVisibilitySet(world.player.x, world.player.y, 8, visibilitySet);

		for (let i = 0, l = visibilitySet.length; i < l; i++) {
			let index = visibilitySet[i];
			let x = index % world.map.width;
			let y = Math.floor(index / world.map.width);

			world.map.setTileActive(x, y, true);

			let monster = monstersByIndex[index];
			if (monster) {
				monster.sceneObject.active = true;
			}
			let item = itemsByIndex[index];
			if (item) {
				item.sceneObject.active = true;
			}
		}
	};

	exports.create = (config) => {
		let { canvas, camera, scene, uiScene, uiAtlas, dungeonAtlas, changeState } = config; 

		let state = {};

		let hud = null;
		let depth = 0;

		let world = {
			player: null,
			map: null,
			monsters: [],
			items: []
		};
		
		// temp variables
		let intentPos = vec2.create();

		let buildMap = (depth) => {
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
					1: "stone_wall",
					2: "stairs_down"
				},
				spawnExit: depth < 2,
				builderType: Math.floor(3 * Math.random())
			});
			let builder = world.map.builder;
		
			let spawner = Spawner.create({ atlas: dungeonAtlas, scene: scene, mapOrigin: mapOrigin });
		
			if (!world.player) {
				world.player = spawner.spawnPlayer(builder.playerStart, 3);
			} else {
				world.player.sceneObject.active = true;
				world.player.x = builder.playerStart[0];
				world.player.y = builder.playerStart[1];
				world.player.position[0] = world.player.x * dungeonAtlas.tileSize + world.map.origin[0];
				world.player.position[1] = world.player.y * dungeonAtlas.tileSize + world.map.origin[1];
			}
			camera.position[0] = world.player.position[0];
			camera.position[1] = world.player.position[1];
	
			let mapsSpawned = 0, mapChance = 0.1;
			let potionsSpawned = 0, potionChance = 0.1;
	
			for (let i = 0, l = builder.spawnPoints.length; i < l; i++) {
				let random = Math.random();
				let randomOffset = 0;
				if (mapsSpawned == 0 && random < mapChance) {
					world.items.push(spawner.spawnItem(
						builder.spawnPoints[i],
						"map",
						"Dungeon Map",
						null,
						() => { world.map.revealMap(); }
					));
					mapsSpawned += 1;
					randomOffset += mapChance;
				} else if (potionsSpawned < 2 && random < randomOffset + potionChance) {
					world.items.push(spawner.spawnItem(
						builder.spawnPoints[i],
						"red_potion",
						"Healing Potion",
						null,
						() => {
							world.player.health = Math.min(world.player.health + 1, world.player.healthMax);
					}));
					potionsSpawned += 1;
					randomOffset += potionChance;
				} else {
					world.monsters.push(spawner.spawnMonster(builder.spawnPoints[i], "goblin", 1));
				}
			}
	
			if (depth == 2) {
				world.items.push(spawner.spawnItem(
					builder.goal,
					"amulet",
					"Amulet of Power",
					() => {
						changeState(GameState.victoryScreen);
				}));
			}
			updateFogOfWar(world);
		};
	

		state.enter = () => {
			buildMap(depth);
			if (!hud) {
				hud = Hud.create({ canvas: canvas, uiAtlas: uiAtlas, uiScene: uiScene, world: world });
			}
			hud.updateLevelDisplay(depth);
		};

		state.exit = () => {
			// Clean up existing level
			world.map.cleanUp();
			for (let i = 0, l = world.monsters.length; i < l; i++) {
				scene.remove(world.monsters[i].sceneObject);
			}
			world.monsters.length = 0;
			for (let i = 0, l = world.items.length; i < l; i++) {
				scene.remove(world.items[i].sceneObject);
			}
			world.items.length = 0;
			world.player.sceneObject.active = false;
			// Increase depth and build new map
			depth += 1;
		};

		state.update = (elapsed) => {
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
					let distanceToPlayer = nav.getValue(x, y, 0);
					if (distanceToPlayer > 1 && distanceToPlayer < 7
						&& world.map.hasLineOfSight(world.player.x, world.player.y, monster.x, monster.y)) {
						// Player -> monster to ensure monster 'sight' matches player expectation
						// Move towards player until within 1 square
						if (nav.getValue(x+1, y, distanceToPlayer) < distanceToPlayer) {
							x += 1;
						} else if (nav.getValue(x-1, y, distanceToPlayer) < distanceToPlayer) {
							x -= 1;
						} else if (nav.getValue(x, y+1, distanceToPlayer) < distanceToPlayer) {
							y += 1;
						} else if (nav.getValue(x, y-1, distanceToPlayer) < distanceToPlayer) {
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
					} else if (distanceToPlayer == 1) {
						world.player.health -= 1;
					}
				}

				updateFogOfWar(world);

				hud.updateInventoryDisplay(world.player);
				hud.updateHealthBar(world.player);

				if (world.player.health <= 0) {
					changeState(GameState.lossScreen);
				}
			}

			if (depth < 2 && world.player.x == world.map.builder.goal[0] && world.player.y == world.map.builder.goal[1]) {
				changeState(GameState.inGame);
			} else {
				scene.render();
				uiScene.render();
			}
		};

		return state;
	};

	return exports;
})();