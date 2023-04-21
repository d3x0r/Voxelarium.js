import * as THREE from "../three.js/build/three.module.js"


Voxelarium.GeometryShaderMono = function() {
    return new THREE.ShaderMaterial( {

	uniforms: {
        in_Color : { value : new THREE.Vector3() },
        in_FaceColor : { value : new THREE.Vector3() },
        in_Pow : { value : 0.0 },
        edge_only : { value : 0 },
        enableAberration : { value : 0 },
        enableLorentz : { value : 0 },
		velocity1 : { value: new THREE.Vector3(0,0,0) },
        velocity2 : { value: new THREE.Vector3(0,0,0) }

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

				uniform float time;
				uniform vec3 velocity1;
				uniform vec3 velocity2;
				uniform int enableAberration;
				uniform int enableLorentz;
				const float C=1.0;
			
				vec3 aberration( vec3 X, vec3 Vo, vec3 Xo ){
			
					if( enableAberration == 0 ) {
						return X+Xo;
					}
					vec3 Xr;// = vec3();
					float delx = X.x-Xo.x;
					float dely = X.y-Xo.y;
					float delz = X.z-Xo.z;
					float len2 = delx*delx+dely*dely+delz*delz;
					float Vlen2 = Vo.x*Vo.x+Vo.y*Vo.y+Vo.z*Vo.z;
					float Vdot = delx * Vo.x + dely * Vo.y + delz * Vo.z;
					vec3 Vcrs = vec3(  delz*Vo.y-dely*Vo.z, delx*Vo.z-delz*Vo.x, dely*Vo.x-delx*Vo.y );
					if( len2 < 0.0000001 || Vlen2 < 0.000001) {
						// not far enough away to change...
						Xr =  Xo+X;
					} else {
						float len = sqrt(len2);
						float Vlen = sqrt(Vlen2);
						float norm = Vlen*len;
						 //const vAng = acos( Vo.x/Vlen ) * (Vo.y<0?1:-1);
						 //console.log( "velocity angle:", vAng, "from", Vlen );
						float CosVDot = Vdot/(norm);
						float baseAng = acos( CosVDot );
						float delAng = acos( ( CosVDot + Vlen/C ) 
								/ ( 1.0 + Vlen/C * CosVDot ) )-baseAng;
				
						if( abs(delAng) < 0.00000001 ) {
							Xr=Xo+X;
							return Xr;
						}
						float c = cos(delAng);
						float s = sin(delAng);
						float n = sqrt( Vcrs.x*Vcrs.x+Vcrs.y*Vcrs.y+Vcrs.z*Vcrs.z);
						if( n < 0.000000001 )
						{
							Xr=Xo+X;
							return Xr;
						}
						float qx = Vcrs.x/n;
						float qy = Vcrs.y/n;
						float qz = Vcrs.z/n;
				
						float vx = delx , vy = dely , vz = delz;
				
						float dot =  (1.0-c)*((qx * vx ) + (qy*vy)+(qz*vz));
						Xr.x = Xo.x + vx*c + s*(qy * vz - qz * vy) + qx * dot;
						Xr.y = Xo.y + vy*c + s*(qz * vx - qx * vz) + qy * dot;
						Xr.z = Xo.z + vz*c + s*(qx * vy - qy * vx) + qz * dot;
						
				/*
						const lnQ = new lnQuat( delAng, Vcrs ); // normalizes vector
						const delVec = {x:delx, y:dely, z:delz };
						const newDel = lnQ.apply( delVec )
				
						Xr.x = Xo.x + newDel.x;
						Xr.y = Xo.y + newDel.y;
						Xr.z = Xo.z + newDel.z;
				*/
					}
					return Xr;
				}
			

    			void main(void) {
    				vec3 normal;
    				float dottmp;
                    float dottmpright;


					vec3 startPos = (modelViewMatrix * vec4( position, 1.0 )).xyz;
            
					if( enableLorentz > 0 ) {
			
						// move position to real position, camera is then at (0,0,0)
						mat3 rotmat = mat3( modelViewMatrix );
						vec3 realVel = (rotmat *  velocity1 );
						vec3 realVel2 = (rotmat *  velocity2 );
						vec3 delpos = startPos;
						vec3 tmp = delpos - realVel2*time;
						float A = time*time*C*C - dot(tmp,tmp);
						float B = time*C*C + dot(realVel, tmp );
						float D = C*C-dot(realVel,realVel);
						float T;
						if( abs(D) < 0.0000001 ) T = B/(2.0*A);
						else T = (sqrt( B*B - D*A ) + B)/D;
						vec3 real_position = startPos + T*realVel;
						//vec3 real_position = startPos;
						//gl_Position = projectionMatrix * vec4( real_position, 1.0 );
						vec3 abb_pos = aberration( real_position, -realVel2, vec3(0) );
						gl_Position = projectionMatrix * vec4( abb_pos, 1.0 );
					} else if( enableAberration > 0 ) {
						mat3 rotmat = mat3( modelViewMatrix );
						vec3 realVel2 = (rotmat *  velocity2 );
			
						vec3 abb_pos = aberration( startPos, -realVel2, vec3(0) );
						gl_Position = projectionMatrix * vec4( abb_pos, 1.0 );
			
					} else {
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
					}
			
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
