"use strict";


require( "./src/voxelarium.gun.db.js" )

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

function myPerspective( m, fovy, aspect, zNear, zFar ) {

	var sine, cotangent, deltaZ;
	var radians=(fovy/2.0*Math.PI/180.0);

	m.elements[1] = 0;
	m.elements[2] = 0;
	m.elements[3] = 0;

	m.elements[4] = 0;
	m.elements[6] = 0;
	m.elements[7] = 0;

	m.elements[8] = 0;
	m.elements[9] = 0;

	m.elements[12] = 0;
	m.elements[13] = 0;

	deltaZ=zFar-zNear;
	sine=Math.sin(radians);
	if ((deltaZ===0.0) || (sine===0.0) || (aspect===0.0) )
	{
		return;
	}
	cotangent=Math.cos(radians)/sine;

	m.elements[0+0] = cotangent / aspect;
	 m.elements[4+1] = cotangent;
//		#if defined( _D3D_DRIVER ) || defined( _D3D10_DRIVER )
//		    m[2][2] = (zFar + zNear) / deltaZ;
//		    m[2][3] = 1.0f;
//		    m[3][2] = -1.0f * zNear * zFar / deltaZ;
//		#else
	m.elements[8+2] = -(zFar + zNear) / deltaZ;
	m.elements[8+3] = -1.0;
	 m.elements[12+2] = -2.0 * zNear * zFar / deltaZ;
//		#endif
	 m.elements[12+3] = 0;
	 m.origin.x = m.elements[12]
	 m.origin.y = m.elements[13]
	 m.origin.z = m.elements[14]
//#ifdef ALLOW_SETTING_GL1_MATRIX
//		 glMultMatrixf(&m[0][0]);
//	#endif
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

		//myPerspective( camera.projectionMatrix, 90, window.innerWidth / window.innerHeight, 1, 10000 );

		camera.matrixAutoUpdate = false;
		camera.position.z = 800;
		camera.matrixWorldNeedsUpdate = true;



		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
		          supportsExtension = false;
		          document.querySelector('#error').style.display = 'block';
		          return;
		        }

				glow.makeComposers( scene
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


		document.body.appendChild( renderer.domElement );

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

		initVoxelarium();

		//
		//scene2.add( controlGame.casting.mesh )
	}

function slowanim() {
	setTimeout( animate, 256 );
}

function render() {
	renderer.clear();

	glow.render();
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
		else
			requestAnimationFrame( animate );
		//var unit = Math.PI/2; //worst case visible

		inventory.animate( camera, delta );

	render();

}



function initVoxelarium() {
	var basicMesher = Voxelarium.BasicMesher(  );
	var voxelUniverse = Voxelarium.World();
	var geometryShader;
	var geometryShaderMono;


	//geometryShader = Voxelarium.GeometryShader();
	//geometryShaderMono = Voxelarium.GeometryShaderMono();



	var geometryMaterial = Voxelarium.GeometryBuffer();
	geometryMaterial.makeVoxCube(  );
	geometryShader = Voxelarium.GeometryShader();
	Voxelarium.TextureAtlas.init( 32, 64 );

	//Voxelarium.Voxels.load( ()=>{
		Voxelarium.db.init( ()=>{
			geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;
			//mesh.material.needsUpdate = true;

		/*
			var material1 = new THREE.MeshBasicMaterial( {map: Voxelarium.TextureAtlas.texture, side:THREE.DoubleSide } );
		    material1.transparent = true;

			var mesh1 = new THREE.Mesh(
		        new THREE.PlaneGeometry(Voxelarium.TextureAtlas.canvas.width, Voxelarium.TextureAtlas.canvas.height),
		        material1
		      );

			mesh1.position.set(0,50,0);

			scene.add( mesh1 );
		*/




			//geometryShaderMono = Voxelarium.GeometryShaderMono();
			//scene2.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );

			var cluster = voxelUniverse.createCluster( basicMesher, 20 );
			cluster.THREE_solid = new THREE.Object3D();
			scene2.add( cluster.THREE_solid );
			clusters.push( cluster );
			cluster.pivot.add( THREE.Vector3Pool.new( cluster.voxelUnitSize * ( cluster.sectorSizeX/2 )
					, -1 * cluster.voxelUnitSize * ( cluster.sectorSizeY/2 )
					, cluster.voxelUnitSize * ( cluster.sectorSizeZ/2 ) ).delete() );
			controlOrbit.center = cluster.pivot;
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

			var inventory_geometryShader =  Voxelarium.GeometryShader();
			inventory_geometryShader.depthTest = false;
			inventory_geometryShader.depthWrite = false;
			inventory_geometryShader.transparent = false;
			inventory_geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;

			 inventory = Voxelarium.Inventory(inventory_geometryShader,renderer.domElement);
			inventory.THREE_solid.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );
			scene3.add( inventory.THREE_solid );
			//scene3.add( inventory.selector.THREE_solid );
			//sector.THREE_solid.matrix.Translate( -16*20, 16*20, -16*20 );
			//camera.matrix.Translate( 16*20, -16*20, 16*20 );


			window.addEventListener( 'keydown', master_onKeyDown, false );
			window.addEventListener( 'keyup', master_onKeyUp, false );

			animate();
		});
	//});


}

function master_onKeyDown( event ) {


	switch ( event.keyCode ) {
		case keys.I:

			controls.disable();
			inventory.activate( ()=>{ controls.enable() });
			break;
	}

}

function master_onKeyUp( event ) {

	switch ( event.keyCode ) {
	}
}

init();
