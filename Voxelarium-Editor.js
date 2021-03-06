"use strict";

import * as THREE  from "./three.js/build/three.module.js"
window.THREE = THREE;
import {Voxelarium,glow} from "./Voxelarium.js"
import {consts,Vector3Pool} from "./three.js/personalFill.js"
import {myPerspective} from './three.js/my_perspective.js'
//var words1 = voxelUniverse.createTextCluster( "Hello World" );
//var glow = require( './glow.renderer.js' );

var controls;
var sceneRoot;
	var scene;
	var scene2;
	var scene3;
	var camera, renderer;
	var renderTargetGlow;
	var	renderTarget;
	var light;
	var glowcomposer;
	var scenecomposer;
	var finalcomposer;
	var geometry, material, mesh = [];
	var frame_target = [];
	var slow_animate = false;
	var frame = 0;

var vrDisplay= window;
var effect = null;
var controller1=null, controller2=null;
var headLight = null;
var sceneScale = consts.Vector3One;
var sceneOffset = consts.Vector3Zero;
var skeleton;
var head;

	var tests = [];
	var clusters = [];

var screen = { width:window.innerWidth, height:window.innerHeight };

//const totalUnit = Math.PI/(2*60);
//const unit = totalUnit;
var delay_counter = 60*3;
//const pause_counter = delay_counter + 120;
var single_counter = 60;
var totalUnit = Math.PI/2;
var unit = totalUnit / single_counter;
var pause_counter = 120;

var counter= 0;

var stats = new Voxelarium.Stats();



function setupViveControls( scene ) {
		// update camera poosition from VR inputs...
		if( Voxelarium.Settings.AltSpace ) {
			controls = new THREE.AltSpaceControls( camera );
		} else
			controls = new THREE.VRControls( camera );
		controls.standing = true;

	scene.add( new THREE.HemisphereLight( 0x888877, 0x777788 ) );

	headLight = new THREE.DirectionalLight( 0xffffff );
	headLight.position.set( 0, 6, 0 );
	headLight.castShadow = true;
	headLight.shadow.camera.top = 2;
	headLight.shadow.camera.bottom = -2;
	headLight.shadow.camera.right = 2;
	headLight.shadow.camera.left = -2;
	headLight.shadow.mapSize.set( 4096, 4096 );
	scene.add( headLight );


	// controllers

	controller1 = new Voxelarium.ViveController( 0 );
	controller1.standingMatrix = controls.getStandingMatrix();
	controller1.userData.points = [ new THREE.Vector3(), new THREE.Vector3() ];
	controller1.userData.matrices = [ new THREE.Matrix4(), new THREE.Matrix4() ];
	controller1.userData.altspace = { collider: { enabled: false } };
	scene.add( controller1 );

	controller2 = new Voxelarium.ViveController( 1 );
	controller2.standingMatrix = controls.getStandingMatrix();
	controller2.userData.points = [ new THREE.Vector3(), new THREE.Vector3() ];
	controller2.userData.matrices = [ new THREE.Matrix4(), new THREE.Matrix4() ];
	controller2.userData.altspace = { collider: { enabled: false } };
	scene.add( controller2 );

	var loader = new THREE.OBJLoader();
	loader.setPath( 'models/obj/vive-controller/' );
	loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

		var loader = new THREE.TextureLoader();
		loader.setPath( 'models/obj/vive-controller/' );

		var controller = object.children[ 0 ];
		controller.material.map = loader.load( 'onepointfive_texture.png' );
		controller.material.specularMap = loader.load( 'onepointfive_spec.png' );
		controller.castShadow = true;
		controller.receiveShadow = true;

		// var pivot = new THREE.Group();
		// var pivot = new THREE.Mesh( new THREE.BoxGeometry( 0.01, 0.01, 0.01 ) );
		var pivot = new THREE.Mesh( new THREE.IcosahedronGeometry( 0.002, 2 ) );
		pivot.name = 'pivot';
		pivot.position.y = -0.016;
		pivot.position.z = -0.043;
		pivot.rotation.x = Math.PI / 5.5;
		controller.add( pivot );

		controller1.add( controller.clone() );

		pivot.material = pivot.material.clone();
		controller2.add( controller.clone() );

	} );


}

