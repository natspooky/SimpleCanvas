import { mergeObjects, checkEventSupport } from './util/utils.js';

class CanvasCore {
	static appendEvent = new CustomEvent('append');
	static _supportedEvents = [
		//mouse
		'mousedown',
		'mouseup',
		'mousemove',
		'mouseenter',
		'mouseleave',
		'contextmenu',

		//touch
		'touchstart',
		'touchend',
		'touchmove',
		'touchcancel',

		//key
		'keyup',
		'keydown',

		//scroll
		'wheel',
		'scroll',
		'scrollend',

		//window focus
		'blur',
		'focus',

		//resize
		'resize',

		//canvas context
		'contextlost',
		'contextrestored',
	].filter(checkEventSupport);

	_observers = [];

	_userEventListeners = {};

	_canvasEventRemovers = {};

	_wheelState = {
		scrolling: false,
	};

	_scrollState = {
		scrolling: false,
	};

	_keyState = {
		pressing: false,
		pressCount: 0,
		currentKeys: {},
	};

	_mouseState = {
		pressing: false,
		covering: false,
		moving: false,
		click: {
			startPosition: {},
			endPosition: {},
		},
		motion: {
			lastEntryTime: 0,
			position: {
				x: 0,
				y: 0,
			},
			lastPostion: {
				x: 0,
				y: 0,
			},
			velocity: {
				x: 0,
				y: 0,
			},
			speed: 0,
		},
	};

	_touchState = {
		pressing: false,
		moving: false,
		touchCount: 0,
		motion: {
			position: {
				x: 0,
				y: 0,
			},
			lastPostion: {
				x: 0,
				y: 0,
			},
		},
	};

	_canvasState = {
		canvas: undefined,
		context: undefined,
		id: undefined,
		location: {
			top: 0,
			left: 0,
		},
		elementSize: {
			width: 0,
			height: 0,
		},
		size: {
			width: 300,
			height: 150,
			locked: false,
			scale: window.devicePixelRatio || 1,
		},
	};

	_drawingState = {
		paused: false,
		drawing: false,
		renderTime: 0,
		interval: 1000 / 60,
		runTime: 0,
		drawFn: undefined,
		setupFn: undefined,
		resizeFn: undefined,
		appendFn: undefined,
	};

	_timers = {
		cursorMotionState: undefined,
	};

	constructor(canvas, settings = {}, name = 'Unnamed Simple Canvas') {
		this._mergeSettings(settings);

		switch (typeof canvas) {
			case 'string':
				this._canvasState.canvas = document.getElementById(canvas);
				if (!this._canvasState.canvas) {
					throw new Error(
						'Assignment error: ' +
							`The ID '${canvas}' does not exist in the DOM.`,
					);
				}
				break;
			case 'object':
				if (null === canvas) {
					throw new Error(
						'Assignment error: ' +
							"Cannot create canvas from 'NULL'.",
					);
				}
				if (
					!(
						canvas.tagName === 'CANVAS' &&
						canvas.nodeType === Node.ELEMENT_NODE
					)
				) {
					throw new Error(
						'Assignment error: ' + "HTML Node is not a 'CANVAS'.",
					);
				}

				this._canvasState.canvas = canvas;

				break;
			default:
				throw new TypeError(
					'Type error: ' +
						"Passed canvas is not of type 'HTML Node' or 'String'.",
				);
		}

		if (
			!(
				!!window.HTMLCanvasElement &&
				!!this._canvasState.canvas.getContext
			)
		) {
			this.disconnect();

			throw new Error(
				'Error: ' +
					"Your browser doesn't support the HTMLCanvasElement API.",
			);
		}

		this._canvasState.id = name;

		this._attachEvents();

		if (!document.body.contains(this._canvasState.canvas)) {
			this._canvasState.canvas.addEventListener(
				'append',
				() => {
					this._resize();
					this._drawingState.appendFn?.();
				},
				{
					once: true,
				},
			);
			this._awaitAppend(this._canvasState.canvas);
			return;
		}

		this._resize();
	}

	static create(identifiers) {
		const canvasElement = document.createElement('canvas');

		identifiers
			.trim()
			.split(/\s|,/)
			.forEach((identifier) => {
				const key = identifier.slice(1);

				switch (identifier.slice(0, 1)) {
					case '#':
						canvasElement.id = key;
						break;
					case '.':
						canvasElement.classList.add(key);
						break;
					default:
						throw new Error(
							'Assignment error: ' +
								"Class and Id keys dont match required syntax: '#IdName .className' or '#IdName,.className'.",
						);
				}
			});

		return canvasElement;
	}

	async _prepareRender() {
		if (!this._drawingState.drawFn) {
			throw new Error('Render error: ' + 'No draw function provided.');
		}

		if (!document.body.contains(this._canvasState.canvas)) {
			throw new Error(
				'Render error: ' +
					'Canvas cannot render content while outside of the Document body.',
			);
		}

		await this._drawingState.setupFn?.();

		console.log(
			`Rendering '${this._canvasState.id}' at ${this.settings.fps}FPS`,
		);

		this._drawingState.drawing = true;
	}

