const Atlas = require('./atlas');
const Fury = require('../fury/src/fury');
const { vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { atlas, scene, mapOrigin } = config;
		
		let spawner = {};

		let spawnEntity = (pos, name) => {
			let position = vec3.fromValues(
				pos[0] * atlas.tileSize + mapOrigin[0],
				pos[1] * atlas.tileSize + mapOrigin[1],
				0
			);
			let entity = {
				x: pos[0],
				y: pos[1],
				position: position
			};
			entity.sceneObject = scene.instantiate({
				name: Atlas.createTilePrefab(atlas, name, true),
				position: position
			});
			return entity;
		}

		spawner.spawnPlayer = (pos) => {
			let player = spawnEntity(pos, "player");
		
			// Should probably change this to an axis type calculation so
			// if you press one direction then the other it doesn't jiggle
			let hasKeyInput = (key, elapsed) => {
				let elapsedMs = elapsed * 1000;
				let initialThreshold = 250;
				let repeatThreshold = 150;
				let downTime = Date.now() - Fury.Input.keyDownTime(key);
				if (downTime < initialThreshold) {
					return Fury.Input.keyUp(key);
				} else if (Fury.Input.keyDown(key)) {
					// If just went over the initial threshold || if went over a repeat threshold then move
					return (downTime - elapsedMs < initialThreshold)
						|| ((downTime - initialThreshold - elapsedMs) % repeatThreshold > (downTime - initialThreshold) % repeatThreshold);
				}
			}; 

			player.inventory = [];

			player.update = (elapsed, map, monsters, items) => {
				let targetX = player.x; targetY = player.y;
				if (hasKeyInput("Up", elapsed)) {
					targetY += 1;
				}
				if (hasKeyInput("Down", elapsed)) {
					targetY -= 1;
				}
				if (hasKeyInput("Left", elapsed)) {
					targetX -= 1;
				}
				if (hasKeyInput("Right", elapsed)) {
					targetX += 1;
				}

				if (map.canEnterTile(targetX, targetY)) {
					let monsterIdx = monsters.findIndex(m => m.x == targetX && m.y == targetY);
					if (monsterIdx >= 0) {
						scene.remove(monsters.splice(monsterIdx, 1)[0].sceneObject);
					} else {
						player.x = targetX;
						player.y = targetY;
						player.position[0] = player.x * atlas.tileSize + map.origin[0]
						player.position[1] = player.y * atlas.tileSize + map.origin[1];

						let itemIdx = items.findIndex(i => i.x == player.x && i.y == player.y);
						if (itemIdx >= 0) {
							let item = items.splice(itemIdx, 1)[0];
							player.inventory.push(item);
							item.sceneObject.active = false;
							if (item.onPickup) {
								item.onPickup();
							}
						}
					}
				}
			};

			return player;
		};

		spawner.spawnItem = (pos, name, onPickup) => {
			let entity = spawnEntity(pos, name);
			entity.onPickup = onPickup;
			return entity;
		};

		spawner.spawnMonster = (pos, name) => {
			return spawnEntity(pos, name);
		};

		return spawner;
	};

	return exports;
})();