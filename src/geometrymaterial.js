

Voxelarium.GeometryShader = function() {
    return new THREE.ShaderMaterial( {

	uniforms: {
        edge_only : { type: "f", value : 0 },
        map : { type : "t", value : null }
	},
    transparent : true,
     blending: THREE.NormalBlending,
	vertexShader: `
    #define USE_MAP

    #include <common>
    #include <uv_pars_vertex>
    #include <uv2_pars_vertex>
    #include <envmap_pars_vertex>
    #include <color_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>

    attribute vec2 in_Texture;
    attribute  vec4 in_Color;
    attribute  vec4 in_FaceColor;
    attribute vec3 in_Normal;
    attribute  float in_Pow;

    attribute  float in_use_texture;
    attribute  float in_flat_color;
    attribute  float in_decal_texture;

    attribute  vec2 in_Modulous;
    varying vec4 ex_Color;
    varying vec2 ex_texCoord;
    varying float ex_Dot;
    varying  float ex_Pow;
    varying  float ex_Pow2;
    varying float vDepth;
    varying float ex_use_texture;
    varying float ex_flat_color;
    varying float ex_decal_texture;
    varying vec4 ex_FaceColor;
    #define EPSILON 1e-6

    varying  vec2 ex_Modulous;

    varying vec4 fe_normal, light_dir, eye_vec, lookat;
    //const float PI =  3.14159265;

    void main() {

    	#include <uv_vertex>
    	#include <uv2_vertex>
    	#include <color_vertex>
    	#include <skinbase_vertex>

    	#ifdef USE_ENVMAP

    	#include <beginnormal_vertex>
    	#include <morphnormal_vertex>
    	#include <skinnormal_vertex>
    	#include <defaultnormal_vertex>

    	#endif

    	#include <begin_vertex>
    	#include <morphtarget_vertex>
    	#include <skinning_vertex>

        #include <project_vertex>
/*

        {
        	vec4 ambient, diffuse, specular;
        	float NdotL, RdotV;

        	//fe_normal = vec4(gl_NormalMatrix * gl_Normal, 0.0);

        	vec4 vVertex = modelViewMatrix * vec4( transformed, 1.0 );

        	//light_dir = gl_LightSource[0].position - vVertex;

        	eye_vec = -vVertex;

        	vec4 temp_pos = projectionMatrix * vVertex;

        	float dist = length(eye_vec);
        	lookat = eye_vec - temp_pos;
        	vec4 dir = temp_pos - eye_vec;
        	vec4 center = normalize(-eye_vec);
        	vec4 proj = dot(temp_pos, normalize(-lookat)) * normalize(-lookat);

        	vec4 c = temp_pos - proj;

        	float magnitude = 1.0-acos(dot(normalize(-eye_vec), normalize(temp_pos)));

        	c = length(c) * magnitude * normalize(c);

        	vec4 dir2 = normalize(c-lookat);

        	dir2 = (dir2 * dist);

        	gl_Position.xyz = dir2.xyz;
        	gl_Position.w = temp_pos.w;

        }
*/
    	#include <logdepthbuf_vertex>

    	#include <worldpos_vertex>
    	#include <clipping_planes_vertex>
    	#include <envmap_vertex>


{
        ex_texCoord = in_Texture;
        ex_Color = in_Color;
        ex_FaceColor = in_FaceColor;

        //normal = normalMatrix * in_Normal;

        //dottmp = dot( normal, vec3( 0.0, 1.0, 0.0 ) );
        //dottmpright = dot( normal, vec3( 1.0, 0.0, 0.0 ) );

        ex_Pow = in_Pow;// * (/*sqrt/(1.0-dottmpright*dottmpright));
        ex_Pow2 = in_Pow;// * (/*sqrt/(1.0-dottmp*dottmp));

        ex_use_texture = in_use_texture;
        ex_flat_color = in_flat_color;
        ex_Modulous = in_Modulous;
}

    }
    `,
fragmentShader:`
    uniform vec3 diffuse;
    uniform float opacity;

    #ifndef FLAT_SHADED

    	varying vec3 vNormal;

    #endif
    #define USE_MAP

    #include <common>
    #include <color_pars_fragment>
    #include <uv_pars_fragment>
    #include <uv2_pars_fragment>
    #include <map_pars_fragment>
    #include <alphamap_pars_fragment>
    #include <aomap_pars_fragment>
    #include <envmap_pars_fragment>
    #include <fog_pars_fragment>
    #include <specularmap_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>

    varying vec2 ex_texCoord;
    varying vec4 ex_Color;

    varying float ex_Pow;
    varying float ex_Pow2;
    varying float ex_use_texture;
    varying float ex_flat_color;
    varying vec2 ex_Modulous;
    varying vec4 ex_FaceColor;
    //uniform sampler2D tex;
    uniform float edge_only;

    uniform float logDepthBufFC;
    varying float vFragDepth;

    void main() {

    	#include <clipping_planes_fragment>

    	vec4 diffuseColor = vec4( diffuse, opacity );

    	#include <logdepthbuf_fragment>
    	#include <map_fragment>
    	#include <color_fragment>
    	#include <alphamap_fragment>
    	#include <alphatest_fragment>
    	#include <specularmap_fragment>



        //if(2.0 > 1.0)
        {
                if( ex_use_texture > 0.5 )
                {
                    vec2 tmp = ex_texCoord * 1.0;
                    //diffuseColor = ;
                    if( edge_only > 0.5 )
                        diffuseColor = vec4(0.0);
                    else
                        diffuseColor = vec4( texture2D( map, tmp ).rgb, 1.0 );
                    //diffuseColor =vec4(ex_texCoord.x,ex_texCoord.y,0,1);// ex_Color;
                }
                else if( ex_flat_color > 0.5 )
                {
                    diffuseColor =vec4(1,0,1,1);// ex_Color;
                }
                else
                {
                    float a = mod(ex_Modulous.x +0.5, 1.0 )-0.5;
                    float b = mod(ex_Modulous.y +0.5, 1.0 )-0.5;

                    float g;
                    float h;
                    vec3 white;
                    a = 4.0*(0.25-a*a);
                    b = 4.0*(0.25-b*b);
                    a = pow( abs(a), ex_Pow );
                    b = pow( abs(b), ex_Pow2 );

                 //g = pow( ( max(a,b)),in_Pow);
                    //h = pow( ( a*b),in_Pow/4);
                    g = min(1.0,b+a);
                    h = max((b+a)-1.0,0.0)/3.0;
                    white = vec3(1.0,1.0,1.0) * max(ex_Color.r,max(ex_Color.g,ex_Color.b));
                    //	diffuseColor = vec4( h * white + (g * ex_Color.rgb), ex_Color.a ) ;
                    //  diffuseColor = vec4( g * ex_Color.rgb, ex_Color.a ) ;
                    if( edge_only > 0.5 )
                         diffuseColor = vec4( h* ( white - ex_FaceColor.rgb )+ (g* ex_Color.rgb), (g * ex_Color.a) ) ;
                    else
                         diffuseColor = vec4( ex_FaceColor.a*(1.0-g)*ex_FaceColor.rgb + h* ( white - ex_FaceColor.rgb ) + (g* ex_Color.rgb), (1.0-g)*ex_FaceColor.a + (g * ex_Color.a) ) ;
                    //diffuseColor = vec4( (1.0-g)*ex_FaceColor.rgb + h* ( white - ex_FaceColor.rgb )+ (g* ex_Color.rgb), (1.0-g)*ex_FaceColor.a + (g * ex_Color.a) ) ;
                    //diffuseColor = vec4(g,h,1,1);
                    //diffuseColor = ex_Color;
                }
        }


    	ReflectedLight reflectedLight;
    	reflectedLight.directDiffuse = vec3( 0.0 );
    	reflectedLight.directSpecular = vec3( 0.0 );
    	reflectedLight.indirectDiffuse = diffuseColor.rgb;
    	reflectedLight.indirectSpecular = vec3( 0.0 );

    	#include <aomap_fragment>

    	vec3 outgoingLight = reflectedLight.indirectDiffuse;

    	#include <envmap_fragment>

    	gl_FragColor = diffuseColor;//vec4( outgoingLight, diffuseColor.a );

    	#include <premultiplied_alpha_fragment>
    	#include <tonemapping_fragment>
    	#include <encodings_fragment>
    	#include <fog_fragment>

    }
    `
} );

/*
#if !MORE_ROUNDED
              g = sqrt((a*a+b*b)/2);
              h = pow(g,200.0) * 0.5;  // up to 600 even works...
              g = pow( ( max(a,b)),400);
              h = (g+h);
              gl_FragColor = vec4( h * in_Color.rgb, in_Color.a ) ;
#else
*/

}
