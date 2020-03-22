#! /bin/sh

cd angular-frontend
./build.sh
cd -

cd rust-backend
./build.sh
cd -
