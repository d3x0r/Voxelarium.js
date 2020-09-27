"use strict";


import * as THREE from "../three.js/build/three.module.js"
import {TimeGradient} from "./src/TimeGradient.js"
import {myPerspective} from './three.js/my_perspective.js'
window.THREE = THREE;
import ( "./Voxelarium.js" ).then ( (V)=>{
const Voxelarium = V.Voxelarium;
const glow = V.glow;
Voxelarium.onready( ()=>{
//var glow = require( './glow.renderer.js' );

var clusters = [];

var l = 0;

var voxelUniverse = Voxelarium.World();
var geometryShader;
var geometryShaderMono;
//var words1 = voxelUniverse.createTextCluster( "Hello World" );

	var scene;
	var scene2;
	var scene3;
	var camera, renderer;
	var light;
	var geometry, material, mesh = [];
	var frame_target = [];
	var slow_animate = false;
	var frame = 0;

	var tests = [];

Voxelarium.controls.game.clusters= clusters;

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

	var clock = new THREE.Clock()


	var status_line;
	function init() {
		console.log( "init?" );
		window.addEventListener( "resize", ()=>{
		       myPerspective( Voxelarium.camera.projectionMatrix, 90, window.innerWidth / window.innerHeight, 0.01, 10000 );
		       renderer.setSize( window.innerWidth, window.innerHeight )
		} );

		scene = new THREE.Scene();
		scene2 = new THREE.Scene();
		scene3 = new THREE.Scene();


		camera = Voxelarium.camera;

		camera.matrixAutoUpdate = false;
		camera.position.z = 0.8;
		//camera.position.x = 0.5;
		//camera.position.x = 1.5;
		//camera.position.y = 2.5;
		camera.matrixWorldNeedsUpdate = true;

		 geometryShader = new THREE.MeshBasicMaterial();
		 	//Voxelarium.GeometryShader();
		 geometryShaderMono = Voxelarium.GeometryShaderMono();


		 // for phong hello world test....
 		var light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
 		light.position.set( 0, 0, 1000 );
 		scene.add( light );


		 initVoxelarium();

		 if( typeof  CubeTest !== "undefined" ) {
		 	tests.push( CubeTest() ) ;
			tests[tests.length-1].init( scene );
		}

		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
		          supportsExtension = false;
		          document.querySelector('#error').style.display = 'block';
		          return;
		        }

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
		);

		document.body.appendChild( renderer.domElement );

		Voxelarium.controls.setDOM( renderer.domElement );

	}

function slowanim() {
	setTimeout( animate, 256 );
}


function render() {
	renderer.clear();
	glow.render();
}

var nFrame = 0;
var nTarget = 60;
var nTarget2 = 120;

let testWord;

function animate() {
	var delta = clock.getDelta();

		Voxelarium.controls.update(delta);
		TimeGradient.update(delta);

		if( testWord ) {
			testWord.setText( ''+new Date() + Date.now() );
		}
		tests.forEach( (test)=>{ test.animate(); } )


		//nFrame++;
		if( nFrame++ < nTarget ) {
			clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
				//sector.THREE_solid.material.uniformsNeedUpdate = true;
				//sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.2 * 1, 0.5* 1,0.05* 1, 1.0 );
				//sector.solid_geometry.geometry.uniforms.in_FaceColor.needsUpdate = true;
				//sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.3 * (nTarget-nFrame)/nTarget, 0.7* (nTarget-nFrame)/nTarget,0.9* (nTarget-nFrame)/nTarget, 1.0 );
				sector.solid_geometry.geometry.uniforms.in_Color = new THREE.Vector4( 0.01 * (nFrame)/nTarget, 0.4* (nFrame)/nTarget,0.01* (nFrame)/nTarget, 1.0 );
				//sector.solid_geometry.geometry.uniforms.in_Color.needsUpdate = true;
				//console.log( "Stting color:", sector.solid_geometry.geometry.uniforms.in_FaceColor, sector.solid_geometry.geometry.uniforms.in_Color );
			})})
		} else if( nFrame < nTarget2 ) {
			clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
				sector.solid_geometry.geometry.uniforms.in_Color = new THREE.Vector4( 0.01 * (nTarget2-nFrame)/nTarget, 0.4* (nTarget2-nFrame)/nTarget,0.01* (nTarget2-nFrame)/nTarget, 1.0 );
				//sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.3 * (nFrame-nTarget)/nTarget, 0.7* (nFrame-nTarget)/nTarget,0.9* (nFrame-nTarget)/nTarget, 1.0 );
			})})
		}
		else {
			nFrame = 0;
		}


		//console.log( "tick")
		//if( frame++ > 10 ) return
		if( slow_animate )
			requestAnimationFrame( slowanim );
		else
			requestAnimationFrame( animate );
		//var unit = Math.PI/2; //worst case visible

	render();

}

