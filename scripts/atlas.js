const Fury = require('../fury/src/fury');
const Primitives = require('./primitives');

module.exports = (function(){
	let exports = {};

	let getAtlasIndex = (atlas, name) => {
		let map = atlas.map;
		for (let i = 0, l = map.length; i < l; i++) {
			if (map[i] == name) {
				return i;
			}
		}
		return 0;
	};

	let getPrefabName = (atlas, atlasIndex, alpha) => {
		let name = atlas.id + "_" + atlasIndex;
		if (alpha !== undefined && alpha != atlas.materialConfig.properties.alpha) {
			name += "_" + (alpha ? "a1" : "a0");
		}
		return name;
	}

	let setMaterialOffset = (config, atlasIndex, size) => {
		let offsetU = (atlasIndex % size) / size;
		let offsetV = 1 - (Math.floor(atlasIndex / size) + 1) / size;
		config.properties.offset = [ offsetU, offsetV ];
	};

	exports.setMaterialOffset = (config, atlas, tile) => {
		let size = atlas.size;
		let atlasIndex = getAtlasIndex(atlas, tile);
		setMaterialOffset(config, atlasIndex, size);
	};

	exports.createTilePrefab = (atlas, tile, alpha) => {
		let size = atlas.size;
		let atlasIndex = getAtlasIndex(atlas, tile);
		let prefabName = getPrefabName(atlas, atlasIndex, alpha);
		
		if (Fury.Prefab.prefabs[prefabName] === undefined) {
			let materialConfig = Object.create(atlas.materialConfig);
			if (alpha !== undefined) {
				materialConfig.properties.alpha = alpha;
			}
			setMaterialOffset(materialConfig, atlasIndex, size);

			Fury.Prefab.create({
				name: prefabName, 
				meshConfig: atlas.meshConfig,
				materialConfig: materialConfig
			});
		}
		return prefabName;
	};

	exports.init = (atlas, image, alpha) => {
		atlas.texture = Fury.Renderer.createTexture(image, "low");
		atlas.materialConfig = {
			shader: Fury.Shaders.Sprite,
			texture: atlas.texture,
			properties: {
				alpha: alpha,
				offset: [ 0, 0 ],
				scale: [ 1 / atlas.size, 1 / atlas.size ]
			}
		};
		atlas.meshConfig = Primitives.createQuadMeshConfig(atlas.tileSize, atlas.tileSize);
	};

	return exports;
})();