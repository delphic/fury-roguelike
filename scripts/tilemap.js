// Really basic tilemap using prefabs per tile

// Could probably be vastly improved by using a custom shader and a lookup texture into the atlas texture 
// (i.e. single quad, single material, easy to move etc)

const Atlas = require('./atlas');
const { vec3 } = require('../fury/src/maths');

// Preludes would be nice... wonder if there's a way to do that in JS :thinking:

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { scene, width: w, height: h, position: pos, atlas, defaultTile } = config;

		let tileMap = {};
		tileMap.width = w;
		tileMap.height =  h;

		let { tileSize } = atlas;
		let position = vec3.clone(pos);
		let tiles = [];

		tileMap.setTile = (x, y, tile) => {
			let index = x + y * w;
			if (index >= 0 && index < tiles.length) {
				let name = Atlas.createTilePrefab(atlas, tile);
				if (tiles[index]) { scene.remove(tiles[index]); }
				tiles[index] = scene.instantiate({
					name: name,
					position: vec3.fromValues(position[0] + x * tileSize, position[1] + y * tileSize, position[2])
				});
			}
		};
		tileMap.fill = (tile) => {
			let name = Atlas.createTilePrefab(atlas, tile);
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					let index = x + w * y;
					if (tiles[index]) { scene.remove(tiles[index]); }
					tiles[x + w * y] = scene.instantiate({
						name: name,
						position: vec3.fromValues(position[0] + x * tileSize, position[1] + y * tileSize, position[2])
					});
				}
			}
		};
		tileMap.remove = () => {
			for (let i = 0, l = tiles.length; i < l; i++) {
				scene.remove(tiles[i]);
			}
		};

		if (defaultTile !== undefined) {
			tileMap.fill(defaultTile);
		} else {
			tiles.length = w * h;
		}

		return tileMap;
	};

	return exports;
})();