

var camera;

exports.gameMouseMove = function(e){
    var projector = new THREE.Projector();
    var mouseVector = new THREE.Vector3();
    mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
    mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );

    var raycaster = projector.pickingRay( mouseVector.clone(), camera );

    var intersects = raycaster.intersectObjects( cubes.children );
    if( intersects ) {

    }
}

exports.getMouseRay = function( camera, e ) {
    //#define BEGIN_SCALE 1
    var COMMON_SCALE = ( 2*camera.aspect)
    var END_SCALE = (1000*1/*l.scale*/)
    var tmp_param1 = (END_SCALE*COMMON_SCALE)
    var mouse_ray_origin = THREE.Vector3Zero.clone().addScaledVector( THREE.Vector3Forward );
    mouse_ray_origin.addScaledVector( THREE.Vector3Right, (e.clientX-(window.innerWidth/2.0f) )*COMMON_SCALE/window.innerWidth );
    mouse_ray_origin.addScaledVector( THREE.Vector3Up, -(e.clientY-(window.innerHeight/2.0f) )*(2)/window.innerHeight );

    var mouse_ray_target = THREE.Vector3Zero.clone().addScaledVector( THREE.Vector3Forward, 1000 );
    mouse_ray_target.addScaledVector( THREE.Vector3Right, tmp_param1*(e.clientX-(window.innerWidth/2.0f) )/window.innerWidth );
    mouse_ray_target.addScaledVector( THREE.Vector3Up, -(2*END_SCALE)*(e.clientY-(window.innerHeight/2.0f))/window.innerHeight );

    mouse_ray_origin.applyMatrix4( camera.matrix );
    mouse_ray_target.applyMatrix4( camera.matrix );

    var mouse_ray_slope = mouse_ray_target.clone().sub( mouse_ray_origin );
	mouse_ray_slope.normalize();
    return {n:mouse_ray_slope,o:mouse_ray_origin};
}
