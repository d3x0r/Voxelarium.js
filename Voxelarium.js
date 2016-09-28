
var Voxelarium = { VERSION : "0.0.1" }

if( !THREE )
	var THREE = require( "../three.js/build/three.js")

Voxelarium.clock = new THREE.Clock()



require( "./src/three.js.example/Projector.js" )
require( "./src/three.js.post/shaders/CopyShader.js")
require( "./src/three.js.post/shaders/HorizontalBlurShader.js")
require( "./src/three.js.post/shaders/VerticalBlurShader.js")
//require( "./src/three.js.post/shaders/ConvolutionShader.js")
//require( "./src/three.js.post/shaders/DotScreenShader.js")
//require( "./src/three.js.post/shaders/FilmShader.js")
require( "./src/three.js.post/EffectComposer.js")
require( "./src/three.js.post/BloomPass.js")


//require( "./src/three.js.post/AdaptiveToneMappingPass.js")
//require( "./src/three.js.post/BokehPass.js")
require( "./src/three.js.post/ClearPass.js")
//require( "./src/three.js.post/DotScreenPass.js")
//require( "./src/three.js.post/FilmPass.js")
//require( "./src/three.js.post/GlitchPass.js")
//require( "./src/three.js.post/ManualMSAARenderPass.js")
require( "./src/three.js.post/MaskPass.js")
require( "./src/three.js.post/RenderPass.js")
//require( "./src/three.js.post/SavePass.js")
require( "./src/three.js.post/ShaderPass.js")
//require( "./src/three.js.post/SMAAPass.js")
//require( "./src/three.js.post/TAARenderPass.js")
require( "./src/three.js.post/TexturePass.js")

Voxelarium.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
Voxelarium.db = null;
//--- fonts ---
Voxelarium.Fonts = {};
require( "./src/fonts/TI99.js")
//require( "./src/fonts/msyh1.js")

require( "./src/constants.js")
require( "./src/bitstream.js")  // read and write bits

require( "./src/sector.js")
require( "./src/cluster.js")
require( "./src/world.js")

require( "./src/geometrybuffer.js")
require( "./src/geometrymaterial.js")
require( "./src/geometrybuffer.mono.js")
require( "./src/geometrymaterial.mono.js")
require( "./src/textureAtlas.canvas.js")

require( "./src/voxelSelector.js")

require( "./src/sorting.tree.js")
require( "./src/mesher.basic.js")

require( "./src/voxels.js" )  // must be after atlas


require( "./src/voxel_inventory.js")  // must be after voxels
//Object.freeze( Voxelarium );
//Voxelarium.freeze();
