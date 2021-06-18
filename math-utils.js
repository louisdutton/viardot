/** Returns a value clamped within range [a, b].
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 */
function clamp(value, a, b) {
    return Math.max(a, Math.min(value, b));
}

/** Returns a linear interpolation of point t between a, b.
* @param {Number} min The lower boundary of the output range
* @param {Number} max The upper boundary of the output range
*/
function lerp(a, b, t) {
    return a * (1-t) + b * t;
}

/** Returns a linear interpolation of point t between a, b.
* @param {Number} min The lower boundary of the output range
* @param {Number} max The upper boundary of the output range
*/
function moveTowards(a, b, value)
{
    if (a<b) return Math.min(a+value, b);
    else return Math.max(a-value, b);
}

/** Returns a linear interpolation of point t between a, b.
* @param {Number} min The lower boundary of the output range
* @param {Number} max The upper boundary of the output range
*/
function moveTowards(a, b, up, down)
{
    if (a<b) return Math.min(a+up, b);
    else return Math.max(a-down, b);
}