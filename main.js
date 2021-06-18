import * as VIARDOT from './viardot.js';

var canvas = document.getElementById("canvas");

// Events
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('focus', onFocus, false);
window.addEventListener('blur', onBlur, false);

const input = document.querySelector('input');
const log = document.getElementById('values');

input.addEventListener('input', onInput);

function onMouseDown() { voice.start(); }
function onMouseMove(e) { 
  voice.setTargetFrequency(window.innerHeight - e.clientY);
  voice.vibratoLFO.frequency.value = (e.clientX / window.innerWidth) * 10;
}
function onFocus() { voice.start(); }
function onBlur() { voice.stop(); }
function onInput(e) {
  var words = e.target.value.split(/ /);
  var ipa = '';
  words.forEach(word => { ipa += VIARDOT.toPhonemes(word, true) + ' '; });
  log.textContent = ipa;
}

// main program
const voice = new VIARDOT.Voice();