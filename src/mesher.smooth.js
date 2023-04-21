// The MIT License (MIT)
//
// Copyright (c) 2020 d3x0r
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Marching Tetrahedra in Javascript
 *
 * Based on Unique Research
 *   - Carbon atom latice in diamond crystal; hence (DCL - Diamond Crystal Lattice)
 *
 *
 * Javascript by d3x0r
 *  - Version 1 - original 'martching tetrahedra'
 *  - Version 2 - Single Cell - Diamond Lattice
 *  - Version 3 - Single Plane - Diamond Lattice
 *  - Version 4 - Full Form - Diamond Lattice
 *                 - supports collision detection
 */

/*
   Data is a single dimensional array described by the 3D array dims.
	dim[0] is the lowest stride, follwed by dims[1], dims[2].
   opts is an object with {
		elements: [] // data describing the type of the point, matches 1:1 with data[] which describes mass of content.
		smoothShade: true/false, // whether normals are merged or distinct.
		vertices: [], // result array to put the vertices into
		normals: [], // faces associated with vertices. 
		// more data 1
		// more data 2
		faces: [], // faces associated with vertices. THis was previosly a THREE.Face() which is a full object.
		
	}
	function(data,dims, opts) {


*/


/*
	// there is a long combination of possible 3-4 bits some 50(?) of
	// which only these 6 apply in reality

this is the vertex references on the right, and which 'vert N' applies.

   0 _ _ 1
   |\   /|
    \\2//     (above page)
    | | |
     \|/
      3


 this is the line index applied.  each 'bit' of valid is this number...
	. ____0____ .
	|\         /|     01  02 03 12 23 31
	\ \_1   3_/ /
	 |  \   /  |
	  \  \ /  /
	   \  .  /   (above page)
	  2|  |  |5
	    \ 4 /
	    | | |
	     \|/
	      .

	// of all combinations of bits in crossings is 6 bits per tetrahedron,
	// these are the only valid combinations.
	// (16 bits per cell)
	const validCombinations = [
		{ val:[1,1,1,0,0,0], // valid (vert 0, 0,1,2)   0 in, 0 out
		},
		{ val:[1,1,0,0,1,1], // valid 0,1,4,5  (0-3,1-2)
		},
		{ val:[1,0,1,1,1,0], // valid 0,2,3,4  (0-2,1-3)
		},
		{ val:[1,0,0,1,0,1], // valid (vert 1, 0,3,5)
		},
		{ val:[0,1,1,1,0,1], // valid 1,2,3,5 (0-1,2,3)
		},
		{ val:[0,1,0,1,1,0], // valid (vert 2, 1,3,4 )
		},
		{ val:[0,0,1,0,1,1], // valid (vert 3, 2,4,5 )
		},
	]

*/

import {GeometryBuffer} from "./geometrybuffer-tets.js";

