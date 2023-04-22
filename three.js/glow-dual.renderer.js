import * as THREE from "./build/three.module.js"
import {ShaderPass} from  "./three.js.post/ShaderPass.js"
import {VerticalBlurShader} from  "./three.js.post/shaders/VerticalBlurShader.js"
import {HorizontalBlurShader} from "./three.js.post/shaders/HorizontalBlurShader.js"
import {RenderPass} from "./three.js.post/RenderPass.js"
import {EffectComposer} from "./three.js.post/EffectComposer.js"

import {Voxelarium} from "../src/Voxelarium.core.js"

//const camera = Voxelarium.camera;
const glow = {

 glowcomposer : null,
 scenecomposer : null,
 finalcomposer : null,
 finalcomposer2 : null,

 renderTargetGlow : null,
	renderTarget : null,
        render : null,
    };


let glowcomposer;
let glowcomposer2;
let scenecomposer;
let finalcomposer;
let finalcomposer2;

let renderTargetGlow;
let	renderTarget;
let renderTargetGlow2;
let	renderTarget2;

let finalshader = {
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
        "  return 1.0-(cameraCoef / (cameraFarPlusNear - texture2D(depthSampler, coord).x * cameraFarMinusNear));",
        "}",

        "void main() {",

            "vec4 texel = texture2D( tDiffuse, vUv );",
            "vec4 glow = texture2D( tGlow, vUv );",
			"float texelDepth = readDepth( tDiffuseDepth, vUv );",
			"float glowDepth = readDepth( tGlowDepth, vUv );",
			//"float texelDepth = texture2D(tDiffuseDepth, vUv).x;",
            //"if( (texel.r+texel.g+texel.b)== 0.0 ) ",
			"    gl_FragColor = (texel + vec4(0.5, 0.75, 1.0, 3.0) * glow * 1.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			//"    gl_FragColor +=  vec4(texelDepth, glowDepth, 0, 1.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			//"else gl_FragColor = texel;",
			//"gl_FragColor = texel;",

        "}"
    ].join("")
};
let finalshader2 = {
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
        "  return 1.0-(cameraCoef / (cameraFarPlusNear - texture2D(depthSampler, coord).x * cameraFarMinusNear));",
        "}",

        "void main() {",

            "vec4 texel = texture2D( tDiffuse, vUv );",
            "vec4 glow = texture2D( tGlow, vUv );",
			"float texelDepth = readDepth( tDiffuseDepth, vUv );",
			"float glowDepth = readDepth( tGlowDepth, vUv );",
			//"float texelDepth = texture2D(tDiffuseDepth, vUv).x;",
            //"if( (texel.r+texel.g+texel.b)== 0.0 ) ",
			"    gl_FragColor = (texel + vec4(0.5, 0.75, 1.0, 3.0) * glow * 1.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			//"    gl_FragColor +=  vec4(texelDepth, glowDepth, 0, 1.0);", // Blend the two buffers together (I colorized and intensified the glow at the same time)
			//"else gl_FragColor = texel;",
			//"gl_FragColor = texel;",

        "}"
    ].join("")
};

let preGlow;
let preFlat;
let overlay;
let scene;

