{
  description = "A physically-modelled vocal synthesis framework";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    flake-utils,
    rust-overlay,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [rust-overlay.overlays.default];
        };

        rust = pkgs.rust-bin.stable.latest.default.override {
          extensions = ["rust-src"];
        };
      in
        with pkgs; { 
          devShells.default = mkShell {
            buildInputs = [
              rust
              cargo
              rust-analyzer
            ];

            env = {
              RUST_SRC_PATH = "${rust}/lib/rustlib/src/rust/library";
              RUST_BACKTRACE = "1";
            };
          };
        }
    );
}
