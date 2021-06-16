import * as Viardot from './viardot.js'

var canvas = document.getElementById("canvas");

// Events
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('focus', onFocus, false);
window.addEventListener('blur', onBlur, false);

function onMouseDown() { voice.start(); }
function onFocus() { voice.start(); }
function onBlur() { voice.stop(); }

// main program
const voice = new Viardot.Voice();