const { Random } = require('../../fury/src/fury');
const { vec2 } = require('../../fury/src/maths');
const TileType = require('../tileType');

module.exports =  (function(){
	let exports = {};

	let performDrunkardsWalk = (out, x, y, gameMap, staggerDist) => {
		let dist = 0;
		out.length = 0;
		while (dist < staggerDist) {
			if (x <= 0 || y <= 0 || x + 1 >= gameMap.width || y + 1 >= gameMap.height) {
				break;
			}
			out.push(gameMap.getPointIndex(x, y));
			gameMap.setTile(x, y, TileType.floor);
			switch (Random.integer(0,4)) {
				case 0:
					x -= 1;
					break;
				case 1:
					x += 1;
					break;
				case 2:
					y -= 1;
					break;
				case 3:
					y += 1;
					break;
			}
			dist++;
		}
	};

	exports.create = (config) => {
		let { gameMap, fillRatio, staggerDist, monsterCount } = config;
		if (fillRatio < 0 && fillRatio >= 1) {
			throw new Error("You must provide a fill ratio between 0 and 1");
		}
		const numTiles = gameMap.width * gameMap.height;
		const numDesiredFloorTiles = Math.floor(numTiles * fillRatio);

		let builder = { // Should probably rename this, it's actually level data
			playerStart: vec2.create(),
			spawnPoints: [],
			goal: vec2.create()
		};

		// Arguably we should separate instantiation of render objects
		// from initial generation for performance reasons to allow generators
		// to be multi-pass without creating and removing objects

		// Run repeated drunkards until floor % is reached
		// Remove drunkard's cavern if does not context to the center
		// This creates a more connected caverns structure than spawning new drunkards
		// in the existing navigable area, which creates a large single cavern (still interesting)
		let floorTiles = [], drunkardsTiles = [];
		let x = Math.floor(gameMap.width / 2);
		let y = Math.floor(gameMap.height / 2);

		vec2.set(builder.playerStart, x, y);

		gameMap.fill(TileType.wall);
		performDrunkardsWalk(drunkardsTiles, x, y, gameMap, staggerDist);
		while (gameMap.getTilesOfType(floorTiles, TileType.floor).length < numDesiredFloorTiles) {
			x = Random.integer(1, gameMap.width - 1);
			y = Random.integer(1, gameMap.height - 1);

			performDrunkardsWalk(drunkardsTiles, x, y, gameMap, staggerDist);

			// TODO: An A* pathfind would be quicker
			let isNavigable = false;
			for (let i = 0, l = drunkardsTiles.length; i < l; i++) {
				x = Math.floor(drunkardsTiles[i] % gameMap.width);
				y = Math.floor(drunkardsTiles[i] / gameMap.width);
				if (gameMap.canEnterTile(x, y)
					|| gameMap.canEnterTile(x + 1, y)
					|| gameMap.canEnterTile(x - 1, y)
					|| gameMap.canEnterTile(x, y + 1)
					|| gameMap.canEnterTile(x, y - 1)) {
					isNavigable = true;
				}
			}

			if (!isNavigable) {
				for (let i = 0, l = drunkardsTiles.length; i < l; i++) {
					x = Math.floor(drunkardsTiles[i] % gameMap.width);
					y = Math.floor(drunkardsTiles[i] / gameMap.width);
					gameMap.setTile(x, y, TileType.wall);
				}
			}
		}

		gameMap.playerNav.calculate(builder.playerStart[0], builder.playerStart[1], 1024);
		gameMap.playerNav.findMaxValuePos(builder.goal);

		for (let i = floorTiles.length - 1; i >= 0; i--) {
			let dx = builder.playerStart[0] - Math.floor(floorTiles[i] % gameMap.width);
			let dy = builder.playerStart[1] - Math.floor(floorTiles[i] / gameMap.width);

			if (dx * dx + dy * dy < 10 * 10) {
				floorTiles.splice(i, 1);
			}
		}

		
		let numSpawnPoints = 0;
		while (numSpawnPoints < monsterCount && floorTiles.length > 0) {
			let mapIdx = floorTiles.splice(Random.integer(0, floorTiles.length), 1);
			builder.spawnPoints.push(vec2.fromValues( mapIdx % gameMap.width, Math.floor(mapIdx / gameMap.width) ));
			numSpawnPoints++;
		}

		return builder;
	};

	return exports;
})();