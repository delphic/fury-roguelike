// Quick and dirty monospace textmesh using tilemap
const TileMap = require('./tilemap');
const { vec3 } = require('../fury/src/maths');

module.exports = (function(){
	let exports = {};

	exports.create = (text, scene, atlas, position) => {
		let textMesh = {}; 

		// Center Alignment
		let offset = Math.floor(text.length / 2) * atlas.tileSize;
		let pos = vec3.fromValues(position[0] - offset, position[1], position[2]);

		let tileMap = TileMap.create(scene, text.length, 1, pos, atlas);
	
		for (let i = 0, l = text.length; i < l; i++) {
			tileMap.setTile(i, 0, text[i]);
		}

		textMesh.remove = tileMap.remove;

		return textMesh;
	};

	return exports;
})();