glow.makeComposers =
function makeComposers( renderer, sceneFlat, preFlatSetup, sceneGlow, preGlowSetup, sceneOver ) {
	//const camera = Voxelarium.camera;
  scene = sceneFlat;
  glow.renderer = renderer;
  renderer.autoClear = false;

  if( !Voxelarium.Settings.use_basic_material ) {

    overlay = sceneOver;
    preGlow = preGlowSetup;
    preFlat = preFlatSetup;
	// Prepare the glow composer's render target
	let renderTargetParameters = { minFilter: THREE.LinearFilter
			, magFilter: THREE.LinearFilter
			//, format: THREE.RGBFormat
			, stencilBufer: false };
	if( !renderTargetGlow ){
          let size = renderer.getSize();
          console.log( size );
	  renderTargetGlow = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
	  renderTargetGlow.texture.minFilter = THREE.LinearFilter;
	  renderTargetGlow.texture.magFilter = THREE.LinearFilter;
	  renderTargetGlow.texture.stencilBufer = false;
	  renderTargetGlow.depthTexture = new THREE.DepthTexture( );

	  renderTargetGlow2 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
	  renderTargetGlow2.texture.minFilter = THREE.LinearFilter;
	  renderTargetGlow2.texture.magFilter = THREE.LinearFilter;
	  renderTargetGlow2.texture.stencilBufer = false;
	  renderTargetGlow2.depthTexture = new THREE.DepthTexture( );
	  //renderTargetGlow.depthTexture.type = isWebGL2 ? THREE.FloatType : THREE.UnsignedShortType;
	}
	// Prepare the blur shader passes
	let hblur = new ShaderPass( HorizontalBlurShader );
	let vblur = new ShaderPass( VerticalBlurShader );

	let bluriness = 1;

	hblur.uniforms[ "h" ].value = bluriness / window.innerWidth;
	//hblur.material.depthTest = false;
	//hblur.material.depthWrite = false;

	vblur.uniforms[ "v" ].value = bluriness / window.innerHeight;
	//vblur.material.depthTest = false;
	//vblur.material.depthWrite = false;

	// Prepare the glow scene render pass
	let renderModelGlow = new RenderPass( sceneGlow, Voxelarium.camera);
	let renderModelGlow2 = new RenderPass( sceneGlow, Voxelarium.camera2);

	// Create the glow composer
	glowcomposer = new EffectComposer( renderer, renderTargetGlow );
	glowcomposer2 = new EffectComposer( renderer, renderTargetGlow2 );

	// Add all the glow passes
	glowcomposer.addPass( renderModelGlow );
	glowcomposer.addPass( hblur );
	glowcomposer.addPass( vblur );

	glowcomposer2.addPass( renderModelGlow2 );
	glowcomposer2.addPass( hblur );
	glowcomposer2.addPass( vblur );

	// Prepare the base scene render pass
	let renderModel = new RenderPass( sceneFlat, Voxelarium.camera );
	let renderModel2 = new RenderPass( sceneGlow, Voxelarium.camera );
	renderModel.clear = true;
	renderModel2.clear = false;

	let renderModel2_flat = new RenderPass( sceneFlat, Voxelarium.camera2 );
	let renderModel22 = new RenderPass( sceneGlow, Voxelarium.camera2 );
	renderModel2_flat.clear = true;
	renderModel22.clear = false;

	// Prepare the composer's render target
	if( !renderTarget ) {
		renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
		renderTargetGlow.texture.minFilter = THREE.LinearFilter;
		renderTargetGlow.texture.magFilter = THREE.LinearFilter;
		renderTargetGlow.texture.stencilBufer = false;
		renderTarget.depthTexture = new THREE.DepthTexture();

		renderTarget2 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight/*, renderTargetParameters*/ );
		renderTargetGlow2.texture.minFilter = THREE.LinearFilter;
		renderTargetGlow2.texture.magFilter = THREE.LinearFilter;
		renderTargetGlow2.texture.stencilBufer = false;
		renderTarget2.depthTexture = new THREE.DepthTexture();
		//renderTarget.depthTexture.type = isWebGL2 ? THREE.FloatType : THREE.UnsignedShortType;
		//renderTarget.depthTexture.type = THREE.FloatType ;//: THREE.UnsignedShortType;
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
	finalshader.uniforms[ "cameraNear"].value = Voxelarium.camera.near;
	finalshader.uniforms[ "cameraFar"].value = Voxelarium.camera.far;

	finalshader2.uniforms[ "tGlow" ].value = glowcomposer2.renderTarget2;
	finalshader2.uniforms[ "tGlowDepth" ].value = renderTargetGlow2.depthTexture;
	finalshader2.uniforms[ "tDiffuseDepth" ].value = renderTarget2.depthTexture;
	finalshader2.uniforms[ "cameraNear"].value = Voxelarium.camera2.near;
	finalshader2.uniforms[ "cameraFar"].value = Voxelarium.camera2.far;

	//finalshader.uniforms[ "tDiffuse" ].value = scenecomposer.renderTarget2;
	// Note that the tDiffuse sampler2D will be automatically filled by the EffectComposer

	// Prepare the additive blending pass
	let finalPass = new ShaderPass( finalshader );
	finalPass.needsSwap = false;
	// Make sure the additive blending is rendered to the screen (since it's the last pass)
	finalPass.renderToScreen = true;

	let finalPass2 = new ShaderPass( finalshader2 );
	finalPass2.needsSwap = false;
	// Make sure the additive blending is rendered to the screen (since it's the last pass)
	finalPass2.renderToScreen = true;

	// Create the composer
	finalcomposer = new EffectComposer( renderer, renderTarget );

	// Add all passes
	finalcomposer.addPass( renderModel );
	finalcomposer.addPass( renderModel2 );
	finalcomposer.addPass( finalPass );

	finalcomposer2 = new EffectComposer( renderer, renderTarget2 );

	// Add all passes
	finalcomposer2.addPass( renderModel2_flat );
	finalcomposer2.addPass( renderModel22 );
	finalcomposer2.addPass( finalPass2 );

	}
    //finalcomposer.addPass( renderModel3 );
}



