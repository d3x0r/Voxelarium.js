
import * as THREE from "../three.js/build/three.module.js"

	// barycentric coordinate anchors.
	const face_i = [1,0,0];
	const face_j = [0,1,0];
	const face_k = [0,0,1];

const attribs = ["position","uv"
, "in_Color", "in_FaceColor", "in_Modulous"
, "normal", "in_Pow", "in_flat_color"
, "in_use_texture", "in_decal_texture", "in_face_index"
, "copies" /*internal*/, "types1", "types2", "typeDelta"
, "simplex"
];  
const attrib_bytes =     [4,4, 1,1,4, 4,4, 1,1,1,4 , 1,2,2,4 ,4]
const attrib_sizes =     [3,2, 4,4,3, 3,1, 1,1,1,3 , 1,3,3,3 ,3] // counts really
const attrib_normalize = [false,false, true,true,0, true,0, 0,1,0,0, 0,0,0,0 ,0]
const white = new THREE.Vector4( 0.5, 0, 0, 1 );
const attrib_buftype = [Float32Array,Float32Array
	,Uint8Array,Uint8Array,Float32Array
	,Float32Array,Float32Array
	, Uint8Array,Uint8Array, Uint8Array, Uint32Array
	, Uint8Array, Uint16Array, Uint16Array, Float32Array
   , Float32Array ]

//THREE.GridGeometryBuffer = GeometryBuffer;

class GeometryBuffer {
	//var buffer = {};

	geometry = new THREE.BufferGeometry();

	// create a simple square shape. We duplicate the top left and bottom right
	// vertices because each vertex needs to appear once per triangle.
	position     = new Float32Array( [] );
	uv           = new Float32Array( [] );
	in_Color     = new Uint8Array( [] );
	in_FaceColor = new Uint8Array( [] );
	normal       = new Float32Array( [] );
	in_Pow       = new Float32Array( [] );
	in_use_texture = new Uint8Array( [] );
	in_flat_color = new Uint8Array( [] );
	in_decal_texture = new Uint8Array( [] );
	in_Modulous = new Int8Array( [] );
	in_face_index = new Uint32Array( [] );

	copies       = new Uint8Array( [] );
	types1 = new Uint16Array( [] );
	types2 = new Uint16Array( [] );
	typeDelta  = new Float32Array( [] );

	simplex = new Float32Array( [] );

	available = 0;
	used = 0;
	availableFaces = 0;
	usedFaces = 0;
	resultedPoints = [];

	constructor() {
	 buffer.geometry.uniforms = {
			 edge_only : false,
	 	};

	attribs.forEach( (att,index)=>{
	if( att === "copies" ) return;
	  this.geometry.setAttribute( att, new THREE.BufferAttribute( buffer[att], attrib_sizes[index], attrib_normalize[index] ))
	})

	this.geometry.index = this.geometry.getAttribute( "in_face_index" );

	}


	expand() {
		var newbuf;
		this.available = ( this.available + 1 ) * 2;

		attribs.forEach( (att,index)=>{
			if( att === "in_face_index") return;
			newbuf =   new attrib_buftype[index]( new ArrayBuffer( this.available * ( attrib_bytes[index] * attrib_sizes[index] ) ) );
			newbuf.set( buffer[att] );
			buffer[att] = newbuf;
			// need new subarrays.
			if( att === "normal" ) {
				for( var p of this.resultedPoints ) p.normalBuffer = newbuf.subarray(p.id*3, p.id*3+3);
			}
			if( att === "position" ) {
				for( var p of this.resultedPoints ) p.vertBuffer = newbuf.subarray(p.id*3, p.id*3+3);
			}
		})
	}

	clear() {
		this.used = 0;
		this.usedFaces = 0;
	}



	expandFaces () {
		var newbuf;
		this.availableFaces = ( this.availableFaces + 1 ) * 2;

		newbuf =   new attrib_buftype[10]( new ArrayBuffer( this.availableFaces * ( attrib_bytes[10] * attrib_sizes[10] ) ) );
		newbuf.set( this.in_face_index );
		this.in_face_index = newbuf;
	}

	markDirty () {

		attribs.forEach( (att)=>{
			if( att === "copies" ) return;
			 var attrib = this.geometry.getAttribute(att);
			 attrib.needsUpdate = true;
			 attrib.array = buffer[att];
			if( att === "in_face_index")
				attrib.count = this.usedFaces;
			 else
				attrib.count = this.used;
		 })
		 //console.log( "dirty", this.geometry.attributes );
	 }