const titleFaceGradient = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [0.4,0.8,1.0] )
.addStage( 1, [0,0,0] );

const titleEdgeGradient = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [0,0,0] )
.addStage( 1.2, [0.4,0.8,1.0] )
;

const blackGradient = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [0,0,0] );
const whiteGradient = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [1,1,1] );

const tealGradient = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [0.2,0.8,0.8] );
const blueGlow = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 0.25, [0,0.6,0.8] )
.addStage( 0.5, [0,0.2,0.4] )
;

const greenGlow = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 0.5, [0,0.8,0] )
.addStage( 0.5, [0,0.4,0] )
;

const rainGlow = new TimeGradient( TimeGradient.arrayScalar )
.addStage( 1, [1,0,0] )
.addStage( 1, [0.5,0.3,0] )
.addStage( 1, [0.8,0.8,0] )
.addStage( 1, [0.0,0.8,0] )
.addStage( 1, [0,1,0.5] )
.addStage( 1, [0.8,0,1] )
.addStage( 1, [1,0,0] )
;

function initVoxelarium() {

	//Voxelarium.TextureAtlas.init( 32, 64 );
  Voxelarium.db.init( ()=>{
//	Voxelarium.Voxels.load( ()=>{
	console.log( "db init finish?" );
	geometryShader.map = Voxelarium.TextureAtlas.texture;
	geometryShader.needsUpdate = true;

	var basicMesher = Voxelarium.BasicMesher(  );
	let line = 0.5;


	var words1 = voxelUniverse.createTextCluster( "Voxelarium", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99, 1.0/80.0 );
	clusters.push( words1 );
	var offset = 0;


	scene2.add(words1.THREE_solid );
        words1.THREE_solid.position.add( new THREE.Vector3(-1, line, 0 ));
	words1.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		words1.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.THREE_solid.onBeforeRender = sector.solid_geometry.updateUniforms.bind( sector.THREE_solid, {
				faceGradient : titleFaceGradient,
				edgeGradient : titleEdgeGradient
			} );


		sector.THREE_solid.position.add( new THREE.Vector3(0, offset, 0 ));
	})
	line -= 4/25.0;

	var words1 = voxelUniverse.createTextCluster( "Blackvoxel", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99, 1.0/80.0 );
	clusters.push( words1 );
	scene2.add(words1.THREE_solid );
        words1.THREE_solid.position.add( new THREE.Vector3(-1, line, 0 ));
	words1.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		words1.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.faceGradient = blackGradient
		sector.edgeGradient = blueGlow
		sector.THREE_solid.onBeforeRender = sector.solid_geometry.updateUniforms.bind( sector.THREE_solid, sector );
		sector.THREE_solid.position.add( new THREE.Vector3( 0, offset, 0 ));
	})
	line -= 4/25.0;

	const menuItem_PlayGame = voxelUniverse.createTextCluster( "Play Game", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99, 1.0/80.0 );
	clusters.push( menuItem_PlayGame );
        menuItem_PlayGame.on( "mouseover", (cluster)=>{
		for( let sector of cluster.SectorList ) {
			sector.faceGradient = whiteGradient
			sector.edgeGradient = rainGlow;
                }
		
	} );
        menuItem_PlayGame.on( "blur", (cluster)=>{
		for( let sector of cluster.SectorList ) {
			sector.faceGradient = rainGlow
			sector.edgeGradient = whiteGradient;
		}
		
	} );
	scene2.add(menuItem_PlayGame.THREE_solid );
    menuItem_PlayGame.THREE_solid.position.add( new THREE.Vector3(-1, line, 0 ));
	menuItem_PlayGame.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		menuItem_PlayGame.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.THREE_solid.onBeforeRender = sector.solid_geometry.updateUniforms.bind( sector.THREE_solid, sector );
		sector.faceGradient = rainGlow
		sector.edgeGradient = whiteGradient

		sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.4, 0.8, 1, 1 );
		sector.solid_geometry.geometry.uniforms.edge_only = 0;
		sector.THREE_solid.position.add( new THREE.Vector3( 0, offset, 0 ));
	})
	line -= 4/25.0;

	var detailsize = (1.0/80.0)*0.25;

	menuItem_PlayGame.THREE_solid.visible = false;
	Voxelarium.controls.core.lockTextEntry( (text,cursorPos)=>{
		if( text === null ) {
			cursor.THREE_solid.visible = false;
			menuItem_PlayGame.THREE_solid.visible = true;
			menuItem_EnterName.THREE_solid.visible = false;
		}else {
			playerName.setText( text )
			cursor.THREE_solid.position.x = -1 + (1/80)*8*cursorPos;
		}
		//cursor.THREE_solid.matrix.origin.x = -1 + (1/80)*8*cursorPos;
	}  )

	var menuItem_EnterName = voxelUniverse.createTextCluster( "Enter Player Name:", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99, 1.0/80.0 );
	clusters.push( menuItem_EnterName );
    menuItem_EnterName.on( "mouseover", (cluster)=>{
		for( let sector of cluster.SectorList ) {
			sector.faceGradient = whiteGradient
			sector.edgeGradient = rainGlow;
                }
		
	} );
        menuItem_EnterName.on( "blur", (cluster)=>{
		for( let sector of cluster.SectorList ) {
			sector.faceGradient = rainGlow
			sector.edgeGradient = whiteGradient;
		}
		
	} );
	scene2.add(menuItem_EnterName.THREE_solid );
        menuItem_EnterName.THREE_solid.position.add( new THREE.Vector3(-1, line, 0 ));
	menuItem_EnterName.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		menuItem_EnterName.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.THREE_solid.onBeforeRender = sector.solid_geometry.updateUniforms.bind( sector.THREE_solid, sector );
		sector.faceGradient = rainGlow
		sector.edgeGradient = whiteGradient

		sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.4, 0.8, 1, 1 );
		sector.solid_geometry.geometry.uniforms.edge_only = 0;
		sector.THREE_solid.position.add( new THREE.Vector3( 0, offset, 0 ));
	})
	line -= 4/25.0;

	const playerName = renderVoxelWords( "Player One", -1, line +offset, 1/80 );

	const cursor = voxelUniverse.createTextCursor( { font:Voxelarium.Fonts.TI99
		, mesher: basicMesher
		   , voxelType :Voxelarium.Voxels.BlackRockType
		   , voxelUnitSize : 1.0/80.0
		  })
	cursor.SectorList.forEach( (sector)=>{
	basicMesher.MakeSectorRenderingData( sector );
	cursor.THREE_solid.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
	sector.THREE_solid.onBeforeRender = sector.solid_geometry.updateUniforms.bind( sector.THREE_solid, {
	faceGradient : blackGradient,
	edgeGradient : blueGlow
	} );

//sector.THREE_solid.position.add( new THREE.Vector3( (1/80)*8*10, offset, 0 ));
})
cursor.THREE_solid.position.add( new THREE.Vector3(-1 + (1/80)*8*10, line - 1/80, + 2/80 ));
scene2.add(cursor.THREE_solid );


	line -= 4/25.0;
	
	testWord = renderVoxelWords( "Inventory", -1, line +offset, detailsize );
	line -= 4/25.0;

	// test layout works...
	for( var n = 0; n < 1; n++ ) {
		renderVoxelWords( "Server Name Goes here" , -1                    ,line+offset, detailsize );
		renderVoxelWords( "Players 0/3"           , -1 + 25 * 8*detailsize,line+offset, detailsize );
		renderVoxelWords( "Ping 333"              , -1 + 40 * 8*detailsize,line+offset, detailsize );
		line -= 10*detailsize;
	}


	function renderVoxelWords( string, xofs, offset, size ) {

		var phrase = voxelUniverse.createDynamicTextCluster( string, {
				type:Voxelarium.Voxels.BlackRockType, 
				mesher:basicMesher, 
				shader:geometryShaderMono,
				font:Voxelarium.Fonts.TI99, 
				size:size,
				faceGradient : blackGradient,
				edgeGradient : greenGlow
		} );
		
		scene2.add( phrase.object )
		const info = phrase.object.userData;

		phrase.object.position.add( new THREE.Vector3(xofs, offset, 0) );
		return phrase;
	}
	}, 10)
}


		init();
		animate();

	})
})