# SimpleCanvas [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

Install via npm:

```bash
npm install simple-canvas
```

Import into your file:

```js
import { Canvas2D } from 'simple-canvas';
```

Create your canvas:

```js
const myCanvas = Canvas2D.create(
	'#MyCanvas .my-class', // #ID .ClassName
	{ fps: 60 }, // Canvas Settings
	'Canvas One', // Canvas Name
);
```

Pass your functions:

```js
myCanvas.setup(setupFn);
myCanvas.draw(drawFn);
myCanvas.resize(resizeFn);
```

Start the renderloop:

```js
myCanvas.render();
```
