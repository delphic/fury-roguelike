const Game = require('./game');
const Atlas = require('./atlas');
const Fury = require('../fury/src/fury');
const furyCanvasId = "fury";

let scaleFactor = 2;
let canvasWidth = 640, canvasHeight = 360;
let canvas;

let cp437Atlas = {
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

	canvas = document.getElementById(furyCanvasId);
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	canvas.setAttribute(
		"style",
		"width: " + (canvas.width * scaleFactor / window.devicePixelRatio) + "px;"
		+ " height: " + (canvas.height * scaleFactor / window.devicePixelRatio) + "px;");
	
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

	loadAtlas(cp437Atlas, true); // TODO: Add color uniform to sprite shader, and mix with texture - default to [1,1,1,1] if not provided - for coloured text
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
	Game.init({
		canvas: canvas,
		uiAtlas: cp437Atlas,
		dungeonAtlas: dungeonAtlas
	});
	Fury.GameLoop.init({ loop: Game.update });
	Fury.GameLoop.start();
};