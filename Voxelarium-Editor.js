"use strict";



//var words1 = voxelUniverse.createTextCluster( "Hello World" );
//var glow = require( './glow.renderer.js' );

var controlNatural, controlGame, controlOrbit;

var controls;
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

	var tests = [];
	var clusters = [];

var inventory = null;

var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40
	, A:65, S:83, D:68, W:87, SPACE:32, C:67
    , I : 73 };

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

	var stats = new Stats();



function setMode1(){
}


function setMode2() {
}


function setMode3() {
}

function setControls1() {
	controls.disable();
	camera.matrixAutoUpdate = false;
	controls = controlNatural;
	controls.enable();
}
function setControls2() {
	controls.disable();
	camera.matrixAutoUpdate = false;  // current mode doesn't auto update
	controls = controlOrbit;
	controls.enable();
}

function setControls3() {
	controls.disable();
	camera.matrixAutoUpdate = false;  // current mode doesn't auto update
	controls = controlGame;
	controls.enable();
}


var status_line;
	function init() {
		document.getElementById( "controls1").onclick = setControls1;
		document.getElementById( "controls2").onclick = setControls2;
		document.getElementById( "controls3").onclick = setControls3;

		scene = new THREE.Scene();
		scene2 = new THREE.Scene();
		scene3 = new THREE.Scene();

		scene.matrixAutoUpdate = false;
		scene2.matrixAutoUpdate = false;
		scene3.matrixAutoUpdate = false;

		// for phong hello world test....
	//	light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
	//	light.position.set( 0, 0, 1000 );
//		scene.add( light );

		camera = Voxelarium.camera;
		//Voxelarium.camera = camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		stats = new Stats();
		stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild( stats.dom );

		//myPerspective( camera.projectionMatrix, 90, window.innerWidth / window.innerHeight, 1, 10000 );
		if( !Voxelarium.Settings.VR ) {
			camera.matrixAutoUpdate = false;
			camera.position.z = 800;
			camera.matrixWorldNeedsUpdate = true;
    }
		else {
			camera.position.y = 1;
			camera.position.z = 1;

			navigator.getVRDisplays().then(function(displays) {
			  if (displays.length > 0) {
			    vrDisplay = displays[0];
			  }
			});

			controls = new THREE.VRControls( camera );
			controls.standing = true;

			// controllers

			controller1 = new THREE.PaintViveController( 0 );
			controller1.standingMatrix = controls.getStandingMatrix();
			controller1.userData.points = [ new THREE.Vector3(), new THREE.Vector3() ];
			controller1.userData.matrices = [ new THREE.Matrix4(), new THREE.Matrix4() ];
			scene.add( controller1 );

			controller2 = new THREE.PaintViveController( 1 );
			controller2.standingMatrix = controls.getStandingMatrix();
			controller2.userData.points = [ new THREE.Vector3(), new THREE.Vector3() ];
			controller2.userData.matrices = [ new THREE.Matrix4(), new THREE.Matrix4() ];
			scene.add( controller2 );


			effect = new THREE.VREffect( renderer );
			 effect.autoSubmitFrame = false;
			effect.setSize( window.innerWidth, window.innerHeight );
		}
		if ( WEBVR.isAvailable() === true ) {

			document.body.appendChild( WEBVR.getButton( effect ) );

		} else {
			document.body.appendChild( WEBVR.getMessage() );

		}

		document.body.appendChild( renderer.domElement );


		if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
		          supportsExtension = false;
		          document.querySelector('#error').style.display = 'block';
		          return;
		        }


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
		if( !Voxelarium.Settings.use_vive ) {
			controlNatural = new THREE.NaturalControls( camera, renderer.domElement );
			controlNatural.disable();

			/* auto enables; make sure to disable before enabling something else... */
			controlOrbit = new THREE.OrbitControls( camera, renderer.domElement );
			controlOrbit.disable();

			controlGame = new THREE.GameMouse( camera, renderer.domElement );
			controlGame.enable();

			scene.add( controlGame.casting.mesh );

			camera.matrixAutoUpdate = false;
			controls = controlGame;
		}
		initVoxelarium();

		//
		//scene2.add( controlGame.casting.mesh )
	}

