"use strict";



//var THREE = require( "../three.js/three.js/build/three.js" );
//var mycam =
var loader = new THREE.FontLoader();
var font;
var clusters = [];
loader.load( 'src/fonts/Microsoft YaHei_Regular.js', function ( _font ) {
	console.log( "Have a font?")
    // your code here
	font = _font;

	var material = new THREE.MeshPhongMaterial({
			color: 0xdddddd
		});
		var textGeom = new THREE.TextGeometry( 'Hello World!', {
			font: font // Must be lowercase!
			, height : 1
			, size : 50

		});
		var textMesh = new THREE.Mesh( textGeom, material );
		textMesh.position.z += 150
		scene.add( textMesh );

} );
var l = 0;

var voxelUniverse = Voxelarium.World();
var geometryShader;
var geometryShaderMono;
//var words1 = voxelUniverse.createTextCluster( "Hello World" );

var controlNatural;
var controlOrbit;
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

var finalshader = {
    uniforms: {
        tDiffuse: { type: "t", value: 0, texture: null }, // The base scene buffer
        tGlow: { type: "t", value: 1, texture: null }, // The glow scene buffer
		tDiffuseDepth: { type: "t", value: 0, texture: null }, // The base scene buffer
        tGlowDepth: { type: "t", value: 1, texture: null }, // The glow scene buffer
		cameraNear: { type: 'f', value: 1 },
		cameraFar: { type: 'f', value: 10000 },
    },

    vertexShader: [
        "varying vec2 vUv;",

        "void main() {",

            "vUv = vec2( uv.x, uv.y );",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"
    ].join(""),

    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tGlow;",
		"uniform sampler2D tDiffuseDepth;",
		"uniform sampler2D tGlowDepth;",
		"uniform float cameraNear;",
 		"uniform float cameraFar;",

        "varying vec2 vUv;",

		"float readDepth (sampler2D depthSampler, vec2 coord) {",
        "  float cameraFarPlusNear = cameraFar + cameraNear;",
        "  float cameraFarMinusNear = cameraFar - cameraNear;",
        "  float cameraCoef = 2.0 * cameraNear;",
        "  return 100.0*(cameraCoef / (cameraFarPlusNear - texture2D(depthSampler, coord).x * cameraFarMinusNear));",
        "}",

        "void main() {",

            "vec4 texel = texture2D( tDiffuse, vUv );",
            "vec4 glow = texture2D( tGlow, vUv );",
			"float texelDepth = readDepth( tDiffuseDepth, vUv );",
			"float glowDepth = readDepth( tGlowDepth, vUv );",
			//"float texelDepth = texture2D(tDiffuseDepth, vUv).x;",
            //"if( (texel.r+texel.g+texel.b)== 0.0 ) ",
			"    gl_FragColor = 0.1 * (texel + vec4(0.5, 0.75, 1.0, 1.0) * glow * 3.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			"    gl_FragColor +=  vec4(texelDepth, glowDepth, 0.0, 1.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			//"else gl_FragColor = texel;",
			//"gl_FragColor = texel;",

        "}"
    ].join("")
};



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


