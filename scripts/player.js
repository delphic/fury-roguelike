const Fury = require('../fury/src/fury');

module.exports = (function(){
	let exports = {};

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

	exports.create = (entity, scene, tileSize) => {
		let player = entity;

		player.inventory = [];

		player.checkForInput = (elapsed, targetPos) => {
			let result = false;
			let targetX = player.x; targetY = player.y;
			if (hasKeyInput("Up", elapsed)) {
				result = true;
				targetY += 1;
			}
			if (hasKeyInput("Down", elapsed)) {
				result = true;
				targetY -= 1;
			}
			if (hasKeyInput("Left", elapsed)) {
				result = true;
				targetX -= 1;
			}
			if (hasKeyInput("Right", elapsed)) {
				result = true;
				targetX += 1;
			}
			if (Fury.Input.keyUp("Space")) {
				result = true;
			}
			targetPos[0] = targetX;
			targetPos[1] = targetY;
			return result;
		};

		player.takeTurn = (world, intent) => {
			let { map, player, monsters, items } = world;
			let targetX = intent[0], targetY = intent[1];
			
			if (map.canEnterTile(targetX, targetY)) {
				let monsterIdx = monsters.findIndex(m => m.x == targetX && m.y == targetY);
				if (monsterIdx >= 0) {
					let monster = monsters[monsterIdx];
					monster.health -= 1;
					if (monster.health <= 0) {
						monsters.splice(monsterIdx, 1);
						scene.remove(monster.sceneObject);
					}
				} else {
					player.x = targetX;
					player.y = targetY;
					player.position[0] = player.x * tileSize + map.origin[0]
					player.position[1] = player.y * tileSize + map.origin[1];

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

	return exports;
})();