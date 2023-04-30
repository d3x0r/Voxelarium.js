import * as THREE from "../three.js/build/three.module.js"
import {Voxelarium} from "./Voxelarium.core.js"

const edges=[0,1,1,3,3,2,2,0,4,5,5,7,7,6,6,4,0,4,1,5,2,6,3,7];

var currentRef;
var currentAddRef;

var selector = Voxelarium.selector = {

    get currentVoxel () {
        return currentRef;
    },
    set currentVoxel (ref) {
        currentRef = ref;
    },
    get currentAddVoxel () {
        return currentAddRef;
    },
    set currentAddVoxel (ref) {
        currentAddRef = ref;
    },
    material : new THREE.LineBasicMaterial({ color:'white'
        ,vertexColors: THREE.VertexColors
        ,linewidth:1 /* windows == 1 always */
        }),
    geometry : new THREE.BufferGeometry(),
    mesh : null,
    meshGlow : null,
};
const vertices =new Float32Array( 48 * 3 );
const colors = new Float32Array( 48 * 3 );
const vertAtt = selector.geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3)) 
const colAtt = selector.geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3)) 
selector.material.depthWrite = false;
selector.material.depthTest = false;

selector.mesh = new THREE.LineSegments( selector.geometry, selector.material );
selector.meshGlow = new THREE.LineSegments( selector.geometry, selector.material );


Voxelarium.selector.update = function() {
    var color = new THREE.Color( 0.8, 0, 0 );
    var unit = currentRef?currentRef.cluster.voxelUnitSize:0;
    var x = 0
    var y = 0
    var z = 0
    var geometry = selector.geometry;
    let v = 0;
    //colors.length = 0;
    for( var n = 0; n < 2; n++ ) {
        if( n == 0 ) {
            if( !currentRef )
            {
                //return;
              }
              else {
                unit = currentRef.cluster.voxelUnitSize;
                x = currentRef.wx * unit
                y = currentRef.wy * unit
                z = currentRef.wz * unit
              }
          }else{
              //color.delete();
              color = new THREE.Color( 0, 0.8, 0 );
              if( !currentAddRef )
              {
                  //return;
                }
                else {
                  x = currentAddRef.wx * unit
                  y = currentAddRef.wy * unit
                  z = currentAddRef.wz * unit
                }

          }
    var P = [new THREE.Vector3( x, y, z )
	        , new THREE.Vector3( x + unit, y, z )
	        , new THREE.Vector3( x, y + unit, z )
	        , new THREE.Vector3( x + unit, y + unit, z )
	        , new THREE.Vector3( x, y, z + unit )
	        , new THREE.Vector3( x + unit, y, z + unit )
	        , new THREE.Vector3( x, y + unit, z + unit )
	        , new THREE.Vector3( x + unit, y + unit, z + unit )
	        ]

	    for( let edge of edges ) {
            colors[v*3+0] = color.r;
            colors[v*3+1] = color.g;
            colors[v*3+2] = color.b;
            vertices[v*3+0] = P[edge].x;
		    vertices[v*3+1] = P[edge].y;
            vertices[v*3+2] = P[edge].z;
            v++;
	    }
    }
    geometry.setDrawRange( 0, v );
    //color.delete();
    vertAtt.needsUpdate = true;
    colAtt.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
}

