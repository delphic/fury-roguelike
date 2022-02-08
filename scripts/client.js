const Fury = require('../fury/src/fury');
const Primitives = require('./primitives');
const TileMap = require('./tilemap');
const { vec3 } = require('../fury/src/maths');
const furyCanvasId = "fury";

let camera, scene, scaleFactor = 2;
let canvasWidth = 640, canvasHeight = 360;

let cp437 = {
	map: [ undefined, "☺", "☻", "♥", "♦", "♣", "♠", "•", "◘", "○", "◙", "♂", "♀", "♪", "♫", "☼", "►", "◄", "↕", "‼", "¶", "§", "▬", "↨", "↑", "↓", "→", "←", "∟", "↔", "▲", "▼", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "⌂", "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "¢", "£", "¥", "₧", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "⌐", "¬", "½", "¼", "¡", "«", "»", "░", "▒", "▓", "│", "┤", "╡", "╢", "╖", "╕", "╣", "║", "╗", "╝", "╜", "╛", "┐", "└", "┴", "┬", "├", "─", "┼", "╞", "╟", "╚", "╔", "╩", "╦", "╠", "═", "╬", "╧", "╨", "╤", "╥", "╙", "╘", "╒", "╓", "╫", "╪", "┘", "┌", "█", "▄", "▌", "▐", "▀", "α", "ß", "Γ", "π", "Σ", "σ", "µ", "τ", "Φ", "Θ", "Ω", "δ", "∞", "φ", "ε", "∩", "≡", "±", "≥", "≤", "⌠", "⌡", "÷", "≈", "°", "∙", "·", "√", "ⁿ", "²", "■", " " ],
	size: 16,
	tileSize: 8,
	path: "images/terminal8x8.png"
};

let dungeonAtlas = {
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
		let tileMap = TileMap.create(scene, w, h, vec3.fromValues( -(0.5 * w - 0.5) * dungeonAtlas.tileSize, -(0.5 * h - 0.5) * dungeonAtlas.tileSize, -16), dungeonAtlas, "stone_floor");
		
		for (let x = 0; x < w; x++) {
			tileMap.setTile(x, 0, "stone_wall");
			tileMap.setTile(x, h-1, "stone_wall");
		}

		for (let y = 0; y < h; y++) {
			tileMap.setTile(0, y, "stone_wall");
			tileMap.setTile(w-1, y, "stone_wall");
		}
		createText("Hello World!", vec3.fromValues(0, 0.5 * canvasHeight - 8, 0));
		Fury.GameLoop.init({ loop: loop });
		Fury.GameLoop.start();
	});	
});

let createText = (text, position) => {
	let getCp437Index = (char) => {
		let map = cp437.map;
		for (let i = 0, l = map.length; i < l; i++) {
			if (map[i] == char) {
				return i;
			}
		}
		return 0;
	};

	let size = cp437.size, tileSize = cp437.tileSize;
	let sceneObjects = [];
	let quadMesh = Fury.Mesh.create(Primitives.createQuadMeshConfig(tileSize, tileSize));
	for (let i = 0, l = text.length; i < l; i++) {
		let cp437Index = getCp437Index(text[i]);
		let offsetX = (cp437Index % size) / size;
		let offsetY = 1 - (Math.floor(cp437Index / size) + 1) / size;
		
		let material = Object.create(cp437.material);
		material.offset = [offsetX, offsetY];
		
		sceneObjects.push(scene.add({
			mesh: quadMesh,
			material: material,
			position: vec3.fromValues(position[0] + (i - 5) * tileSize, position[1], position[2])
		})); 
	}
	return sceneObjects;
};

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
