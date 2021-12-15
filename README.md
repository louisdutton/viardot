# Bel Canto &middot; [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/belcanto) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bel Canto is a vocal synthesis library that uses optimised physical-modelling techniques to enable realistic, real-time synthesis.

## Install

```bash
npm i belcanto
```

## Usage

```js
import * as Bel from 'belcanto'

// Event handlers
const handleMouseDown = () => {
    Bel.start() // Initialise AudioContent on user interaction
    voice.start()
}
const handleMouseUp = () => voice.stop

// Create voice and controls
const voice = new Bel.Voice('soprano')
window.addEventListener('mousedown', handleMouseDown, false)
window.addEventListener('mouseup', handleMouseUp, false)
```

## Reference
- [Tone.js](https://github.com/Tonejs/Tone.js)
- [gyng/synthrs](https://github.com/gyng/synthrs/)
- [Pink Trombone](https://dood.al/pinktrombone/)
- [Toward a high-quality singing synthesizer with vocal texture control](https://ccrma.stanford.edu/~vickylu/thesis/)
- [A unit selection text-to-speech-and-singing synthesis framework from neutral speech: proof of concept
](https://asmp-eurasipjournals.springeropen.com/articles/10.1186/s13636-019-0163-y)
