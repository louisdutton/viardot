// Original code from https://easings.net
// Modifed by Louis Dutton.

type EasingFunction = (progress: number) => number

interface EasingDictionary {
  [easing: string]: EasingFunction
}

const pow = Math.pow
const sqrt = Math.sqrt
const sin = Math.sin
const cos = Math.cos
const PI = Math.PI
const c1 = 1.70158
const c2 = c1 * 1.525
const c3 = c1 + 1
const c4 = (2 * PI) / 3
const c5 = (2 * PI) / 4.5

const bounceout: EasingFunction = (x) => {
  const n1 = 7.5625
  const d1 = 2.75

  return x < 1 / d1
    ? n1 * x * x
    : x < 2 / d1
    ? n1 * (x -= 1.5 / d1) * x + 0.75
    : x < 2.5 / d1
    ? n1 * (x -= 2.25 / d1) * x + 0.9375
    : n1 * (x -= 2.625 / d1) * x + 0.984375
}

const Ease: EasingDictionary = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2),
  inQuart: (x) => x * x * x * x,
  outQuart: (x) => 1 - pow(1 - x, 4),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2),
  inQuint: (x) => x * x * x * x * x,
  outQuint: (x) => 1 - pow(1 - x, 5),
  inOutQuint: (x) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2),
  inSine: (x) => 1 - cos((x * PI) / 2),
  outSine: (x) => sin((x * PI) / 2),
  inOutSine: (x) => -(cos(PI * x) - 1) / 2,
  inExpo: (x) => (x === 0 ? 0 : pow(2, 10 * x - 10)),
  outExpo: (x) => (x === 1 ? 1 : 1 - pow(2, -10 * x)),
  inOutExpo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2),
  inCirc: (x) => 1 - sqrt(1 - pow(x, 2)),
  outCirc: (x) => sqrt(1 - pow(x - 1, 2)),
  inOutCirc: (x) => (x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2),
  inBack: (x) => c3 * x * x * x - c1 * x * x,
  outBack: (x) => 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2),
  inOutBack: (x) =>
    x < 0.5
      ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,
  inElastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4)),
  outElastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1),
  inOutElastic: (x) =>
    x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
      : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1,
  inBounce: (x) => 1 - bounceout(1 - x),
  outBounce: bounceout,
  inOutBounce: (x) => (x < 0.5 ? (1 - bounceout(1 - 2 * x)) / 2 : (1 + bounceout(2 * x - 1)) / 2),
}

export default Ease
