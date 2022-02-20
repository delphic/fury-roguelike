const TileMap = require('./tilemap');
const FlowMap = require('./flowMap');
const BuilderType = require('./mapBuilder/buildertype');
const AutomataBuilder = require('./mapBuilder/automata');
const DrunkardBuilder = require('./mapBuilder/drunkard');
const RoomsBuilder = require('./mapBuilder/rooms'); 
const TileType = require('./tileType');
const Maths = require('../fury/src/maths');

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { width: w, height: h, position, theme, spawnExit, builderType } = config;

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

		gameMap.cleanUp = () => {
			tileMap.remove();
			seenTileMap.remove();
		};

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

		gameMap.getPointIndex = (x, y) => {
			return x + w * y;
		};

		gameMap.getTilesOfType = (out, tileType) => {
			out.length = 0;
			for (let i = 0, l = tiles.length; i < l; i++) {
				if (tiles[i] === tileType) {
					out.push(i); 
				}
			}
			return out;
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
				case TileType.exit:
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

		gameMap.revealMap = () => {
			for (let x = 0; x < w; x++) {
				for (let y = 0; y < h; y++) {
					seenTileMap.setTileActive(x, y, true);
				}
			}
		};

		let tileVisiblity = [];
		gameMap.buildVisibilitySet = (x, y, dist, out) => {
			out.length = tileVisiblity.length = 0;
			
			// As we check if any portion of the tile is visible
			// rather than the mid points, can not reuse lines from
			// origin to outer most tiles to determine visibility
			// So go to every tile, but check against existing set
			
			// If we change los to mid point, can reduce calls necessary

			// TODO: Should probably check to see if just checking
			// every tile with no out parameter is actually quicker.
			for (let l = dist; l >= 0; l--) {
				for (let i = 1; i <= l; i++) {
					let tx = x + i;
					let ty = y + l - i;
					if (!tileVisiblity[tx + w * ty]) {
						gameMap.hasLineOfSight(x, y, tx, ty, tileVisiblity);
					}
					tx = x + l - i;
					ty = y - i;
					if (!tileVisiblity[tx + w * ty]) {
						gameMap.hasLineOfSight(x, y, tx, ty, tileVisiblity);
					}
					tx = x - i;
					ty = y - l + i;
					if (!tileVisiblity[tx + w * ty]) {
						gameMap.hasLineOfSight(x, y, tx, ty, tileVisiblity);
					}
					tx = x - l + i;
					ty = y + i;
					if (!tileVisiblity[tx + w * ty]) {
						gameMap.hasLineOfSight(x, y, tx, ty, tileVisiblity);
					}
				}
			}

			for (let i = 0, l = tileVisiblity.length; i < l; i++) {
				if (tileVisiblity[i]) {
					out.push(i);
				}
			}
		};

		gameMap.hasLineOfSight = (x0, y0, x1, y1, out) => {
			// out stores tiles by index that were seen along the way
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
				if (out) { out[x1 + y1 * w] = true; }
				return true;
			}

			if (y0 == y1) {
				let x = x0;
				// Just check left or right
				for (let i = 0, l = Math.abs(x1 - x0); i < l; i++) {
					if (out) { out[x + y0 * w] = true; }
					if (!gameMap.canEnterTile(x, y0)) {
						return false;
					}
					x = Math.round(x + xDir);
				}
				if (out) { out[x1 + y1 * w] = true; }
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

			while (tileX != x1 || tileY != y1) {
				if (out && !(horiztonalBlocked && verticalBlocked)) { out[tileX + tileY * w] = true; }
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
						if (out) { out[tileX + xDir + tileY * w] = true; }
						horiztonalBlocked = !gameMap.canEnterTile(tileX + xDir, tileY);
					}
					if (!verticalBlocked) {
						if (out) { out[tileX + (tileY + yDir) * w] = true; }
						verticalBlocked = !gameMap.canEnterTile(tileX, tileY + yDir);
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
			if (tileX == x1 && tileY == y1 && (!horiztonalBlocked || !verticalBlocked || !isTileNavigable)) {
				if (out) { out[tileX + tileY * w] = true; }
				return true;
			}
			return false;
		};

		let flowMapConfig = { width: w, height: h, gameMap: gameMap };
		gameMap.createFlowMap = () => {
			return FlowMap.create(flowMapConfig);
		};
		gameMap.playerNav = FlowMap.create(flowMapConfig);

		let monsterCount = Math.round(w + h / 2);

		switch(builderType) {
			case BuilderType.drunkardsWalk:
				gameMap.builder = DrunkardBuilder.create({
					gameMap: gameMap,
					fillRatio: 0.33,
					staggerDist: 400,
					monsterCount: monsterCount 
				});
				break;
			default:
			case BuilderType.rooms:
				gameMap.builder = RoomsBuilder.create(gameMap, monsterCount);
				break;
			case BuilderType.cellularAutomata:
				gameMap.builder = AutomataBuilder.create({ gameMap: gameMap, monsterCount: monsterCount });
		}

		if (spawnExit) {
			let goal = gameMap.builder.goal;
			gameMap.setTile(goal[0], goal[1], TileType.exit);
		}

		// Fill seen tilemap, and disable activeTiles and seenTiles
		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				seenTileMap.setTile(x, y, theme[tiles[x + y * w]], grey);
				tileMap.setTileActive(x, y, false);
				seenTileMap.setTileActive(x, y, false);
			}
		}

		return gameMap;
	};

	return exports;
})();