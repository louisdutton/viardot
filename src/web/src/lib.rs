// extern crate wasm_bindgen;

// use core::filter::stateful::tract::Tract;
// use core::source::Glottis;
// use wasm_bindgen::prelude::*;

// #[cfg(feature = "wee_alloc")]
// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// #[wasm_bindgen]
// extern "C" {
//     fn alert(s: &str);
// }

// #[no_mangle]
// pub extern "C" fn buffer_alloc(size: usize) -> *mut f32 {
//     let mut buffer = Vec::<f32>::with_capacity(size);
//     let ptr = buffer.as_mut_ptr();
//     std::mem::forget(buffer);
//     return ptr as *mut f32;
// }

#[no_mangle]
pub extern "C" fn test(time: f64) -> f64 {
    // let mut glottis = Glottis::new();
    // return glottis.tick(0.5);
    time.sin()
}

// #[no_mangle]
// pub extern "C" fn process(out_ptr: *mut f32, sample_count: u32) {
//     soundchip.process(out_ptr, sample_count);
// }
