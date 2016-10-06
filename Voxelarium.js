
if( typeof Voxelarium === "undefined" ){
    this.Voxelarium = {};
//	var Voxelarium;
}

Voxelarium = { VERSION : "0.0.1",
  Settings : {
     VR : true,
     AltSpace : true,
      use_basic_material : true,
      use_vive : true,
  }
};

if( updateVoxelariumSettings ){
  console.log( "preset");
  updateVoxelariumSettings();
}
console.log( "too late now." );
Object.freeze( Voxelarium.Settings );

if(  THREE === null ) {
//	THREE = require( "./three.js.74/build/three.js")
}
	require( "./three.js/personalFill.js")

//if( Voxelarium.Settings.AltSpace )
//   var altspace = require( "./AltSpaceVR/dist/altspace.js" );

Voxelarium.Stats = (!Voxelarium.Settings.VR)?require( './three.js/js/stats.min.js' ):function(){};
require( './three.js/js/controls/VRControls.js' );
require( './three.js/js/effects/VREffect.js' );

require( './three.js/js/vr/ViveController.js' );
require( './three.js/js/vr/PaintViveController.js' );
require( './three.js/js/vr/WebVR.js' );

Voxelarium.clock = new THREE.Clock()


if( !Voxelarium.Settings.VR ) {
  require( "./orbit_controls.js" )
  require( "./NaturalCamera.js" )
  require( "./gameMouse.js" )
}

if( !Voxelarium.Settings.use_basic_material )
	require( "./glow.renderer.js" );

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

Voxelarium.camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 10000 );
//console.log( Voxelarium.camera.projectionMatrix.toArray() )
require( "./src/voxelarium.gun.db.js" )

//--- fonts ---
Voxelarium.Fonts = {};
require( "./src/fonts/TI99.js")
//require( "./src/fonts/msyh1.js")

require( "./src/constants.js")
require( "./src/bitstream.js")  // read and write bits

require( "./src/sector.js")
require( "./src/cluster.js")
require( "./src/world.js")

require( "./src/geometrybasicbuffer.js")
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
