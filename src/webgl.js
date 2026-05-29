import CanvasCore from './core.js';

class CanvasWebGL extends CanvasCore {
	constructor(canvas, settings, name) {
		super(canvas, settings, name);

		this._canvasState.context = this._canvasState.canvas.getContext(
			'webgl',
			this.settings.canvas,
		);
	}

	static create(identifiers, settings, name) {
		const element = CanvasCore.create(identifiers);

		return new CanvasWebGL(element, settings, name);
	}
}

export default CanvasWebGL;
