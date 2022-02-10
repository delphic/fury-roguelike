module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { width, height, gameMap } = config;

		let flowMap = {};
		flowMap.evaluatedTiles =  [];
		flowMap.values = [];

		let stack = [];
		let consideredTiles = [];
		stack.tryAdd = (x, y) => {
			let index = x + width * y;
			if (x >= 0 && x < width && y >= 0 && y < height && !consideredTiles[index] && gameMap.canEnterTile(x, y)) {
				stack.push(index);
				consideredTiles[index] = true;
			}
		};

		flowMap.calculate = (x, y, limit) => {
			stack.length = consideredTiles.length = flowMap.evaluatedTiles.length = 0;
			let i = 0;
			stack.tryAdd(x, y);
			while (i < stack.length && i < limit) {
				x = Math.floor(stack[i] % width);
				y = Math.floor(stack[i] / width);
				flowMap.evaluatedTiles[stack[i]] = true;
				flowMap.values[stack[i]] = i;
				stack.tryAdd(x - 1, y);
				stack.tryAdd(x, y + 1);
				stack.tryAdd(x + 1, y);
				stack.tryAdd(x, y - 1);
				i++;
			}
			return flowMap;
		};

		flowMap.getEvalutedTileIndexSet = (out) => {
			out.length = 0;
			for (let i = 0, l = evaluatedTiles.length; i < l; i++) {
				if (evaluatedTiles[i] !== undefined) {
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