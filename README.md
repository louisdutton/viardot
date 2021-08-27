# Viardot.js &middot; [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/viardot) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Viardot is a virtual singing voice powered by the WebAudioAPI AudioWorklet.

## Installation

```bash
npm i viardot
```

## Usage

```js
import * as Viardot from 'viardot';

const voice = new Viardot.Voice('soprano');
voice.start();
voice.stop();
```

## To-Do

- optimise worklet processors
