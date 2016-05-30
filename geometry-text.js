

//var THREE = require( "../three.js/three.js/build/three.js" );
//var mycam =
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