const MarchingTetrahedra4 = (function() {

	const debug_ = false;
	// static working buffers

	var sizes = 0;
	const pointHolder = [null,null];
	const pointMergeHolder = [[],[]];
	const normalHolder = [[],[]];
	const crossHolder = [null,null];
	var bits = null; // single array of true/false per cube-cell indicating at least 1 cross happened
	
	// basis cube
	const geom = [
		[0,0,0],  // bottom layer
		[1,0,0],
		[0,1,0],
		[1,1,0],
		[0,0,1],  // 5 top layer
		[1,0,1],   // 6
		[0,1,1],   // 7
		[1,1,1],   // 8
	]

	// these are the 6 computed lines per cell.
	// the numbers are the indexes of the point in the computed layer map (tesselation-5tets-plane.png)
	// every other cell has a different direction of the diagonals.

// low left, front up, left diag, bot front, front diag, bottom diag, front diag
	const linesOddMin =  [ [0,2],[0,4],[2,4],  [0,1],[1,2],[1,4]  ];
	const linesEvenMin = [ [0,2],[0,4],[0,6],  [0,1],[0,3],[0,5]  ];
	const linesMin = [linesEvenMin,linesOddMin];

	// this is the running center of the faces being generated - center of the cell being computed.
	const cellOrigin = [0,0,0];

	// see next comment...
	// the order of these MUST MATCH edgeToComp order
	const vertToDataOrig = [
		[ [4,6,5,0], [3,1,5,0], [ 2,3,6,0], [6,7,5,3], [0,6,5,3] ],
		[ [ 0,2,4,1], [4,7,5,1], [6,7,4,2], [3,1,7,2], [1,2,4,7] ],
	];
	
	// these is the point orders of the tetrahedra. (first triangle in comments at top)
	// these can be changed to match the original information on the wikipedia marching-tetrahedra page.
	// the following array is modified so the result is the actual offset in the computed data plane;
	// it is computed from the above, original, array.

	// index with [odd] [tet_of_cube] [0-3 vertex]
	// result is point data rectangular offset... (until modified)
	const vertToData = [	// updated base index to resolved data cloud offset
			[ [ 2,3,6,0], [3,1,5,0], [4,6,5,0], [6,7,5,3], [0,6,5,3] ],
			[ [ 0, 2,4,1], [3,1,7,2], [6,7,4,2], [4,7,5,1], [1,2,4,7] ],
	];
	
	// these are short term working variables
	// reduces number of temporary arrays created.
	const pointOutputHolder = [0,0,0];
	// face normal - base direction to add normal, scales by angle 
	const fnorm = [0,0,0];
	// used to compute cross product for angle between faces
	const tmp = [0,0,0];
	// used to compute angle between faces, are two direction vectors from a point
	const a1t = [0,0,0];
	const a2t = [0,0,0];

	// these are used for the non-geometry-helper output
	const v_cb = new THREE.Vector3();
	const v_ab = new THREE.Vector3()
	const v_normTmp = new THREE.Vector3();
	// used to compute angle between faces, are two direction vectors from a point
	const v_a1t = new THREE.Vector3();
	const v_a2t = new THREE.Vector3();

	// a tetrahedra has 6 crossing values
	// the result of this is the index into that ordered list of intersections (second triangle in comments at top)

	// indexed with [invert][face][0-1 tri/quad] [0-2]
	// indexed with 'useFace'  and that is defined above in the order of validCombinations
	const facePointIndexesOriginal = [
			[
				[[0,1,2]],    // vert 0
				[[0,1,4],[0,4,5]],
				[[0,3,4],[0,4,2]],
				[[0,5,3]],    // vert 1
				[[1,2,5],[1,5,3]],
				[[1,3,4]],    // vert 2
				[[2,4,5]]     // vert 3
			],
			[
				[[1,0,2]],    // vert 0
				[[1,0,4],[4,0,5]],
				[[3,0,4],[4,0,2]],
				[[5,0,3]],    // vert 1
				[[5,2,1],[5,1,3]],
				[[3,1,4]],    // vert 2
				[[4,2,5]]     // vert 3
			]
	];


//----------------------------------------------------------
//  This is the real working fucntion; the above is just
//  static data in the function context; instance data for this function.
	return mesherScope;

	function mesherScope(data,dims, opts) {

		const elements = opts.elements;
		var vertices = opts.vertices || []
		, faces = opts.faces || [];
		var smoothShade = opts.smoothShade || false;
		opts.geometryHelper = opts.geometryHelper || new GeometryBuffer();
		//const showGrid = opts.showGrid;

		meshCloud( data,dims );
		return null;


		function meshCloud(data, dims) {

			// values input to this are in 2 planes for lower and upper values
			const dim0 = dims[0];
			const dim1 = dims[1];
			const dim2 = dims[2];
			const dataOffset = [ 0, 1, dim0, 1+dim0, 0 + dim0*dim1,1 + dim0*dim1,dim0 + dim0*dim1, 1+dim0 + dim0*dim1] ;

			// vertex paths 0-1 0-2, 0-3  1-2 2-3 3-1
			// this is the offset from dataOffset to the related value.

			// index with [odd] [tet_of_cube] [0-5 line index]
			// result is composite point data offset.
			const edgeToComp = [
				[[1*dim0*dim1*6  + 0,1*dim0*dim1*6  + 3,1,1*dim0*dim1*6  + 4,5,2]
				,[1*6 + 0,1*6 + 2,4,1*6 + 1,5,3]
				,[1*dim0*6  + 3,1*dim0*6  + 1,0,1*dim0*6  + 5,2,4]
				,[1*dim0*dim1*6  + 1*dim0*6  + 3,1*dim0*dim1*6  + 4,1*dim0*6  + 5,1*dim0*dim1*6  + 1*6 + 0,1*6 + 2,1*dim0*6  + 1*6 + 1]
				,[2,5,4,1*dim0*dim1*6  + 4,1*6 + 2,1*dim0*6  + 5]]
				,[[0,1,3,2,5,4]
				,[1*dim0*dim1*6  + 4,1*dim0*dim1*6  + 3,5,1*dim0*dim1*6  + 1*6 + 0,1*6 + 1,1*6 + 2]
				,[1*dim0*dim1*6  + 1*dim0*6  + 3,1*dim0*dim1*6  + 0,1*dim0*6  + 1,1*dim0*dim1*6  + 4,2,1*dim0*6  + 5]
				,[1*6 + 0,1*dim0*6  + 1*6 + 1,1*dim0*6  + 3,1*6 + 2,1*dim0*6  + 5,4]
				,[4,5,1*6 + 2,2,1*dim0*dim1*6  + 4,1*dim0*6  + 5]
				]
				];
			
			for( let a = 0; a < 2; a++ ) for( let b = 0; b < 5; b++ ) for( let c = 0; c < 4; c++ ) vertToData[a][b][c] = dataOffset[vertToDataOrig[a][b][c]];

			// these are bits that are going to 0.
			const tetMasks = [ [ 4|0, 1, 2, 4|3, 4|3 ], [ 0, 4|1, 4|2, 3, 4|3 ] ];

			// this is a computed lookup from facePointIndexes ([invert][output_face_type][0-1 triangle count][0-3 triangle point index]
			// it is actually edgeToComp[odd][tet][  FPI[invert][face_type][0-1][point indexes] ]
			// index with [odd][tet][invert][output_face_type][0-1 triangle count][0-3 triangle point index]
			const facePointIndexes = [ 
			];

			for( let odd=0; odd < 2; odd++) {
				let t; 
				facePointIndexes.push( t = [] )
				for( let tet = 0; tet < 5; tet++ ){
					t.push(  [
						[ [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][0][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][0][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][0][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][1][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][1][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][1][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[0][1][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][1][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][1][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][2][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][2][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][2][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[0][2][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][2][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][2][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][3][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][3][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][3][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][4][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][4][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][4][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[0][4][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][4][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][4][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][5][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][5][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][5][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[0][6][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[0][6][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[0][6][0][2]]] ]
					]
					, [ [   [edgeToComp[odd][tet][facePointIndexesOriginal[1][0][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][0][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][0][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][1][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][1][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][1][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[1][1][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][1][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][1][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][2][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][2][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][2][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[1][2][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][2][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][2][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][3][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][3][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][3][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][4][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][4][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][4][0][2]]]
						, [  edgeToComp[odd][tet][facePointIndexesOriginal[1][4][1][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][4][1][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][4][1][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][5][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][5][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][5][0][2]]] ]
						, [ [edgeToComp[odd][tet][facePointIndexesOriginal[1][6][0][0]],edgeToComp[odd][tet][facePointIndexesOriginal[1][6][0][1]],edgeToComp[odd][tet][facePointIndexesOriginal[1][6][0][2]]] ]
					] ] )	
				}
			}


			if( dim0*dim1*dim2*6 > sizes ) {
				sizes = dim0 * dim1 * dim2*6;
				bits = new Uint8Array(dim0*dim1*dim2);
				pointHolder[0] = new Uint32Array(sizes);
				crossHolder[0] = new Uint8Array(sizes);
				for( let zz = normalHolder[0].length; zz < sizes; zz++ ) {
					normalHolder[0].push( null );
				}
				for( let zz = pointMergeHolder[0].length; zz < (dim0*dim1*dim2); zz++ ) {
					pointMergeHolder[0].push( null ); 
				}
			}
			
			// all work space has been allocated by this point.
			// now, for each layer, compute inside-outside crossings ('cross').. which interestingly relates to 'cross product' but in a 2D way...

			const points  = pointHolder[0];
			const pointMerge  = pointMergeHolder[0];
			const normals = normalHolder[0];
			const crosses = crossHolder[0];
			for( let zero = 0; zero < dim0*dim1*dim2; zero++ ) {
				pointMerge[zero] = null;
				// make sure to reset this... 
				for( let crz = 0; crz < 6; crz++ ) crosses[zero*6+crz] = 0;
			}
			for( var z = 0; z < dim2; z++ ) {
			
				let odd = 0;
				let zOdd = z & 1;
				cellOrigin[2] = z-0.5;

				// compute one layer (x by y) intersections (cross from inside to outside).
				// each cell individually has 16 intersections
				// the first cell needs 9 intersections computed; the subsequent cells providing the computation for the 7 'missing'
				// 3 intersections per cell after the first layer can be copied; but shift in position (moving from the top to the bottom)
				// 
				for( var y = 0; y < dim1-1; y++ ) {
					cellOrigin[1] = y-0.5;
					for( var x = 0; x < dim0-1; x++ ) {
						odd = (( x + y ) &1) ^ zOdd;
			
						cellOrigin[0] = x-0.5;
			
						const baseHere = (x+0 + y*dim0 + z*(dim0*dim1))*6;
						const baseOffset = x+0 + y*dim0 + z * dim0*dim1;
						const lineArray = linesMin[odd];
						bits[baseOffset] = 0;
					//if( x < 3 || x >3  ) continue;
					//if( y < 0 || y > 1 ) continue;
					//if( z > 5 ) continue;

						for( let l = 0; l < 6; l++ ) {
							const p0 = lineArray[l][0];
							const p1 = lineArray[l][1];
			
							if( (x == (dim0-1)) &&( (p0 & 1) || (p1 &1) )) {
								// this is an overflow, need to push fake data....
								points[baseHere+l] = null;
								crosses[baseHere+l] = 0;
								continue;
							}
							if( (y == (dim1-1)) &&( (p0 & 2) || (p1 &2) )) {
								// this is an overflow, need to push fake data....
								points[baseHere+l] = null;
								crosses[baseHere+l] = 0;
								continue;
							}
							if( (z == (dim2-1)) &&( (p0 & 4) || (p1 & 4) )) {
								// this is an overflow, need to push fake data....
								points[baseHere+l] = null;
								crosses[baseHere+l] = 0;
								continue;
							}

							const data0=baseOffset+dataOffset[p0];
							const data1=baseOffset+dataOffset[p1];
						let d,e;
							d=-data[data0]; e=-data[data1];
			
							if( ( d <= 0 && e >0  )|| (d > 0 && e <= 0 ) ){
								let t;
								let normal = null;
								//console.log( "x, y is a cross:", x+y*dim0,(x+y*dim0)*6, crosses.length, baseOffset+l, x, y, p0, p1, data0, data1, `d:${d} e:${e}` );
								if( e <= 0 ) {
									(t = -e/(d-e));
		// --V-V-V-V-V-V-V-V-- CREATE OUTPUT POINT(VERTEX) HERE --V-V-V-V-V-V-V-V--
									if( opts.geometryHelper ){
										normal = null;
										if( t < 0.00001 )  {
											//console.log( "t0a at ", x, y, z, p1, baseOffset+ dataOffset[p0] );
											normal = pointMerge[baseOffset+dataOffset[p1]];
										} else if( t > 1-0.001 ){
											//console.log( "t1a at ", x, y, z, p1, baseOffset+ dataOffset[p1] );
											normal = pointMerge[baseOffset+dataOffset[p0]];
									}
										if( !normal ) {
											pointOutputHolder[0] = cellOrigin[0]+ geom[p1][0]+( geom[p0][0]- geom[p1][0])* t;
											pointOutputHolder[1] = cellOrigin[1]+ geom[p1][1]+( geom[p0][1]- geom[p1][1])* t;
											pointOutputHolder[2] = cellOrigin[2]+ geom[p1][2]+( geom[p0][2]- geom[p1][2])* t;
											normal = opts.geometryHelper.addPoint( pointOutputHolder
												, null, null // texture, and uv[1,0] 
												, [0xA0,0x00,0xA0,255] // edge color
												, [0x11, 0x11, 0x11, 255] // face color
												, [0,0,0] // normal *needs to be updated*;
												, 100 // pow
												, false // use texture
												, false // flat
												, false // decal texture?
												, pointOutputHolder  // modulous of this point.
												, data0*10+elements.data[data0], data1*10+elements.data[data1], t, false
											);
											if( t < 0.00001 )  {
						//console.log( "t0 at ", x, y, z );
												pointMerge[baseOffset+dataOffset[p1]] = normal;
											} else if( t > 1-0.001 ) {
						//console.log( "t1 at ", x, y, z );
												pointMerge[baseOffset+dataOffset[p0]] = normal;	
											}
										} else {
											//console.log( "Already found point: ", x, y );
										}
										points[baseHere+l] = normal.id;
									}
									else
										points[baseHere+l] = (vertices.push(new THREE.Vector3(cellOrigin[0]+ geom[p1][0]+( geom[p0][0]- geom[p1][0])* t
												, cellOrigin[1]+ geom[p1][1]+( geom[p0][1]- geom[p1][1])* t
												, cellOrigin[2]+ geom[p1][2]+( geom[p0][2]- geom[p1][2])* t )),vertices.length-1);
		// --^-^-^-^-^-^-- END OUTPUT POINT(VERTEX) HERE --^-^-^-^-^-^--
								} else {
									(t = -d/(e-d));
		// --V-V-V-V-V-V-V-V-- OUTPUT POINT 2 HERE --V-V-V-V-V-V-V-V--
									if( opts.geometryHelper ){
										normal = null;
										if( t < 0.00001 )  {
			//				console.log( "t0b at ", x, y, z, p1, baseOffset+ dataOffset[p1] );
											normal = pointMerge[baseOffset+dataOffset[p0]];
										} else if( t > 1-0.001 )  {
			//				console.log( "t1b at ", x, y, z, p1, baseOffset+ dataOffset[p0] );
											normal = pointMerge[baseOffset+dataOffset[p1]];
										}
										if( !normal ) {
											pointOutputHolder[0] = cellOrigin[0]+ geom[p0][0]+( geom[p1][0]- geom[p0][0])* t;
											pointOutputHolder[1] = cellOrigin[1]+ geom[p0][1]+( geom[p1][1]- geom[p0][1])* t;
											pointOutputHolder[2] = cellOrigin[2]+ geom[p0][2]+( geom[p1][2]- geom[p0][2])* t;
											normal = opts.geometryHelper.addPoint( pointOutputHolder
												, null, null // texture, and uv[1,0] 
												, [0xA0,0x00,0xA0,255] // edge color
												, [0x11, 0x11, 0x11, 255] // face color
												, [0,0,0] // normal *needs to be updated*;
												, 100 // pow
												, false // use texture
												, false // flat
												, false // decal texture?
												, pointOutputHolder  // modulous of this point.
												, data1*10+elements.data[data1], data0*10+elements.data[data0], t, true
											);
											if( t < 0.00001 ) 
												pointMerge[baseOffset+dataOffset[p0]] = normal;
											else if( t > 1-0.001 )
												pointMerge[baseOffset+dataOffset[p1]] = normal;
										}else {
											//console.log( "Already found point: ", x, y );
										}
										points[baseHere+l] = normal.id;
									}
									else
										points[baseHere+l] =( vertices.push(new THREE.Vector3(cellOrigin[0]+ geom[p0][0]+( geom[p1][0]- geom[p0][0])* t
												, cellOrigin[1]+ geom[p0][1]+( geom[p1][1]- geom[p0][1])* t
												, cellOrigin[2]+ geom[p0][2]+( geom[p1][2]- geom[p0][2])* t )),vertices.length-1 );
		// --^-^-^-^-^-^-- END  OUTPUT POINT 2 HERE --^-^-^-^-^-^--
								}
								if( normal ){
									// 'normal' in this context is a vertex reference
									debug_ && (normal.adds = 0);
									normals[baseHere+l] = normal;
								}
								else {
									// for normal, just need an accumulator to smooth shade; or to compute face normal into later
									normal = normals[baseHere+l] = ( new THREE.Vector3(0,0,0) );
									debug_ && (normal.adds = 0);
								}
								crosses[baseHere+l] = 1;
								bits[baseOffset] = 1; // set any 1 bit is set here.
							}
							else {
								//console.log( "x,y does not cross", x+y*dim0,(x+y*dim0)*6, crosses.length, baseOffset+l, x, y, p0, p1, data0, data1, `d:${d} e:${e}` ); 
								crosses[baseHere+l] = 0;
							}
						}
					}
				}
			}


			for( var z = 0; z < dim2; z++ ) {
			
				let odd = 0;
				let zOdd = z & 1;

				// for all bounday crossed points, generate the faces from the intersection points.
				for( var y = 0; y < dim1; y++ ) {
					for( var x = 0; x < dim0; x++ ) {
						var tetSkip = 0;
						const baseOffset = (x + (y*dim0) + z*dim0*dim1)*6;
						if( !bits[baseOffset] ) {
							// if nothing in x, x+1, y+1, just 1 bit in forward right wouldn't be enough.
							if( !bits[baseOffset + 1] && !bits[baseOffset + dim0] && !bits[baseOffset + dim0*dim1] ) {
									//console.log( "Skip:", (x+1)+y*dim0, x, y, z );
									//continue;
							}
						}

						if( x >= (dim0-1)) tetSkip |= 1;
						if( y >= (dim1-1)) tetSkip |= 2;
						if( z >= (dim2-1)) tetSkip |= 4;
						const dataOffset = x + (y*dim0) + z*dim1*dim0;
							odd = (( x + y ) &1) ^ zOdd;
						for( let tet = 0; tet < 5; tet++ ) {
							if( tetMasks[odd][tet] & tetSkip ) continue;

							let f;
							let invert = 0;
							let useFace = 0;

							// this is 'valid combinations' check.
							if( crosses[ baseOffset+edgeToComp[odd][tet][0] ] ) {
								//console.log( `Output: odd:${odd} tet:${tet} x:${x} y:${y} a:${JSON.stringify(a)}` );
								if( crosses[ baseOffset+edgeToComp[odd][tet][1] ] ) {
									if( crosses[ baseOffset+edgeToComp[odd][tet][2] ] ) {
										// lower left tet. // source point is 0
										useFace = 1;
										invert = ( data[dataOffset+vertToData[odd][tet][0]] >= 0 )?1:0;
									} else {
										if( crosses[ baseOffset+edgeToComp[odd][tet][4] ] && crosses[ baseOffset+edgeToComp[odd][tet][5] ]) {
											// source point is 2? 1?   (0?3?)
											useFace = 2;
											invert = ( data[dataOffset+vertToData[odd][tet][0]] >= 0 )?1:0 ;
										}
									}
								} else {
									if( crosses[ baseOffset+edgeToComp[odd][tet][2]] && crosses[ baseOffset+edgeToComp[odd][tet][3]] && crosses[ baseOffset+edgeToComp[odd][tet][4] ] ) {
										// source point is ? 1? 3?   (0? 2?)
										useFace = 3;
										invert = ( data[dataOffset+vertToData[odd][tet][0]] >= 0 )?1:0  ;
									}else if( crosses[ baseOffset+edgeToComp[odd][tet][3]] && crosses[ baseOffset+edgeToComp[odd][tet][5] ] ) {
										// source point is 1
										useFace = 4;
										invert = ( data[dataOffset+vertToData[odd][tet][1]] >= 0 )?1:0
									}
								}
							} else {
								if( crosses[ baseOffset+edgeToComp[odd][tet][1] ] ) {
									if( crosses[ baseOffset+edgeToComp[odd][tet][2] ] && crosses[ baseOffset+edgeToComp[odd][tet][3] ] && crosses[ baseOffset+edgeToComp[odd][tet][5] ]) {
										// 0?1?   2?3?
										useFace = 5;
										invert = ( data[dataOffset+vertToData[odd][tet][0]] >= 0 )  ?1:0
									} else if( crosses[ baseOffset+edgeToComp[odd][tet][3]] && crosses[ baseOffset+edgeToComp[odd][tet][4] ] ) {
										// source point is 2
										useFace = 6;
										invert = ( data[dataOffset+vertToData[odd][tet][2]] >= 0 ) ?1:0
									}
								} else {
									if( crosses[ baseOffset+edgeToComp[odd][tet][2] ] && crosses[ baseOffset+edgeToComp[odd][tet][4]] && crosses[ baseOffset+edgeToComp[odd][tet][5] ] ) {
										// source point is 3
										useFace = 7;
										invert = ( data[dataOffset+vertToData[odd][tet][3]] >= 0 ) ?1:0
									} else {
									}
								}
							}
							//if( useFace > 5 || useFace < 5 ) continue;
							if( useFace-- ) {
								bits[dataOffset] = 1; // set any 1 bit is set here.
								const fpi = facePointIndexes[odd][tet][invert][useFace];
								for( var tri=0;tri< fpi.length; tri++ ){
									const ai = baseOffset+fpi[tri][0];
									const bi = baseOffset+fpi[tri][1];
									const ci = baseOffset+fpi[tri][2];
									// ai, bi, ci are indexes into computed pointcloud layer.
		// --V-V-V-V-V-V-V-V-- GENERATE OUTPUT FACE --V-V-V-V-V-V-V-V--

									if( smoothShade ) {
										//  https://stackoverflow.com/questions/45477806/general-method-for-calculating-smooth-vertex-normals-with-100-smoothness
										// suggests using the angle as a scalar of the normal.
										
										if( opts.geometryHelper )	{

											// a - b - c    c->b a->b
											const vA = normals[ai].vertBuffer;
											const vB = normals[bi].vertBuffer;
											const vC = normals[ci].vertBuffer;
											let v1, v2, v3;
											const AisB =  ( ( vA[0] === vB[0] ) && ( vA[1] === vB[1]  ) && ( vA[2] === vB[2]  ) );
											const AisC =  ( ( vA[0] === vC[0] ) && ( vA[1] === vC[1]  ) && ( vA[2] === vC[2]  ) );
											const BisC =  ( ( vB[0] === vC[0] ) && ( vB[1] === vC[1]  ) && ( vB[2] === vC[2]  ) );
											if( AisB || BisC || AisC ) {
											//console.log( "zero size tri-face")
											continue;
											}
											{
												v1 = vC;
												v2 = vB;
												v3 = vA;
											}
											if( AisC ) {
												v1 = vB;
												v2 = vC;
												v3 = vA;
											}
											if( BisC ) {
												v1 = vA;
												v2 = vC;
												v3 = vB;
											}

											//if( !vA || !vB || !vC ) debugger;
											fnorm[0] = v2[0]-v1[0];fnorm[1] = v2[1]-v1[1];fnorm[2] = v2[2]-v1[2];
											tmp[0] = v3[0]-v1[0];tmp[1] = v3[1]-v1[1];tmp[2] = v3[2]-v1[2];
											let a=fnorm[0], b=fnorm[1];
											fnorm[0]=fnorm[1]*tmp[2] - fnorm[2]*tmp[1];
											fnorm[1]=fnorm[2]*tmp[0] - a       *tmp[2];
											fnorm[2]=a       *tmp[1] - b       *tmp[0];
											let ds;
											if( (ds=fnorm[0]*fnorm[0]+fnorm[1]*fnorm[1]+fnorm[2]*fnorm[2]) > 0.00000001 ){
												ds = 1/Math.sqrt(ds);
												fnorm[0] *= ds;fnorm[1] *= ds;fnorm[2] *= ds;
											}else {
												//console.log( "1Still not happy...", fnorm, ds,vA, vB, vC );
												// b->A  c->A
												fnorm[0] = vB[0]-vA[0];fnorm[1] = vB[1]-vA[1];fnorm[2] = vB[2]-vA[2];
												tmp[0] = vC[0]-vA[0];tmp[1] = vC[1]-vA[1];tmp[2] = vC[2]-vA[2];
												let a=fnorm[0];
												fnorm[0]=fnorm[1]*tmp[2] - fnorm[2]*tmp[1];
												fnorm[1]=fnorm[2]*tmp[0] - a       *tmp[2];
												fnorm[2]=a       *tmp[1] - b       *tmp[0];
												let ds2;
												if( (ds2=fnorm[0]*fnorm[0]+fnorm[1]*fnorm[1]+fnorm[2]*fnorm[2]) > 0.00000001 ){
													ds2 = -1/Math.sqrt(ds2);
													fnorm[0] *= ds2;fnorm[1] *= ds2;fnorm[2] *= ds2;
												} else {
													//console.log( "2Still not happy...", ds2, vA, vB, vC );
													// B->C  A->C
													fnorm[0] = vA[0]-vC[0];fnorm[1] = vA[1]-vC[1];fnorm[2] = vA[2]-vC[2];
													tmp[0] = vB[0]-vC[0];tmp[1] = vB[1]-vC[1];tmp[2] = vB[2]-vC[2];
													let a=fnorm[0];
													fnorm[0]=fnorm[1]*tmp[2] - fnorm[2]*tmp[1];
													fnorm[1]=fnorm[2]*tmp[0] - a       *tmp[2];
													fnorm[2]=a       *tmp[1] - b       *tmp[0];
													let ds3;
													if( (ds3=fnorm[0]*fnorm[0]+fnorm[1]*fnorm[1]+fnorm[2]*fnorm[2]) > 0.00000001 ){
														ds3 = -1/Math.sqrt(ds3);
														fnorm[0] *= ds3;fnorm[1] *= ds3;fnorm[2] *= ds3;
													} 
													//else 
													//	console.log( "3Still not happy...", ds, vA, vB, vC );
												}
											}
			
											{
												a1t[0]=vB[0]-vA[0];a1t[1]=vB[1]-vA[1];a1t[2]=vB[2]-vA[2];
												a2t[0]=vC[0]-vA[0];a2t[1]=vC[1]-vA[1];a2t[2]=vC[2]-vA[2];

												let angle = 0;
												if( (a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2] ) >0.00000001 && 
													(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) >0.00000001 )
													angle = 2*Math.acos( clamp((a1t[0]*a2t[0]+a1t[1]*a2t[1]+a1t[2]*a2t[2])/(Math.sqrt(a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2])*Math.sqrt(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) ), 1.0 ));
												normals[ai].normalBuffer[0] += fnorm[0]*angle;
												normals[ai].normalBuffer[1] += fnorm[1]*angle;
												normals[ai].normalBuffer[2] += fnorm[2]*angle;
											}

											{
												a1t[0]=vC[0]-vB[0];a1t[1]=vC[1]-vB[1];a1t[2]=vC[2]-vB[2];
												a2t[0]=vA[0]-vB[0];a2t[1]=vA[1]-vB[1];a2t[2]=vA[2]-vB[2];
												let angle = 0;
												if( (a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2] ) >0.00000001 && 
													(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) >0.00000001 ) {
														angle = 2*Math.acos( clamp((a1t[0]*a2t[0]+a1t[1]*a2t[1]+a1t[2]*a2t[2])/(Math.sqrt(a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2])*Math.sqrt(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) ), 1.0) );
												}

												normals[bi].normalBuffer[0] += fnorm[0]*angle;
												normals[bi].normalBuffer[1] += fnorm[1]*angle;
												normals[bi].normalBuffer[2] += fnorm[2]*angle;
											}

											{
												a1t[0]=vA[0]-vC[0];a1t[1]=vA[1]-vC[1];a1t[2]=vA[2]-vC[2];
												a2t[0]=vB[0]-vC[0];a2t[1]=vB[1]-vC[1];a2t[2]=vB[2]-vC[2];

												let angle = 0;
												if( (a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2] ) >0.00000001 && 
													(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) >0.00000001 )
													angle = 2*Math.acos( clamp((a1t[0]*a2t[0]+a1t[1]*a2t[1]+a1t[2]*a2t[2])/(Math.sqrt(a1t[0]*a1t[0]+a1t[1]*a1t[1]+a1t[2]*a1t[2])*Math.sqrt(a2t[0]*a2t[0]+a2t[1]*a2t[1]+a2t[2]*a2t[2] ) ), 1.0) );
												normals[ci].normalBuffer[0] += fnorm[0]*angle;
												normals[ci].normalBuffer[1] += fnorm[1]*angle;
												normals[ci].normalBuffer[2] += fnorm[2]*angle;
											}
											debug_ && normals[ai].adds++;
											debug_ && normals[bi].adds++;
											debug_ && normals[ci].adds++;
											if( isNaN(normals[ci].normalBuffer[0]) || isNaN(normals[ci].normalBuffer[1]) || isNaN(normals[ci].normalBuffer[2]) )debugger;
											if( isNaN(normals[bi].normalBuffer[0]) || isNaN(normals[bi].normalBuffer[1]) || isNaN(normals[bi].normalBuffer[2]) )debugger;
											if( isNaN(normals[ai].normalBuffer[0]) || isNaN(normals[ai].normalBuffer[1]) || isNaN(normals[ai].normalBuffer[2]) )debugger;
											
											if( debug_ && normals[ci].adds >= 3 &&  !normals[ci].normalBuffer[0] && !normals[ci].normalBuffer[1] && !normals[ci].normalBuffer[2] ){ console.log( "zero normal:", ci, normals[ci], normals[ci].normalBuffer, normals[ci].vertBuffer );}//debugger;
											if( debug_ && normals[bi].adds >= 3 &&  !normals[bi].normalBuffer[0] && !normals[bi].normalBuffer[1] && !normals[bi].normalBuffer[2] ){ console.log( "zero normal:", ci, normals[ci], normals[ci].normalBuffer, normals[ci].vertBuffer );}//debugger;
											if( debug_ && normals[ai].adds >= 3 &&  !normals[ai].normalBuffer[0] && !normals[ai].normalBuffer[1] && !normals[ai].normalBuffer[2] ){ console.log( "zero normal:", ci, normals[ci], normals[ci].normalBuffer, normals[ci].vertBuffer );}//debugger;


											//console.log( "vertices", tet, useFace, tri, "odd:",odd, "invert:", invert, "pos:", x, y, z, "dels:", normals[ai].typeDelta, normals[bi].typeDelta, normals[ci].typeDelta, "a:", normals[ai].invert, normals[ai].type1, normals[ai].type2, "b:", normals[bi].invert, normals[bi].type1, normals[bi].type2, "c:", normals[ci].invert, normals[ci].type1, normals[ci].type2 );

											opts.geometryHelper.addFace( points[ai], points[bi], points[ci], null
												, invert
												, [normals[ai].type1%10, normals[ai].type2%10, normals[bi].type1%10, normals[bi].type2%10, normals[ci].type1%10, normals[ci].type2%10 ]
												, [normals[ai].typeDelta, normals[bi].typeDelta, normals[ci].typeDelta] );
											
											//opts.geometryHelper.addFace( normals[ai].id, normals[bi].id, normals[ci].id );

										}else{
											// in this mode, normals is just a THREEE.vector3.
											faces.push( f = new THREE.Face3( points[ai], points[bi], points[ci]
														,[normals[ai],normals[bi],normals[ci]] )
											);

											const vA = vertices[f.a];
											const vB = vertices[f.b];
											const vC = vertices[f.c];
											if( ( vA.x === vB.x && vA.x === vC.x )
											&& ( vA.y === vB.y && vA.y === vC.y )
											&& ( vA.z === vB.z && vA.z === vC.z ) ) {
												//console.log( "zero size tri-face")
											continue;
											}
											//if( !vA || !vB || !vC ) debugger;
											v_cb.subVectors(vC, vB);
											v_ab.subVectors(vA, vB);
											v_cb.cross(v_ab);
									
											if( v_cb.length() > 0.000001 ){
												// try a cross from a different side.
											}
											v_cb.normalize();

											{
												v_a1t.subVectors(vC,vB);
												v_a2t.subVectors(vA,vB);
												let angle = 0;
												if( v_a1t.length() && v_a2t.length() )
													angle = v_a1t.angleTo( v_a2t );
												v_normTmp.copy(v_cb).multiplyScalar(angle);
												normals[bi].add( v_normTmp );
											}
			
											{
												v_a1t.subVectors(vB,vA);
												v_a2t.subVectors(vC,vA);
												let angle = 0;
												if( v_a1t.length() > 0 && v_a2t.length()>0 ){
													angle = v_a1t.angleTo( v_a2t );
												}
												v_normTmp.copy(v_cb).multiplyScalar(angle);
												normals[ai].add( v_normTmp );
											}
									
											v_cb.subVectors(vA, vC);
											v_ab.subVectors(vB, vC);
											v_cb.cross(v_ab);
			
											if( v_cb.length() > 0.000001 ) {
												v_cb.normalize();
												v_a1t.subVectors(vA,vC);
												v_a2t.subVectors(vB,vC);
												let angle = 0;
												if( v_a1t.length() > 0 && v_a2t.length()>0 ){
													angle = v_a1t.angleTo( v_a2t );
												}
												v_cb.multiplyScalar(angle);
			
												v_normTmp.copy(v_cb).multiplyScalar(angle);
												normals[ci].add( v_normTmp );
											}
										}
									} else {
										if( opts.geometryHelper )	{
											const vA = normals[ai].vertBuffer;
											const vB = normals[bi].vertBuffer;
											const vC = normals[ci].vertBuffer;
											//if( !vA || !vB || !vC ) debugger;
											fnorm[0] = vC[0]-vB[0];fnorm[1] = vC[1]-vB[1];fnorm[2] = vC[2]-vB[2];
											tmp[0] = vA[0]-vB[0];tmp[1] = vA[1]-vB[1];tmp[2] = vA[2]-vB[2];
											let a=fnorm[0], b = fnorm[1];
											fnorm[0]=fnorm[1]*tmp[2] - fnorm[2]*tmp[1];
											fnorm[1]=fnorm[2]*tmp[0] - a       *tmp[2];
											fnorm[2]=a       *tmp[1] - b       *tmp[0];
											let ds;
											if( (ds=fnorm[0]*fnorm[0]+fnorm[1]*fnorm[1]+fnorm[2]*fnorm[2]) < 0.00001 ){
												fnorm[0] = vB[0]-vA[0];fnorm[1] = vB[1]-vA[1];fnorm[2] = vB[2]-vA[2];
												tmp[0] = vC[0]-vA[0];tmp[1] = vC[1]-vA[1];tmp[2] = vC[2]-vA[2];
												let a=fnorm[0], b = fnorm[1];
												fnorm[0]=fnorm[1]*tmp[2] - fnorm[2]*tmp[1];
												fnorm[1]=fnorm[2]*tmp[0] - a       *tmp[2];
												fnorm[2]=a       *tmp[1] - b       *tmp[0];
												ds=fnorm[0]*fnorm[0]+fnorm[1]*fnorm[1]+fnorm[2]*fnorm[2];
											}
											ds = 1/Math.sqrt(ds);
											fnorm[0] *= ds;fnorm[1] *= ds;fnorm[2] *= ds;

											opts.geometryHelper.addFace( points[ai], points[bi], points[ci]
														, fnorm, invert
												, [normals[ai].type1%10, normals[ai].type2%10, normals[bi].type1%10, normals[bi].type2%10, normals[ci].type1%10, normals[ci].type2%10 ]
												, [normals[ai].typeDelta, normals[bi].typeDelta, normals[ci].typeDelta]  );
										}else {
											const vA = vertices[points[ai]];
											const vB = vertices[points[bi]];
											const vC = vertices[points[ci]];
											//if( !vA || !vB || !vC ) debugger;
											v_cb.subVectors(vC, vB);
											v_ab.subVectors(vA, vB);
											v_cb.cross(v_ab);
												
											if( v_cb.length() < 0.01 ){
												v_cb.subVectors(vB, vA);
												v_ab.subVectors(vC, vA);
												v_cb.cross(v_ab);
											}
											v_cb.normalize();
											faces.push( f = new THREE.Face3( points[ai], points[bi], points[ci], v_cb.clone() ) );
										}
									}
								}
		// --^-^-^-^-^-^-- END GENERATE OUTPUT FACE --^-^-^-^-^-^--
							}
						}
					}
				}
			}

			// update geometry (could wait for index.html to do this?
			if( showGrid )
				opts.geometryHelper.markDirty();

			opts.points  = points;   
			opts.normals = normals;
			opts.bits    = bits; 
			// internal utility function to limit angle
			function clamp(a,b) {
				if( a < b ) return a; return b;
			}
		}

	}
})()

