

import {Voxelarium} from "./src/Voxelarium.core.js"

const readies = [];
Voxelarium.onready = function(cb) {
	readies.push(cb);
}

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

import * as THREE from "./three.js/build/three.module.js"

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

Voxelarium.controls = { orbit:null
	, natural : null
	, game : null 
	}

  import {controls as oControls } from "./three.js/orbit_controls.js"
  Voxelarium.controls.orbit = oControls;
  import {controls as nControls } from "./three.js/NaturalCamera.js"
  Voxelarium.controls.natural = nControls;
  import {controls as gControls } from "./three.js/gameMouse.js"
  Voxelarium.controls.game = gControls;


//if( !Voxelarium.Settings.use_basic_material )

import {glow} from "./three.js/glow.renderer.js";

import( "./three.js/js/renderers/Projector.js" )
import( "./three.js/three.js.post/shaders/CopyShader.js")
import( "./three.js/three.js.post/shaders/HorizontalBlurShader.js")
import( "./three.js/three.js.post/shaders/VerticalBlurShader.js")
import( "./three.js/three.js.post/EffectComposer.js").then( ()=>{
	import( "./three.js/three.js.post/BloomPass.js")
	import( "./three.js/three.js.post/ClearPass.js")
	import( "./three.js/three.js.post/MaskPass.js")
	import( "./three.js/three.js.post/RenderPass.js")
	import( "./three.js/three.js.post/ShaderPass.js")
	import( "./three.js/three.js.post/TexturePass.js")
})




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

function tick() {
	if( Voxelarium.World && Voxelarium.Inventory  && Voxelarium.db && Voxelarium.Voxels) { if( readies.length ) readies[0](); }
	else setTimeout( tick, 100 );
}tick();

//Object.freeze( Voxelarium );
//Voxelarium.freeze();
export {Voxelarium,glow}