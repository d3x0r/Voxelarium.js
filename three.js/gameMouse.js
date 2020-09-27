import * as THREE from "./build/three.module.js"


var casting = {
		reset: function() { this.cubes = 0; },
		material : new THREE.LineBasicMaterial({color:'blue',linewidth:3}),
		geometry : new THREE.BufferGeometry,
		mesh : null,
		addRef : null,
		cubes : 0
};
casting.geometry.dynamic = true;
casting.mesh = new THREE.LineSegments( casting.geometry, casting.material );
casting.mesh.frustumCulled = false;
var vertices = new Float32Array( 500 * 3 ); // 3 vertices per point
casting.geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) )

casting.addRef = function updateCastMesh( currentRef) {
	{
		var unit = currentRef.cluster.voxelUnitSize;
		var x = currentRef.wx * unit
		var y = currentRef.wy * unit
		var z = currentRef.wz * unit
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
		var geometry = casting.geometry;
		//    console.log( "add", x, y, z )
		var v = casting.cubes * 24*3;
		for( let edge of edges ) {
			vertices[v++] = P[edge].x; vertices[v++] = P[edge].y; vertices[v++] = P[edge].z;
		}
		this.cubes++;
		geometry.attributes.position.needsUpdate = true
		geometry.verticesNeedUpdate = true;
}



function controls( object, domElement ) {
		this.object = object;
	this.domElement = domElement ;
		this.casting = casting;
	this.camera = null;
	var scope = this;
	this.mode = 0;
	this.voxelSelector = null;
	this.clusters = null;
	this.mouseRay = { n : new THREE.Vector3(), o: new THREE.Vector3() }
	this.mouseClock = new THREE.Clock();
	this.mouseEvents = [];
	this.currentAddType = null;//Voxelarium.Voxels.types[2];
	this.setDOM = (dom)=>{
		scope.domElement = dom;
		
	}
	var mouseButtonCount = 0;
	var mouseScrollX = 0;
	var mouseScrollY = 0;
	var cursorDistance = 650;

	this.setCurrentType = function( type ) {
		this.currentAddType = type;
	}
	
	this.setMouseRay = function( camera, e ) {
			//#define BEGIN_SCALE 1
			var rect = scope.domElement.getBoundingClientRect();
			const w = rect.right-rect.left;//window.innerWidth;
			const h = rect.bottom-rect.top;//window.innerHeight;
			var x = (((e.clientX-rect.left)-(w/2.0))/w) * 2;
			var y = (((e.clientY-rect.top)-(h/2.0))/h) * 2;
			//console.log( `mouse at ${x}, ${y}` )

			var mouse_ray_slope = new THREE.Vector3( camera.matrix.elements[0], camera.matrix.elements[1], camera.matrix.elements[2] ).multiplyScalar( x*camera.aspect );
			mouse_ray_slope.addScaledVector( camera.matrix.up, -(y) );

			// 0.47 is some magic number for 90 degree FOV
			//mouse_ray_slope.addScaledVector( camera.matrix.forward, -0.47 );
			// 75 degree view and like 3/4 aspect
			//mouse_ray_slope.addScaledVector( camera.matrix.forward, -0.605 );//-Math.sqrt(1 - mouse_ray_slope.length()) );

			// just need to point it backwards...
			// using 'myPerspective' the calculation doesn't need magic values.
			mouse_ray_slope.addScaledVector( camera.matrix.backward, -1.0);

			mouse_ray_slope.normalize();

			scope.mouseRay.n.copy( mouse_ray_slope );
			scope.mouseRay.o.copy( camera.matrix.origin );
	}
	scope.priorMouseOver = null;
	this.update = function() {
		if( !scope.clusters )
			return;
	if( !Voxelarium.inventory.enabled ){

				switch( scope.mode )
				{
				case 0: // game mouse
						let cluster;
						let result;
					 for( cluster of scope.clusters ) {

						if( mouseScrollY ) {
							 cursorDistance += ( mouseScrollY / 120 ) * cluster.voxelUnitSize;
							 mouseScrollY = 0;
						 }
					 	const o = new THREE.Vector3();
					 	
					 		o.x = scope.mouseRay.o.x - cluster.THREE_solid.matrix.elements[12];
					 		o.y = scope.mouseRay.o.y - cluster.THREE_solid.matrix.elements[13];
							o.z = scope.mouseRay.o.z - cluster.THREE_solid.matrix.elements[14];
						 
							//result = cluster.zoneCast( o, scope.mouseRay.n )

							result = cluster.rayCast( o, scope.mouseRay.n )
							 // if( result )
								//  console.log( "Result at ", scope.mouseRay.o, scope.mouseRay.n, result )

							 if( result && result.PredPointedVoxel ) {

									Voxelarium.selector.currentAddVoxel = cluster.getVoxelRef( false, result.PredPointedVoxel.x, result.PredPointedVoxel.y, result.PredPointedVoxel.z )
									Voxelarium.selector.currentVoxel = result.ref;
									 break;
							 }
					 }
					 if( result ) {
							 if( cluster != scope.priorMouseOver ) {
								if( scope.priorMouseOver )
									scope.priorMouseOver.on( "blur", scope.priorMouseOver );
								cluster.on( "mouseover", cluster );
								scope.priorMouseOver = cluster;
							}

								//}
					if( scope.mouseEvents ) {
						var mEvent = scope.mouseEvents.shift();
						if( mEvent ) {
							if( mEvent.down ) {
								if( mEvent.button === 0 && scope.currentAddType ) { // left
									var ref = Voxelarium.selector.currentAddVoxel;
									if( ref && ref.sector ){
											ref.sector.setCube( ref.x, ref.y, ref.z, scope.currentAddType )
											ref.cluster.mesher.SectorUpdateFaceCulling( ref.sector, true )
											//basicMesher.SectorUpdateFaceCulling_Partial( cluster, sector, Voxelarium.FACEDRAW_Operations.ALL, true )
											ref.cluster.mesher.MakeSectorRenderingData( ref.sector );
											Voxelarium.db.world.storeSector( ref.sector );
									}

								}
								if( mEvent.button === 2 ) { // right
									var ref = Voxelarium.selector.currentVoxel;
									if( ref && ref.sector ){
										ref.sector.setCube( ref.x, ref.y, ref.z, Voxelarium.Voxels.Void )
										ref.cluster.mesher.SectorUpdateFaceCulling( ref.sector, true )
										//basicMesher.SectorUpdateFaceCulling_Partial( cluster, sector, Voxelarium.FACEDRAW_Operations.ALL, true )
										ref.cluster.mesher.MakeSectorRenderingData( ref.sector );
										Voxelarium.db.world.storeSector( ref.sector );
									}
								}
							}
						}
					}



					}else {
									 	if( scope.priorMouseOver ) {
									 	scope.priorMouseOver.on( "blur", scope.priorMouseOver );
												scope.priorMouseOver = null;
												}
							 }
					 break;
			}
		}
	}

function mouseEvent( x, y, b, down ) {
	if( !Voxelarium.inventory.enabled ){
		const ev = { x : x,
				y : y,
				button : b,
				delta : scope.mouseClock.getDelta(),
				down : down
		}
		// events from remotes come in this way.

			scope.mouseEvents.push( ev );
	}
}

var ongoingTouches = [];

function copyTouch(touch) {
	return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
}
function ongoingTouchIndexById(idToFind) {
	for (var i = 0; i < ongoingTouches.length; i++) {
		var id = ongoingTouches[i].identifier;

		if (id == idToFind) {
			return i;
		}
	}
	return -1;    // not found
}
function onTouchDown(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for( var i = 0; i < touches.length; i++ ) {
		console.log( `touch ${i}=${touches[i]}`);
		ongoingTouches.push( copyTouch( touches[i] ) );

	}
}

function onTouchUp(event) {
	event.preventDefault();
}

function onTouchMove(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for( var i = 0; i < touches.length; i++ ) {
		var idx = ongoingTouchIndexById(touches[i].identifier);
		if( idx >= 0 ) {
			ongoingTouches.splice( idx, 1, copyTouch( touches[i] ) );
		}
	}
}

function onTouchCancel(event) {
	event.preventDefault();
}



	function onMouseDown(event) {
			if ( scope.enabled === false ) return;
			event.preventDefault();
			mouseEvent( event.clientX, event.clientY, event.button, true );
	}

	function onMouseUp(event) {
			if ( scope.enabled === false ) return;
			event.preventDefault();
			mouseEvent( event.clientX, event.clientY, event.button, false );
	}

		function onMouseMove( event ) {

			if ( scope.enabled === false ) return;

			event.preventDefault();
			if( !Voxelarium.inventory.enabled )
					scope.setMouseRay( Voxelarium.camera, event );

			}

		function onMouseWheel( event ) {
				event.preventDefault();
				mouseScrollX += event.wheelDeltaX;
				mouseScrollY += event.wheelDeltaY;
		}

	function ignore(event) {
			event.preventDefault();
	}
	this.enabled = false;
	this.disable = function() {
		this.enabled = false;
		if( scope.domElement ){
			scope.domElement.removeEventListener( 'contextmenu', ignore, false );
			scope.domElement.removeEventListener( 'touchstart', onTouchDown, false );
			scope.domElement.removeEventListener( 'touchend', onTouchUp, false );
			scope.domElement.removeEventListener( 'touchcancel', onTouchCancel, false );
			scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );
			scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
			scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
			scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
			scope.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
			scope.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
		}
	}

	this.onKeyDown = onKeyDown;
	function onKeyDown(event){
		if( event.keyCode === 27 ) {
			if( Voxelarium.inventory.enabled )
				Voxelarium.inventory.deactivate();
		}
		if( event.keyCode === 73 ) {
			if( !Voxelarium.inventory.enabled ){
				Voxelarium.inventory.activate();
			}else {
				Voxelarium.inventory.deactivate();
			}

			event.preventDefault();
		}
		
	}

	this.enable = function() {
		this.enabled = true;
		scope.object.matrixWorldNeedsUpdate = true;
		if( scope.domElement ){
			if( !Voxelarium.inventory  ){
				var inventory_geometryShader = Voxelarium.Settings.use_basic_material
						? new THREE.MeshBasicMaterial()
						: Voxelarium.GeometryShader();

				inventory_geometryShader.depthTest = false;
				inventory_geometryShader.depthWrite = false;
				inventory_geometryShader.transparent = false;
				inventory_geometryShader.vertexColors = THREE.VertexColors;
				inventory_geometryShader.map = Voxelarium.TextureAtlas.texture;
				if( inventory_geometryShader.uniforms )
					inventory_geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;
				inventory_geometryShader.needsUpdate = true;
				//inventory_geometryShader.uniforms.map.value = Voxelarium.TextureAtlas.texture;

				Voxelarium.inventory = Voxelarium.Inventory(inventory_geometryShader,scope.domElement);
			}
			//this.currentAddType = Voxelarium.Voxels.types[2];

			scope.domElement.addEventListener( 'contextmenu', ignore, false );
			scope.domElement.addEventListener( 'touchstart', onTouchDown, false );
			scope.domElement.addEventListener( 'touchend', onTouchUp, false );
			scope.domElement.addEventListener( 'touchcancel', onTouchCancel, false );
			scope.domElement.addEventListener( 'touchmove', onTouchMove, false );
			scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
			scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
			scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
			scope.domElement.addEventListener( 'mousewheel', onMouseWheel, false ); // firefox
			scope.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
		}
		//window.addEventListener( 'keydown', onKeyDown, false );
		//window.addEventListener( 'keyup', onKeyUp, false );
	}


}


export {controls}