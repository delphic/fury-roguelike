const TileMap = require('./tilemap');
const RoomsBuilder = require('./mapBuilder/rooms'); 
const TileType = require('./tileType');
const { floor } = require('./tileType');

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { floorTile, wallTile, width: w, height: h } = config;

		let gameMap = {};
		gameMap.width = w;
		gameMap.height = h;

		let tiles = [];
		tiles.length = w * h;
		let tileMap = TileMap.create(config);

		let theme = {}; // TODO: Just pass this in config
		theme[TileType.floor] = floorTile;
		theme[TileType.wall] = wallTile;

		gameMap.setTile = (x, y, tileType) => {
			if (x < 0 || x >= w || y < 0 || y >= h) {
				console.error("Set tile request outside bounds (" + x + "," + y + ")");
			} else if (theme[tileType]) {
				tileMap.setTile(x, y, theme[tileType]);
				tiles[x + y * w] = tileType;
			} else {
				console.error("Unexpected tiletype " + tileType);
			}
		};

		gameMap.fill = (tileType) => {
			if (theme[tileType]) {
				tiles.fill(tileType);
				tileMap.fill(theme[tileType]);
			} else {
				console.error("Unexpected tile " + tileType);
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

		gameMap.builder = RoomsBuilder.create(gameMap, 10);

		return gameMap;
	};

	return exports;
})();