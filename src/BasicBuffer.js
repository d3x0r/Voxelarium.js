import * as THREE from "../three.js/build/three.module.js"

if( Number(THREE.REVISION) >= 76 ) {
	var count_is_getter = false;
  Object.freeze( count_is_getter );
}
else {
	var count_is_getter = true;
  Object.freeze( count_is_getter );
}

     const white = new THREE.Vector4( 0.5, 0.5, 0.5, 1 );



export class BasicBuffer extends THREE.BufferGeometry {

     uniforms = {
             edge_only : false,
     	};
	attribs = [ { name:"position",
                    bytes:4,
                    size:3,
                    normalize:false,
                    buftype:Float32Array },
                  { name:"color",
                    bytes:4,
                    size:4,
                    normalize:false,
                    buftype:Float32Array } 
					]
                  
    // create a simple square shape. We duplicate the top left and bottom right
    // vertices because each vertex needs to appear once per triangle.
    position = new Float32Array( [] );
    //uv = new Float32Array( [] );
    color = new Float32Array( [] );
    //normal = new Float32Array( [] );
    /*
    this.in_FaceColor = new Uint8Array( [] );
    this.in_Pow = new Uint8Array( [] );
    this.in_use_texture = new Uint8Array( [] );
    this.in_flat_color = new Uint8Array( [] );
    this.in_decal_texture = new Uint8Array( [] );
    this.in_Modulous = new Int8Array( [] );
    */
    available = 0;
    used = 0;

    clear()  {
        this.used = 0;
    }

	constructor() {
		super();
    this.attribs.forEach( (att)=>{		
      this.setAttribute( att.name
							, new THREE.BufferAttribute( this[att.name], att.size, att.normalize ))
    })

	}

     expand() {
         var newbuf;
         this.available = ( this.available + 1 ) * 2;

          this.attribs.forEach( (attrib)=>{
            newbuf =   new attrib.buftype( new ArrayBuffer( this.available * ( attrib.bytes * attrib.size ) ) );
            newbuf.set( buffer[attrib.name] );
            buffer[attrib.name] = newbuf;
          })
     }



     markDirty () {
        this.geometry.drawRange.count = this.used;
         this.attribs.forEach( (attrib)=>{
             var attribu = this.geometry.getAttribute(attrib.name);
             attribu.needsUpdate = true;
						 if( Voxelarium.Settings.AltSpace ) {

             	attribu.array = buffer[attrib.name].subarray( 0, this.used * attrib.size );
						}else
						 	attribu.array = buffer[attrib.name];
						 if( !count_is_getter )
                attribu.count = this.used;
         })
         //console.log( "dirty", this.geometry.attributes );
     }

     addPoint ( v, color ) {
         if( this.used >= this.available )
            this.expand();
            //const u2 = this.used * 2;
            const u3 = this.used * 3;
            const u4 = this.used * 4;

        this.position[u3 + 0 ] = v.x;
        this.position[u3 + 1 ] = v.y;
        this.position[u3 + 2 ] = v.z;

          this.color[u4 + 0 ] = 1;
          this.color[u4 + 1 ] = 1;
          this.color[u4 + 2 ] = 1;
          this.color[u4 + 3 ] = 1;

        /*
        if( fc ) {
        this.in_FaceColor[u4 + 0 ] = fc.x*255;
        this.in_FaceColor[u4 + 1 ] = fc.y*255;
        this.in_FaceColor[u4 + 2 ] = fc.z*255;
        this.in_FaceColor[u4 + 3 ] = fc.w*255; }

        this.in_Pow[ this.used ] = p;
        this.in_use_texture[ this.used ] = ut;
        this.in_flat_color[this.used] = flat;
        this.in_decal_texture[this.used] = dt;
        this.in_Modulous[this.used * 2 + 0] = mod[0];
        this.in_Modulous[this.used * 2 + 1] = mod[1];
*/
        this.used++;
    };

     //this.

