#! /bin/bash

cd rust-backend
diesel migration run
cargo run