var status_line;
	function init() {

	if( !sceneRoot )
		sceneRoot = new THREE.Scene();

		if( !scene ) {
			//sceneRoot.add(
				scene = new THREE.Scene()
			// );
			sceneRoot.add( scene2 = new THREE.Scene() );
			sceneRoot.add( scene3 = new THREE.Scene() );
		}
		if( !Voxelarium.Settings.AltSpace ) {
			scene.matrixAutoUpdate = false;
			scene2.matrixAutoUpdate = false;
			scene3.matrixAutoUpdate = false;
		}
		// for phong hello world test....
	//	light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
	//	light.position.set( 0, 0, 1000 );
  //		scene.add( light );

		camera = Voxelarium.camera;
		if( !Voxelarium.Settings.VR ) {

			renderer = new THREE.WebGLRenderer();
                        renderer.autoClear = false;
			renderer.setSize( window.innerWidth, window.innerHeight );
			window.addEventListener( "resize", ()=>{
				myPerspective( Voxelarium.camera.projectionMatrix, 90, window.innerWidth / window.innerHeight, 0.01, 10000 );
				renderer.setSize( window.innerWidth, window.innerHeight ) 
			} );
			document.body.appendChild( renderer.domElement );

			Voxelarium.controls.setDOM( renderer.domElement );

			camera.matrixAutoUpdate = false;
			camera.position.y = 3.3;
			camera.position.x = 1.5;
			camera.position.z = 1.5;
                        camera.matrix.origin.copy( camera.position );

			if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
					          supportsExtension = false;
					          document.querySelector('#error').style.display = 'block';
					         return;
			}

  			if( !Voxelarium.Settings.use_basic_material ){
  							glow.makeComposers( renderer, scene
  								, ()=>{
  									clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
  										sector.solid_geometry.geometry.uniforms.edge_only = 0;
  									})})
  								}
  								, scene2
  								, ()=>{
  									clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
  										sector.solid_geometry.geometry.uniforms.edge_only = 1;
  									})})
  								}
  								, scene3
  							);
  					 }
		}
		else {
                       // is VR...
			if( !Voxelarium.Settings.AltSpace ) {
				navigator.getVRDisplays().then(function(displays) {
				  if (displays.length > 0) {
				    vrDisplay = displays[0];
				  }
				});

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.sortObjects = false;
				renderer.autoClear = false;
				renderer.shadowMap.enabled = true;
				renderer.gammaInput = true;
				renderer.gammaOutput = true;

				document.body.appendChild( renderer.domElement );

				effect = new THREE.VREffect( renderer );
				effect.autoSubmitFrame = false;
				effect.autoClear = false;
				effect.setSize( window.innerWidth, window.innerHeight );


									if( !Voxelarium.Settings.use_basic_material ){
													glow.makeComposers( effect, scene
														, ()=>{
															clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
																sector.solid_geometry.geometry.uniforms.edge_only = 0;
															})})
														}
														, scene2
														, ()=>{
															clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
																sector.solid_geometry.geometry.uniforms.edge_only = 1;
															})})
														}
														, scene3
													);
											 }

		 		if ( typeof WEBVR !== "undefined" )
					if ( WEBVR.isAvailable() === true ) {

						document.body.appendChild( WEBVR.getButton( effect ) );

					} else {
						document.body.appendChild( WEBVR.getMessage() );

					}

			} else { // is AltSpace

			}
			setupViveControls( scene );
		}


		if( !Voxelarium.Settings.VR ) {
			scene.add( Voxelarium.controls.game.casting.mesh );
			camera.matrixAutoUpdate = false;
		}
		initVoxelarium();

		//
		//scene2.add( controlGame.casting.mesh )
	}

function slowanim() {
	setTimeout( animate, 256 );
}

function handleController( controller ) {
  // update controller object from VR input (gamepad)
	controller.update();

	var pivot = controller.getObjectByName( 'pivot' );

	if ( pivot ) {

		pivot.material.color.copy( controller.getColor() );

		var matrix = pivot.matrixWorld;

		var point1 = controller.userData.points[ 0 ];
		var point2 = controller.userData.points[ 1 ];

		var matrix1 = controller.userData.matrices[ 0 ];
		var matrix2 = controller.userData.matrices[ 1 ];

		point1.setFromMatrixPosition( matrix );
		matrix1.lookAt( point2, point1, THREE.Vector3Up );

		if ( controller.getButtonState( 'trigger' ) ) {

      // this is the old drawing code...
			//stroke( controller, point1, point2, matrix1, matrix2 );

		}

		point2.copy( point1 );
		matrix2.copy( matrix1 );

	}

}


