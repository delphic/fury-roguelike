const Random = require('../../fury/src/random');
const { vec2 } = require('../../fury/src/maths');
const TileType = require('../tileType');

module.exports = (function(){
	let exports = {};

	let navigableTiles = [];
	let overlappingSpawnPoints = [];

	exports.tryApply = (gameMap, stamp) => {
		let builder = gameMap.builder;
		let attemptCount = 0, maxAttemptCount = 20;

		gameMap.playerNav.getNavigableTileIndexSet(navigableTiles);

		let placement = null;
		while (attemptCount < maxAttemptCount) {
			attemptCount++;

			let mapIndex = navigableTiles[Random.integer(0, navigableTiles.length)];

			let xMin = mapIndex % gameMap.width,
				yMin = Math.floor(mapIndex / gameMap.height),
				xMax = xMin + stamp.width,
				yMax = yMin + stamp.height;

			let minDistance = Math.max(20, stamp.width, stamp.height);

			let canPlace = true;
			overlappingSpawnPoints.length = 0;
			for (let y = yMin; y < yMax && canPlace; y++) {
				for (let x = xMin; x < xMax; x++) {
					let distance = gameMap.playerNav.getValue(x, y, undefined); // This should be excluding going out of bounds but apparently it isn't?
					if (distance === undefined || distance <= minDistance || (x == builder.goal[0] && y == builder.goal[1])) {
						canPlace = false;
						break;
					}

					for (let i = 0, l = builder.spawnPoints.length; i < l; i++) {
						if (builder.spawnPoints[i][0] == x && builder.spawnPoints[i][1] == y) {
							overlappingSpawnPoints.push(i);
						}
					}
				}
			}

			if (canPlace) {
				placement = {
					xMin: xMin,
					xMax: xMax,
					yMin: yMin,
					yMax: yMax
				};
				overlappingSpawnPoints.sort();
				while (overlappingSpawnPoints.length) {
					let index = overlappingSpawnPoints.length - 1;
					builder.spawnPoints.splice(overlappingSpawnPoints[index], 1);
					overlappingSpawnPoints.length = index;
				}
				break;
			}
		}

		// Apply Stamp
		if (placement) {
			for (let i = 0, l = stamp.tiles.length; i < l; i++) {
				let row = stamp.tiles[i];
				let y = placement.yMax - 1 - i;
				for (let ri = 0, rl = row.length; ri < rl; ri++) {
					let x = placement.xMin + ri;
					switch (row[ri]) {
						case "-":
							gameMap.setTile(x, y, TileType.floor);
							break;
						case "#":
							gameMap.setTile(x, y, TileType.wall);
							break;
						case "S":
							gameMap.setTile(x, y, TileType.floor);
							builder.spawnPoints.push(vec2.fromValues(x, y));
							break;
					}
				}
			}
			return true;
		}

		return false;
	};

	return exports;
})();