if("undefined" != typeof exports) {
	exports.mesher = MarchingTetrahedra4;
}


"use strict";
import * as THREE from "../three.js/build/three.module.js"

import {voxels} from  "./voxels.js"


export class SmoothMesher {

	sorted_draw_infos = new Array( 27);
	SortedSectorIndexes = new Array(27); //ushort[27][];
	center_sorted_x = -1;
	center_sorted_y = 0;
	center_sorted_z = 0;

	construtor() {

	}

	MakeSectorRenderingData( sector )
	{
		// this is THE thing huh?
		// we get a sector and then what?

		var face = new THREE.Vector4( 255, 0, 0, 255 ), edge = new THREE.Vector4( 0, 0, 0, 255 );
		var power = 400;
		var x, y, z;
		var ofs;
		var info;
		var cube;
		/* build sector geometry */
		var cluster = sector.cluster;
		var Offset;
		var cubx, cuby, cubz;
		var Sector_Display_x, Sector_Display_y, Sector_Display_z;
		var Draw;
		var P0,P1,P2,P3,P4,P5,P6,P7;

		if( !sector.solid_geometry ) {
        	sector.solid_geometry = cluster.getGeometryBuffer();
			sector.Flag_Render_Dirty = true;
		}
		if( !sector.data.FaceCulling )
		{
			sector.culler = cluster.mesher.culler;
			this.initCulling( sector );
			}
		// Display list creation or reuse.
		if( sector.Flag_Render_Dirty )
		{
			var geometry = sector.solid_geometry;
			var voxelSize = cluster.voxelUnitSize;
			var FaceCulling = sector.data.FaceCulling;

			sector.data.data.forEach( (voxel,Offset)=>
				{
				});
		}

	}

		MakeSectorRenderingData_Sorted  ( sector, viewed_as
										, centerX, centerY, centerZ )
	{

	}




	/// <summary>
	/// Build the INCENTER order list.
	/// </summary>
	/// <param name="x">voxel position of viewpoint</param>
	/// <param name="y">voxel position of viewpoint</param>
	/// <param name="z">voxel position of viewpoint</param>
		BuildSortListInSector ( cluster, eye_x, eye_y, eye_z )
	{
	}
}



//Voxelarium.mesher = { sorters : [] }
