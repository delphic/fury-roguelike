const Fury = require('../fury/src/fury');

module.exports = (function(){
	let exports = {};

	exports.createQuadMeshConfig = (w, h) => {
		return {
			vertices: [ 
				w, h, 0.0,
				0, h, 0.0, 
				w, 0, 0.0,
				0, 0, 0.0 ],
			textureCoordinates: [
				1.0, 1.0,
				0.0, 1.0,
				1.0, 0.0,
				0.0, 0.0 ],
			renderMode: Fury.Renderer.RenderMode.TriangleStrip
		};
	};

	return exports;
})();