		// vertex, texture uv, textuvIndex, color, facecolor, normal, power, 
		// use_texture, flat_color, decal texture, modulous for x/y/z grid at point
		// element type 1 (from), element type 2(to), element delta
	 addPoint( v, t, tBase, c, fc, n, p, ut, flat, dt, mod, type1, type2, typeDelta ) {
		 if( this.used >= this.available )
			this.expand();

		const u2 = this.used * 2;
		const u3 = this.used * 3;
		const u4 = this.used * 4;
		if( t ) {
			this.uv[u2+0] = t[tBase+0];
			this.uv[u2+1] = t[tBase+1];
		}
		else {
			this.uv[u2+0] = 0;
			this.uv[u2+1] = 0;
		}
		this.copies[this.used] = 0;
		this.position[u3 + 0 ] = v[0];
		this.position[u3 + 1 ] = v[1]
		this.position[u3 + 2 ] = v[2]
		if( c ) {
			this.in_Color[u4 + 0 ] = c[0];
			this.in_Color[u4 + 1 ] = c[1];
			this.in_Color[u4 + 2 ] = c[2];
			this.in_Color[u4 + 3 ] = c[3]; }

		if( fc ) {
			this.in_FaceColor[u4 + 0 ] = fc[0];
			this.in_FaceColor[u4 + 1 ] = fc[1];
			this.in_FaceColor[u4 + 2 ] = fc[2];
			this.in_FaceColor[u4 + 3 ] = fc[3]; }

		this.normal[u3 + 0] = n?n[0]:0;
		this.normal[u3 + 1] = n?n[1]:0;
		this.normal[u3 + 2] = n?n[2]:1;

		this.in_Pow[ this.used ] = p;
		this.in_use_texture[ this.used ] = ut;
		this.in_flat_color[this.used] = flat;
		this.in_decal_texture[this.used] = dt;
		this.in_Modulous[u3 + 0] = mod[0];
		this.in_Modulous[u3 + 1] = mod[1];
		this.in_Modulous[u3 + 2] = mod[2];

		let result = {
			id:this.used++,
			normalBuffer:this.normal.subarray(u3,u3+3),
			vertBuffer:this.position.subarray(u3,u3+3),
				type1:type1, type2:type2, typeDelta:typeDelta, // saved just as meta for later
		}
		this.resultedPoints.push(result);
		return result;
	};

