#include <emscripten.h>
#include <cmath>
#include "OpenSimplexNoise.h"

// TODO Get the glottal and tract processor running in pure C++. Then work on the WASM.

OpenSimplexNoise::Noise noise;

EMSCRIPTEN_KEEPALIVE
// 2D Open Simplex Noise.
double noise2D(double x, double y)
{
  return noise.eval(x, y);
}

// Returns the cross-sectional area for a given diameter.
float calculateArea(float diameter)
{
  return diameter * diameter / 4 * M_PI;
}

// Returns the coefficient of reflection between two cross-sectional areas.
float kellyLochbaum(float A1, float A2)
{
  return (A1 - A2) / (A1 + A2);
}

// Returns an eased value in range [0-1].
float ease(float x)
{
  return x == 0 ? 0 : powf(2, 10 * x - 10);
}

// Coefficient of reflection at the glottis.
const float glottalK = 0.7;

// Coefficient of reflection at the labia.
const float labialK = -0.85;

// Coefficient of reflection at the nose.
const float nasalK = -0.9;

// Left-moving coefficient of reflection at the nasopharyngeal junction.
const float velumKL = 0;

// Right-moving coefficient of reflection at the nasopharyngeal junction.
const float velumKR = 0;

// Number of segments in the buccal cavity.
const int buccalLength = 44;

// Number of segments in the nasal cavity.
const int nasalLength = 28;

// The index of the buccal segment that connects the pharyngeal and nasal cavities.
const int velumIndex = 17;

const float attenuation = 0.9999;

// The coefficients of reflection for each segment within the pharyngeal & buccal cavities.
float K[buccalLength];

// The left-moving component of sound propagating the pharyngeal & buccal cavities.
float L[buccalLength];

// The right-moving component of sound propagating the pharyngeal & buccal cavities.
float R[buccalLength];

float junctionR[buccalLength + 1];
float junctionL[buccalLength + 1];

// The left-moving component of sound propagating the nasal cavity.
float nasalL[nasalLength];

// The right-moving component of sound propagating the nasal cavity.
float nasalR[nasalLength];

float nasalJunctionR[buccalLength + 1];
float nasalJunctionL[buccalLength + 1];

// Simulates the propogation of sound within the vocal tract (must run at twice the sample rate).
float step(float excitation, float noise)
{
  // Calculate reflections in the buccal cavity.

  // Glottal excitation enters left and labial reflection enters right
  junctionR[0] = L[0] * glottalK + excitation;
  junctionL[buccalLength] = R[buccalLength - 1] * labialK;

  // reflection {w} at each junction
  for (int m = 1; m < buccalLength; m++)
  {
    float w = K[m] * (R[m - 1] + L[m]); // reflection
    junctionR[m] = R[m - 1] - w;
    junctionL[m] = L[m] + w;
  }

  // Calculate reflections at the velopharyngeal junction
  int v = velumIndex;
  junctionL[v] = velumKL * R[v - 1] + (1 + velumKL) * (nasalL[0] + L[v]);
  junctionR[v] = velumKR * L[v] + (1 + velumKR) * (R[v - 1] + nasalL[0]);
  nasalJunctionR[0] = nasalK * nasalL[0] + (1 + nasalK) * (L[v] + R[v - 1]);

   // Transfer attenuated energy to 
  for (int m = 0; m < buccalLength; m++) {
      R[m] = junctionR[m] * attenuation;
      L[m] = junctionL[m+1] * attenuation;
  }
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