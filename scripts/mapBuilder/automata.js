const Random = require('../../fury/src/random');
const { vec2 } = require('../../fury/src/maths');
const TileType = require('../tileType');

module.exports =  (function(){
	let exports = {};

	let countNeighbours = (tiles, x, y) => {
		let count = 0;
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (!(i == 0 && j == 0) && tiles[y + j][x + i] == TileType.wall) {
					count += 1;
				}
			}
		}
		return count;
	};

	let iterate = (out, tiles) => {
		for (let y = 1, yMax = tiles.length - 1; y < yMax; y++) {
			for (let x = 1, xMax = tiles[y].length - 1; x < xMax; x++) {
				let neighbourCount = countNeighbours(tiles, x, y);
				if (neighbourCount > 4 || neighbourCount == 0) {
					out[y][x] = TileType.wall; 
				} else {
					out[y][x] = TileType.floor;
				}
			}
		}
	};

	exports.create = (config) => {
		let { gameMap, monsterCount } = config;

		let builder = { // Should probably rename this, it's actually level data
			playerStart: vec2.create(),
			spawnPoints: [],
			goal: vec2.create()
		};

		// Generate Initial Random seed
		let a = [], b = [];
		for (let y = 0; y < gameMap.height; y++) {
			let rowA = [];
			let rowB = [];
			for (let x = 0; x < gameMap.width; x++) {
				rowA[x] = Random.value() < 0.55 ? TileType.floor : TileType.wall;
				rowB[x] = rowA[x];
			}
			a[y] = rowA;
			b[y] = rowB;
		}

		// Iterate Automata 
		for (let i = 0; i < 10; i++) {
			if (i%2 == 0) {
				iterate(b, a);
			} else {
				iterate(a, b);
			}
		}

		// Fill game map
		let xMax = gameMap.width - 1;
		let yMax = gameMap.height - 1;
		for (let y = 1; y < yMax; y++) {
			for (let x = 1; x < xMax; x++) {
				gameMap.setTile(x, y, a[y][x]);
			}
		}

		// Enclose
		for (let x = 0; x < gameMap.width; x++) {
			gameMap.setTile(x, 0, TileType.wall);
			gameMap.setTile(x, yMax, TileType.wall);
		}
		for (let y = 0; y < gameMap.height; y++) {
			gameMap.setTile(0, y, TileType.wall);
			gameMap.setTile(xMax, y, TileType.wall);
		}

		// Calculate points 
		let floorTiles = [];
		gameMap.getTilesOfType(floorTiles, TileType.floor);

		// Find player start (closest point to centre)
		// Remove tiles closer than 10 sqrs to reuse floortiles for monster spawns
		let cx = Math.floor(gameMap.width / 2), cy = Math.floor(gameMap.height / 2);

		let minX = 0, minY = 0;
		let minTileSqrDistance = Number.MAX_VALUE;
		for (let i = floorTiles.length - 1; i >= 0; i--) {
			let x = floorTiles[i] % gameMap.width;
			let y = Math.floor(floorTiles[i] / gameMap.width);
			let sqrDist =  (cx - x) * (cx - x) + (cy - y) * (cy - y);
			if (sqrDist < minTileSqrDistance) {
				minTileSqrDistance = sqrDist;
				minX = x;
				minY = y;
			}
			if (sqrDist < 10 * 10) {
				floorTiles.splice(i, 1);
			}
		}

		vec2.set(builder.playerStart, minX, minY);

		// Find spawn points 
		let numSpawnPoints = 0;
		while (numSpawnPoints < monsterCount && floorTiles.length > 0) {
			let mapIdx = floorTiles.splice(Random.integer(0, floorTiles.length), 1);
			builder.spawnPoints.push(vec2.fromValues(mapIdx % gameMap.width, Math.floor(mapIdx / gameMap.width) ));
			numSpawnPoints++;
		}

		// Put goal at furthest point from player start
		gameMap.playerNav.calculate(minX, minY, 1024);
		gameMap.playerNav.findMaxValuePos(builder.goal);

		return builder;

	};

	return exports;
})();