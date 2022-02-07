const Fury = require('../fury/src/fury');
const { vec3 } = require('../fury/src/maths');
const furyCanvasId = "fury";

let camera, scene, scaleFactor = 2;

let createQuadMeshData = (w, h) => {
	return {
		vertices: [ 
			w * 0.5, h * 0.5, 0.0,
			h * -0.5, w * 0.5, 0.0, 
			w * 0.5, h * -0.5, 0.0,
			h * -0.5, w * -0.5, 0.0 ],
		textureCoordinates: [
			1.0, 1.0,
			0.0, 1.0,
			1.0, 0.0,
			0.0, 0.0 ],
		renderMode: Fury.Renderer.RenderMode.TriangleStrip
		// Is it fine what there's no indices?
	};
};

let cp437 = {
	map: [ undefined, "☺", "☻", "♥", "♦", "♣", "♠", "•", "◘", "○", "◙", "♂", "♀", "♪", "♫", "☼", "►", "◄", "↕", "‼", "¶", "§", "▬", "↨", "↑", "↓", "→", "←", "∟", "↔", "▲", "▼", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "⌂", "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "¢", "£", "¥", "₧", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "⌐", "¬", "½", "¼", "¡", "«", "»", "░", "▒", "▓", "│", "┤", "╡", "╢", "╖", "╕", "╣", "║", "╗", "╝", "╜", "╛", "┐", "└", "┴", "┬", "├", "─", "┼", "╞", "╟", "╚", "╔", "╩", "╦", "╠", "═", "╬", "╧", "╨", "╤", "╥", "╙", "╘", "╒", "╓", "╫", "╪", "┘", "┌", "█", "▄", "▌", "▐", "▀", "α", "ß", "Γ", "π", "Σ", "σ", "µ", "τ", "Φ", "Θ", "Ω", "δ", "∞", "φ", "ε", "∩", "≡", "±", "≥", "≤", "⌠", "⌡", "÷", "≈", "°", "∙", "·", "√", "ⁿ", "²", "■", " " ],
	size: 16,
	path: "images/terminal8x8.png",
}

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
		createText("Hello World!", vec3.create());
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

	let sceneObjects = [];
	let quadMesh = Fury.Mesh.create(createQuadMeshData(8, 8));
	for (let i = 0, l = text.length; i < l; i++) {
		let cp437Index = getCp437Index(text[i]);
		let offsetX = (cp437Index % 16) / 16;
		let offsetY = 1 - (Math.floor(cp437Index / 16) + 1) / 16;
		
		let material = Object.create(cp437.material);
		material.offset = [offsetX, offsetY];
		material.scale = [1/16, 1/16];
		
		sceneObjects.push(scene.add({
			mesh: quadMesh,
			material: material,
			position: vec3.fromValues(position[0] + (i - 5) * 8, position[1], position[2])
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

	assetsLoading++;
	loadImage(cp437.path, (image) => {
		cp437.texture = Fury.Renderer.createTexture(image, "low");
		cp437.material = Fury.Material.create({ shader: Fury.Shaders.Sprite, texture: cp437.texture, properties: { offset: [0, 0], scale: [1, 1] } });
		onAssetLoadComplete();
	});
};

let loadImage = (path, callback) => {
	let image = new Image();
	image.onload = () => {
		callback(image);
	};
	image.src = path;
};