	async _frameLoop(drawCallback) {
		let then = performance.now(),
			delta = 0,
			now = 0;

		while (this._drawingState.drawing) {
			now = await new Promise(requestAnimationFrame);

			if (now - then < this._drawingState.interval - delta) continue;

			delta = Math.min(
				this._drawingState.interval,
				delta + now - then - this._drawingState.interval,
			);

			if (this._drawingState.paused) continue;

			this._drawingState.renderTime = (now - then) / 1000;

			this._drawingState.runTime += this._drawingState.renderTime;

			then = now;

			drawCallback();
		}
	}

	_mergeSettings(userSettings) {
		this.settings = mergeObjects(
			{
				fps: 60,
				autoClear: true,
				autoResize: true,
				setupOnResize: true,
				cursor: {
					active: false,
					global: false,
					passive: true,
					correctTransform: true,
				},
				key: {
					active: false,
					passive: true,
				},
				touch: {
					active: false,
					global: false,
					passive: true,
					correctTransform: true,
				},
				useWheel: false,
				useScroll: false,
				diagnostics: false,
				pauseOnBlur: false,
				inView: false,

				useRetina: true,
				canvas: {
					willReadFrequently: false,
					alpha: true,
					failIfMajorPerformanceCaveat: false,
				},
			},
			userSettings,
		);

		this.fps = this.settings.fps;

		if (this.settings.size) this.size = this.settings.size;
	}

	_clearObservers() {
		this._observers.forEach((observer) => {
			observer.disconnect();
		});
		this._observers = null;
	}

	_buildEmbedEvent({ target, eventName, fn, options }) {
		if (!CanvasCore._supportedEvents.includes(eventName)) {
			throw new Error(
				'Event error: ' + `The event '${eventName}' isn't available.`,
			);
		}

		const boundEventFn = fn.bind(this);

		target.addEventListener(eventName, boundEventFn, options);

		this._canvasEventRemovers.push(() =>
			target.removeEventListener(eventName, boundEventFn),
		);
	}

	_clearEvents() {
		this._canvasEventRemovers.forEach((remover) => {
			remover();
		});
		this._canvasEventRemovers = null;
	}

