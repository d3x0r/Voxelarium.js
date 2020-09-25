import * as THREE from "../three.js/build/three.module.js"


Voxelarium.GeometryShaderMono = function() {
    return new THREE.ShaderMaterial( {

	uniforms: {
        in_Color : { value : new THREE.Vector3() },
        in_FaceColor : { value : new THREE.Vector3() },
        in_Pow : { value : 0.0 },
        edge_only : { value : 0 },
	},
    transparent : true,
     blending: THREE.NormalBlending,
	vertexShader: `
                //attribute vec4 position;
                uniform mat3 rotation;
    			attribute vec2 in_Texture;
    			uniform  vec4 in_Color;
    			uniform  vec4 in_FaceColor;
    			attribute vec3 in_Normal;
    			uniform  float in_Pow;
                attribute  float in_use_texture;
    			attribute  float in_flat_color;
    			attribute  float in_decal_texture;

        		attribute  vec2 in_Modulous;
    			varying vec4 ex_Color;
    			varying vec2 ex_texCoord;
    			varying float ex_Dot;
    			varying  float ex_Pow;
                varying  float ex_Pow2;
    			float ex_use_texture;
    			float ex_flat_color;
    			float ex_decal_texture;
    			varying vec4 ex_FaceColor;

    			varying  vec2 ex_Modulous;
    			void main(void) {
    				vec3 normal;
    				float dottmp;
                    float dottmpright;
    			    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    				ex_texCoord = in_Texture/32768.0;
    				ex_Color = in_Color;
    				ex_FaceColor = in_FaceColor;

    				normal = normalMatrix * in_Normal;

    				dottmp = dot( normal, vec3( 0.0, 1.0, 0.0 ) );
                    dottmpright = dot( normal, vec3( 1.0, 0.0, 0.0 ) );

    				ex_Pow = in_Pow;// * (/*sqrt*/(1.0-dottmpright*dottmpright));
                    ex_Pow2 = in_Pow;// * (/*sqrt*/(1.0-dottmp*dottmp));

    				ex_use_texture = in_use_texture;
    				ex_flat_color = in_flat_color;
    				ex_Modulous = in_Modulous;
    			}
    `,//.replace(/[^\x00-\x7F]/g, ""),
	fragmentShader:`
    			varying vec2 ex_texCoord;
    			varying vec4 ex_Color;

                varying float ex_Pow;
                varying float ex_Pow2;
    			float ex_use_texture;
    			float ex_flat_color;
    			varying vec2 ex_Modulous;
    			varying vec4 ex_FaceColor;
                uniform  float edge_only;
    			uniform sampler2D tex;
    			void main(void) {
			float ca = ex_Color.a;
			ca = 1.0;
    			  if( ex_use_texture > 0.5 )
    				{
    					gl_FragColor = ex_Color * texture2D( tex, ex_texCoord );
    				}
    				else if( ex_flat_color > 0.5 )
    				{
    					gl_FragColor =vec4(1,0,1,1);// ex_Color;
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
        				a = pow( abs(a), 10.0);//ex_Pow );
        				b = pow( abs(b), 10.0);//ex_Pow2 );

        			 //g = pow( ( max(a,b)),in_Pow);
        				//h = pow( ( a*b),in_Pow/4);
        				g = min(1.0,b+a);
        				h = max((b+a)-1.0,0.0)/3.0;
					float mx = max(ex_Color.r,max(ex_Color.g,ex_Color.b));
					if( mx < 0.0001 ) white = vec3(1.0,1.0,1.0);
        				else white = vec3(1.0,1.0,1.0) * max(ex_Color.r,max(ex_Color.g,ex_Color.b));
					
        				//gl_FragColor = vec4( h * white + (g * ex_Color.rgb), ca ) ;
//        				gl_FragColor = vec4(  white.rgb, ca ) ;
//      				gl_FragColor = vec4( ex_Color.rgb, 1 ) ;
//					return;
        			//  gl_FragColor = vec4( g * ex_Color.rgb, ex_Color.a ) ;
                    if( edge_only > 0.5 ) {
                        gl_FragColor = vec4( h* ( white - ex_FaceColor.rgb )+ (g* ex_Color.rgb), 1.0/*(g * ca)*/ ) ;
	               } else
        			    gl_FragColor = vec4( ex_FaceColor.a*(1.0-g)*ex_FaceColor.rgb + h* ( white - ex_FaceColor.rgb )+ (g* ex_Color.rgb), 1.0/*(1.0-g)*ex_FaceColor.a + (g * ca)*/ ) ;
                    //    gl_FragColor = vec4( ex_FaceColor.a*(1.0-g)*ex_FaceColor.rgb +  (g* ex_Color.rgb), (1.0-g)*ex_FaceColor.a + (g * ex_Color.a) ) ;
    			}
            }
            `,//.replace(/[^\x00-\x7F]/g, "")

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
