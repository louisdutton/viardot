class TractProcessor extends AudioWorkletProcessor {
    constructor() { 
      super(); 

      // sections
      var N = this.N = 44;
      this.bladeStart = 10;
      this.tipStart = 32;
      this.lipStart = 39;

      // values
      this.R = new Float64Array(N); // right-moving component
      this.L = new Float64Array(N); // left-moving component
      this.reflection = new Float64Array(N+1);
      this.junctionOutputR = new Float64Array(N+1);
      this.junctionOutputL = new Float64Array(N+1);

      // diameter & cross-sectional area
      this.diameter = new Float64Array(N);
      this.restDiameter = new Float64Array(N);
      this.targetDiameter = new Float64Array(N);
      this.A = new Float64Array(N);

      // magic numbers are relative to 44
      for (var i = 0; i < N; i++)
      {
          var diameter = 0;
          if (i < 7 - 0.5) diameter = 0.6;
          else if (i < 12) diameter = 1.1;
          else diameter = 1.5;
          this.diameter[i] = this.restDiameter[i] = this.targetDiameter[i] = diameter;
      }

      this.A = [];
      this.glottalReflection = 0.75;
      this.lipReflection = -0.85;
      this.lastObstruction = -1;
      this.fade = 1.0; //0.9999,
      this.movementSpeed = 15; //cm per second
      this.transients = [];
      this.lipOutput = 0;

      // Nose
      this.initNose(28);

      // reflections
      this.reflectionLeft = this.reflectionRight = this.reflectionNose = 0;
      this.calculateReflections();        
      this.calculateNoseReflections();

      this.noseDiameter[0] = this.velumTarget;
    }

    initNose(N) {
      this.noseOutput = 0;
      this.velumTarget = 0.01;
      this.noseLength = N;
      this.noseStart = this.N - N + 1;
      this.noseR = new Float64Array(N);
      this.noseL = new Float64Array(N);
      this.noseJunctionOutputR = new Float64Array(N+1);
      this.noseJunctionOutputL = new Float64Array(N+1);        
      this.noseReflection = new Float64Array(N+1);
      this.noseDiameter = new Float64Array(N);
      this.noseA = new Float64Array(N);
      this.noseMaxAmplitude = new Float64Array(N);
      for (var i = 0; i < N; i++)
      {
          var diameter;
          var d = 2 * (i/N);
          if (d<1) diameter = 0.4 + (1.6 * d);
          else diameter = 0.5 + 1.5 * (2-d);
          diameter = Math.min(diameter, 1.9);
          this.noseDiameter[i] = diameter;
      }       
    }

    calculateReflections()
    {
      for (var i=0; i<this.N; i++) 
      {
        this.A[i] = this.diameter[i]*this.diameter[i]; //ignoring PI etc.
      }
      for (var i=1; i<this.N; i++)
      {
        if (this.A[i] == 0) this.reflection[i] = 0.999; //to prevent some bad behaviour if 0
        else this.reflection[i] = (this.A[i-1]-this.A[i]) / (this.A[i-1]+this.A[i]); // kl junction
      }
      
      //now at junction with nose
      var sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0];
      this.reflectionLeft = (2*this.A[this.noseStart]-sum)/sum;
      this.reflectionRight = (2*this.A[this.noseStart+1]-sum)/sum;   
      this.reflectionNose = (2*this.noseA[0]-sum)/sum;      
    }

    calculateNoseReflections()
    {
      for (var i=0; i<this.noseLength; i++) 
      {
        this.noseA[i] = this.noseDiameter[i]*this.noseDiameter[i]; 
      }
      for (var i=1; i<this.noseLength; i++)
      {
        this.noseReflection[i] = (this.noseA[i-1]-this.noseA[i]) / (this.noseA[i-1]+this.noseA[i]); 
      }
    }

    step(glottalExcitation, lambda) {
      // mouth
      // this.processTransients();
      // this.addTurbulenceNoise(turbulenceNoise);
      
      this.junctionOutputR[0] = this.L[0] * this.glottalReflection + glottalExcitation;
      this.junctionOutputL[this.N] = this.R[this.N-1] * this.lipReflection; 
      
      for (var i=1; i<this.N; i++)
      {
          var r = this.reflection[i];
          var w = r * (this.R[i-1] + this.L[i]);
          this.junctionOutputR[i] = this.R[i-1] - w;
          this.junctionOutputL[i] = this.L[i] + w;
      }    
      
      // now at junction with nose
      var i = this.noseStart;
      var r = this.reflectionLeft;
      this.junctionOutputL[i] = r*this.R[i-1]+(1+r)*(this.noseL[0]+this.L[i]);
      r = this.reflectionRight;
      this.junctionOutputR[i] = r*this.L[i]+(1+r)*(this.R[i-1]+this.noseL[0]);     
      r = this.reflectionNose;
      this.noseJunctionOutputR[0] = r*this.noseL[0]+(1+r)*(this.L[i]+this.R[i-1]);
       
      for (var i=0; i<this.N; i++)
      {          
          this.R[i] = this.junctionOutputR[i]*0.999;
          this.L[i] = this.junctionOutputL[i+1]*0.999; 
      }

      this.lipOutput = this.R[this.N-1];
      
      //nose     
      this.noseJunctionOutputL[this.noseLength] = this.noseR[this.noseLength-1] * this.lipReflection; 
      
      for (var i = 1; i < this.noseLength; i++)
      {
          var w = this.noseReflection[i] * (this.noseR[i-1] + this.noseL[i]);
          this.noseJunctionOutputR[i] = this.noseR[i-1] - w;
          this.noseJunctionOutputL[i] = this.noseL[i] + w;
      }
      
      for (var i = 0; i < this.noseLength; i++)
      {
          this.noseR[i] = this.noseJunctionOutputR[i] * 1;
          this.noseL[i] = this.noseJunctionOutputL[i+1] * 1;     
      }

      this.noseOutput = this.noseR[this.noseLength-1];

      return this.lipOutput + this.noseOutput;
      return glottalExcitation;
    }

    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const noise = inputs[1];
      const output = outputs[0];

      // block start
      for (let channel = 0; channel < input.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        for (let n = 0; n < 128; n++) {
          // outputChannel[n] = inputChannel[n] / 2;
          outputChannel[n] = this.step(inputChannel[n], n/128);
        }
      }

      // block end
      // this.reshapeTract(AudioSystem.bufferDuration);
      this.calculateReflections();

      return true;
    }
  }

  registerProcessor('tract-filter', TractProcessor);
    

  
    // }
      
    // reshapeTract(deltaTime)
    // {
    //   var amount = deltaTime * this.movementSpeed; ;    
    //   var newLastObstruction = -1;
    //   for (var i=0; i<this.n; i++)
    //   {
    //     var diameter = this.diameter[i];
    //     var targetDiameter = this.targetDiameter[i];
    //     if (diameter <= 0) newLastObstruction = i;
    //     var slowReturn; 
    //     if (i<this.noseStart) slowReturn = 0.6;
    //     else if (i >= this.tipStart) slowReturn = 1.0; 
    //     else slowReturn = 0.6+0.4*(i-this.noseStart)/(this.tipStart-this.noseStart);
    //     this.diameter[i] = Math.moveTowards(diameter, targetDiameter, slowReturn*amount, 2*amount);
    //   }
    //   if (this.lastObstruction>-1 && newLastObstruction == -1 && this.noseA[0]<0.05)
    //   {
    //     this.addTransient(this.lastObstruction);
    //   }
    //   this.lastObstruction = newLastObstruction;
      
    //   amount = deltaTime * this.movementSpeed; 
    //   this.noseDiameter[0] = Math.moveTowards(this.noseDiameter[0], this.velumTarget, 
    //       amount*0.25, amount*0.1);
    //   this.noseA[0] = this.noseDiameter[0]*this.noseDiameter[0];        
    // }
      
    // addTransient(position)
    // {
    //   var trans = {}
    //   trans.position = position;
    //   trans.timeAlive = 0;
    //   trans.lifeTime = 0.2;
    //   trans.strength = 0.3;
    //   trans.exponent = 200;
    //   this.transients.push(trans);
    // }
      
    // processTransients()
    // {
    //   for (var i = 0; i < this.transients.length; i++)  
    //   {
    //     var trans = this.transients[i];
    //     var amplitude = trans.strength * Math.pow(2, -trans.exponent * trans.timeAlive);
    //     this.R[trans.position] += amplitude/2;
    //     this.L[trans.position] += amplitude/2;
    //     trans.timeAlive += 1.0/(sampleRate*2);
    //   }
    //   for (var i=this.transients.length-1; i>=0; i--)
    //   {
    //     var trans = this.transients[i];
    //     if (trans.timeAlive > trans.lifeTime)
    //     {
    //       this.transients.splice(i,1);
    //     }
    //   }
    // }
      
    // addTurbulenceNoise(turbulenceNoise)
    // {
    //   for (var j=0; j<UI.touchesWithMouse.length; j++)
    //   {
    //     var touch = UI.touchesWithMouse[j];
    //     if (touch.index<2 || touch.index>Tract.n) continue;
    //     if (touch.diameter<=0) continue;            
    //     var intensity = touch.fricative_intensity;
    //     if (intensity == 0) continue;
    //     this.addTurbulenceNoiseAtIndex(0.66*turbulenceNoise*intensity, touch.index, touch.diameter);
    //   }
    // }
      
    // addTurbulenceNoiseAtIndex(turbulenceNoise, index, diameter)
    // {   
    //   var i = Math.floor(index);
    //   var delta = index - i;
    //   turbulenceNoise *= Glottis.getNoiseModulator();
    //   var thinness0 = Math.clamp(8*(0.7-diameter),0,1);
    //   var openness = Math.clamp(30*(diameter-0.3), 0, 1);
    //   var noise0 = turbulenceNoise*(1-delta)*thinness0*openness;
    //   var noise1 = turbulenceNoise*delta*thinness0*openness;
    //   this.R[i+1] += noise0/2;
    //   this.L[i+1] += noise0/2;
    //   this.R[i+2] += noise1/2;
    //   this.L[i+2] += noise1/2;
    // }