//exports.render =
glow.render = function glowRender() {
	//const camera = Voxelarium.camera;
	[Voxelarium.camera, Voxelarium.camera2].forEach( (camera,id)=>{
		const renderer = glow.renderer;
		const square_size = window.innerWidth/2;
		if( id ) {
			renderer.setViewport( 0, 0, square_size, square_size );
			renderer.setScissor( 0, 0, square_size, square_size );
			renderer.setScissorTest( true );
			renderer.setClearColor( 0x300000,1.0 );
			finalshader2.uniforms[ "tGlow" ].value = glowcomposer2.renderTarget2;
			finalshader2.uniforms[ "tGlowDepth" ].value = renderTargetGlow2.depthTexture.texture;
			finalshader2.uniforms[ "tDiffuseDepth" ].value = renderTarget2.depthTexture.texture;
			finalshader2.uniforms[ "cameraNear"].value = camera.near;
			finalshader2.uniforms[ "cameraFar"].value = camera.far;
	
		}else {
			renderer.setViewport( square_size, 0, square_size, square_size );
			renderer.setScissor( square_size, 0, square_size, square_size );
			renderer.setScissorTest( true );
			renderer.setClearColor( 0x003000,1.0 );
			finalshader.uniforms[ "tGlow" ].value = glowcomposer.renderTarget2;
			finalshader.uniforms[ "tGlowDepth" ].value = renderTargetGlow.depthTexture.texture;
			finalshader.uniforms[ "tDiffuseDepth" ].value = renderTarget.depthTexture.texture;
			finalshader.uniforms[ "cameraNear"].value = camera.near;
			finalshader.uniforms[ "cameraFar"].value = camera.far;
	
		}
	if( !Voxelarium.Settings.use_basic_material ) {
		preGlow();
		if( id )
			glowcomposer2.render();
		else
			glowcomposer.render();

		preFlat();
		//scenecomposer.render();

		if( id )
			finalcomposer2.render();
		else
			finalcomposer.render();
			
		if( overlay )
			glow.renderer.render( overlay, camera );
	}
	else {
		glow.renderer.render( scene, camera );
		if( overlay )
			glow.renderer.render( overlay, camera );

	}
	} )
	if( Voxelarium.Settings.VR )
		effect.submitFrame();
}
export {glow}