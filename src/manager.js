import Canvas2D from './2d.js';
import CanvasWebGL from './webgl.js';
import CanvasWebGPU from './webgpu.js';
import CanvasCore from './core.js';

class Manager {
	_canvasInstances = [];

	_layers = new Map();

	constructor() {}

	getCanvasType(type) {
		switch (type) {
			case '2d':
				return Canvas2D;
			case 'webgl':
			case 'webgl2':
				return CanvasWebGL;
			case 'webgpu':
				return CanvasWebGPU;
			case 'bitmaprenderer':
				return CanvasCore;

			default:
				throw new Error('');
		}
	}

	add(type, canvas, settings, name) {
		const CanvasClass = this.getCanvasType(type);

		const simpleCanvasObj = new CanvasClass(canvas, settings, name);

		this._layers.set(name ?? this._canvasInstances.length, simpleCanvasObj);
	}

	create(type, identifiers, settings, name) {
		const CanvasClass = this.getCanvasType(type);

		const simpleCanvasObj = CanvasClass.create(identifiers, settings, name);

		this._layers.set(name ?? this._canvasInstances.length, simpleCanvasObj);
	}
}

export default Manager;