	copyPoint( p, n, bc, i, t, td ) {

		if( n && !this.copies[p]++ ) {
			this.normal[p*3 + 0] = n[0];
			this.normal[p*3 + 1] = n[1];
			this.normal[p*3 + 2] = n[2];		

		this.simplex[p*3+0] = bc[0];
		this.simplex[p*3+1] = bc[1];
		this.simplex[p*3+2] = bc[2];

		this.types1[p*3+0] = t[0];//this.type1[p];
		this.types1[p*3+1] = t[1];//this.type2[p];
		this.types1[p*3+2] = t[2];//this.type1[p];
		this.types2[p*3+0] = t[3];//this.type1[p];
		this.types2[p*3+1] = t[4];//this.type1[p];
		this.types2[p*3+2] = t[5];//this.type1[p];
		this.typeDelta[p*3+0] = td[0];//this.typeDelta[p];
		this.typeDelta[p*3+1] = td[1];//this.typeDelta[p];
		this.typeDelta[p*3+2] = td[2];//this.typeDelta[p];

		return p; // first 'copy' doesn't need to be copied.
	}
//	else if( n ) {
//		if( Math.abs(this.normal[p*3+0] - n[0] )<0.0001 && Math.abs(this.normal[p*3+1]- n[1]) < 0.0001&& Math.abs(this.normal[p*3+2] - n[2]) < 0.0001 )
//			return p;
//	}


	if( bc && !this.copies[p]++ ) {
	
		this.simplex[p*3+0] = bc[0];
		this.simplex[p*3+1] = bc[1];
		this.simplex[p*3+2] = bc[2];
	
		this.types1[p*3+0] = t[0];//this.type1[p];
		this.types1[p*3+1] = t[1];//this.type2[p];
		this.types1[p*3+2] = t[2];//this.type1[p];
		this.types2[p*3+0] = t[3];//this.type1[p];
		this.types2[p*3+1] = t[4];//this.type1[p];
		this.types2[p*3+2] = t[5];//this.type1[p];
		//console.log( "First copy; set deltas:", td );
		this.typeDelta[p*3+0] = td[0];//this.typeDelta[p];
		this.typeDelta[p*3+1] = td[1];//this.typeDelta[p];
		this.typeDelta[p*3+2] = td[2];//this.typeDelta[p];
		return p; // first 'copy' doesn't need to be copied.
	}
		if( this.used >= this.available )
		   this.expand();
		   const u2 = this.used * 2;
		   const u3 = this.used * 3;
		   const u4 = this.used * 4;


		this.uv[u2+0] = this.uv[p*2+0];
		this.uv[u2+1] = this.uv[p*2+1];

	   this.position[u3 + 0 ] = this.position[p*3 + 0 ];
	   this.position[u3 + 1 ] = this.position[p*3 + 1 ];
	   this.position[u3 + 2 ] = this.position[p*3 + 2 ];

	   this.in_Color[u4 + 0 ] = this.in_Color[p*4 + 0 ] ;
	   this.in_Color[u4 + 1 ] = this.in_Color[p*4 + 1 ] ;
	   this.in_Color[u4 + 2 ] = this.in_Color[p*4 + 2 ] ;
	   this.in_Color[u4 + 3 ] = this.in_Color[p*4 + 3 ];

	   this.in_FaceColor[u4 + 0 ] = this.in_FaceColor[p*4 + 0 ];
	   this.in_FaceColor[u4 + 1 ] = this.in_FaceColor[p*4 + 1 ];
	   this.in_FaceColor[u4 + 2 ] = this.in_FaceColor[p*4 + 2 ];
	   this.in_FaceColor[u4 + 3 ] = this.in_FaceColor[p*4 + 3 ];

	   if(n){
		this.normal[u3 + 0] = n[0];
		this.normal[u3 + 1] = n[1];
		this.normal[u3 + 2] = n[2];
	   } else {
		this.normal[u3 + 0] = this.normal[p*3 + 0];
		this.normal[u3 + 1] = this.normal[p*3 + 1];
		this.normal[u3 + 2] = this.normal[p*3 + 2];
	   }

	if( bc ) {
		this.simplex[u3+0] = bc[0];
		this.simplex[u3+1] = bc[1];
		this.simplex[u3+2] = bc[2];
	

		this.types1[u3+0] = t[0];//this.type1[p];
		this.types1[u3+1] = t[1];//this.type2[p];
		this.types1[u3+2] = t[2];//this.type2[p];
		this.types2[u3+0] = t[3];//this.type2[p];
		this.types2[u3+1] = t[4];//this.type2[p];
		this.types2[u3+2] = t[5];//this.type2[p];
		//console.log( "2+ copy Setting type deltas:", td );
		this.typeDelta[u3+0] = td[0];//this.typeDelta[p];
		this.typeDelta[u3+1] = td[1];//this.typeDelta[p];
		this.typeDelta[u3+2] = td[2];//this.typeDelta[p];
	}
	   this.in_Pow[ this.used ]            = this.in_Pow[ p ]           ;
	   this.in_use_texture[ this.used ]    = this.in_use_texture[ p ]   ;
	   this.in_flat_color[this.used]       = this.in_flat_color[p]      ;
	   this.in_decal_texture[this.used]    = this.in_decal_texture[p]   ;
	   this.in_Modulous[this.used * 3 + 0] = this.in_Modulous[p * 3 + 0];
	   this.in_Modulous[this.used * 3 + 1] = this.in_Modulous[p * 3 + 1];
	   this.in_Modulous[this.used * 3 + 2] = this.in_Modulous[p * 3 + 2];

	   return this.used++;
   };


	addFace( a,b,c, n, i, types, deltaTypes ){
		while( (this.usedFaces+3) >= this.availableFaces )
			this.expandFaces();

			a = this.copyPoint( a, n, face_i, i, types, deltaTypes );
			b = this.copyPoint( b, n, face_j, i, types, deltaTypes );
			c = this.copyPoint( c, n, face_k, i, types, deltaTypes );

		this.in_face_index[this.usedFaces++] = a;
		this.in_face_index[this.usedFaces++] = b;
		this.in_face_index[this.usedFaces++] = c;
	}

	 //this.

