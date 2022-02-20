const TextMesh = require('./textmesh');
const Fury = require('../fury/src/fury');
const { vec3, vec4 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { canvas: canvas, uiAtlas: uiAtlas, uiScene: uiScene, world: world } = config;

		let hud = {
			inventory: []
		};

		let red = vec4.fromValues(1, 0, 0, 1);
		let currentlyDisplayedWeapon = null;

		hud.updateLevelDisplay = (depth) => {
			if (hud.levelDisplay) {
				hud.levelDisplay.remove();
			}
			hud.levelDisplay = TextMesh.create({
				text: "Level: " + (depth + 1),
				scene: uiScene,
				atlas: uiAtlas,
				position: vec3.fromValues(canvas.width - uiAtlas.tileSize, canvas.height - 2 * uiAtlas.tileSize, 0),
				alignment: TextMesh.Alignment.right
			});
		};

		hud.updateHealthBar = (player) => {
			if (!hud.healthBarLabel) {
				hud.healthBarLabel = TextMesh.create({
					text: "Health:",
					scene: uiScene,
					atlas: uiAtlas,
					position: vec3.fromValues(uiAtlas.tileSize, canvas.height - 2 * uiAtlas.tileSize, 0),
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
				position: vec3.fromValues(uiAtlas.tileSize * 8, canvas.height - 2 * uiAtlas.tileSize, 0),
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
							position: vec3.fromValues(uiAtlas.tileSize, canvas.height - (4 + i) * uiAtlas.tileSize, 0)
						})
					);
				}
			}
		};

		hud.updateWeaponDisplay = (player) => {
			if (player.weapon && player.weapon.name != currentlyDisplayedWeapon) {
				if (hud.weaponDisplay) {
					hud.weaponDisplay.remove();
				}
				hud.weaponDisplay = TextMesh.create({
					text: player.weapon.name +  " (" + player.weapon.damage + ")",
					scene: uiScene,
					atlas: uiAtlas,
					position: vec3.fromValues(canvas.width - uiAtlas.tileSize, canvas.height - 3 * uiAtlas.tileSize, 0),
					alignment: TextMesh.Alignment.right
				});
				currentlyDisplayedWeapon = player.weapon.name;
			} else if (!player.weapon && hud.weaponDisplay) {
				hud.weaponDisplay.remove();
				hud.weaponDisplay = null;
				currentlyDisplayedWeapon = null;
			}
		};

		hud.updateHealthBar(world.player);

		return hud;
	};

	return exports;
})();