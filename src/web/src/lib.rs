extern crate wasm_bindgen;

// use core::filter::stateful::tract::Tract;
use core::source::Glottis;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn test(time: f64) -> f64 {
    let mut glottis = Glottis::new();
    return glottis.tick(time);
}
