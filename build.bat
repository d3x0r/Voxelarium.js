
call browserify voxelarium.js --bare --ignore-missing --noparse=node_modules/gun/gun.js --noparse=../node_modules/gun/gun.js --noparse=three.js/build/three.js -o V.debug.js -d
call browserify voxelarium.js --bare --ignore-missing -o V.tmp.js 
copy /b header.js+V.debug.js V.js 
copy V.js test

: npm install babel-plugin-transform-es2015-arrow-functions                babel-preset-es2015 babel-preset-stage-0
call babel --presets=es2015 --plugins transform-es2015-arrow-functions Voxelarium-Editor.js --out-file Voxelarium-Editor5.js -s
call babel --presets=es2015 --plugins transform-es2015-arrow-functions V.js --out-file V5.js -s


