const Fury = require('../fury/src/fury');
const { TextMesh } = Fury;
const { vec3, vec4 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { canvas: canvas, uiAtlas: uiAtlas, uiScene: uiScene, world: world } = config;

		let hud = {
			inventory: []
		};

		let red = vec4.fromValues(1, 0, 0, 1);

		hud.updateLevelDisplay = (depth) => {
			if (hud.levelDisplay) {
				hud.levelDisplay.remove();
			}
			hud.levelDisplay = TextMesh.create({
				text: "Level: " + (depth + 1),
				scene: uiScene,
				atlas: uiAtlas,
				position: vec3.fromValues(canvas.width - uiAtlas.tileWidth, canvas.height - 2 * uiAtlas.tileHeight, 0),
				alignment: TextMesh.Alignment.right
			});
		};

		hud.updateHealthBar = (player) => {
			if (!hud.healthBarLabel) {
				hud.healthBarLabel = TextMesh.create({
					text: "Health:",
					scene: uiScene,
					atlas: uiAtlas,
					position: vec3.fromValues(uiAtlas.tileWidth, canvas.height - 2 * uiAtlas.tileHeight, 0),
					alignment: TextMesh.Alignment.left
				});
			}
			if (hud.healthBar) {
				hud.healthBar.remove();
			}

			let healthString = "";
			for (let i = 0; i < player.health; i++) {
				healthString += " ♥";
			}
			hud.healthBar = TextMesh.create({
				text: healthString,
				scene: uiScene,
				atlas: uiAtlas,
				position: vec3.fromValues(uiAtlas.tileWidth * 8, canvas.height - 2 * uiAtlas.tileHeight, 0),
				alignment: TextMesh.Alignment.left,
				color: red
			});
		};

		hud.updateInventoryDisplay = (player) => {
			if (hud.inventory.length != player.inventory.length) {
				if (hud.inventory.length) {
					for (let i = 0, l = hud.inventory.length; i < l; i++) {
						hud.inventory[i].remove();
					}
					hud.inventory.length = 0;
				}
				for (let i = 0, l = player.inventory.length; i < l; i++) {
					hud.inventory.push(
						TextMesh.create({
							text: (i + 1) + ". " + player.inventory[i].name,
							scene: uiScene,
							atlas: uiAtlas,
							position: vec3.fromValues(uiAtlas.tileWidth, canvas.height - (4 + i) * uiAtlas.tileHeight, 0)
						})
					);
				}
			}
		};

		hud.updateWeaponDisplay = (player) => {
			if (player.weapon && (!hud.weaponDisplay || hud.weaponDisplay.text != player.weapon.name)) {
				if (hud.weaponDisplay) {
					hud.weaponDisplay.remove();
				}
				hud.weaponDisplay = TextMesh.create({
					text: player.weapon.name +  " (" + player.weapon.damage + ")",
					scene: uiScene,
					atlas: uiAtlas,
					position: vec3.fromValues(canvas.width - uiAtlas.tileWidth, canvas.height - 3 * uiAtlas.tileHeight, 0),
					alignment: TextMesh.Alignment.right
				});
			} else if (!player.weapon && hud.weaponDisplay) {
				hud.weaponDisplay.remove();
				hud.weaponDisplay = null;
			}
		};

		hud.refresh = (player, depth) => {
			hud.updateHealthBar(player);
			hud.updateLevelDisplay(depth);
			hud.updateInventoryDisplay(player);
			hud.updateWeaponDisplay(player);
		};

		hud.clear = () => {
			if (hud.levelDisplay) { 
				hud.levelDisplay.remove();
				hud.levelDisplay = null;
			}
			if (hud.healthBarLabel) { 
				hud.healthBarLabel.remove();
				hud.healthBarLabel = null;
			}
			if (hud.healthBar) {
				hud.healthBar.remove();
				hud.healthBar = null;
			}
			if (hud.inventory.length) {
				for (let i = 0, l = hud.inventory.length; i < l; i++) {
					hud.inventory[i].remove();
				}
				hud.inventory.length = 0;
			}
			if (hud.weaponDisplay) {
				hud.weaponDisplay.remove();
				hud.weaponDisplay = null;
			}
		};

		hud.updateHealthBar(world.player);

		return hud;
	};

	return exports;
})();