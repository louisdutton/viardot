import './utils'
import { worklet } from "../global"

export const name = 'tractFilter'
export const processor = /* javascript */`
  class TractFilterProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        { name: 'tongueIndex', defaultValue: .2, automationRate: 'k-rate'},
        { name: 'tongueDiameter', defaultValue: .2, automationRate: 'k-rate'},
        { name: 'lipDiameter', defaultValue: .5, automationRate: 'k-rate'},
        { name: 'tipIndex', defaultValue: .7, automationRate: 'k-rate'},
        { name: 'tipDiameter', defaultValue: 1, automationRate: 'k-rate'},
      ]
    }

    constructor({processorOptions: {proportions}}) { 
      super() 
      this.port.onmessage = (e) => this.port.postMessage(this.diameter)
    
      // Init cavities
      this.initOralCavity(proportions) // 44
      this.initNasalCavity(proportions) // 28

      // Ks
      this.KL = this.KR = this.KNose = 0
      this.calculateReflectionCoefficients()
      this.calculateNoseReflections()

      this.noseDiameter[0] = this.velumTarget
    }

    calculateArea = (d) => d * d / 4 * Math.PI
    kellyLochbaum = (A1, A2) => (A1-A2) / (A1+A2) 
    ease = x => x === 0 ? 0 : Math.pow(2, 10 * x - 10)

    initOralCavity({oralLength, maxDiameter}) {
      // sections
      const N = oralLength + (Math.random() * 2 - 1) << 0
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
          if (m < this.glottisEnd) diameter = this.glottalDiameter + this.ease(m/this.glottisEnd) * glottalDifference
          else if (m < this.pharynxEnd) diameter = this.pharyngealDiameter
          else diameter = this.oralDiameter
          this.diameter[m] = this.restDiameter[m] = this.targetDiameter[m] = diameter
      }


      // Reflection (can probably make a bunch of these constants)
      this.K = new Float64Array(N+1) // Reflection coefficients
      this.softK = .8
      this.hardK = .9
      this.glottalReflectionCoefficient = .7
      this.labialReflectionCoefficient = -.85
      this.lastObstruction = -1
      this.decay = .9999 // the coefficient of decay in the transfer function
      this.movementSpeed = 4 + Math.random() * 2 // cm per second
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
        this.A[m] = this.calculateArea(this.diameter[m])
      }
      for (let m=1; m<this.N; m++) {
        const coefficient = m > this.pharynxEnd ? this.hardK : this.softK
        // prevent error if 0
        this.K[m] = (this.A[m] == 0 ? 0.999 : this.kellyLochbaum(this.A[m-1], this.A[m])) * coefficient
      }
      
      // now at velopharyngeal junction / port
      const sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0]
      this.KL = (2*this.A[this.noseStart]-sum)/sum
      this.KR = (2*this.A[this.noseStart+1]-sum)/sum   
      this.KNose = (2*this.noseA[0]-sum)/sum      
    }

    calculateNoseReflections() {
      for (let m = 0; m < this.noseLength; m++) {
        this.noseA[m] = this.calculateArea(this.noseDiameter[m])
      }
      for (let m = 1; m < this.noseLength; m++) {
        this.noseK[m] = this.kellyLochbaum(this.noseA[m-1], this.noseA[m]) 
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

      // block start
      for (let n = 0; n < 128; n++) {
        const source = glottalSource[n]
        const noise = fricativeNoise[n]

        // run step at twice the sample rate
        this.step(source, noise, tipIndex, tipDiameter)
        this.step(source, noise, tipIndex, tipDiameter)
        // this.step(source, noise, tipIndex, tipDiameter)
        // this.step(source, noise, tipIndex, tipDiameter)

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
`

worklet.registerProcessor(name, processor)