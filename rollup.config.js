//import * as fs from 'fs';

import replace from 'rollup-plugin-replace';

export default {
	input :'Voxelarium.js',
	output: { 
		file: 'build/Voxelarium.js',
	//	moduleName: 'Voxelarium',
		format: 'umd'
	},
	plugins: [
		//glsl()
	]
	//outro: outro
};
