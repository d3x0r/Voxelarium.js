"use strict";

var types = Voxelarium.Voxels;

var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40
	, A:65, S:83, D:68, W:87, SPACE:32, C:67
    , I : 73, ESCAPE : 27 };


function InventoryItem ( voxelType ) {
    var item = {
        voxelType : voxelType,  // voxel type
        THREE_solid : null,
        geometry : Voxelarium.Settings.use_basic_material
					? Voxelarium.GeometryBasicBuffer()
					: Voxelarium.GeometryBuffer() ,

    }
    item.geometry.makeVoxCube( 0.25, voxelType );

    return item;
}

Voxelarium.Inventory = function( geometryShader,domElement ) {
    var domElement = ( domElement !== undefined ) ? domElement : document;
    var inventory = {
         raycaster : new THREE.Raycaster(),
        items : [],
        enabled : false,
        build_vertical : true,
        THREE_solid : new THREE.Object3D(),
         x_max : 15, y_max : 12,
         x_inc : 0.75, y_inc : 0.75,
         mouseRay : { n : THREE.Vector3Zero.clone(), o: new THREE.Vector3().delete() },
         last_intersects : null,
         deactivates : [],
         //mouseClock : new THREE.Clock();

        updatePositions : function() {
            var x = 0, y = 0;
            inventory.items.forEach( (item)=>{
                if( y >= this.y_max || x >= this.x_max ) {
                    item.THREE_solid.visible = false;
                  return;
                }
                item.THREE_solid.visible = true;
                item.THREE_solid.matrix.origin.set( x, y, 0 );
                if( this.build_vertical ) {
                    y += this.y_inc;
                    if( y >= this.y_max ) {
                      y = 0;
                      x += this.x_inc;
                    }
                }else {
                    x += this.x_inc;
                    if( x >= this.x_max ) {
                      x = 0;
                      y += this.y_inc;
                    }
                }
            })
        },
        activate : function(  inactiveCallback ) {
            domElement.addEventListener( 'contextmenu', ignore, false );
        	domElement.addEventListener( 'mousedown', onMouseDown, false );
        	domElement.addEventListener( 'mousewheel', onMouseWheel, false );
            domElement.addEventListener( 'mousemove', onMouseMove, false );
            domElement.addEventListener( 'mouseup', onMouseUp, false );
            window.addEventListener( 'keydown', onKeyDown, false );
            window.addEventListener( 'keyup', onKeyUp, false );
            inventory.THREE_solid.visible = true;
            inventory.enabled = true;
            if( inactiveCallback )
                inventory.deactivates.push( inactiveCallback )
        },
        deactivate : function( ) {
            domElement.removeEventListener( 'contextmenu', ignore, false );
            domElement.removeEventListener( 'mousedown', onMouseDown, false );
            domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
            //domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
            domElement.removeEventListener( 'mousemove', onMouseMove, false );
            domElement.removeEventListener( 'mouseup', onMouseUp, false );
            window.removeEventListener( 'keydown', onKeyDown, false );
            window.removeEventListener( 'keyup', onKeyUp, false );

            inventory.THREE_solid.visible = false;
            inventory.enabled = false;
            if( inventory.deactivates.length ) {
                inventory.deactivates.forEach( (cb)=>cb() );
                inventory.deactivates.length = 0;
            }

        },
        animate : function( camera, tick ) {
            if( !camera )return;
            if( !inventory.enabled) return;
            var o;
			var inventoryO;
            var f;

            ( inventoryO = this.THREE_solid.position ).copy( camera.position );
            //f = camera.matrix.forward

			o = inventory.raycaster.ray.origin.clone();
			f = inventory.raycaster.ray.direction;

            o.addScaledVector( f, 11 );

			var tmpdel = f.dot( camera.matrix.forward.delete() );
			inventoryO.addScaledVector( camera.matrix.forward.delete(),  11 / tmpdel );

            var m = this.THREE_solid.matrix;
            var away = camera.position.clone().addScaledVector( o, 2 )
            m.lookAt( o, camera.position, camera.matrix.up )
            m.rotateOrtho( Math.PI, 0, 2 );
            //var d = camera.matrix.down;
            inventoryO.addScaledVector( m.down.delete(), (this.y_max-this.y_inc)/2 );
            inventoryO.addScaledVector( m.right.delete(), (this.x_max-this.x_inc)/2 );


			//inventoryO.copy( o );

            this.THREE_solid.matrixWorldNeedsUpdate = true;

            inventory.last_intersects = inventory.raycaster.intersectObjects( inventory.THREE_solid.children );
            inventory.selector.currentVoxel = null;
            for ( var i = 0; i < inventory.last_intersects.length; i++ ) {
                if( inventory.last_intersects[i].object !== inventory.selector.THREE_solid ) {
                    inventory.selector.currentVoxel = inventory.last_intersects[i];
                    break;
                }
                //inventory.selector.currentVoxel = intersects[i];
                //inventory.selector.currentVoxel = intersects[i].object.item
                //intersects[ i ].object.material.color.set( 0xff0000 );

            }
            var obj;
            if( inventory.selector.currentVoxel ) {
                obj = inventory.selector.currentVoxel.object;
                obj.matrix.motion.rotation.x = 0.50;
                obj.matrix.motion.rotation.y = 1.50;
                obj.matrix.motion.rotation.z = 2.30;
                //obj.matrix.motion.torque.x = 0.25;
                obj.matrix.move(tick);
                obj.matrixWorldNeedsUpdate = true;

            }
            updateSelector();
            //if( inventory.selector.currentVoxel )
            //    inventory.selector.currentVoxel.object.visible = false;
            //for ( var i = 0; i < inventory.last_intersects.length; i++ ) {
                //console.log( inventory.last_intersects[i])
        		//intersects[ i ].object.material.color.set( 0xff0000 );

        	//}
        }
    }
    types.types.forEach( (voxel)=>{
        var item;
        inventory.items.push( item = InventoryItem( voxel ) );
        inventory.THREE_solid.add( item.THREE_solid = new THREE.Mesh( item.geometry.geometry, geometryShader ) );
        item.THREE_solid.frustumCulled = false;
        item.THREE_solid.item = item;
        item.THREE_solid.matrixAutoUpdate = false;
    })
    inventory.updatePositions();
    inventory.THREE_solid.matrixAutoUpdate = false;
    inventory.THREE_solid.visible = false;
    var currentRef;
    var currentAddRef;

    inventory.selector = {

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
            //,vertexColors: THREE.VertexColors
            ,linewidth:1 /* windows == 1 always */
            }),
        geometry : new THREE.Geometry(),
        THREE_solid : null,
        meshGlow : null,
    };
    inventory.selector.material.depthWrite = false;
    inventory.selector.material.depthTest = false;

    inventory.selector.THREE_solid = new THREE.LineSegments( inventory.selector.geometry, inventory.selector.material );
    inventory.selector.meshGlow = new THREE.LineSegments( inventory.selector.geometry, inventory.selector.material );
    inventory.selector.THREE_solid.frustumCulled = false;

    inventory.THREE_solid.add( inventory.selector.THREE_solid );


    function updateSelector() {
        var color = new THREE.Color( 0.8, 0, 0 );
        var unit = 0.8;
        var x = 0
        var y = 0
        var z = 0
        var geometry = inventory.selector.geometry;
        geometry.vertices.length = 0;
        geometry.colors.length = 0;
        if( !currentRef ){
            geometry.computeBoundingSphere();
            geometry.verticesNeedUpdate = true;
            geometry.colorsNeedUpdate = true;

            return;
        }
        var origin = currentRef.object.position;
        //console.log( `inventory at ${origin.x} ${origin.y} ${origin.z}`)
        for( var n = 0; n < 1; n++ ) {
            x = origin.x  - unit/2 - 0.1
            y = origin.y  - unit/2 - 0.1
            z = origin.z  - unit/2 - 0.1
          unit += 0.2;
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


    return inventory;


     function setMouseRay( camera, e ) {
        var rect = domElement.getBoundingClientRect();
        const w = rect.right-rect.left;//window.innerWidth;
        const h = rect.bottom-rect.top;//window.innerHeight;
        var x = (((e.clientX-rect.left)-(w/2.0))/w) * 2;
        var y = (((e.clientY-rect.top)-(h/2.0))/h) * 2;
        //console.log( `mouse at ${x}, ${y}` )

        inventory.raycaster.setFromCamera( {x:x,y:-y}, camera );

    }


      function onMouseDown(event) {
          if ( inventory.enabled === false ) return;
          event.preventDefault();
          if( inventory.selector.currentVoxel ) {
              controlGame.setCurrentType( inventory.selector.currentVoxel.object.item.voxelType );

              inventory.deactivate();
          }
          //inventory.last_intersects = inventory.raycaster.intersectObjects( inventory.THREE_solid.children );
          for ( var i = 0; i < inventory.last_intersects.length; i++ ) {
              if( inventory.last_intersects[i].object !== inventory.selector.THREE_solid ) {
                  inventory.selector.currentVoxel = inventory.last_intersects[i];
                  break;
              }
              //inventory.selector.currentVoxel = intersects[i];
              //inventory.selector.currentVoxel = intersects[i].object.item
              //intersects[ i ].object.material.color.set( 0xff0000 );

          }

      }

      function onMouseUp(event) {
          if ( inventory.enabled === false ) return;
          event.preventDefault();
      }

        function onMouseMove( event ) {
        	if ( inventory.enabled === false ) return;
        	event.preventDefault();
            setMouseRay( camera, event );
        }

        function onMouseWheel( event ) {
            event.preventDefault();
            mouseScrollX += event.wheelDeltaX;
            mouseScrollY += event.wheelDeltaY;
        }

      function ignore(event) {
          event.preventDefault();
      }

      function onKeyDown( event ) {


      	switch ( event.keyCode ) {
            case keys.ESCAPE:
      		case keys.I:
      			inventory.deactivate();
      			break;
      	}

      }

      function onKeyUp( event ) {

      	switch ( event.keyCode ) {
      	}
      }


}