     AddQuad ( norm, P1,P2,P3,P4,faceColor,color,pow ) {

         const min = 0;
         const max = 1;
         this.addPoint( P1, color );
         this.addPoint( P2, color );
         this.addPoint( P3, color );
         this.addPoint( P2, color );
         this.addPoint( P4, color );
         this.addPoint( P3, color );
     }
     AddQuadTexture ( norm, P1,P2,P3,P4,textureCoords ) {
         const min = 0;
         const max = 1;
         this.addPoint( P1, textureCoords.uv_array, 0, white, undefined, norm, undefined, 255, false, false, [min,min] );
         this.addPoint( P2, textureCoords.uv_array, 2, white, undefined, norm, undefined, 255, false, false, [max,min] );
         this.addPoint( P3, textureCoords.uv_array, 4, white, undefined, norm, undefined, 255, false, false, [min,max] );
         this.addPoint( P2, textureCoords.uv_array, 2, white, undefined, norm, undefined, 255, false, false, [max,min] );
         this.addPoint( P4, textureCoords.uv_array, 6, white, undefined, norm, undefined, 255, false, false, [max,max] );
         this.addPoint( P3, textureCoords.uv_array, 4, white, undefined, norm, undefined, 255, false, false, [min,max] );
     }
     addSimpleQuad ( quad, color, faceColor, norm, pow ) {
         var min = 0;
         var max = 1;
         this.addPoint( quad[0], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,min] );
         this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
         this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( quad[3], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,max] );
         this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
     }
     addSimpleQuadTex ( quad, uvs, norm, pow ) {
         var min = 0;
         var max = 1.0;
         this.addPoint( quad[0], uvs, 0, white, white, norm, pow, 255, false, false, [min,min] );
         this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
         this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
         this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
         this.addPoint( quad[3], uvs, 6, white, white, norm, pow, 255, false, false, [max,max] );
         this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
     }
     updateVoxCube ( voxelType ) {
     }
     makeVoxCube ( size, voxelType ) {
        var v1 = new THREE.Vector3(1,1,1);
        var v2 = new THREE.Vector3(-1,1,1);
        var v3 = new THREE.Vector3(1,-1,1);
        var v4 = new THREE.Vector3(-1,-1,1);
        var v5 = new THREE.Vector3(1,1,-1);
        var v6 = new THREE.Vector3(-1,1,-1);
        var v7 = new THREE.Vector3(1,-1,-1);
        var v8 = new THREE.Vector3(-1,-1,-1);
        var quad;
        if( voxelType && voxelType.image ) {
            var in_uvs = voxelType.textureCoords.uvs;
            var uvs = voxelType.textureCoords.uv_array;
            this.addSimpleQuadTex( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
                , uvs
                , THREE.Vector3Forward
                , 200 )
                //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

            this.addSimpleQuadTex( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
                , voxelType.textureCoords.uvs
                , THREE.Vector3Backward
                , 200 )
                //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            this.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Up
                    , 200 )
                  //  quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            this.addSimpleQuadTex( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Down
                    , 200 )
                    //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            this.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Right
                    , 200 )
                    //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            this.addSimpleQuadTex( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Left
                    , 200 )
                    //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

        }else {
        this.addSimpleQuad( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
            , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 0.0, 1, 1.0 )
            , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Forward
            , 200 )
            //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        this.addSimpleQuad( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
            , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 1, 0, 1.0 )
            , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Backward
            , 200 )
            //quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        this.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 0, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Up
                , 200 )
          //      quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        this.addSimpleQuad( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0, 1, 1, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Down
                , 200 )
            //    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        this.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 1, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Right
                , 200 )
            //    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        this.addSimpleQuad( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 1, 0, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Left
                , 200 )
          //      quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        }
        this.markDirty(  );
     }

     //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
     //var mesh = new THREE.Mesh( geometry, material );
 

	updatePosition() {
   	 this.attributes.position.needsUpdate = true;
	}

}