function makeComposers() {
	renderer.autoClear = false;

	// Prepare the glow composer's render target
	var renderTargetParameters = { minFilter: THREE.LinearFilter
			, magFilter: THREE.LinearFilter
			//, format: THREE.RGBFormat
			, stencilBufer: false };
	if( !renderTargetGlow ){
		renderTargetGlow = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
		renderTargetGlow.texture.minFilter = THREE.LinearFilter;
		renderTargetGlow.texture.magFilter = THREE.LinearFilter;
		renderTargetGlow.texture.stencilBufer = false;
		renderTargetGlow.depthTexture = new THREE.DepthTexture( );
		//renderTargetGlow.depthTexture.type = isWebGL2 ? THREE.FloatType : THREE.UnsignedShortType;
	}
	// Prepare the blur shader passes
	var hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
	var vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );

	var bluriness = 1;

	hblur.uniforms[ "h" ].value = bluriness / window.innerWidth;
	//hblur.material.depthTest = false;
	//hblur.material.depthWrite = false;

	vblur.uniforms[ "v" ].value = bluriness / window.innerHeight;
	//vblur.material.depthTest = false;
	//vblur.material.depthWrite = false;

	// Prepare the glow scene render pass
	var renderModelGlow = new THREE.RenderPass( scene2, camera);

	// Create the glow composer
	glowcomposer = new THREE.EffectComposer( renderer, renderTargetGlow );

	// Add all the glow passes
	glowcomposer.addPass( renderModelGlow );
	glowcomposer.addPass( hblur );
	glowcomposer.addPass( vblur );


	// Prepare the base scene render pass
	var renderModel = new THREE.RenderPass( scene, camera );
	var renderModel2 = new THREE.RenderPass( scene2, camera );
	renderModel.clear = true;
	renderModel2.clear = false;


	// Prepare the composer's render target
	if( !renderTarget ) {
		renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
		renderTargetGlow.texture.minFilter = THREE.LinearFilter;
		renderTargetGlow.texture.magFilter = THREE.LinearFilter;
		renderTargetGlow.texture.stencilBufer = false;
		renderTarget.depthTexture = new THREE.DepthTexture();
		//renderTarget.depthTexture.type = isWebGL2 ? THREE.FloatType : THREE.UnsignedShortType;
		renderTarget.depthTexture.type = THREE.FloatType ;//: THREE.UnsignedShortType;
	}
	// Create the composer
//	scenecomposer = new THREE.EffectComposer( renderer, renderTarget );

	// First we need to assign the glow composer's output render target to the tGlow sampler2D of our shader
	// Old Three.js pre-r50
	//finalshader.uniforms[ "tGlow" ].texture = glowcomposer.renderTarget2;
	// New Three.js
	finalshader.uniforms[ "tGlow" ].value = glowcomposer.renderTarget2;
	finalshader.uniforms[ "tGlowDepth" ].value = renderTargetGlow.depthTexture;
	finalshader.uniforms[ "tDiffuseDepth" ].value = renderTarget.depthTexture;
	finalshader.uniforms[ "cameraNear"].value = camera.near;
	finalshader.uniforms[ "cameraFar"].value = camera.far;

	//finalshader.uniforms[ "tDiffuse" ].value = scenecomposer.renderTarget2;
	// Note that the tDiffuse sampler2D will be automatically filled by the EffectComposer

	// Prepare the additive blending pass
	var finalPass = new THREE.ShaderPass( finalshader );
	finalPass.needsSwap = true;
	// Make sure the additive blending is rendered to the screen (since it's the last pass)
	finalPass.renderToScreen = true;

	// Create the composer
	finalcomposer = new THREE.EffectComposer( renderer, renderTarget );

	// Add all passes
	finalcomposer.addPass( renderModel );
	finalcomposer.addPass( renderModel2 );
	finalcomposer.addPass( finalPass );
}

function makeText( t,color, v )
{
	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	context1.font = "Bold 40px Arial";
	context1.fillStyle = color;
    context1.fillText(t, 0, 50);

	// canvas contents will be used for a texture
	var texture1 = new THREE.Texture(canvas1)
	texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    var mesh1 = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
      );
	  if( v )
	  mesh1.position.set( v[0], v[1], v[2] );
	  else
	mesh1.position.set(0,0,150);
	scene.add( mesh1 );
	return mesh1;
}

var status_line;
	function init() {
		document.getElementById( "controls1").onclick = setControls1;
		document.getElementById( "controls2").onclick = setControls2;

		scene = new THREE.Scene();
		scene2 = new THREE.Scene();
		scene3 = new THREE.Scene();

		// for phong hello world test....
		light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
		light.position.set( 0, 0, 1000 );
		scene.add( light );

		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

		camera.matrixAutoUpdate = false;
		camera.position.z = 800;
		camera.matrixWorldNeedsUpdate = true;

		 var geometryMaterial = Voxelarium.GeometryBuffer();
		 geometryMaterial.makeVoxCube(  );
		 geometryShader = Voxelarium.GeometryShader();
		 geometryShaderMono = Voxelarium.GeometryShaderMono();
		 //scene2.add( new THREE.Mesh( geometryMaterial.geometry, geometryShader) );

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

		makeComposers();

		document.body.appendChild( renderer.domElement );

		controlNatural = new THREE.NaturalControls( camera, renderer.domElement );
		controlNatural.disable();
		controlOrbit = new THREE.OrbitControls( camera, renderer.domElement );
		camera.matrixAutoUpdate = false;
		controlOrbit.enable();
		controls = controlOrbit;

	}

