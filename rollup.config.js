//import * as fs from 'fs';

import replace from 'rollup-plugin-replace';

export default {
	entry: 'Voxelarium.js',
	dest: 'build/Voxelarium.js',
	moduleName: 'Voxelarium',
	format: 'umd',
	plugins: [
		//glsl()
	],
	//outro: outro
};
