function clamp(value, a, b) {
  return Math.max(a, Math.min(value, b))
}

function moveTowards(a, b, value) {
  return (a<b)
    ? Math.min(a+value, b)
    : Math.max(a-value, b)
}

class TractProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'tongueIndex', defaultValue: 0.84, automationRate: 'k-rate'},
      { name: 'tongueDiameter', defaultValue: 0.73, automationRate: 'k-rate'},
      { name: 'lipIndex', defaultValue: 41, automationRate: 'k-rate'},
      { name: 'lipDiameter', defaultValue: 3, automationRate: 'k-rate'},
      { name: 'tipIndex', defaultValue: 0.7, automationRate: 'k-rate'},
      { name: 'tipDiameter', defaultValue: 1, automationRate: 'k-rate'},
    ]
  }

  constructor() { 
    super() 
    this.port.onmessage = (e) => this.port.postMessage(this.diameter)

    // Init cavities
    // var tractLength = 37 + Math.round(Math.random() * 6)
    this.initOralCavity(40) // 44=tenor, 
    this.initNasalCavity(28) // 28

    // Ks
    this.KL = this.KR = this.KNose = 0
    this.calculateReflections()
    this.calculateNoseReflections()

    this.noseDiameter[0] = this.velumTarget
  }

  initOralCavity(N) {
    // sections
    this.N = N
    this.bladeStart = Math.round(N * 0.227)
    this.tipStart = Math.round(N * 0.727)
    this.lipStart = Math.round(N * 0.886)

    // values
    this.R = new Float64Array(N) // right-moving component
    this.L = new Float64Array(N) // left-moving component
    this.K = new Float64Array(N+1)
    this.junctionOutputR = new Float64Array(N+1)
    this.junctionOutputL = new Float64Array(N+1)

    // diameter & cross-sectional area
    this.maxDiameter = this.oralDiameter = 3
    this.glottalDiameter = this.oralDiameter * 0.4
    this.pharyngealDiameter = this.oralDiameter * 0.9
    this.diameter = new Float64Array(N)
    this.restDiameter = new Float64Array(N)
    this.targetDiameter = new Float64Array(N)
    this.A = new Float64Array(N) // cross-sectional areas

    var phraynxStart = N * 0.2
    var oralStart = N * 0.275

    // tract diameter calc
    for (var m = 0; m < N; m++)
    {
        var diameter = 0
        if (m < phraynxStart) diameter = this.glottalDiameter
        else if (m < oralStart) diameter = this.pharyngealDiameter
        else diameter = this.oralDiameter
        this.diameter[m] = this.restDiameter[m] = this.targetDiameter[m] = diameter
    }

    this.glottalK = 0.7 // reflection at glottis
    this.lipK = -0.85 // reflection at labia (lips)
    this.lastObstruction = -1
    this.decay = 0.999 // the coefficient of decay in the transfer function
    this.movementSpeed = 15 // cm per second
    this.transients = [] // stop consonants
    this.lipOutput = 0 // outout at the labia (lips)
  }

  initNasalCavity(N) {
    this.noseOutput = 0
    this.velumOpen = 0.1
    this.velumTarget = 0.01
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

    for (var i = 0; i < N; i++)
    {
        var d = 2 * (i/N)
        var diameter = (d<1) ? 0.4 + (1.6 * d) : 0.5 + 1.5 * (2-d)
        this.noseDiameter[i] = Math.min(diameter, 1.9) * this.noseLength / 28 // fix magic numbers
    }
  }

  // Kelly-Lochenbaum junction (sonic transfer function)
  kl(A1, A2) { return (A1-A2)/(A1+A2) }

  calculateReflections()
  {
    for (var m=0; m<this.N; m++) 
    {
      this.A[m] = this.diameter[m] * this.diameter[m] //ignoring PI etc.
    }
    for (var m=1; m<this.N; m++)
    {
      // prevent error if 0
      this.K[m] = this.A[m] == 0 ? 0.999 : this.kl(this.A[m-1], this.A[m])
    }
    
    // now at velopharyngeal junction / port
    var sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0]
    this.KL = (2*this.A[this.noseStart]-sum)/sum
    this.KR = (2*this.A[this.noseStart+1]-sum)/sum   
    this.KNose = (2*this.noseA[0]-sum)/sum      
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
      this.noseK[m] = this.kl(this.noseA[m-1], this.noseA[m]) 
    }
  }

  step(glottalExcitation, noise, index, diameter) {
    // mouth
    this.processTransients()
    this.addFricativeNoise(noise * 0.5, index, diameter)
    
    this.junctionOutputR[0] = this.L[0] * this.glottalK + glottalExcitation
    this.junctionOutputL[this.N] = this.R[this.N-1] * this.lipK 
    
    for (var v=1; v<this.N; v++)
    {
        var r = this.K[v]
        var w = r * (this.R[v-1] + this.L[v])
        this.junctionOutputR[v] = this.R[v-1] - w
        this.junctionOutputL[v] = this.L[v] + w
    }    
    
    // now at junction with nose (velum)
    var v = this.noseStart // velum
    var r = this.KL
    this.junctionOutputL[v] = r*this.R[v-1]+(1+r)*(this.noseL[0]+this.L[v])
    r = this.KR
    this.junctionOutputR[v] = r*this.L[v]+(1+r)*(this.R[v-1]+this.noseL[0])     
    r = this.KNose
    this.noseJunctionOutputR[0] = r*this.noseL[0]+(1+r)*(this.L[v]+this.R[v-1])
    
    // decay in oral cavity 
    for (var v = 0; v < this.N; v++)
    {          
        this.R[v] = this.junctionOutputR[v]*this.decay
        this.L[v] = this.junctionOutputL[v+1]*this.decay
    }

    this.lipOutput = this.R[this.N-1]
    
    //nose     
    this.noseJunctionOutputL[this.noseLength] = this.noseR[this.noseLength-1] * this.lipK 
    
    for (var v = 1; v < this.noseLength; v++)
    {
        var w = this.noseK[v] * (this.noseR[v-1] + this.noseL[v])
        this.noseJunctionOutputR[v] = this.noseR[v-1] - w
        this.noseJunctionOutputL[v] = this.noseL[v] + w
    }
    
    // decay in nasal cavity 
    for (var v = 0; v < this.noseLength; v++)
    {
        this.noseR[v] = this.noseJunctionOutputR[v] * this.decay
        this.noseL[v] = this.noseJunctionOutputL[v+1] * this.decay   
    }

    this.noseOutput = this.noseR[this.noseLength-1]
  }

  // Turbulence noise
    
  addFricativeNoise(noise, index, diameter)
  {   
    var i = Math.floor(index)
    var delta = index - i
    // noise amplitude modulation now occurs in source node !!!
    var thinness = clamp(8*(0.7-diameter),0,1)
    var openness = clamp(30*(diameter-0.3), 0, 1)

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
      this.diameter[m] = moveTowards(diameter, targetDiameter, slowReturn*amount, 2*amount)
    }
    if (this.lastObstruction>-1 && newLastObstruction == -1 && this.noseA[0]<0.05)
    {
      this.addTransient(this.lastObstruction)
    }
    this.lastObstruction = newLastObstruction
    
    amount = deltaTime * this.movementSpeed 
    this.noseDiameter[0] = moveTowards(this.noseDiameter[0], this.velumTarget, amount*0.25, amount*0.1)
    this.noseA[0] = this.noseDiameter[0]*this.noseDiameter[0]        
  }

  addTransient(position) {
    var trans = {}
    trans.position = position
    trans.timeAlive = 0
    trans.lifeTime = 0.25
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
    var blade = this.bladeStart
    var tip = this.tipStart
    var lip = this.lipStart

    var d = this.oralDiameter * 0.66
    var fixedDiameter = d + (diameter-d) / (this.oralDiameter * 0.5)

    // update rest & target diameter
    for (var i=this.bladeStart; i<this.lipStart; i++)
    {
      var t = 1.1 * Math.PI * (index-i) / (tip-blade)
      var curve = (1.5-fixedDiameter) * Math.cos(t)
      if (i == blade-2 || i == lip-1) curve *= 0.8
      if (i == blade || i == lip-2) curve *= 0.94              
      this.targetDiameter[i] = this.restDiameter[i] = 1.5 - curve
    }
  }

  // THIS FOR SOME READSON PERMANENTLY REDUCES VOLUME
  updateConstrictions(ind, dia) {
    var tip = this.tipStart

    var index = ind * this.N
    var diameter = dia * this.oralDiameter
    this.velumTarget = diameter < 0 ? this.velumOpen : this.velumTarget
    diameter -= 0.3; // min diameter required to produce sound
    if (diameter<0) diameter = 0;         
    var width;
    if (index<25) width = 10;
    else if (index>=tip) width= 5;
    else width = 10-5*(index-25)/(tip-25);
    if (index >= 2 && index < this.N && diameter < this.maxDiameter)
    {
      var intIndex = Math.round(index);
      for (var i=-Math.ceil(width)-1; i<width+1; i++) 
      {   
        if (intIndex+i<0 || intIndex+i>=this.N) continue;
        var relpos = (intIndex+i) - index;
        relpos = Math.abs(relpos)-0.5;
        var shrink;
        if (relpos <= 0) shrink = 0;
        else if (relpos > width) shrink = 1;
        else shrink = 0.5*(1-Math.cos(Math.PI * relpos / width));
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
    // const lipIndex = PARAMS.tongueIndex[0]
    // const lipDiameter = PARAMS.tongueDiameter[0]

    // var turbulenceIndex, turbulenceDiameter;
    // if tipIndex > lip

    // block start
    for (let n = 0; n < 128; n++) {
      const source = glottalSource[n]
      const noise = fricativeNoise[n]

      // run step at twice the sample rate
      this.step(source, noise, tipIndex, tipDiameter)
      this.step(source, noise, tipIndex, tipDiameter)

      output[n] = this.lipOutput + this.noseOutput
    }

    // block end
    this.updateTongue(tongueIndex, tongueDiameter)
    this.updateConstrictions(tipIndex, tipDiameter)
    this.reshapeTract(128/sampleRate) // 128 / sampleRate
    this.calculateReflections()

    return true
  }
}

registerProcessor('tract', TractProcessor)