//------------------------------------------------------------------------
//  render
//------------------------------------------------------------------------

var priorError = { message: ""};
function render() {
	if( Voxelarium.Settings.VR ) {

		if( Voxelarium.Settings.AltSpace ){
			try {
				renderer.render( sceneRoot );
				renderer.render( scene );
			}catch( err ) {
				console.log( err );
			}
		}
    else if( Voxelarium.Settings.use_basic_material ) {
		  effect.render( scene, camera );
		  effect.render( scene2, camera );
		  effect.render( scene3, camera );
		  effect.submitFrame();
		}
		else
	    glow.render( effect );

	}
	else {
		if( Voxelarium.Settings.use_basic_material ) {
			renderer.clear();
			renderer.render( scene, camera );
			renderer.render( scene2, camera );
				renderer.render( scene3, camera );

		}
		else
			glow.render( effect );
  }
}
//render();

var clock = new THREE.Clock();
var db_delta = 0;
var start = Date.now();
function animate() {
	var delta = clock.getDelta();
	var now = Date.now();
if( delta > 0.033 || (now - start) > 50 )
	console.log( "Tick is:", delta, now - start );
	delta = (now - start)/1000;
	start = now;
	db_delta += delta;
		if( !Voxelarium.db.player.positionUpdate ) {
			Voxelarium.controls.update( delta );
			if( db_delta > 0.500 ) {
				Voxelarium.db.animate();
				db_delta = 0;
			}
		}
		else {
			// this writes it...
			Voxelarium.db.player.positionUpdate = false;
		}

		if( Voxelarium.Settings.VR ) {
			handleController( controller1 );
			handleController( controller2 );
		}

		Voxelarium.selector.update();

		Voxelarium.inventory.animate( camera, delta );

		if( slow_animate )
			requestAnimationFrame( slowanim );
		else {
				if( Voxelarium.Settings.VR )
					vrDisplay.requestAnimationFrame( animate )
				else
					requestAnimationFrame( animate );
		}
		//var unit = Math.PI/2; //worst case visible

		//stats.end();
		render();
		//stats.begin();
if( (Date.now() - start) > 50 ) {
	console.log( "Taaaick is:", delta, Date.now() - start );
}
	start = Date.now();
}



function initVoxelarium() {
	var basicMesher = Voxelarium.BasicMesher(  );
	var voxelUniverse = Voxelarium.World();
	var geometryShader;

	var geometryMaterial = Voxelarium.Settings.use_basic_material
			? Voxelarium.GeometryBasicBuffer()
			: Voxelarium.GeometryBuffer();

	geometryShader = Voxelarium.Settings.use_basic_material
			? new THREE.MeshBasicMaterial()
	    : Voxelarium.GeometryShader();

	//Voxelarium.TextureAtlas.init( 32, 64 );

		Voxelarium.db.init( ()=>{
			//geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;
			geometryShader.vertexColors = THREE.VertexColors;
			if( geometryShader.uniforms )
				geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;
			else
				geometryShader.map = Voxelarium.TextureAtlas.texture;
			//geometryShader.needsUpdate = true;
			//document.body.appendChild( Voxelarium.TextureAtlas.canvas );
			//mesh.material.needsUpdate = true;


			//geometryShaderMono = Voxelarium.GeometryShaderMono();
			//scene2.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );

			var cluster = voxelUniverse.createCluster( basicMesher, 0.1 );
			cluster.THREE_solid = new THREE.Object3D();
			if( Voxelarium.Settings.AltSpace )
				cluster.THREE_solid.userData.altspace = { collider: { enabled: false } };
			scene2.add( cluster.THREE_solid );
			clusters.push( cluster );
			cluster.pivot.add( Vector3Pool.new( cluster.voxelUnitSize * ( cluster.sectorSizeX/2 )
					, -1 * cluster.voxelUnitSize * ( cluster.sectorSizeY/2 )
					, cluster.voxelUnitSize * ( cluster.sectorSizeZ/2 ) ).delete() );

			Voxelarium.controls.orbit.center = cluster.pivot;
			Voxelarium.controls.game.clusters = clusters;

			//var sector = Voxelarium.Sector(cluster,0,-1,0);
			var sector = cluster.createSector( 0, 0, 0 );
			sector.MakeSector(Voxelarium.Voxels.types[2]);

			//var s = sector.stringify();
			//sector.decode( s );
			//console.log( "sector encode looks like", s );
			basicMesher.initCulling( sector );

			// this was patched/hacked to do the full sector including
			// neighbors if they exist.
			basicMesher.SectorUpdateFaceCulling( sector, true )
			//basicMesher.SectorUpdateFaceCulling_Partial( cluster, sector, Voxelarium.FACEDRAW_Operations.ALL, true )
			basicMesher.MakeSectorRenderingData( sector );

			Voxelarium.db.world.cluster = cluster;
			Voxelarium.db.world.loadSector( sector ); // hook into database event read.

			cluster.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShader ) );

			scene2.add( Voxelarium.selector.meshGlow );
			scene3.add( Voxelarium.selector.mesh );
			scene3.add( Voxelarium.inventory.THREE_solid );

			requestAnimationFrame( animate );
		}, 8);
	//});


}



