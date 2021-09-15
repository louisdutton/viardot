"use strict";

// Stefan Gustavson's Perlin Noise
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const Grad = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0, 1],
    [0, -1],
];
function makeNoise2D(random) {
    if (random === void 0) { random = Math.random; }
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++)
        p[i] = i;
    var n;
    var q;
    for (var i = 255; i > 0; i--) {
        n = Math.floor((i + 1) * random());
        q = p[i];
        p[i] = p[n];
        p[n] = q;
    }
    var perm = new Uint8Array(512);
    var permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = perm[i] % 12;
    }
    return function (x, y) {
        // Skew the input space to determine which simplex cell we're in
        var s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0); // Hairy factor for 2D
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = x - X0; // The x,y distances from the cell origin
        var y0 = y - Y0;
        // Determine which simplex we are in.
        var i1 = x0 > y0 ? 1 : 0;
        var j1 = x0 > y0 ? 0 : 1;
        // Offsets for corners
        var x1 = x0 - i1 + G2;
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2;
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var g0 = Grad[permMod12[ii + perm[jj]]];
        var g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]];
        var g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]];
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        var n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0);
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        var n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1);
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        var n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2);
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1]
        return 70.14805770653952 * (n0 + n1 + n2);
    };
}

class Aspirator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tenseness', defaultValue: 0.6, automationRate: 'k-rate'},
      { name: 'intensity', defaultValue: 0.5, automationRate: 'k-rate'},
    ]
  }
  
  constructor() { 
    super()
    const simplex2D = makeNoise2D()
    this.simplex = t => simplex2D(t*1.2, -t*0.7) 
  }

  process(IN, OUT, PARAMS) {
    const input = IN[0][0]
    const output = OUT[0][0]
    const intensity = PARAMS.intensity[0] 
    const tenseness = PARAMS.tenseness[0]
    const floor = 0.1
    const amplitude = 0.05

    // pre block
    var mod = intensity * (Math.sqrt(tenseness))

    // block
    for (let n = 0; n < 128; n++) {
      output[n] = (input[n] * mod) * (floor + amplitude * this.simplex(currentTime * 4))
    }

    return true
  }
}

registerProcessor('aspirator', Aspirator)