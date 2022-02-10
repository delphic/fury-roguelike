const Atlas = require('./atlas');
const Fury = require('../fury/src/fury');
const TextMesh = require('./textmesh');
const Spawner = require('./spawner');
const GameMap = require('./gameMap');
const { vec3 } = require('../fury/src/maths');
const furyCanvasId = "fury";

let camera, scene, scaleFactor = 2;
let uiCamera, uiScene;
let canvasWidth = 640, canvasHeight = 360;
let player, map, monsters = [];

let cp437 = {
	id: "cp437",
	map: [ undefined, "☺", "☻", "♥", "♦", "♣", "♠", "•", "◘", "○", "◙", "♂", "♀", "♪", "♫", "☼", "►", "◄", "↕", "‼", "¶", "§", "▬", "↨", "↑", "↓", "→", "←", "∟", "↔", "▲", "▼", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "⌂", "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "¢", "£", "¥", "₧", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "⌐", "¬", "½", "¼", "¡", "«", "»", "░", "▒", "▓", "│", "┤", "╡", "╢", "╖", "╕", "╣", "║", "╗", "╝", "╜", "╛", "┐", "└", "┴", "┬", "├", "─", "┼", "╞", "╟", "╚", "╔", "╩", "╦", "╠", "═", "╬", "╧", "╨", "╤", "╥", "╙", "╘", "╒", "╓", "╫", "╪", "┘", "┌", "█", "▄", "▌", "▐", "▀", "α", "ß", "Γ", "π", "Σ", "σ", "µ", "τ", "Φ", "Θ", "Ω", "δ", "∞", "φ", "ε", "∩", "≡", "±", "≥", "≤", "⌠", "⌡", "÷", "≈", "°", "∙", "·", "√", "ⁿ", "²", "■", " " ],
	size: 16,
	tileSize: 8,
	path: "images/terminal8x8.png"
};

let dungeonAtlas = {
	id: "dungeon-atlas",
	map: [ "dirt", "tree", "stone_floor", "stairs_down", "stone_wall", "goblin", "goblin_boss", "short_sword", "player", "claws", "teeth", "long_sword", "red_potion", "map", "amulet", "broad_sword" ],
	size: 4,
	tileSize: 32,
	path: "images/dungeon-atlas.png"
};

window.addEventListener('load', () => {
	Fury.init({ canvasId: furyCanvasId, glContextAttributes: { antialias: false } });

	let canvas = document.getElementById(furyCanvasId);
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
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
	uiCamera = Fury.Camera.create({
		type: Fury.Camera.Type.Orthonormal,
		near: 0.1,
		far: 100,
		height: canvas.height,
		ratio: canvas.width / canvas.height,
		position: vec3.fromValues(0.5 * canvasWidth, -0.5 * canvasHeight, 1.0),
		clear: false
	});
	scene = Fury.Scene.create({ camera: camera });
	uiScene = Fury.Scene.create({ camera: uiCamera });

	loadAssets(start);	
});

let loadAssets = (callback) => {
	let assetsLoading = 0;
	let onAssetLoadComplete = () => {
		assetsLoading--;
		if (assetsLoading <= 0) {
			callback();
		}
	};

	let loadAtlas = (atlas, alpha) => {
		assetsLoading++;
		loadImage(atlas.path, (image) => {
			Atlas.init(atlas, image, alpha);
			onAssetLoadComplete();
		});
	};

	loadAtlas(cp437, true); // TODO: Add color uniform to sprite shader, and mix with texture - default to [1,1,1,1] if not provided - for coloured text
	loadAtlas(dungeonAtlas, false);
};

let loadImage = (path, callback) => {
	let image = new Image();
	image.onload = () => {
		callback(image);
	};
	image.src = path;
};

let start = () => {
	let w = 40, h = 20;
	let pos = vec3.fromValues(
		-Math.floor(0.5 * w) * dungeonAtlas.tileSize,
		-Math.floor(0.5 * h) * dungeonAtlas.tileSize,
		-16);
	map = GameMap.create({
		scene: scene,
		width: w,
		height: h,
		position: pos,
		atlas: dungeonAtlas,
		theme: {
			0: "stone_floor",
			1: "stone_wall"
		}
	});

	let spawner = Spawner.create({ atlas: dungeonAtlas, scene: scene, mapOrigin: pos });

	player = spawner.spawnPlayer(map.builder.playerStart);
	for (let i = 0, l = map.builder.spawnPoints.length; i < l; i++) {
		monsters.push(spawner.spawnMonster(map.builder.spawnPoints[i], "goblin"));
	}
	spawner.spawnItem(map.builder.goal, "amulet");

	TextMesh.create({ 
		text: "Fury Roguelike",
		scene: uiScene,
		atlas: cp437,
		position: vec3.fromValues(0.5 * canvasWidth, -2 * cp437.tileSize, 0),
		alignment: TextMesh.Alignment.center
	});

	Fury.GameLoop.init({ loop: loop });
	Fury.GameLoop.start();
};

let loop = (elapsed) => {

	player.update(elapsed, map, monsters);
	
	camera.position[0] = player.position[0];
	camera.position[1] = player.position[1];

	scene.render();
	uiScene.render();
};