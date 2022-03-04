const Game = require('./game');
const Fury = require('../fury/src/fury');
const furyCanvasId = "fury";

let scaleFactor = 1;
let allElementsHeight = 0;
let atlases = {};
let canvasWidth = 640, canvasHeight = 360;
let canvas;
let config;

window.addEventListener('load', () => {
	Fury.init({ canvasId: furyCanvasId, glContextAttributes: { antialias: false } });
	Fury.TextMesh.alignmentStyle = Fury.TextMesh.AlignmentStyle.grid;

	canvas = document.getElementById(furyCanvasId);

	canvas.height = 0;
	allElementsHeight = document.getElementsByTagName("html")[0].offsetHeight;
	// ^^ body.clientHeight does not include top padding, and html element clientHeight is huge for no decernable reason

	// Set canvas to target resolution
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;


	resizeCanvas();

	window.addEventListener('resize', resizeCanvas);
	
	fetch("config/game.json").then(response => response.json()).then((json) => {
		config = json;
		loadAssets(start);
	});
});

let resizeCanvas = () => {
	scaleFactor = 1;

	let isFullscreen = screen.height == window.innerHeight; // Could also use window.outerHeight
	let heightOffset = isFullscreen ? 0 : allElementsHeight;

	while (canvas.width * (scaleFactor + 1) / window.devicePixelRatio <= window.innerWidth
		&& canvas.height * (scaleFactor + 1) / window.devicePixelRatio <= window.innerHeight - heightOffset) {
		scaleFactor += 1;
	}

	if (canvas.width * scaleFactor / window.devicePixelRatio == window.innerWidth 
		|| canvas.height * scaleFactor / window.devicePixelRatio == window.innerHeight 
		|| isFullscreen) {
		document.body.classList.add("fullScreen");
	} else {
		document.body.classList.remove("fullScreen");
	}

	canvas.setAttribute(
		"style",
		"width: " + (canvas.width * scaleFactor / window.devicePixelRatio) + "px;"
		+ " height: " + (canvas.height * scaleFactor / window.devicePixelRatio) + "px;");
};

let loadAssets = (callback) => {
	let assetsLoading = 0;
	let onAssetLoadComplete = () => {
		assetsLoading--;
		if (assetsLoading <= 0) {
			callback();
		}
	};

	for(let key in config.atlases) {
		assetsLoading++
		Fury.Atlas.load(config.atlases[key], (atlas) => {
			atlases[key] = atlas;
			onAssetLoadComplete();
		});
	}
};

let start = () => {
	Game.init({
		canvas: canvas,
		uiAtlas: atlases["cp437"],
		dungeonAtlas: atlases["dungeon"],
		gameConfig: config
	});
	Fury.GameLoop.init({ loop: Game.update });
	Fury.GameLoop.start();
};