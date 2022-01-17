/// Returns the circular cross-sectional area for a given diameter.
pub fn circle_area(diameter: f64) -> f64 {
    return diameter * diameter / 4.0 * std::f64::consts::PI;
}

/// Returns the coefficient of reflection between two cross-sectional areas.
pub fn kelly_lochbaum(a1: f64, a2: f64) -> f64 {
    return (a1 - a2) / (a1 + a2);
}

/// Returns an eased value in range [0-1].
pub fn ease(x: f64) -> f64 {
    if x == 0.0 {
        return 0.0;
    } else {
        return f64::powf(2.0, 10.0 * x - 10.0);
    }
}

pub fn min(a: f64, b: f64) -> f64 {
    if a < b {
        a
    } else {
        b
    }
}
