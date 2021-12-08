const combFilterTunings = [
  1557 / 44100,
  1617 / 44100,
  1491 / 44100,
  1422 / 44100,
  1277 / 44100,
  1356 / 44100,
  1188 / 44100,
  1116 / 44100,
]
const allpassFilterFrequencies = [225, 556, 441, 341]

interface CombFilterNode extends BiquadFilterNode {
  resonance: AudioParam
  dampening: AudioParam
}

export default function Freeverb(audioContext: any) {
  const node = audioContext.createGain()
  node.channelCountMode = "explicit"
  node.channelCount = 2

  const output = audioContext.createGain()
  const merger = audioContext.createChannelMerger(2)
  const splitter = audioContext.createChannelSplitter(2)
  const highpass = audioContext.createBiquadFilter()
  highpass.type = "highpass"
  highpass.frequency.value = 200

  const wet = audioContext.createGain()
  const dry = audioContext.createGain()

  node.connect(dry)
  node.connect(wet)
  wet.connect(splitter)
  merger.connect(highpass)
  highpass.connect(output)
  dry.connect(output)

  const combFilters: CombFilterNode[] = []
  const allpassFiltersL: BiquadFilterNode[] = []
  const allpassFiltersR: BiquadFilterNode[] = []
  let roomSize = 0.8
  let dampening = 3000

  // make the allpass filters on the right
  for (let l = 0; l < allpassFilterFrequencies.length; l++) {
    const allpassL = audioContext.createBiquadFilter()
    allpassL.type = "allpass"
    allpassL.frequency.value = allpassFilterFrequencies[l]
    allpassFiltersL.push(allpassL)

    if (allpassFiltersL[l - 1]) {
      allpassFiltersL[l - 1].connect(allpassL)
    }
  }

  // make the allpass filters on the left
  for (let r = 0; r < allpassFilterFrequencies.length; r++) {
    const allpassR = audioContext.createBiquadFilter()
    allpassR.type = "allpass"
    allpassR.frequency.value = allpassFilterFrequencies[r]
    allpassFiltersR.push(allpassR)

    if (allpassFiltersR[r - 1]) {
      allpassFiltersR[r - 1].connect(allpassR)
    }
  }

  allpassFiltersL[allpassFiltersL.length - 1].connect(merger, 0, 0)
  allpassFiltersR[allpassFiltersR.length - 1].connect(merger, 0, 1)

  // make the comb filters
  for (let c = 0; c < combFilterTunings.length; c++) {
    const lfpf = LowpassCombFilter(audioContext)
    lfpf.delayTime.value = combFilterTunings[c]
    if (c < combFilterTunings.length / 2) {
      splitter.connect(lfpf, 0)
      lfpf.connect(allpassFiltersL[0])
    } else {
      splitter.connect(lfpf, 1)
      lfpf.connect(allpassFiltersR[0])
    }
    combFilters.push(lfpf)
  }

  Object.defineProperties(node, {
    roomSize: {
      get: () => roomSize,
      set: function (value) {
        roomSize = value
        refreshFilters()
      },
    },
    dampening: {
      get: () => dampening,
      set: (value) => {
        dampening = value
        refreshFilters()
      },
    },
  })

  refreshFilters()

  node.connect = output.connect.bind(output)
  node.disconnect = output.disconnect.bind(output)
  node.wet = wet.gain
  node.dry = dry.gain

  // expose combFilters for direct automation
  node.combFilters = combFilters

  return node

  // scoped

  function refreshFilters() {
    for (let i = 0; i < combFilters.length; i++) {
      combFilters[i].resonance.value = roomSize
      combFilters[i].dampening.value = dampening
    }
  }
}

function LowpassCombFilter(ctx: any) {
  const node = ctx.createDelay(1)

  const output = ctx.createBiquadFilter()

  // this magic number seems to fix everything in Chrome 53
  // see https://github.com/livejs/freeverb/issues/1#issuecomment-249080213
  output.Q.value = -3.0102999566398125

  output.type = "lowpass"
  node.dampening = output.frequency

  const feedback = ctx.createGain()
  node.resonance = feedback.gain

  node.connect(output)
  output.connect(feedback)
  feedback.connect(node)

  node.dampening.value = 3000
  node.delayTime.value = 0.1
  node.resonance.value = 0.5

  return node
}
