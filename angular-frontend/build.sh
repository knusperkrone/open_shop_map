#! /bin/sh

npm i
ng build --prod --deploy-url /static/ --output-path dist/
