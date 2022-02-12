const TileMap = require('./tilemap');
const FlowMap = require('./flowMap');
const RoomsBuilder = require('./mapBuilder/rooms'); 
const TileType = require('./tileType');
const Maths = require('../fury/src/maths');

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { width: w, height: h, position, theme } = config;

		let gameMap = {};
		gameMap.width = w;
		gameMap.height = h;
		gameMap.origin = position;

		let tiles = [];
		tiles.length = w * h;
		let tileMap = TileMap.create(config);

		// Create tilemap for grey tinted seen tiles with small offset 
		let tmpPosition = position;
		config.position = Maths.vec3.clone(tmpPosition);
		config.position[2] -= 1; 
		let grey = Maths.vec4.fromValues(0.5, 0.5, 0.5, 1);
		let seenTileMap = TileMap.create(config);

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

		gameMap.isTileActive = (x, y) => {
			return tileMap.isTileActive(x, y);
		};

		gameMap.setTileActive = (x, y, active) => {
			tileMap.setTileActive(x, y, active);
			if (active) {
				// Permanently see tiles
				seenTileMap.setTileActive(x, y, true);
			}
		};

		gameMap.hasLineOfSight = (x0, y0, x1, y1) => {
			let xDir = Math.sign(x1 - x0);
			let yDir = Math.sign(y1 - y0);

			if (x0 == x1) {
				let y = y0;
				// Just check up or down
				for (let i = 0, l = Math.abs(y1 - y0); i < l; i++) {
					if (!gameMap.canEnterTile(x0, y)) {
						return false;
					}
					y = Math.round(y + yDir);
				}
				return true;
			}

			if (y0 == y1) {
				let x = x0;
				// Just check left or right
				for (let i = 0, l = Math.abs(x1 - x0); i < l; i++) {
					if (!gameMap.canEnterTile(x, y0)) {
						return false;
					}
					x = Math.round(x + xDir);
				}
				return true;
			}

			// Determine line equestion and check each tile along the way
			// Want line from mid point of starting tile to closest corner of target tile
			let sx = x0 + 0.5, sy = y0 + 0.5;
			let tx = xDir < 0 ? x1 + 1 : x1;
			let ty = yDir < 0 ? y1 + 1 : y1;

			let c = (sx * ty - tx * sy) / (sx - tx);
			let m = tx != 0 ? (ty - c) / tx : (sy - c) / sx;

			let x = sx, y = sy;
			let tileX = x0, tileY = y0; // Stores the tile coordinate of the current tile being travelled through
			let horiztonalBlocked = false, verticalBlocked = false;

			while ((tileX != x1 || tileY != y1)) {
				if (!gameMap.canEnterTile(tileX, tileY) || (horiztonalBlocked && verticalBlocked)) {
					return false;
				}

				let nextIntX = tileX + 0.5 + 0.5 * xDir;
				let nextIntY = tileY + 0.5 + 0.5 * yDir;
				let yAtNextIntX = m * nextIntX + c;
				let xAtNextIntY = (nextIntY - c) / m;
				let sqrToNextIntX = (x - nextIntX) * (x - nextIntX) + (y - yAtNextIntX) * (y - yAtNextIntX);
				let sqrToNextIntY = (y - nextIntY) * (y - nextIntY) + (x - xAtNextIntY) * (x - xAtNextIntY);

				if (Maths.approximately(sqrToNextIntX, sqrToNextIntY, 0.0001)) {
					// => Hit corner precisely, check can see one of the sides 
					if (!horiztonalBlocked) {
						horiztonalBlocked = !gameMap.canEnterTile(tileX, tileY + yDir);
					}
					if (!verticalBlocked) {
						verticalBlocked = !gameMap.canEnterTile(tileX + xDir, tileY);
					}
					tileY = Math.round(tileY + yDir);
					tileX = Math.round(tileX + xDir);
					y = nextIntY;
					x = nextIntX;
				} else if (sqrToNextIntY < sqrToNextIntX) {
					// will get to next integer y first
					tileY = Math.round(tileY + yDir);
					y = nextIntY;
					x = xAtNextIntY;
				} else {
					// will get to next integer x first
					tileX = Math.round(tileX + xDir);
					x = nextIntX;
					y = yAtNextIntX;
				}
			}
			let isTileNavigable = gameMap.canEnterTile(tileX, tileY); // Show walls in corners
			return tileX == x1 && tileY == y1 && (!horiztonalBlocked || !verticalBlocked || !isTileNavigable);
		};

		let flowMapConfig = { width: w, height: h, gameMap: gameMap };
		gameMap.createFlowMap = () => {
			return FlowMap.create(flowMapConfig);
		};
		gameMap.playerNav = FlowMap.create(flowMapConfig);

		gameMap.builder = RoomsBuilder.create(gameMap, 20);

		// Fill seen tilemap, but disabled by default
		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				seenTileMap.setTile(x, y, theme[tiles[x + y * w]], grey);
				seenTileMap.setTileActive(x, y, false);
			}
		}

		return gameMap;
	};

	return exports;
})();