var instanceRef;
var sceneSync;
var sim;

function initAltSpace( init ) {
	sim = altspace.utilities.Simulation( {auto:false });
	renderer = sim.renderer;
	camera = Voxelarium.camera = sim.camera;

	if (altspace.inClient) {
		// internally use this to attach events for inventory (for instance)
		Object.defineProperty( renderer, "domElement", { value: document } );
	}

	sceneRoot = sim.scene;

	var inCodePen = altspace.utilities.codePen.inCodePen;
		altspace.utilities.sync.connect({
					appId: 'Voxelarium.js',
				authorId: inCodePen ? altspace.utilities.codePen.getAuthorId() : 'd3x0r',
				instanceId: inCodePen ? altspace.utilities.codePen.getPenId() : null
		}).then(function(connection) {
				instanceRef = connection.instance;

				sceneSync = altspace.utilities.behaviors.SceneSync(instanceRef, {
					instantiators: {
						'Piece': function(initData){

							gameObjects.add(object3d);
							return object3d;
						}
					},
					ready: function(firstInstance){
							console.log( "got 'ready' which is add scenes?")
						if (firstInstance){
							console.log( "is first once?")
							//arrangePieces();
						}
						//gameObjects.add(board);
						//sim.scene.add(scene);
						//sim.scene.add(scene2);
						//sim.scene.add(scene3);
						//for(var i=0; i < whitePieces.length; i++){
							if (firstInstance) {
								//var white = sceneSync.instantiate('Piece', { index: i, color: 'white' });
								//var black = sceneSync.instantiate('Piece', { index: i, color: 'black' });
							}
						//}
					}
				});
				sim.scene.addBehavior(sceneSync);


				if (altspace.inClient) {
					altspace.getThreeJSTrackingSkeleton().then( (s)=>{
						skeleton = s;
						head = skeleton.getJoint( "Head" );
					} )

						altspace.getEnclosure().then(function (enclosure) {
								var scale =  enclosure.pixelsPerMeter;// * 0.0254;
								sceneScale = new THREE.Vector3( scale, scale,scale );
								sceneOffset = new THREE.Vector3( 0, -enclosure.innerHeight / 2, 0 );
						    sceneRoot.scale.set( scale, scale,scale );
								sceneRoot.position.y -= enclosure.innerHeight / 2;
						});
				} else {
						sim.camera.position.z = 32;
						sim.camera.position.y = 0;
						sim.camera.lookAt(sim.scene.position);
						console.log( 'seting scene to ', sim.scene )
						//sim.scene.position.y = -enclosure.innerHeight / 2
						//scene = sim.scene;
						//scene2 = sim.scene;
						//scene3 = sim.scene;
				}
				init();
     } );
}

if( Voxelarium.Settings.AltSpace )
	initAltSpace( init );
else
	Voxelarium.onready( init );
