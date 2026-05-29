import CanvasCore from './core.js';

class CanvasWebGPU extends CanvasCore {
	constructor(canvas, settings, name) {
		super(canvas, settings, name);

		this._canvasState.context = this._canvasState.canvas.getContext(
			'webgpu',
			this.settings.canvas,
		);
	}

	static create(identifiers, settings, name) {
		const element = CanvasCore.create(identifiers);

		return new CanvasWebGPU(element, settings, name);
	}
}

export default CanvasWebGPU;
