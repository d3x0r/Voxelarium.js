

function makeText( t,color, v )
{
	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	context1.font = "Bold 40px Arial";
	context1.fillStyle = color;
    context1.fillText(t, 0, 50);

	// canvas contents will be used for a texture
	var texture1 = new THREE.Texture(canvas1)
	texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    var mesh1 = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
      );
	  if( v )
	  mesh1.position.set( v[0], v[1], v[2] );
	  else
	mesh1.position.set(0,0,150);
	scene.add( mesh1 );
	return mesh1;
}
