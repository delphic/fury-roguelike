const Atlas = require('./atlas');
const Player = require('./player');
const Fury = require('../fury/src/fury');
const { vec3 } = Fury.Maths;

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { atlas, scene, mapOrigin } = config;
		
		let spawner = {};

		let spawnEntity = (pos, name) => {
			let position = vec3.fromValues(
				pos[0] * atlas.tileSize + mapOrigin[0],
				pos[1] * atlas.tileSize + mapOrigin[1],
				0
			);
			let entity = {
				x: pos[0],
				y: pos[1],
				position: position
			};
			entity.sceneObject = scene.instantiate({
				name: Atlas.createTilePrefab({ atlas: atlas, tile: name, alpha: true }),
				position: position
			});
			return entity;
		}

		spawner.spawnPlayer = (pos, health) => {
			let player = Player.create(spawnEntity(pos, "player"), scene, atlas.tileSize);
			player.health = health;
			player.healthMax = health;
			return player;
		};

		spawner.spawnItem = (pos, name, onPickup) => {
			let entity = spawnEntity(pos, name);
			entity.onPickup = onPickup;
			return entity;
		};

		spawner.spawnMonster = (pos, name, health) => {
			let monster = spawnEntity(pos, name);
			monster.health = health;
			monster.healthMax = health;
			return monster;
		};

		return spawner;
	};

	return exports;
})();