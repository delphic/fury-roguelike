module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { width, height, gameMap } = config;

		let flowMap = {};
		flowMap.navigableTiles =  [];
		flowMap.values = [];

		let queue = [];
		let queueDistances = [];
		let consideredTiles = [];

		let clear = () => {
			queue.length = queueDistances.length = consideredTiles.length = flowMap.navigableTiles.length = 0;
		};

		queue.tryAdd = (x, y, distance) => {
			let index = x + width * y;
			if (x >= 0 && x < width && y >= 0 && y < height && !consideredTiles[index] && gameMap.canEnterTile(x, y)) {
				queue.push(index);
				queueDistances.push(distance);
				consideredTiles[index] = true;
			}
		};

		flowMap.getValue = (x, y, fallback) => {
			if (x >= 0 && y >= 0 && x < width && y < height) {
				return flowMap.values[x + width * y];
			}
			return fallback;
		};

		flowMap.calculate = (x, y, limit) => {
			clear();
			let i = 0, distance = 0;
			queue.tryAdd(x, y, 0);
			while (i < queue.length && distance < limit) {
				distance = queueDistances[i];
				x = Math.floor(queue[i] % width);
				y = Math.floor(queue[i] / width);
				flowMap.navigableTiles[queue[i]] = true;
				flowMap.values[queue[i]] = distance;
				queue.tryAdd(x - 1, y, distance + 1);
				queue.tryAdd(x, y + 1, distance + 1);
				queue.tryAdd(x + 1, y, distance + 1);
				queue.tryAdd(x, y - 1, distance + 1);
				i++;
			}
			return flowMap;
		};

		flowMap.getNavigableTileIndexSet = (out) => {
			out.length = 0;
			for (let i = 0, l = flowMap.navigableTiles.length; i < l; i++) {
				if (flowMap.navigableTiles[i] !== undefined) {
					out.push(i);
				}
			}
		};

		flowMap.findMaxValuePos = (out) => {
			let resultIndex = -1;
			let maxValue = -1;
			for (let i = 0, l = flowMap.values.length; i < l; i++) {
				let value = flowMap.values[i]
				if (value !== undefined && value > maxValue) {
					resultIndex = i;
					maxValue = value;
				} 
			}
			out[0] = Math.floor(resultIndex % width);
			out[1] = Math.floor(resultIndex / width);
		};

		return flowMap;
	};

	return exports;
})();