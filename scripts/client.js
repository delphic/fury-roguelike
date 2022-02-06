const Fury = require('../fury/src/fury');
const { vec3 } = require('../fury/src/maths');
const furyCanvasId = "fury";

let camera, scene, scaleFactor = 2;

let loop = (elapsed) => {
	scene.render();
};

window.addEventListener('load', () => {
	Fury.init({ canvasId: furyCanvasId, glContextAttributes: { antialias: false } });

	let canvas = document.getElementById(furyCanvasId);
	canvas.width = 640;
	canvas.height = 360;
	canvas.setAttribute(
		"style",
		"width: " + (canvas.width * scaleFactor / window.devicePixelRatio) + "px;"
		+ " height: " + (canvas.height * scaleFactor / window.devicePixelRatio) + "px;");
	
	camera = Fury.Camera.create({
		type: Fury.Camera.Type.Orthonormal,
		near: 0.1,
		far: 100,
		height: canvas.height,
		ratio: canvas.width / canvas.height,
		position: vec3.fromValues(0.0, 0.0, 1.0)
	});
	scene = Fury.Scene.create({ camera: camera });

	loadAssets(() => {
		Fury.GameLoop.init({ loop: loop });
		Fury.GameLoop.start();
	});	
});


let loadAssets = (callback) => {
	// Load images! e.g. terminal 8x8
	callback();
};

let loadImage = (path, callback) => {
	let image = new Image();
	image.onload = () => {
		callback(image);
	};
	image.src = path;
};
