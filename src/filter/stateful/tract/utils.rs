use std::f64::consts::PI;

/// Returns the circular cross-sectional area for a given diameter.
pub fn circle_area(diameter: f64) -> f64 {
    return diameter * diameter / 4.0 * PI;
}

/// Returns the coefficient of reflection between two cross-sectional areas.
pub fn kelly_lochbaum(a1: f64, a2: f64) -> f64 {
    return (a1 - a2) / (a1 + a2);
}

