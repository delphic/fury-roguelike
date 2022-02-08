// Really basic tilemap using prefabs per tile

// Could probably be vastly improved by using a custom shader and a lookup texture into the atlas texture 
// (i.e. single quad, single material, easy to move etc)

const Fury = require('../fury/src/fury');
const { vec3 } = require('../fury/src/maths');
const Primitives = require('./primitives');

// Preludes would be nice... wonder if there's a way to do that in JS :thinking:

module.exports = (function(){
	let exports = {};

	let tileMapCount = 0;

	let getAtlasIndex = (atlas, name) => {
		let map = atlas.map;
		for (let i = 0, l = map.length; i < l; i++) {
			if (map[i] == name) {
				return i;
			}
		}
		return 0;
	};

	exports.create = (scene, w, h, pos, atlas, defaultTile) => {
		let quadMeshConfig = Primitives.createQuadMeshConfig(atlas.tileSize, atlas.tileSize);
		let materialBaseConfig = {
			shader: Fury.Shaders.Sprite,
			texture: atlas.texture,
			properties: {
				alpha: atlas.material.alpha,
				offset: [ 0, 0 ],
				scale: [ 1 / atlas.size, 1 / atlas.size ]
			}
		};

		let size = atlas.size, tileSize = atlas.tileSize;
		let position = vec3.clone(pos);

		let id = tileMapCount++;

		let tiles = [];
		let prefabs = {};

		let tileMap = {};

		let getPrefabName = (atlasIndex) => {
			return "_tm_" + id + "_" + atlasIndex;
		}

		let createTilePrefab = (tile) => {
			let index = getAtlasIndex(atlas, tile); 
			let prefabName = getPrefabName(index);
			
			if (prefabs[prefabName] === undefined) {
				let offsetU = (index % size) / size;
				let offsetV = 1 - (Math.floor(index / size) + 1) / size;
	
				let materialConfig = Object.create(materialBaseConfig);
				materialConfig.properties.offset = [ offsetU, offsetV ];
	
				Fury.Prefab.create({
					name: prefabName, 
					meshConfig: quadMeshConfig,
					materialConfig: materialConfig
				});

				prefabs[prefabName] = tile;
			}
			return prefabName;
		};

		tileMap.setTile = (x, y, tile) => {
			let tileIndex = x + y * w;
			if (tileIndex >= 0 && tileIndex < tiles.length) {
				let name = createTilePrefab(tile);
				scene.remove(tiles[tileIndex]);
				tiles[tileIndex] = scene.instantiate({
					name: name,
					position: vec3.fromValues(position[0] + x * tileSize, position[1] + y * tileSize, position[2])
				});
			}
		};
		tileMap.fill = (tile) => {
			let name = createTilePrefab(tile);
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

		tileMap.fill(defaultTile);

		return tileMap;
	};

	return exports;
})();