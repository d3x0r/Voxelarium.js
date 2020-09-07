

import {Voxelarium} from "./src/Voxelarium.core.js"

if( typeof Voxelarium === "undefined" ){
    this.Voxelarium = {};
//	var Voxelarium;
}
window.Voxelarium = Voxelarium;
Object.assign( Voxelarium, { VERSION : "0.0.1",
	  Settings : {
	     VR : false,
	     AltSpace : false,
	      use_basic_material : false,
	      use_vive : false,
	  }
	}
);

if( typeof updateVoxelariumSettings === 'function' ){
  updateVoxelariumSettings();
}

Object.freeze( Voxelarium.Settings );

import "./three.js/build/three.js"

import  "./three.js/personalFill.js"

import {db} from "./src/Voxelarium.db.js"

//if( Voxelarium.Settings.AltSpace )
//   var altspace = import( "./AltSpaceVR/dist/altspace.js" );

Voxelarium.Stats = function(){};  //(!Voxelarium.Settings.VR)?import( './three.js/js/stats.min.js' ):

/*
if( Voxelarium.Settings.VR ) {
  import( './three.js/AltSpace_WebVR_fill.js');

  if( Voxelarium.Settings.AltSpace )
  import( './three.js/js/controls/AltSpaceControls.js' );
  else
  import( './three.js/js/controls/VRControls.js' );
  import( './three.js/js/effects/VREffect.js' );

  import( './three.js/js/vr/ViveController.js' );
  //import( './three.js/js/vr/PaintViveController.js' );
  import( './src/VoxelariumViveController.js' );
  import( './three.js/js/vr/WebVR.js' );
  import( './three.js/js/loaders/OBJLoader.js' );
}
*/

Voxelarium.clock = new THREE.Clock()


//if( !Voxelarium.Settings.VR ) {
  import "./orbit_controls.js"
  import "./NaturalCamera.js"
  import "./gameMouse.js"
//}

//if( !Voxelarium.Settings.use_basic_material )

import {glow} from "./glow.renderer.js";

import( "./three.js/js/renderers/Projector.js" )
import( "./src/three.js.post/shaders/CopyShader.js")
import( "./src/three.js.post/shaders/HorizontalBlurShader.js")
import( "./src/three.js.post/shaders/VerticalBlurShader.js")
import( "./src/three.js.post/EffectComposer.js")
import( "./src/three.js.post/BloomPass.js")


import( "./src/three.js.post/ClearPass.js")
import( "./src/three.js.post/MaskPass.js")
import( "./src/three.js.post/RenderPass.js")
import( "./src/three.js.post/ShaderPass.js")
import( "./src/three.js.post/TexturePass.js")


Voxelarium.camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.001, 10000 );

//--- fonts ---
Voxelarium.Fonts = {};
import( "./src/fonts/TI99.js")
//import( "./src/fonts/msyh1.js")

import( "./src/constants.js")
import( "./src/bitstream.js")  // read and write bits

import( "./src/sector.js")
import( "./src/cluster.js")
import( "./src/world.js")

import( "./src/geometrybasicbuffer.js")
import( "./src/geometrybuffer.js")
import( "./src/geometrymaterial.js")
import( "./src/geometrybuffer.mono.js")
import( "./src/geometrymaterial.mono.js")
import( "./src/textureAtlas.canvas.js")

import( "./src/voxelSelector.js")

import( "./src/sorting.tree.js")
import( "./src/mesher.basic.js")

import( "./src/voxels.js" )  // must be after atlas


import( "./src/voxel_inventory.js")  // must be after voxels

//Object.freeze( Voxelarium );
//Voxelarium.freeze();
export {Voxelarium,glow}