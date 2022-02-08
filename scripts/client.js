const Fury = require('../fury/src/fury');
const TextMesh = require('./textmesh');
const GameMap = require('./gameMap');
const { vec3 } = require('../fury/src/maths');
const furyCanvasId = "fury";

let camera, scene, scaleFactor = 2;
let canvasWidth = 640, canvasHeight = 360;

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

let loop = (elapsed) => {
	scene.render();
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
	scene = Fury.Scene.create({ camera: camera });

	loadAssets(() => {
		let w = 20, h = 10;
		let pos = vec3.fromValues( -(0.5 * w) * dungeonAtlas.tileSize, -(0.5 * h) * dungeonAtlas.tileSize, -16);
		let map = GameMap.create({
			scene: scene,
			width: w,
			height: h,
			position: pos,
			atlas: dungeonAtlas,
			floorTile: "stone_floor",
			wallTile: "stone_wall"
		});

		TextMesh.create({ 
			text: "Hello World!",
			scene: scene,
			atlas: cp437,
			position: vec3.fromValues(0, 0.5 * canvasHeight - 2 * cp437.tileSize, 0),
			alignment: TextMesh.Alignment.center 
		});

		Fury.GameLoop.init({ loop: loop });
		Fury.GameLoop.start();
	});	
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
			atlas.texture = Fury.Renderer.createTexture(image, "low");
			atlas.material = Fury.Material.create({
				shader: Fury.Shaders.Sprite,
				texture: atlas.texture,
				properties: {
					alpha: alpha,
					offset: [ 0, 0 ],
					scale: [ 1 / atlas.size, 1 / atlas.size ]
				}
			});
			onAssetLoadComplete();
		});
	};

	loadAtlas(cp437, true);
	loadAtlas(dungeonAtlas);
	// TODO: Add color uniform to sprite shader, and mix with texture - default to [1,1,1,1] if not provided
};

let loadImage = (path, callback) => {
	let image = new Image();
	image.onload = () => {
		callback(image);
	};
	image.src = path;
};
