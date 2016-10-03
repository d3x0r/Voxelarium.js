

Voxelarium.GeometryBufferMono = function () {
    var buffer = {};
     buffer.geometry = new THREE.BufferGeometry();
     buffer.geometry.uniforms = {
             in_Color : new THREE.Vector4(1,0,0,1),
             in_FaceColor : new THREE.Vector4(0,1,0,1),
             in_Pow : 20.0 ,
             edge_only : true,
     	};
    // create a simple square shape. We duplicate the top left and bottom right
    // vertices because each vertex needs to appear once per triangle.
    buffer.position = new Float32Array( [] );
    buffer.in_Texture = new Float32Array( [] );
    //buffer.in_Color = new Uint8Array( [] );
    //buffer.in_FaceColor = new Uint8Array( [] );
    buffer.in_Normal = new Float32Array( [] );
    //buffer.in_Pow = new Uint8Array( [] );
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
     //buffer.geometry.addAttribute( 'in_Color', new THREE.BufferAttribute( buffer.in_Color, 4,true ) );
     //buffer.geometry.addAttribute( 'in_FaceColor', new THREE.BufferAttribute( buffer.in_FaceColor, 4, true ) );
     buffer.geometry.addAttribute( 'in_Normal', new THREE.BufferAttribute( buffer.in_Normal, 3 ) );
     //buffer.geometry.addAttribute( 'in_Pow', new THREE.BufferAttribute( buffer.in_Pow, 1 ) );
     buffer.geometry.addAttribute( 'in_use_texture', new THREE.BufferAttribute( buffer.in_use_texture, 1 ) );
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

         newbuf =   new Float32Array( new ArrayBuffer( this.available * ( 4 * 3 ) ) );
         newbuf.set( buffer.in_Normal );
         buffer.in_Normal = newbuf;

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
         ,"in_Modulous"
         ,"in_Normal", "in_flat_color", "in_use_texture", "in_decal_texture"
     ].forEach( (att)=>{
             var attrib = this.geometry.getAttribute(att);
             attrib.needsUpdate = true;
             attrib.array = buffer[att];
         })

         this.geometry.attributes.position.needsUpdate = true;
         this.geometry.attributes.in_Texture.needsUpdate = true;
         this.geometry.attributes.in_Normal.needsUpdate = true;
         this.geometry.attributes.in_use_texture.needsUpdate = true;
         this.geometry.attributes.in_flat_color.needsUpdate = true;
         this.geometry.attributes.in_decal_texture.needsUpdate = true;
         this.geometry.attributes.in_Modulous.needsUpdate = true;
     }

     buffer.addPoint = function( v, n, ut, flat, dt, mod ) {
         if( this.used >= this.available )
            this.expand();
            const u3 = this.used * 3;
            const u4 = this.used * 4;
        this.position[u3 + 0 ] = v.x;
        this.position[u3 + 1 ] = v.y;
        this.position[u3 + 2 ] = v.z;


        this.in_Normal[u3 + 0] = n?n.x:0;
        this.in_Normal[u3 + 1] = n?n.y:0;
        this.in_Normal[u3 + 2] = n?n.z:1;

        this.in_use_texture[ this.used ] = ut;
        this.in_flat_color[this.used] = flat;
        this.in_decal_texture[this.used] = dt;
        this.in_Modulous[this.used * 2 + 0] = mod[0];
        this.in_Modulous[this.used * 2 + 1] = mod[1];

        this.used++;
    };

     //buffer.

     buffer.AddQuad = function( norm, P1,P2,P3,P4 ) {

         const min = 0;
         const max = 1;
         this.addPoint( P1, norm, false, false, false, [min,min] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P4,  norm, false, false, false, [max,max] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
     }
     buffer.AddQuadTexture = function( norm, P1,P2,P3,P4,textureCoords ) {
         const min = 0;
         const max = 1;
         this.addPoint( P1, norm, false, false, false, [min,min] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P4,  norm, false, false, false, [max,max] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
     }
     const white = new THREE.Vector4( 0.5, 0.5, 0, 1 );
     buffer.addSimpleQuadTex = function( quad, uvs, norm, pow ) {
         var min = 0;
         var max = 1.0;
         this.addPoint( P1, norm, false, false, false, [min,min] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
         this.addPoint( P2,  norm, false, false, false, [max,min] );
         this.addPoint( P4,  norm, false, false, false, [max,max] );
         this.addPoint( P3,  norm, false, false, false, [min,max] );
     }
     buffer.addSimpleQuad = function( quad, norm ) {
         var min = -2;
         var max = 2;
         this.addPoint( quad[0], undefined, norm, false, false, false, [min,min] );
         this.addPoint( quad[1], undefined, norm, false, false, false, [max,min] );
         this.addPoint( quad[2], undefined, norm, false, false, false, [min,max] );
         this.addPoint( quad[1], undefined, norm, false, false, false, [max,min] );
         this.addPoint( quad[3], undefined, norm, false, false, false, [max,max] );
         this.addPoint( quad[2], undefined, norm, false, false, false, [min,max] );
     }

     buffer.makeVoxCube = function(size) {
        var v1 = new THREE.Vector3(1,1,1);
        var v2 = new THREE.Vector3(-1,1,1);
        var v3 = new THREE.Vector3(1,-1,1);
        var v4 = new THREE.Vector3(-1,-1,1);
        var v5 = new THREE.Vector3(1,1,-1);
        var v6 = new THREE.Vector3(-1,1,-1);
        var v7 = new THREE.Vector3(1,-1,-1);
        var v8 = new THREE.Vector3(-1,-1,-1);
        buffer.addSimpleQuad( [v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
            , new THREE.Vector4( 0.2, 0.0, 1, 1.0 ), new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Forward
            , 200 )
        buffer.addSimpleQuad( [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
            , new THREE.Vector4( 0.2, 1, 0, 1.0 ), new THREE.Vector4( 0, 0, 0, 0.5 )
            , THREE.Vector3Backward
            , 200 )
        buffer.addSimpleQuad( [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
                , new THREE.Vector4( 1, 0.0, 0, 1.0 ), new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Up
                , 200 )
        buffer.addSimpleQuad( [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , new THREE.Vector4( 0, 1, 1, 1.0 ), new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Down
                , 200 )
        buffer.addSimpleQuad( [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
                , new THREE.Vector4( 1, 0.0, 1, 1.0 ), new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Right
                , 200 )
        buffer.addSimpleQuad( [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
                , new THREE.Vector4( 1, 1, 0, 1.0 )
                , new THREE.Vector4( 0, 0, 0, 0.5 )
                , THREE.Vector3Left
                , 200 )
        this.markDirty(  );
     }

     //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
     //var mesh = new THREE.Mesh( geometry, material );
     return buffer;
}




function updatePosition() {
    buffer.geometry.attributes.position.needsUpdate = true;
}
