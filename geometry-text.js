
		// for phong hello world test....
		var light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
		light.position.set( 0, 0, 1000 );
		scene.add( light );


var loader = new THREE.FontLoader();
var font;
loader.load( 'src/fonts/Microsoft YaHei_Regular.js', function ( _font ) {
	console.log( "Have a font?")
    // your code here
	font = _font;

	var material = new THREE.MeshPhongMaterial({
			color: 0xdddddd
		});
		var textGeom = new THREE.TextGeometry( 'Hello World!', {
			font: font // Must be lowercase!
			, height : 1
			, size : 50

		});
		var textMesh = new THREE.Mesh( textGeom, material );
		textMesh.position.z += 150
		scene.add( textMesh );

} );