	 AddQuad( norm, P1,P2,P3,P4,faceColor,color,pow ) {
		 const min = 0;
		 const max = 1;
		 this.addPoint( P1, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,min] );
		 this.addPoint( P2, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
		 this.addPoint( P3, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
		 this.addPoint( P2, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
		 this.addPoint( P4, undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,max] );
		 this.addPoint( P3, undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
	 }
	 AddQuadTexture ( norm, P1,P2,P3,P4,textureCoords ) {
		 const min = 0;
		 const max = 1;
		 this.addPoint( P1, textureCoords.uv_array, 0, undefined, undefined, norm, undefined, 255, false, false, [min,min] );
		 this.addPoint( P2, textureCoords.uv_array, 2, undefined, undefined, norm, undefined, 255, false, false, [max,min] );
		 this.addPoint( P3, textureCoords.uv_array, 4, undefined, undefined, norm, undefined, 255, false, false, [min,max] );
		 this.addPoint( P2, textureCoords.uv_array, 2, undefined, undefined, norm, undefined, 255, false, false, [max,min] );
		 this.addPoint( P4, textureCoords.uv_array, 6, undefined, undefined, norm, undefined, 255, false, false, [max,max] );
		 this.addPoint( P3, textureCoords.uv_array, 4, undefined, undefined, norm, undefined, 255, false, false, [min,max] );
	 }
	 addSimpleQuad( quad, color, faceColor, norm, pow ) {
		 var min = 0;
		 var max = 1;
		 this.addPoint( quad[0], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,min] );
		 this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
		 this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
		 this.addPoint( quad[1], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,min] );
		 this.addPoint( quad[3], undefined, undefined, color, faceColor, norm, pow, false, false, false, [max,max] );
		 this.addPoint( quad[2], undefined, undefined, color, faceColor, norm, pow, false, false, false, [min,max] );
	 }
	 addSimpleQuadTex( quad, uvs, norm, pow ) {
		 var min = 0;
		 var max = 1.0;
		 this.addPoint( quad[0], uvs, 0, white, white, norm, pow, 255, false, false, [min,min] );
		 this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
		 this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
		 this.addPoint( quad[1], uvs, 2, white, white, norm, pow, 255, false, false, [max,min] );
		 this.addPoint( quad[3], uvs, 6, white, white, norm, pow, 255, false, false, [max,max] );
		 this.addPoint( quad[2], uvs, 4, white, white, norm, pow, 255, false, false, [min,max] );
	 }

	 makeVoxCube( size, voxelType ) {
		var v1 = new THREE.Vector3(1,1,1);
		var v2 = new THREE.Vector3(-1,1,1);
		var v3 = new THREE.Vector3(1,-1,1);
		var v4 = new THREE.Vector3(-1,-1,1);
		var v5 = new THREE.Vector3(1,1,-1);
		var v6 = new THREE.Vector3(-1,1,-1);
		var v7 = new THREE.Vector3(1,-1,-1);
		var v8 = new THREE.Vector3(-1,-1,-1);
		var quad;
		if( voxelType && voxelType.image
				   && (( voxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_SHADER ) == 0 )
		   ) {
			var in_uvs = voxelType.textureCoords.uvs;
			var uvs = voxelType.textureCoords.uv_array;
			this.addSimpleQuadTex( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
				, uvs
				, THREE.Vector3Forward
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

			this.addSimpleQuadTex( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
				, voxelType.textureCoords.uvs
				, THREE.Vector3Backward
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
			this.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
					, voxelType.textureCoords.uvs
					, THREE.Vector3Up
					, 200 )
					quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
			this.addSimpleQuadTex( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
					, voxelType.textureCoords.uvs
					, THREE.Vector3Down
					, 200 )
					quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
			this.addSimpleQuadTex( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
					, voxelType.textureCoords.uvs
					, THREE.Vector3Right
					, 200 )
					quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
			this.addSimpleQuadTex( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
					, voxelType.textureCoords.uvs
					, THREE.Vector3Left
					, 200 )
					quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();

		}else {
		this.addSimpleQuad( quad=[v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size),v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size)]
			, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 0.0, 1, 1.0 )
			, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
			, THREE.Vector3Forward
			, 200 )
			quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		this.addSimpleQuad( quad = [v6.clone().multiplyScalar(size),v5.clone().multiplyScalar(size),v8.clone().multiplyScalar(size),v7.clone().multiplyScalar(size)]
			, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0.2, 1, 0, 1.0 )
			, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
			, THREE.Vector3Backward
			, 200 )
			quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		this.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v2.clone().multiplyScalar(size)]
				, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 0, 1.0 )
				, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
				, THREE.Vector3Up
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		this.addSimpleQuad( quad = [v3.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
				, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 0, 1, 1, 1.0 )
				, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
				, THREE.Vector3Down
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		this.addSimpleQuad( quad = [v5.clone().multiplyScalar(size),v1.clone().multiplyScalar(size),v7.clone().multiplyScalar(size),v3.clone().multiplyScalar(size)]
				, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 0.0, 1, 1.0 )
				, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
				, THREE.Vector3Right
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		this.addSimpleQuad( quad = [v2.clone().multiplyScalar(size),v6.clone().multiplyScalar(size),v4.clone().multiplyScalar(size),v8.clone().multiplyScalar(size)]
				, voxelType && voxelType.properties.EdgeColor || new THREE.Vector4( 1, 1, 0, 1.0 )
				, voxelType && voxelType.properties.FaceColor || new THREE.Vector4( 0, 0, 0, 0.5 )
				, THREE.Vector3Left
				, 200 )
				quad[0].delete(); quad[1].delete(); quad[2].delete(); quad[3].delete();
		}
		this.markDirty(  );
	 }

}




function updatePosition() {
	this.geometry.attributes.position.needsUpdate = true;
}


export { GeometryBuffer }
