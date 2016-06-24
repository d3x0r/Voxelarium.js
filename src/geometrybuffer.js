

Voxelarium.GeometryBuffer = function () {
    var buffer = {};
     buffer.geometry = new THREE.BufferGeometry();

     buffer.geometry.uniforms = {
             edge_only : false,
     	};

    // create a simple square shape. We duplicate the top left and bottom right
    // vertices because each vertex needs to appear once per triangle.
    buffer.position = new Float32Array( [] );
    buffer.in_Texture = new Float32Array( [] );
    buffer.in_Color = new Uint8Array( [] );
    buffer.in_FaceColor = new Uint8Array( [] );
    buffer.in_Normal = new Float32Array( [] );
    buffer.in_Pow = new Uint8Array( [] );
    buffer.in_use_texture = new Uint8Array( [] );
    buffer.in_flat_color = new Uint8Array( [] );
    buffer.in_decal_texture = new Uint8Array( [] );
    buffer.in_Modulous = new Int8Array( [] );
    buffer.available = 0;
    buffer.used = 0;

    buffer.clear = function() {
        this.used = 0;
    }
/*
    attribute vec4 vPosition;
    attribute vec2 in_Texture;
    attribute  vec4 in_Color;
    attribute  vec4 in_FaceColor;
    attribute vec3 in_Normal;
    attribute  float in_Pow;

    attribute  float in_use_texture;
    attribute  float in_flat_color;
    attribute  float in_decal_texture;

    attribute  vec2 in_Modulous;
*/
//buffer.geometry
    buffer.geometry.addAttribute( 'position', new THREE.BufferAttribute( buffer.position, 3 ) );
     buffer.geometry.addAttribute( 'in_Texture', new THREE.BufferAttribute( buffer.in_Texture, 2 ) );
     buffer.geometry.addAttribute( 'in_Color', new THREE.BufferAttribute( buffer.in_Color, 4,true ) );
     buffer.geometry.addAttribute( 'in_FaceColor', new THREE.BufferAttribute( buffer.in_FaceColor, 4, true ) );
     buffer.geometry.addAttribute( 'in_Normal', new THREE.BufferAttribute( buffer.in_Normal, 3 ) );
     buffer.geometry.addAttribute( 'in_Pow', new THREE.BufferAttribute( buffer.in_Pow, 1 ) );
     buffer.geometry.addAttribute( 'in_use_texture', new THREE.BufferAttribute( buffer.in_use_texture, 1, true ) );
     buffer.geometry.addAttribute( 'in_flat_color', new THREE.BufferAttribute( buffer.in_flat_color, 1 ) );
     buffer.geometry.addAttribute( 'in_decal_texture', new THREE.BufferAttribute( buffer.in_decal_texture, 1 ) );
     buffer.geometry.addAttribute( 'in_Modulous', new THREE.BufferAttribute( buffer.in_Modulous, 2, false ) );



     buffer.expand = function() {
         var newbuf;
         this.available = ( this.available + 1 ) * 2;

         newbuf =   new Float32Array( new ArrayBuffer( this.available * ( 4 * 3 ) ) );
         newbuf.set( buffer.position );
         buffer.position = newbuf;

         newbuf =   new Float32Array( new ArrayBuffer( this.available * ( 4 * 2 ) ) );
         newbuf.set( buffer.in_Texture );
         buffer.in_Texture = newbuf;

         newbuf =   new Uint8Array( new ArrayBuffer( this.available * ( 1 * 4 ) ) );
         newbuf.set( buffer.in_Color );
         buffer.in_Color = newbuf;

         newbuf =   new Uint8Array( new ArrayBuffer( this.available * ( 1 * 4 ) ) );
         newbuf.set( buffer.in_FaceColor );
         buffer.in_FaceColor = newbuf;

         newbuf =   new Float32Array( new ArrayBuffer( this.available * ( 4 * 3 ) ) );
         newbuf.set( buffer.in_Normal );
         buffer.in_Normal = newbuf;

         newbuf =   new Float32Array( new ArrayBuffer( this.available * ( 4 * 1 ) ) );
         newbuf.set( buffer.in_Pow );
         buffer.in_Pow = newbuf;

         newbuf =   new Uint8Array( new ArrayBuffer( this.available * ( 1 * 1 ) ) );
         newbuf.set( buffer.in_use_texture );
         buffer.in_use_texture = newbuf;

         newbuf =   new Uint8Array( new ArrayBuffer( this.available * ( 1 * 1 ) ) );
         newbuf.set( buffer.in_flat_color );
         buffer.in_flat_color = newbuf;

         newbuf =   new Uint8Array( new ArrayBuffer( this.available * ( 1 * 1 ) ) );
         newbuf.set( buffer.in_decal_texture );
         buffer.in_decal_texture = newbuf;

         newbuf =   new Int8Array( new ArrayBuffer( this.available * ( 4 * 2 ) ) );
         newbuf.set( buffer.in_Modulous );
         buffer.in_Modulous = newbuf;

     };

     buffer.markDirty = function () {
         ["position","in_Texture"
         ,"in_Color", "in_FaceColor", "in_Modulous"
         ,"in_Normal", "in_Pow", "in_flat_color", "in_use_texture", "in_decal_texture"
     ].forEach( (att)=>{
             var attrib = this.geometry.getAttribute(att);
             attrib.needsUpdate = true;
             attrib.array = buffer[att];
         })

         this.geometry.attributes.position.needsUpdate = true;
         this.geometry.attributes.in_Texture.needsUpdate = true;
         this.geometry.attributes.in_Color.needsUpdate = true;
         this.geometry.attributes.in_FaceColor.needsUpdate = true;
         this.geometry.attributes.in_Normal.needsUpdate = true;
         this.geometry.attributes.in_Pow.needsUpdate = true;
         this.geometry.attributes.in_use_texture.needsUpdate = true;
         this.geometry.attributes.in_flat_color.needsUpdate = true;
         this.geometry.attributes.in_decal_texture.needsUpdate = true;
         this.geometry.attributes.in_Modulous.needsUpdate = true;
     }

     buffer.addPoint = function( v, t, tBase, c, fc, n, p, ut, flat, dt, mod ) {
         if( this.used >= this.available )
            this.expand();
            const u2 = this.used * 2;
            const u3 = this.used * 3;
            const u4 = this.used * 4;
        if( t ) {
            this.in_Texture[u2+0] = t[tBase+0];
            this.in_Texture[u2+1] = t[tBase+1];
        }
        else {
            this.in_Texture[u2+0] = 0;
            this.in_Texture[u2+1] = 0;
        }
        this.position[u3 + 0 ] = v.x;
        this.position[u3 + 1 ] = v.y;
        this.position[u3 + 2 ] = v.z;

        this.in_Color[u4 + 0 ] = c.x*255;
        this.in_Color[u4 + 1 ] = c.y*255;
        this.in_Color[u4 + 2 ] = c.z*255;
        this.in_Color[u4 + 3 ] = c.w*255;

        this.in_FaceColor[u4 + 0 ] = fc.x*255;
        this.in_FaceColor[u4 + 1 ] = fc.y*255;
        this.in_FaceColor[u4 + 2 ] = fc.z*255;
        this.in_FaceColor[u4 + 3 ] = fc.w*255;

        this.in_Normal[u3 + 0] = n?n.x:0;
        this.in_Normal[u3 + 1] = n?n.y:0;
        this.in_Normal[u3 + 2] = n?n.z:1;

        this.in_Pow[ this.used ] = p;
        this.in_use_texture[ this.used ] = ut;
        this.in_flat_color[this.used] = flat;
        this.in_decal_texture[this.used] = dt;
        this.in_Modulous[this.used * 2 + 0] = mod[0];
        this.in_Modulous[this.used * 2 + 1] = mod[1];

        this.used++;
    };

     //buffer.

     buffer.AddQuad = function( norm, P1,P2,P3,P4,faceColor,color,pow ) {

         const min = 0;
         const max = 1;
         this.addPoint( P1, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,min] );
         this.addPoint( P2, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( P3, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
         this.addPoint( P2, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( P4, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,max] );
         this.addPoint( P3, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
     }
     buffer.addSimpleQuad = function( quad, color, faceColor, norm, pow ) {
         var min = 0;
         var max = 1;
         this.addPoint( quad[0], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,min] );
         this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
         this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
         this.addPoint( quad[3], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,max] );
         this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
     }
     const white = new THREE.Vector4( 0.5, 0, 0, 1 );
     buffer.addSimpleQuadTex = function( quad, uvs, norm, pow ) {
         var min = 0;
         var max = 1.0;
         this.addPoint( quad[0], uvs, 0, white, white, norm, pow, 255, false, false, [min,min] );
         this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
         this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
         this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
         this.addPoint( quad[3], uvs, 6, white, white, norm, pow, 255, false, false, [max,max] );
         this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
     }

     buffer.makeVoxCube = function( size, voxelType ) {
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
            var uvs = [in_uvs[1*2+0]
                        ,in_uvs[1*2+1]
                        ,in_uvs[0*2+0]
                        ,in_uvs[0*2+1]
                        ,in_uvs[3*2+0]
                        ,in_uvs[3*2+1]
                        ,in_uvs[2*2+0]
                        ,in_uvs[2*2+1]
                    ];
            buffer.addSimpleQuadTex( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
                , uvs
                , THREE.Vector3Forward
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

            buffer.addSimpleQuadTex( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
                , voxelType.textureCoords.uvs
                , THREE.Vector3Backward
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            buffer.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Up
                    , 200 )
                    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            buffer.addSimpleQuadTex( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Down
                    , 200 )
                    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            buffer.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Right
                    , 200 )
                    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
            buffer.addSimpleQuadTex( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                    , voxelType.textureCoords.uvs
                    , THREE.Vector3Left
                    , 200 )
                    quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

        }else {
        buffer.addSimpleQuad( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
            , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 0.0, 1, 1.0 )
            , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Forward
            , 200 )
            quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        buffer.addSimpleQuad( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
            , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 1, 0, 1.0 )
            , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Backward
            , 200 )
            quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        buffer.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 0, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Up
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        buffer.addSimpleQuad( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0, 1, 1, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Down
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        buffer.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 1, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Right
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        buffer.addSimpleQuad( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 1, 0, 1.0 )
                , voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Left
                , 200 )
                quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
        }
        this.markDirty(  );
     }

     //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
     //var mesh = new THREE.Mesh( geometry, material );
     return buffer;
}




function updatePosition() {
    buffer.geometry.attributes.position.needsUpdate = true;
}
