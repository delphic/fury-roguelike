const TileMap = require('./tilemap');

module.exports = (function(){
	let exports = {};

	let TileType = exports.TileType = {
		"floor": 0,
		"wall": 1
	};

	exports.create = (config) => {
		let gameMap = {};

		let { floorTile, wallTile, width: w, height: h } = config;

		let tiles = [];
		tiles.length = w * h;
		let tileMap = TileMap.create(config);

		gameMap.setTile = (x, y, tileType) => {
			switch (tileType) {
				case TileType.floor:
					tileMap.setTile(x, y, floorTile);
					tiles[x + y * w] = tileType;
					break;
				case TileType.wall:
					tileMap.setTile(x, y, wallTile);
					tiles[x + y * w] = tileType;
					break;
				default:
					console.error("Unexpected tiletype " + tileType);
					break;
			}
		};

		gameMap.canEnterTile = (x, y) => {
			if (x < 0 || x >= w || y < 0 || y >= h) {
				return false;
			}
			switch(tiles[x + y * w]) {
				case TileType.floor:
					return true;
				default: 
					return false;
			}
		};

		// Default Map Builder
		tiles.fill(TileType.floor)
		tileMap.fill(floorTile);

		for (let x = 0; x < w; x++) {
			gameMap.setTile(x, 0, TileType.wall);
			gameMap.setTile(x, h-1, TileType.wall);
		}

		for (let y = 0; y < h; y++) {
			gameMap.setTile(0, y, TileType.wall);
			gameMap.setTile(w-1, y, TileType.wall);
		}

		return gameMap;
	};

	return exports;
})();