	_attachEvents() {
		//context
		this._buildEmbedEvent({
			target: this._canvasState.canvas,
			eventName: 'contextlost',
			fn: this._contextLost,
		});

		this._buildEmbedEvent({
			target: this._canvasState.canvas,
			eventName: 'contextrestored',
			fn: this._contextRestored,
			options: { passive: true },
		});

		//mouse
		if (this.settings.cursor.active) {
			this._buildEmbedEvent({
				target: document,
				eventName: 'mouseup',
				fn: this._mouseUp,
				options: { passive: true },
			});
			this._buildEmbedEvent({
				target: document,
				eventName: 'mousedown',
				fn: this._mouseDown,
				options: { passive: this.settings.cursor.passive },
			});
			this._buildEmbedEvent({
				target: document,
				eventName: 'mousemove',
				fn: this._mouseMove,
				options: { passive: true },
			});
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'contextmenu',
				fn: this._contextMenu,
				options: { passive: this.settings.cursor.passive },
			});
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'mouseenter',
				fn: this._mouseEnter,
				options: { passive: true },
			});
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'mouseleave',
				fn: this._mouseLeave,
				options: { passive: true },
			});
		}

		//touch
		if (this.settings.useTouch) {
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'touchstart',
				fn: this._touchStart,
			});
			this._buildEmbedEvent({
				target: document,
				eventName: 'touchend',
				fn: this._touchEnd,
				options: { passive: true },
			});
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'touchmove',
				fn: this._touchMove,
			});
			this._buildEmbedEvent({
				target: document,
				eventName: 'touchcancel',
				fn: this._touchCancel,
			});
		}

		//keyboard
		if (this.settings.key.active) {
			this._buildEmbedEvent({
				target: document,
				eventName: 'keyup',
				fn: this._keyUp,
				options: { passive: true },
			});
			this._buildEmbedEvent({
				target: document,
				eventName: 'keydown',
				fn: this._keyDown,
				options: { passive: this.settings.key.passive },
			});
		}

		//wheel
		if (this.settings.useWheel) {
			this._buildEmbedEvent({
				target: this._canvasState.canvas,
				eventName: 'wheel',
				fn: this._wheel,
			}); // when scrolling without motion of the page
		}

		//scroll
		if (this.settings.useScroll) {
			this._buildEmbedEvent({
				target: document,
				eventName: 'scroll',
				fn: this._scroll,
			}); // when scrolling and the page moves
		}

		//resize
		if (this.settings.autoResize) {
			const resizeFn = this._resize.bind(this);
			const observer = new ResizeObserver(resizeFn);

			this._observers.push(observer);

			observer.observe(this._canvasState.canvas);
		}

		this._buildEmbedEvent({
			target: window,
			eventName: 'resize',
			fn: this._locationUpdate,
			options: { passive: true },
		});

		//focus
		this._buildEmbedEvent({
			target: window,
			eventName: 'blur',
			fn: this._pageBlur,
			options: { passive: true },
		});
		this._buildEmbedEvent({
			target: window,
			eventName: 'focus',
			fn: this._pageFocus,
			options: { passive: true },
		});

		//intersect
		if (this.settings.inView) {
			const intersectFn = this._intersect.bind(this);

			const observer = new IntersectionObserver(intersectFn, {
				rootMargin: '0px',
				scrollMargin: '0px',
				threshold: 0.06,
			});

			this._observers.push(observer);

			observer.observe(this._canvasState.canvas);
		}
	}

	disconnect() {
		this._removeEvents();

		this._clearObservers();

		this._drawingState.drawing = false;

		this._canvasState.canvas = null;
		this._canvasState.context = null;
	}

	pause() {
		this._drawingState.paused = true;
	}

	play() {
		this._drawingState.paused = false;
	}

	setup(fn) {
		this._drawingState.setupFn = fn;
	}

	append(fn) {
		this._drawingState.appendFn = fn;
	}

	draw(fn) {
		this._drawingState.drawFn = fn;
	}

	resize(fn) {
		this._drawingState.resizeFn = fn;
	}

	set size({ height, width }) {
		this._canvasState.size.locked = true;
		if (width) this._canvasState.size.width = width;
		if (height) this._canvasState.size.height = height;
	}

	set fps(newFPS) {
		new Promise((resolve) =>
			requestAnimationFrame((t1) =>
				requestAnimationFrame((t2) =>
					resolve(Math.floor(1000 / (t2 - t1))),
				),
			),
		).then((calculatedFPS) => {
			const closestRate = [
				30, 60, 75, 90, 100, 120, 144, 180, 240, 360,
			].reduce((previous, current) =>
				Math.abs(current - calculatedFPS) <
				Math.abs(previous - calculatedFPS)
					? current
					: previous,
			);

			newFPS = Math.min(newFPS, closestRate);

			this.settings.fps = newFPS;
			this._drawingState.interval = 1000 / newFPS;
		});
	}

	on(eventName, callback) {
		if (!CanvasCore._supportedEvents.includes(eventName)) {
			console.warn(
				'Event warning: ' +
					`'${eventName}' is not supported in Simple Canvas`,
			);
		}
		this._userEventListeners[eventName] = callback;
	}

	removeEvent(eventName) {
		if (!CanvasCore._supportedEvents.includes(eventName)) {
			console.log('uh oh');
		}

		delete this._userEventListeners[eventName];
	}

	_awaitAppend(element) {
		const isAppended = (element) => {
			while (element.parentNode) element = element.parentNode;
			return element instanceof Document;
		};

		if (isAppended(element)) {
			element.dispatchEvent(CanvasCore.appendEvent);
			return;
		}

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes.length === 0) continue;
				if (
					!Array.from(mutation.addedNodes).some((node) =>
						node.contains(element),
					)
				)
					continue;

				observer.disconnect();
				element.dispatchEvent(CanvasCore.appendEvent);
			}
		});

		this._observers.push(observer);

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	get element() {
		return this._canvasState.canvas;
	}

	get context() {
		return this._canvasState.context;
	}

	get id() {
		return this._canvasState.id;
	}

	get width() {
		return this._canvasState.size.width;
	}

	get height() {
		return this._canvasState.size.height;
	}

	get top() {
		return this._canvasState.location.top;
	}

	get left() {
		return this._canvasState.location.left;
	}

	get runTime() {
		return this._drawingState.runTime;
	}

	get renderTime() {
		return this._drawingState.renderTime;
	}

	get paused() {
		return this._drawingState.paused;
	}

	get drawing() {
		return this._drawingState.drawing;
	}

	get retinaScale() {
		return this.settings.useRetina ? this._canvasState.size.scale : 1;
	}

	get fps() {
		return this.settings.fps;
	}

	get touch() {
		return {
			pressing: this._touchState.pressing,
			touchCount: this._touchState.touchCount,
			covering: this._touchState.covering,
			moving: this._touchState.moving,
			position: this._touchState.motion.position,
			prevPosition: this._touchState.motion.lastPostion,
			speed: this._touchState.motion.speed,
			velocity: this._touchState.motion.velocity,
		};
	}

	get cursor() {
		return {
			pressing: this._mouseState.pressing,
			covering: this._mouseState.covering,
			moving: this._mouseState.moving,
			position: this._mouseState.motion.position,
			prevPosition: this._mouseState.motion.lastPostion,
			speed: this._mouseState.motion.speed,
			velocity: this._mouseState.motion.velocity,
		};
	}

	get keyboard() {
		return {
			pressing: this._keyState.pressing,
			keys: this._keyState.currentKeys,
			keyCount: this._keyState.pressCount,
		};
	}
}

export default CanvasCore;
