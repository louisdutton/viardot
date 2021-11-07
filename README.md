# Bel Canto &middot; [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/viardot) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bel Canto is a vocal synthesis library that uses optimised physical-modelling techniques to enable realistic, real-time synthesis.

## Installation

```bash
npm i viardot
```

## Usage

```js
import * as Viardot from 'viardot'

// Initialize global AudioContext for voices
Viardot.start().then(() => Init())

// Initialize voices
function Init() {
    const voice = new Viardot.Voice('soprano')
    window.addEventListener('mousedown', e => voice.start(), false)
    window.addEventListener('mouseup', e => voice.stop(), false)
}

```

## Reference
- [Tone.js](https://github.com/Tonejs/Tone.js)
- [Pink Trombone](https://dood.al/pinktrombone/) - Neil Thapen
- "Toward a high-quality singing synthesizer with vocal texture control" - Hui-Ling Lu
