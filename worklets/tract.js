import * as UTILS from '../math-utils'

class TractProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tongueIndex', defaultValue: 2.3, automationRate: 'k-rate'},
      { name: 'tongueDiameter', defaultValue: 12.75, automationRate: 'k-rate'},
    ]
  }

  constructor() { 
    super() 

    this.port.onmessage = (e) => {
      // console.log(e.data)
      // this.velumTarget = e.data
      this.port.postMessage(this.diameter)
    }

    // Init cavities
    this.initOralCavity(44) // 44
    this.initNasalCavity(28) // 28

    // reflections
    this.reflectionLeft = this.reflectionRight = this.reflectionNose = 0
    this.calculateReflections()
    this.calculateNoseReflections()

    this.noseDiameter[0] = this.velumTarget
  }

  initOralCavity(N) {
    // sections
    this.N = N
    this.bladeStart = 10
    this.tipStart = 32
    this.lipStart = 39

    // values
    this.R = new Float64Array(N) // right-moving component
    this.L = new Float64Array(N) // left-moving component
    this.reflection = new Float64Array(N+1)
    this.junctionOutputR = new Float64Array(N+1)
    this.junctionOutputL = new Float64Array(N+1)

    // diameter & cross-sectional area
    this.diameter = new Float64Array(N)
    this.restDiameter = new Float64Array(N)
    this.targetDiameter = new Float64Array(N)
    this.A = new Float64Array(N)

    // magic numbers relative to 44
    for (var m = 0; m < N; m++)
    {
        var diameter = 0
        if (m < 7 - 0.5) diameter = 0.6
        else if (m < 12) diameter = 1.1
        else diameter = 1.5
        this.diameter[m] = this.restDiameter[m] = this.targetDiameter[m] = diameter * 5
    }

    this.A = []
    this.glottalReflection = 0.7
    this.lipReflection = -0.85
    this.lastObstruction = -1
    this.fade = 0.999 //0.9999,
    this.movementSpeed = 15 //cm per second
    this.transients = []
    this.lipOutput = 0
  }

  initNasalCavity(N) {
    this.noseOutput = 0
    this.velumTarget = 0.01
    this.noseLength = N
    this.noseStart = this.N - N + 1
    this.noseR = new Float64Array(N)
    this.noseL = new Float64Array(N)
    this.noseJunctionOutputR = new Float64Array(N+1)
    this.noseJunctionOutputL = new Float64Array(N+1)        
    this.noseReflection = new Float64Array(N+1)
    this.noseDiameter = new Float64Array(N)
    this.noseA = new Float64Array(N)
    this.noseMaxAmplitude = new Float64Array(N)

    for (var i = 0; i < N; i++)
    {
        var diameter
        var d = 2 * (i/N)
        if (d<1) diameter = 0.4 + (1.6 * d)
        else diameter = 0.5 + 1.5 * (2-d)
        diameter = Math.min(diameter, 1.9)
        this.noseDiameter[i] = diameter
    }
  }

  calculateReflections()
  {
    for (var m=0; m<this.N; m++) 
    {
      this.A[m] = this.diameter[m] * this.diameter[m] //ignoring PI etc.
    }
    for (var m=1; m<this.N; m++)
    {
      if (this.A[m] == 0) this.reflection[m] = 0.999 //to prevent some bad behaviour if 0
      else this.reflection[m] = (this.A[m-1]-this.A[m]) / (this.A[m-1]+this.A[m]) // kl junction
    }
    
    //now at junction with nose
    var sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0]
    this.reflectionLeft = (2*this.A[this.noseStart]-sum)/sum
    this.reflectionRight = (2*this.A[this.noseStart+1]-sum)/sum   
    this.reflectionNose = (2*this.noseA[0]-sum)/sum      
  }

  calculateNoseReflections()
  {
    for (var m = 0; m < this.noseLength; m++) 
    {
      var r = this.noseDiameter[m]
      this.noseA[m] = Math.PI * (r*r)
    }
    for (var m = 1; m < this.noseLength; m++)
    {
      this.noseReflection[m] = (this.noseA[m-1]-this.noseA[m]) / (this.noseA[m-1]+this.noseA[m]) 
    }
  }

  step(glottalExcitation, noise) {
    // mouth
    this.processTransients()
    this.addNoise(noise)
    
    this.junctionOutputR[0] = this.L[0] * this.glottalReflection + glottalExcitation
    this.junctionOutputL[this.N] = this.R[this.N-1] * this.lipReflection 
    
    for (var m=1; m<this.N; m++)
    {
        var r = this.reflection[m]
        var w = r * (this.R[m-1] + this.L[m])
        this.junctionOutputR[m] = this.R[m-1] - w
        this.junctionOutputL[m] = this.L[m] + w
    }    
    
    // now at junction with nose
    var m = this.noseStart
    var r = this.reflectionLeft
    this.junctionOutputL[m] = r*this.R[m-1]+(1+r)*(this.noseL[0]+this.L[m])
    r = this.reflectionRight
    this.junctionOutputR[m] = r*this.L[m]+(1+r)*(this.R[m-1]+this.noseL[0])     
    r = this.reflectionNose
    this.noseJunctionOutputR[0] = r*this.noseL[0]+(1+r)*(this.L[m]+this.R[m-1])
      
    for (var m = 0; m < this.N; m++)
    {          
        this.R[m] = this.junctionOutputR[m]*0.999
        this.L[m] = this.junctionOutputL[m+1]*0.999 
    }

    this.lipOutput = this.R[this.N-1]
    
    //nose     
    this.noseJunctionOutputL[this.noseLength] = this.noseR[this.noseLength-1] * this.lipReflection 
    
    for (var m = 1; m < this.noseLength; m++)
    {
        var w = this.noseReflection[m] * (this.noseR[m-1] + this.noseL[m])
        this.noseJunctionOutputR[m] = this.noseR[m-1] - w
        this.noseJunctionOutputL[m] = this.noseL[m] + w
    }
    
    for (var m = 0; m < this.noseLength; m++)
    {
        this.noseR[m] = this.noseJunctionOutputR[m] * 1
        this.noseL[m] = this.noseJunctionOutputL[m+1] * 1     
    }

    this.noseOutput = this.noseR[this.noseLength-1]
  }

  // Turbulence noise
  addNoise(noise) { this.addNoiseAtIndex(noise, 10, 10) } // * intensity
    
  addNoiseAtIndex(noise, index, diameter)
  {   
    var i = Math.floor(index)
    var delta = index - i
    // noise amplitude modulation now occurs in source node !!!
    var thinness = UTILS.clamp(8*(0.7-diameter),0,1)
    var openness = UTILS.clamp(30*(diameter-0.3), 0, 1)

    // divided by two for L-R split
    var noise0 = noise*(1-delta)*thinness*openness / 2
    var noise1 = noise*delta*thinness*openness / 2
    this.R[i+1] += noise0
    this.L[i+1] += noise0
    this.R[i+2] += noise1
    this.L[i+2] += noise1
  }

  reshapeTract(deltaTime)
  {
    var amount = deltaTime * this.movementSpeed     
    var newLastObstruction = -1
    for (var m = 0; m < this.N; m++)
    {
      var diameter = this.diameter[m]
      var targetDiameter = this.targetDiameter[m]
      if (diameter <= 0) newLastObstruction = m
      var slowReturn 
      if (m<this.noseStart) slowReturn = 0.6
      else if (m >= this.tipStart) slowReturn = 1.0 
      else slowReturn = 0.6+0.4*(m-this.noseStart)/(this.tipStart-this.noseStart)
      this.diameter[m] = UTILS.moveTowards(diameter, targetDiameter, slowReturn*amount, 2*amount)
    }
    if (this.lastObstruction>-1 && newLastObstruction == -1 && this.noseA[0]<0.05)
    {
      this.addTransient(this.lastObstruction)
    }
    this.lastObstruction = newLastObstruction
    
    amount = deltaTime * this.movementSpeed 
    this.noseDiameter[0] = UTILS.moveTowards(this.noseDiameter[0], this.velumTarget, amount*0.25, amount*0.1)
    this.noseA[0] = this.noseDiameter[0]*this.noseDiameter[0]        
  }

  addTransient(position) {
    var trans = {}
    trans.position = position
    trans.timeAlive = 0
    trans.lifeTime = 0.2
    trans.strength = 0.3
    trans.exponent = 200
    this.transients.push(trans)
  }
    
  processTransients() {
    for (var t = 0; t < this.transients.length; t++) {
      var trans = this.transients[t]
      var amplitude = trans.strength * Math.pow(2, -trans.exponent * trans.timeAlive)
      this.R[trans.position] += amplitude/2
      this.L[trans.position] += amplitude/2
      trans.timeAlive += 1.0/(sampleRate*2)
    }
    
    for (var t = this.transients.length-1; t>=0; t--) {
      var trans = this.transients[t]
      if (trans.timeAlive > trans.lifeTime) {
        this.transients.splice(t,1)
      }
    }
  }

  updateTongue(index, diameter)
  {
    // update rest & target diameter
    for (var i=this.bladeStart; i<this.lipStart; i++)
    {
      var blade = this.bladeStart
      var tip = this.tipStart
      var lip = this.lipStart
      var t = 1.1 * Math.PI * (index-i) / (tip-blade)
      var fixedDiameter = 2 + (diameter-2) / 1.5
      var curve = (1.5-fixedDiameter) * Math.cos(t)
      if (i == blade-2 || i == lip-1) curve *= 0.8
      if (i == blade || i == lip-2) curve *= 0.94              
      this.targetDiameter[i] = this.restDiameter[i] = 1.5 - curve
    }
    // for (var i=0; i<Tract.n; i++) Tract.targetDiameter[i] = Tract.restDiameter[i];
  }

  process(IN, OUT, PARAMS) {
    const glottalSource = IN[0][0] // single channel (0)
    const fricativeNoise = IN[1][0] // single channel (0)
    const output = OUT[0][0]
    // tongue
    const index = PARAMS.tongueIndex[0]
    const diameter = PARAMS.tongueDiameter[0]

    // block start
    for (let n = 0; n < 128; n++) {
      const source = glottalSource[n]
      const noise = fricativeNoise[n]

      // run step at twice the sample rate
      this.step(source, noise)
      this.step(source, noise)

      output[n] = this.lipOutput + this.noseOutput
    }
    // block end

    this.updateTongue(index, diameter)
    this.reshapeTract(128/sampleRate) // 128 / sampleRate
    this.calculateReflections()

    // port messages
    // this.port.postMessage(this.diameter)

    return true
  }
}

registerProcessor('tract', TractProcessor)