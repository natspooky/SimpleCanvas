import CanvasCore from './core.js';

class Canvas2D extends CanvasCore {
	constructor(canvas, settings, name) {
		super(canvas, settings, name);

		this._canvasState.context = this._canvasState.canvas.getContext(
			'2d',
			this.settings.canvas,
		);
	}

	static create(identifiers, settings, name) {
		const element = CanvasCore.create(identifiers);

		return new Canvas2D(element, settings, name);
	}

	async render() {
		await this._prepareRender();

		this._frameLoop(this.draw());
	}

	_transformlessWrapper(callback) {
		const context = this.context;

		context.save();

		context.setTransform(1, 0, 0, 1, 0, 0);

		callback(context);

		context.restore();
	}

	_diagnostics() {}

	draw() {
		if (this.settings.autoClear) this.clear();

		this._drawingState.drawFn();

		if (this.settings.diagnostics) this._diagnostics();
	}

	clear() {
		this._transformlessWrapper((ctx) => {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		});
	}

	paintAll(colour) {
		this._transformlessWrapper((ctx) => {
			if (colour) ctx.fillStyle = colour;
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		});
	}
}

export default Canvas2D;
