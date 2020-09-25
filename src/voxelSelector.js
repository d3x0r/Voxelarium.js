import * as THREE from "../three.js/build/three.module.js"
import {Voxelarium} from "./Voxelarium.core.js"


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
    geometry : new THREE.Geometry(),
    mesh : null,
    meshGlow : null,
};
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
    geometry.vertices.length = 0;
    geometry.colors.length = 0;
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
    geometry.colors.push( color );
    geometry.vertices.push( P[0] );
    geometry.colors.push( color );
    geometry.vertices.push( P[1] );
    geometry.colors.push( color );
    geometry.vertices.push( P[1] );
    geometry.colors.push( color );
    geometry.vertices.push( P[3] );
    geometry.colors.push( color );
    geometry.vertices.push( P[3] );
    geometry.colors.push( color );
    geometry.vertices.push( P[2] );
    geometry.colors.push( color );
    geometry.vertices.push( P[2] );
    geometry.colors.push( color );
    geometry.vertices.push( P[0] );

    geometry.colors.push( color );
    geometry.vertices.push( P[4] );
    geometry.colors.push( color );
    geometry.vertices.push( P[5] );
    geometry.colors.push( color );
    geometry.vertices.push( P[5] );
    geometry.colors.push( color );
    geometry.vertices.push( P[7] );
    geometry.colors.push( color );
    geometry.vertices.push( P[7] );
    geometry.colors.push( color );
    geometry.vertices.push( P[6] );
    geometry.colors.push( color );
    geometry.vertices.push( P[6] );
    geometry.colors.push( color );
    geometry.vertices.push( P[4] );

    geometry.colors.push( color );
    geometry.vertices.push( P[0] );
    geometry.colors.push( color );
    geometry.vertices.push( P[4] );
    geometry.colors.push( color );
    geometry.vertices.push( P[1] );
    geometry.colors.push( color );
    geometry.vertices.push( P[5] );
    geometry.colors.push( color );
    geometry.vertices.push( P[2] );
    geometry.colors.push( color );
    geometry.vertices.push( P[6] );
    geometry.colors.push( color );
    geometry.vertices.push( P[3] );
    geometry.colors.push( color );
    geometry.vertices.push( P[7] );

    }
    //color.delete();
    geometry.computeBoundingSphere();
    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
}

