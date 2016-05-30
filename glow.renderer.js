

var glowcomposer;
var scenecomposer;
var finalcomposer;

var renderTargetGlow;
var	renderTarget;


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

var preGlow;
var preFlat;

exports.makeComposers = function makeComposers( sceneFlat, preFlatSetup, sceneGlow, preGlowSetup ) {
	renderer.autoClear = false;
    preGlow = preGlowSetup;
    preFlat = preFlatSetup;
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
	var renderModelGlow = new THREE.RenderPass( sceneGlow, camera);

	// Create the glow composer
	glowcomposer = new THREE.EffectComposer( renderer, renderTargetGlow );

	// Add all the glow passes
	glowcomposer.addPass( renderModelGlow );
	glowcomposer.addPass( hblur );
	glowcomposer.addPass( vblur );


	// Prepare the base scene render pass
	var renderModel = new THREE.RenderPass( sceneFlat, camera );
	var renderModel2 = new THREE.RenderPass( sceneGlow, camera );
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



exports.render = function render() {
    preGlow();
    glowcomposer.render();

    preFlat();
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
