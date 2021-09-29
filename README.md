# Viardot.js &middot; [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/viardot) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Viardot is a virtual voice engine capable of delivering a physically-accurate lingual performance. The end-goal is to produce a free, high-quality vocal plugin for DAWs and music notation software.

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

## To-Do

- Convert audio-processing code to WebAssembly
- General improvements to accuracy and quality of voice

## References
- Tone.js (AudioContext & AudioWorklet architecture)
- Pink Trombone
- "Toward a high-quality singing synthesizer with vocal texture control", Hui-Ling Lu
