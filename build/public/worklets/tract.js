"use strict"

/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G2 = (3.0 - Math.sqrt(3.0)) / 6.0
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
]
function makeNoise2D(random) {
    if (random === void 0) { random = Math.random }
    const p = new Uint8Array(256)
    for (let i = 0 ;i < 256; i++)
        p[i] = i
    let n
    let q
    for (let i = 255; i > 0; i--) {
        n = Math.floor((i + 1) * random())
        q = p[i]
        p[i] = p[n]
        p[n] = q
    }
    const perm = new Uint8Array(512)
    const permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255]
        permMod12[i] = perm[i] % 12
    }
    return function (x, y) {
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0) // Hairy factor for 2D
        const i = Math.floor(x + s)
        const j = Math.floor(y + s)
        const t = (i + j) * G2
        const X0 = i - t // Unskew the cell origin back to (x,y) space
        const Y0 = j - t
        const x0 = x - X0 // The x,y distances from the cell origin
        const y0 = y - Y0
        // Determine which simplex we are in.
        const i1 = x0 > y0 ? 1 : 0
        const j1 = x0 > y0 ? 0 : 1
        // Offsets for corners
        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1.0 + 2.0 * G2
        const y2 = y0 - 1.0 + 2.0 * G2
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255
        const jj = j & 255
        const g0 = Grad[permMod12[ii + perm[jj]]]
        const g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]]
        const g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]]
        // Calculate the contribution from the three corners
        const t0 = 0.5 - x0 * x0 - y0 * y0
        const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0)
        const t1 = 0.5 - x1 * x1 - y1 * y1
        const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1)
        const t2 = 0.5 - x2 * x2 - y2 * y2
        const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2)
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1]
        return 70.14805770653952 * (n0 + n1 + n2)
    }
}

// Additional math functions
Math.simplex2D = makeNoise2D(Math.random)
Math.simplex = t => Math.simplex2D(t*1.2, t*0.7)
Math.PI2 = Math.PI * 2
Math.clamp = (value, a, b) => Math.max(a, Math.min(value, b))
Math.moveTowards = (a, b, target) => (a<b)
  ? Math.min(a+target, b)
  : Math.max(a-target, b)

// Circular area from diameter
const calculateArea = (d) => d * d / 4 * Math.PI

// Kelly-Lochbaum junction (acoustic scattering function)
const kellyLochbaum = (A1, A2) => (A1-A2) / (A1+A2) 

// exponential easing function
const ease = x => x === 0 ? 0 : Math.pow(2, 10 * x - 10);

const C = 343 // speed of sound in air (m/s)

class TractProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tongueIndex', defaultValue: .2, automationRate: 'k-rate'},
      { name: 'tongueDiameter', defaultValue: .2, automationRate: 'k-rate'},
      { name: 'lipDiameter', defaultValue: 1, automationRate: 'k-rate'},
      { name: 'tipIndex', defaultValue: .7, automationRate: 'k-rate'},
      { name: 'tipDiameter', defaultValue: 1, automationRate: 'k-rate'},
    ]
  }

  constructor({processorOptions: {proportions}}) { 
    super() 
    this.port.onmessage = (e) => this.port.postMessage(this.diameter)

    console.log(proportions)
  
    // Init cavities
    this.initOralCavity(proportions) // 44=tenor, 
    this.initNasalCavity(proportions) // 28

    // Ks
    this.KL = this.KR = this.KNose = 0
    this.calculateReflectionCoefficients()
    this.calculateNoseReflections()

    this.noseDiameter[0] = this.velumTarget
  }

  initOralCavity({oralLength:N, maxDiameter}) {
    // sections
    this.N = N

    // Tongue
    this.bladeStart = Math.round(N * 0.25)
    this.tipStart = Math.round(N * 0.727)
    this.lipStart = Math.round(N-2)

    // Travelling components
    this.R = new Float64Array(N) // right-moving component
    this.L = new Float64Array(N) // left-moving component
    this.junctionOutputR = new Float64Array(N+1)
    this.junctionOutputL = new Float64Array(N+1)

    // diameter & cross-sectional area
    const glottalRatio = .167 // (1/6)^2
    const pharyngealRatio = .667
    this.maxDiameter = maxDiameter
    const d = this.oralDiameter = maxDiameter
    this.glottalDiameter = d * glottalRatio
    this.pharyngealDiameter = d * pharyngealRatio
    this.diameter = new Float64Array(N)
    this.restDiameter = new Float64Array(N)
    this.targetDiameter = new Float64Array(N)
    this.A = new Float64Array(N) // cross-sectional areas

    this.glottisEnd = N/6.
    this.pharynxEnd = N/3.

    const glottalDifference = this.pharyngealDiameter - this.glottalDiameter

    // Calculate diameter
    for (let m = 0; m < N; m++)
    {
        let diameter = 0
        if (m < this.glottisEnd) diameter = this.glottalDiameter + ease(m/this.glottisEnd) * glottalDifference
        else if (m < this.pharynxEnd) diameter = this.pharyngealDiameter
        else diameter = this.oralDiameter
        this.diameter[m] = this.restDiameter[m] = this.targetDiameter[m] = diameter
    }


    // Reflection (can probably make a bunch of these constants)
    this.K = new Float64Array(N+1) // Reflection coefficients
    this.softK = .75
    this.hardK = .9
    this.glottalReflectionCoefficient = .7
    this.labialReflectionCoefficient = -.9
    this.lastObstruction = -1
    this.decay = .9999 // the coefficient of decay in the transfer function
    this.movementSpeed = 15 // cm per second
    this.transients = [] // stop consonants
    this.labialOutput = 0 // outout at the labia (lips)
  }

  initNasalCavity({nasalLength:N}) {
    this.noseOutput = 0
    this.velumOpen = .1
    this.velumTarget = .04
    this.noseLength = N
    this.noseStart = this.N - N + 1
    this.noseR = new Float64Array(N)
    this.noseL = new Float64Array(N)
    this.noseJunctionOutputR = new Float64Array(N+1)
    this.noseJunctionOutputL = new Float64Array(N+1)        
    this.noseK = new Float64Array(N+1)
    this.noseDiameter = new Float64Array(N)
    this.noseA = new Float64Array(N)
    this.noseMaxAmplitude = new Float64Array(N)

    for (let i = 0; i < N; i++)
    {
        const d = 2 * (i/N)
        const diameter = (d<1) ? 0.4 + (1.6 * d) : 0.2 + 1.2 * (2-d)
        this.noseDiameter[i] = Math.min(diameter, 1.2) * this.noseLength / 28 // fix magic numbers
    }
  }

  calculateReflectionCoefficients() {
    for (let m=0; m<this.N; m++) {
      this.A[m] = calculateArea(this.diameter[m])
    }
    for (let m=1; m<this.N; m++) {
      const coefficient = m > this.pharynxEnd ? this.hardK : this.softK
       // prevent error if 0
      this.K[m] = (this.A[m] == 0 ? 0.999 : kellyLochbaum(this.A[m-1], this.A[m])) * coefficient
    }
    
    // now at velopharyngeal junction / port
    const sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0]
    this.KL = (2*this.A[this.noseStart]-sum)/sum
    this.KR = (2*this.A[this.noseStart+1]-sum)/sum   
    this.KNose = (2*this.noseA[0]-sum)/sum      
  }

  calculateNoseReflections() {
    for (let m = 0; m < this.noseLength; m++) {
      this.noseA[m] = calculateArea(this.noseDiameter[m])
    }
    for (let m = 1; m < this.noseLength; m++) {
      this.noseK[m] = kellyLochbaum(this.noseA[m-1], this.noseA[m]) 
    }
  }

  step(glottalExcitation, noise, index, diameter) {
    // mouth
    // this.processTransients()
    // this.addFricativeNoise(noise * .2, index, diameter)
    
    this.junctionOutputR[0] = this.L[0] * this.glottalReflectionCoefficient + glottalExcitation
    this.junctionOutputL[this.N] = this.R[this.N-1] * this.labialReflectionCoefficient 

    // reflect at each junction
    for (let m=1; m<this.N; m++) {
      const k = this.K[m] // coefficient
      const w = k * (this.R[m-1] + this.L[m]) // reflection
      this.junctionOutputR[m] = this.R[m-1] - w
      this.junctionOutputL[m] = this.L[m] + w
    }    
    
    // now at junction with nose (velum)
    const v = this.noseStart // velum
    let r = this.KL
    this.junctionOutputL[v] = r*this.R[v-1]+(1+r)*(this.noseL[0]+this.L[v])
    r = this.KR
    this.junctionOutputR[v] = r*this.L[v]+(1+r)*(this.R[v-1]+this.noseL[0])     
    r = this.KNose
    this.noseJunctionOutputR[0] = r*this.noseL[0]+(1+r)*(this.L[v]+this.R[v-1])
    
    // decay at each junction
    for (let m = 0; m < this.N; m++) {          
        this.R[m] = this.junctionOutputR[m]*this.decay
        this.L[m] = this.junctionOutputL[m+1]*this.decay
    }

    this.labialOutput = this.R[this.N-1]
    
    // Nose
    this.noseJunctionOutputL[this.noseLength] = this.noseR[this.noseLength-1] * this.labialReflectionCoefficient 
    
    for (let v = 1; v < this.noseLength; v++) {
        const w = this.noseK[v] * (this.noseR[v-1] + this.noseL[v])
        this.noseJunctionOutputR[v] = this.noseR[v-1] - w
        this.noseJunctionOutputL[v] = this.noseL[v] + w
    }
    
    // decay in nasal cavity 
    for (let v = 0; v < this.noseLength; v++) {
        this.noseR[v] = this.noseJunctionOutputR[v] * this.decay
        this.noseL[v] = this.noseJunctionOutputL[v+1] * this.decay   
    }

    this.noseOutput = this.noseR[this.noseLength-1]
  }

  // Turbulence noise
    
  addFricativeNoise(noise, position, diameter) {   
    const m = Math.floor(position) // section
    const delta = position - m
    // noise amplitude modulation now occurs in source node !!!
    const thinness = Math.clamp(8*(0.7-diameter),0,1)
    const openness = Math.clamp(30*(diameter-0.3), 0, 1)

    // divided by two for L-R split
    const noise0 = noise*(1-delta)*thinness*openness / 2
    const noise1 = noise*delta*thinness*openness / 2

    // Add noise to tract
    this.R[m+1] += noise0
    this.L[m+1] += noise0
    this.R[m+2] += noise1
    this.L[m+2] += noise1
  }

  reshapeTract(deltaTime) {
    let amount = deltaTime * this.movementSpeed     
    let newLastObstruction = -1
    for (let m = 0; m < this.N; m++) {
      const diameter = this.diameter[m]
      let targetDiameter = this.targetDiameter[m]
      if (diameter <= 0) newLastObstruction = m
      let slowReturn 
      if (m<this.noseStart) slowReturn = 0.6
      else if (m >= this.tipStart) slowReturn = 1.0 
      else slowReturn = 0.6+0.4*(m-this.noseStart)/(this.tipStart-this.noseStart)
      this.diameter[m] = Math.moveTowards(diameter, targetDiameter, slowReturn*amount, 2*amount)
    }
    if (this.lastObstruction>-1 && newLastObstruction == -1 && this.noseA[0]<0.05) {
      this.addTransient(this.lastObstruction)
    }
    this.lastObstruction = newLastObstruction
    
    amount = deltaTime * this.movementSpeed 
    this.noseDiameter[0] = Math.moveTowards(this.noseDiameter[0], this.velumTarget, amount*0.25, amount*0.1)
    this.noseA[0] = this.noseDiameter[0]*this.noseDiameter[0]        
  }

  addTransient(position) {
    let trans = {}
    trans.position = position
    trans.timeAlive = 0
    trans.lifeTime = 0.25
    trans.strength = 0.3
    trans.exponent = 200
    this.transients.push(trans)
  }
    
  processTransients() {
    for (let t = 0; t < this.transients.length; t++) {
      let trans = this.transients[t]
      let amplitude = trans.strength * Math.pow(2, -trans.exponent * trans.timeAlive)
      this.R[trans.position] += amplitude/2
      this.L[trans.position] += amplitude/2
      trans.timeAlive += 1.0/(sampleRate*2)
    }
    
    for (let t = this.transients.length-1; t>=0; t--) {
      let trans = this.transients[t]
      if (trans.timeAlive > trans.lifeTime) {
        this.transients.splice(t,1)
      }
    }
  }

  updateTongue(index, diameter)
  {
    let blade = this.bladeStart
    let tip = this.tipStart
    let lip = this.lipStart

    let d = this.maxDiameter * 0.75
    let tongueDiameter = d + (diameter-d) / (this.maxDiameter * 0.3)

    // update rest & target diameter
    for (let i=this.bladeStart; i<this.lipStart; i++)
    {
      let t = 1.1 * Math.PI * (index-i) / (tip-blade)
      let curve = (this.maxDiameter/2-tongueDiameter) * Math.cos(t)
      if (i == blade-2 || i == lip-1) curve *= 0.8
      if (i == blade || i == lip-2) curve *= 0.94  
      const newDiameter =  (this.maxDiameter/2 - curve) * (1+Math.simplex(i)*0.15)       
      this.targetDiameter[i] = this.restDiameter[i] = Math.clamp(newDiameter, 0.3, this.maxDiameter)
    }
  }

  updateLip(value) {
    const length = this.N - this.lipStart
    const target = value * this.maxDiameter
    for (let i=this.lipStart; i<this.N; i++) {
      this.targetDiameter[i] = this.restDiameter[i] = target
    }
  }

  // THIS FOR SOME REASON PERMANENTLY REDUCES VOLUME
  updateConstrictions(ind, dia) {
    let tip = this.tipStart

    let index = ind * this.N
    let diameter = dia * this.oralDiameter
    this.velumTarget = diameter < 0 ? this.velumOpen : this.velumTarget
    diameter -= 0.3; // min diameter required to produce sound
    if (diameter<0) diameter = 0;         
    let width;
    if (index<25) width = 10;
    else if (index>=tip) width= 2;
    else width = 10-2*(index-25)/(tip-25);
    if (index >= 2 && index < this.N && diameter < this.maxDiameter)
    {
      let intIndex = Math.round(index);
      for (let i=-Math.ceil(width)-1; i<width+1; i++) 
      {   
        if (intIndex+i<0 || intIndex+i>=this.N) continue;
        let relpos = (intIndex+i) - index;
        relpos = Math.abs(relpos)-0.2;
        let shrink;
        if (relpos <= 0) shrink = 0;
        else if (relpos > width) shrink = 1;
        else shrink = 0.2*(1-Math.cos(Math.PI * relpos / width));
        if (diameter < this.targetDiameter[intIndex+i])
        {
          this.targetDiameter[intIndex+i] = diameter + (this.targetDiameter[intIndex+i]-diameter)*shrink;
        }
      }
    }
  }

  process(IN, OUT, PARAMS) {
    const glottalSource = IN[0][0] // single channel (0)
    const fricativeNoise = IN[1][0] // single channel (0)
    const output = OUT[0][0]
    // tongue
    const tongueIndex = PARAMS.tongueIndex[0] * (this.tipStart-this.bladeStart) + this.bladeStart
    const tongueDiameter = PARAMS.tongueDiameter[0] * this.oralDiameter
    const tipIndex = PARAMS.tipIndex[0]
    const tipDiameter = PARAMS.tipDiameter[0]
    // lip
    const lipDiameter = PARAMS.lipDiameter[0]

    // let turbulenceIndex, turbulenceDiameter;
    // if tipIndex > lip

    // block start
    for (let n = 0; n < 128; n++) {
      const source = glottalSource[n]
      const noise = fricativeNoise[n]

      // run step at twice the sample rate
      this.step(source, noise, tipIndex, tipDiameter)
      this.step(source, noise, tipIndex, tipDiameter)

      output[n] = this.labialOutput + this.noseOutput
    }

    // block end
    this.updateTongue(tongueIndex, tongueDiameter)
    this.updateLip(lipDiameter)
    // this.updateConstrictions(tipIndex, tipDiameter)
    this.reshapeTract(128/sampleRate) // 128 / sampleRate
    this.calculateReflectionCoefficients()

    // post tract data
    this.port.postMessage(this.diameter)

    return true
  }
}

registerProcessor('tract', TractProcessor)