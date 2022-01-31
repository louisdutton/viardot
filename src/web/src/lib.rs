extern crate wasm_bindgen;

// use core::filter::stateful::tract::Tract;
// use core::source::Glottis;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn test() -> i32 {
    let mut a = 0;
    for n in 0..256 {
        a += n;
    }
    return a;
}
