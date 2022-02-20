const Bounds = require('../../fury/src/bounds');
const { Random } = require('../../fury/src/fury');
const { vec2 } = require('../../fury/src/maths');
const TileType = require('../tileType');

module.exports =  (function(){
	let exports = {};

	exports.create = (gameMap, numRooms) => {
		let builder = {
			rooms: [],
			playerStart: vec2.create(),
			spawnPoints: [],
			goal: vec2.create()
		};

		gameMap.fill(TileType.wall);

		// Add Rooms
		let rooms = builder.rooms;
		let maxRoomSize = 10;
		let failCount = 0;
		while (builder.rooms.length < numRooms && failCount < 100) {
			// Some 2D Bounds / Rect functions would be nice
			// Also Fury.Random should be a thing
			let min = [ 
				Random.integer(1, gameMap.width - maxRoomSize - 1),
				Random.integer(1, gameMap.height - maxRoomSize - 1),
				0
			];
			let max = [
				min[0] + Random.integer(2, maxRoomSize),
				min[1] + Random.integer(2, maxRoomSize),
				1
			];
			let room = Bounds.create({ min: min, max: max });

			let overlaps = false;
			for (let i = 0, l = rooms.length; i < l; i++) {
				if (Bounds.intersect(room, rooms[i])) {
					overlaps = true;
					break;
				}
			}

			if (!overlaps) {
				failCount = 0;
				for (let x = room.min[0], xMax = room.max[0]; x < xMax; x++) {
					for (let y = room.min[1], yMax = room.max[1]; y < yMax; y++) {
						gameMap.setTile(x, y, TileType.floor);
					}
				}
				rooms.push(room);
			} else {
				failCount++;
			}
		}

		rooms.sort((a, b) => a.center[0] - b.center[0]);

		let applyVerticalTunnel = (y1, y2, x) => {
			for (let y = Math.min(y1, y2), yMax = Math.max(y1, y2); y <= yMax; y++) {
				gameMap.setTile(x, y, TileType.floor);
			}
		};

		let applyHorizontalTunnel = (x1, x2, y) => {
			for (let x = Math.min(x1, x2), xMax = Math.max(x1, x2); x <= xMax; x++) {
				gameMap.setTile(x, y, TileType.floor);
			}
		}

		// Add Corridors
		let prev = vec2.create(), next = vec2.create();
		for (let i = 1, l = rooms.length; i < l; i++) {
			vec2.floor(prev, rooms[i-1].center);
			vec2.floor(next, rooms[i].center);

			if (Random.value() < 0.5) {
				applyHorizontalTunnel(prev[0], next[0], prev[1]);
				applyVerticalTunnel(prev[1], next[1], next[0]);
			} else {
				applyVerticalTunnel(prev[1], next[1], prev[0]);
				applyHorizontalTunnel(prev[0], next[0], next[1]);
			}
		}

		// Add Spawn Points
		vec2.floor(builder.playerStart, rooms[0].center);

		for (let i = 1, l = rooms.length; i < l; i++) {
			let pos = vec2.create();
			vec2.floor(pos, rooms[i].center);
			builder.spawnPoints.push(pos);
		}

		gameMap.playerNav.calculate(builder.playerStart[0], builder.playerStart[1], 1024);
		gameMap.playerNav.findMaxValuePos(builder.goal);

		return builder;
	};

	return exports;
})();