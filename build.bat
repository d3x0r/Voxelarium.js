call browserify voxelarium.js -o V.debug.js -d
call browserify voxelarium.js -o V.tmp.js
copy /b header.js+V.tmp.js V.js 
copy V.js test