function slowanim() {
	setTimeout( animate, 256 );
}

function render() {
	//renderer.clear();
	if( Voxelarium.Settings.use_basic_material ) {
	  effect.render( scene, camera );
	  effect.render( scene2, camera );
	  effect.render( scene3, camera );
		 effect.submitFrame();
  }
	else {
		glow.render( effect );
	}
}
//render();

var clock = new THREE.Clock();
var db_delta = 0;
function animate() {
	var delta = clock.getDelta();
	db_delta += delta;
		if( !Voxelarium.db.player.positionUpdate ) {
			controls.update( delta );
			if( db_delta > 0.500 ) {
				Voxelarium.db.animate();
				db_delta = 0;
			}
		}
		else {
			// this writes it...
			Voxelarium.db.player.positionUpdate = false;
		}

		Voxelarium.selector.update();

		if( slow_animate )
			requestAnimationFrame( slowanim );
		else {
				if( Voxelarium.Settings.VR )
					vrDisplay.requestAnimationFrame( animate )
				else
					requestAnimationFrame( animate );
		}
		//var unit = Math.PI/2; //worst case visible

		inventory.animate( camera, delta );
		stats.end();
		render();
		stats.begin();
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

	Voxelarium.TextureAtlas.init( 32, 64 );

		Voxelarium.db.init( ()=>{
			//geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;
			geometryShader.vertexColors = THREE.VertexColors;
			geometryShader.map = Voxelarium.TextureAtlas.texture;
			geometryShader.needsUpdate = true;
			//document.body.appendChild( Voxelarium.TextureAtlas.canvas );
			//mesh.material.needsUpdate = true;


			//geometryShaderMono = Voxelarium.GeometryShaderMono();
			//scene2.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );

			var cluster = voxelUniverse.createCluster( basicMesher, 1 );
			cluster.THREE_solid = new THREE.Object3D();
			scene2.add( cluster.THREE_solid );
			clusters.push( cluster );
			cluster.pivot.add( THREE.Vector3Pool.new( cluster.voxelUnitSize * ( cluster.sectorSizeX/2 )
					, -1 * cluster.voxelUnitSize * ( cluster.sectorSizeY/2 )
					, cluster.voxelUnitSize * ( cluster.sectorSizeZ/2 ) ).delete() );
			if( controlOrbit )
				controlOrbit.center = cluster.pivot;
			if( controlGame )
				controlGame.clusters = clusters;
			//var sector = Voxelarium.Sector(cluster,0,-1,0);
			var sector = cluster.createSector( 0, -1, 0 );
			sector.MakeSector(Voxelarium.Voxels.types[1]);

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

			var inventory_geometryShader = Voxelarium.Settings.use_basic_material
					? new THREE.MeshBasicMaterial()
					: Voxelarium.GeometryShader();

			inventory_geometryShader.depthTest = false;
			inventory_geometryShader.depthWrite = false;
			inventory_geometryShader.transparent = false;
			inventory_geometryShader.map = Voxelarium.TextureAtlas.texture;
			//inventory_geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;

			 inventory = Voxelarium.Inventory(inventory_geometryShader,renderer.domElement);
			inventory.THREE_solid.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );
			scene3.add( inventory.THREE_solid );
			//scene3.add( inventory.selector.THREE_solid );
			//sector.THREE_solid.matrix.Translate( -16*20, 16*20, -16*20 );
			//camera.matrix.Translate( 16*20, -16*20, 16*20 );


			window.addEventListener( 'keydown', master_onKeyDown, false );
			window.addEventListener( 'keyup', master_onKeyUp, false );
			stats.begin();

			animate();
		});
	//});


}

function master_onKeyDown( event ) {


	switch ( event.keyCode ) {
		case keys.I:

			//controls.disable();
			inventory.activate(/* ()=>{ controls.enable() } */);
			break;
	}

}

function master_onKeyUp( event ) {

	switch ( event.keyCode ) {
	}
}

init();
