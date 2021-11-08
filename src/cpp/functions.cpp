#include <emscripten.h>
#include "OpenSimplexNoise.h"

// TODO Get the glottal and tract processor running in pure C++. Then work on the WASM.

OpenSimplexNoise::Noise noise;

EMSCRIPTEN_KEEPALIVE
// 2D Open Simplex Noise.
double noise2D(double x, double y)
{
  return noise.eval(x, y);
}

// Coefficient of reflection at the glottis.
const float glottalK = 0.7;

// Coefficient of reflection at the labia.
const float labialK = -0.85;

// Coefficient of reflection at the nose.
const float nasalK = -0.9;

// Number of segments in the buccal cavity.
const int buccalLength = 44;

// Number of segments in the nasal cavity.
const int nasalLength = 28;

// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const int velumIndex = 17;

// The coefficients of reflection for each segment within the buccal cavity.
float K [buccalLength];

// The right-moving component of sonic propagation.
float R [buccalLength];

// The left-moving component of sonic propagation.
float L [buccalLength];

float step(float excitation, float noise)
{
  // Junctions are reset per iteration
  float junctionR[buccalLength + 1];
  float junctionL[buccalLength + 1];

  // Glottal excitation enters left and labial reflection enters right
  junctionR[0] = L[0] * glottalK + excitation;
  junctionL[buccalLength] = R[buccalLength - 1] * labialK;

  // reflection {w} at each junction
  for (int m=1; m<buccalLength; m++) {
    float w = K[m] * (R[m-1] + L[m]); // reflection
    junctionR[m] = R[m-1] - w;
    junctionL[m] = L[m] + w;
  }

  // Calculate reflections at the velopharyngeal junction
  // const int v = velumIndex&; // velum
  // let r = KL
  // junctionOutputL[v] = r*R[v-1]+(1+r)*(noseL[0]+L[v])
  // r = KR
  // junctionOutputR[v] = r*L[v]+(1+r)*(R[v-1]+noseL[0])
  // r = KNose
  // noseJunctionOutputR[0] = r*noseL[0]+(1+r)*(L[v]+R[v-1])

  return excitation;
}

EMSCRIPTEN_KEEPALIVE
float *process(float excitationSamples[], float noiseSamples[], int blockSize)
{
  float output[blockSize];
  for (int n = 0; n < blockSize; n++)
  {
    const float excitation = excitationSamples[n];
    const float noise = noiseSamples[n];

    // run step twice per sample
    step(excitation, noise);
    step(excitation, noise);

    // output[n] = labialOutput + nasalOutput;
  }
  return output;
}

// float TractStep(float excitation, float noise) {
//

//   

//   // now at junction with nose (velum)
//  

//   // decay at each junction
//   for (let m = 0; m < N; m++) {
//       R[m] = junctionOutputR[m]*decay
//       L[m] = junctionOutputL[m+1]*decay
//   }

//   // Nose
//   noseJunctionOutputL[noseLength] = noseR[noseLength-1] * labialReflectionCoefficient

//   for (let v = 1; v < noseLength; v++) {
//       const w = noseK[v] * (noseR[v-1] + noseL[v])
//       noseJunctionOutputR[v] = noseR[v-1] - w
//       noseJunctionOutputL[v] = noseL[v] + w
//   }

//   // decay in nasal cavity
//   for (int v = 0; v < noseLength; v++) {
//       noseR[v] = noseJunctionOutputR[v] * decay;
//       noseL[v] = noseJunctionOutputL[v+1] * decay;
//   }
// }