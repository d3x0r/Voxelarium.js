import {Voxelarium} from "./src/Voxelarium.core.js"


import * as login from "http://localhost:7880/login/webSocketClient.js"
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

const style = document.createElement( "link" );
style.rel = "stylesheet";
//style.href = "/node_modules/@d3x0r/popups/styles.css";
style.href = "/node_modules/@d3x0r/popups/dark-styles.css";
document.head.insertBefore( style, document.head.childNodes[0] || null );
login.openSocket( "ws://localhost:7880" );
const loginForm = popups.makeLoginForm( async (guest)=>{
	console.log( "parameter is guest?:", guest );
	//console.log( "login form event" );
	//debugger;
	Voxelarium.login.hide();
	const info = await login.connection.request( "d3x0r.org", "Voxelarium(js)" );
	
	//console.log( "service information:", info );
	if( info ) {
		Voxelarium.db.connect( info.svc );
		/*
		openSocket( info.addr, (ws)=>{
			ws.onmessage = handleMessage;
			ws.onclose = handleClose;
			this.load();					
		}, "VOXDB" );
		*/
	} else {
		popups.Alert( "Service failed to be found" );
		Voxelarium.login.show();
	}

} , { useForm:"http://localhost:7880/login/loginForm.html"
	, useSashForm:null//"http://localhost:7880/login/pickSashForm.html"
	, sashScript : null//"http://localhost:7880/login/pickSashForm.js"
	, wsLoginClient:login.connection} );

Voxelarium.login = loginForm;
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
	, core : null 
	, setDOM(dom ) {
		Voxelarium.controls.orbit.setDOM(dom);
		Voxelarium.controls.game.setDOM(dom);
		Voxelarium.controls.natural.setDOM(dom);
		Voxelarium.controls.core.setDOM(dom);
		Voxelarium.controls.core.enable();
	}
	, update(delta) {
		Voxelarium.controls.core.update(delta);
	}
}


//if( !Voxelarium.Settings.use_basic_material )
import {myPerspective} from './three.js/my_perspective.js'
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
myPerspective( Voxelarium.camera.projectionMatrix, 90, window.innerWidth / window.innerHeight, 0.01, 10000 );

  import {controls as oControls } from "./three.js/orbit_controls.js"
  Voxelarium.controls.orbit = new oControls(Voxelarium.camera);
  import {controls as nControls } from "./three.js/NaturalCamera.js"
  Voxelarium.controls.natural = new nControls(Voxelarium.camera);
  import {controls as gControls } from "./three.js/gameMouse.js"
  Voxelarium.controls.game = new gControls(Voxelarium.camera);
  import {controls as coreControls } from "./src/controls.js"
  Voxelarium.controls.core = new coreControls(Voxelarium.camera);



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
	if( Voxelarium.World && Voxelarium.Inventory  && Voxelarium.db && Voxelarium.Voxels && Voxelarium.Sector)
        {
            Voxelarium.TextureAtlas.init( 32, 64 );

            if( readies.length ) readies[0]();
        } else setTimeout( tick, 100 );
}tick();

//Object.freeze( Voxelarium );
//Voxelarium.freeze();
export {Voxelarium,glow}