function slowanim() {
	setTimeout( animate, 256 );

}




function render() {
	renderer.clear();
	clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
		sector.solid_geometry.geometry.uniforms.edge_only = 1;
	})})
    glowcomposer.render();

	clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
		sector.solid_geometry.geometry.uniforms.edge_only = 0;
	})})
	//scenecomposer.render();

	finalshader.uniforms[ "tGlow" ].value = glowcomposer.renderTarget2;
	finalshader.uniforms[ "tGlowDepth" ].value = renderTargetGlow.depthTexture.texture;
	finalshader.uniforms[ "tDiffuseDepth" ].value = renderTarget.depthTexture.texture;
	finalshader.uniforms[ "cameraNear"].value = camera.near;
	finalshader.uniforms[ "cameraFar"].value = camera.far;


    finalcomposer.render();
}
//render();

var nFrame = 0;
var nTarget = 60;
var nTarget2 = 120;

function animate() {
	var delta = clock.getDelta();

		controls.update();

		tests.forEach( (test)=>{ test.animate(); } )


		//nFrame++;
		if( nFrame++ < nTarget ) {
			clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
				sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.3 * 1, 0.7* 1,0.9* 1, 1.0 );
				//sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.3 * (nTarget-nFrame)/nTarget, 0.7* (nTarget-nFrame)/nTarget,0.9* (nTarget-nFrame)/nTarget, 1.0 );
				sector.solid_geometry.geometry.uniforms.in_Color = new THREE.Vector4( 0.3 * (nFrame)/nTarget, 0.7* (nFrame)/nTarget,0.9* (nFrame)/nTarget, 1.0 );
			})})
		} else if( nFrame < nTarget2 ) {
			clusters.forEach( (cluster)=>{ cluster.SectorList.forEach( (sector)=>{
				sector.solid_geometry.geometry.uniforms.in_Color = new THREE.Vector4( 0.3 * (nTarget2-nFrame)/nTarget, 0.7* (nTarget2-nFrame)/nTarget,0.9* (nTarget2-nFrame)/nTarget, 1.0 );
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

function initVoxelarium() {
	var basicMesher = Voxelarium.BasicMesher(  );


	var words1 = voxelUniverse.createTextCluster( "Voxelarium", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99 );
	clusters.push( words1 );
	var offset = 300;
	words1.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		scene2.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.THREE_solid.matrix.Translate( -800, +offset, 0 );
	})

	var words1 = voxelUniverse.createTextCluster( "Black Voxel", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99 );
	clusters.push( words1 );
	words1.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		scene2.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.THREE_solid.matrix.Translate( -800, -8*20+offset, 0 );
	})

	var words1 = voxelUniverse.createTextCluster( "Play Game", Voxelarium.Voxels.BlackRockType, basicMesher, Voxelarium.Fonts.TI99 );
	clusters.push( words1 );
	words1.SectorList.forEach( (sector)=>{
		basicMesher.MakeSectorRenderingData( sector );
		scene2.add( sector.THREE_solid = new THREE.Mesh( sector.solid_geometry.geometry, geometryShaderMono ) )
		sector.solid_geometry.geometry.uniforms.in_FaceColor = new THREE.Vector4( 0.4, 0.8, 1, 1 );
		sector.solid_geometry.geometry.uniforms.edge_only = 0;
		sector.THREE_solid.matrix.Translate( -800, -2*8*20+offset, 0 );
	})

}

function makeLine() {
	//console.log( l )
	var material = new THREE.LineBasicMaterial({
		color:l===0? 0x0000ff:l===1?0x80ff80:l==2?0xff0000:0xff00ff
	});
	l++;
	if( l == 3)
		l = 0;
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3( -10, 0, 0 ),
		new THREE.Vector3( 0, 10, 0 ),
		new THREE.Vector3( 10, 0, 0 )
	);

	var line = new THREE.Line( geometry, material );
	scene.add( line );
	return line;
}


init();
animate();
