cargo build-sbf --manifest-path=./mint/Cargo.toml --sbf-out-dir=./dist/program
solana program deploy dist/program/mint.so