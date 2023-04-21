import * as THREE from "../three.js/build/three.module.js"
import {consts,Vector4Pool,Vector3Pool} from "../three.js/personalFill.js"
import {db} from "./Voxelarium.db.js"

function controls( object, domElement ) {
		this.object = object;
	var scope = this;
	let mode = 0; // default to game cursor
	this.domElement = domElement ;
	this.camera = null;

	this.nameEntryField = document.getElementById( 'playerNameEntry' );
	this.nameEntryField.style.fontSize = "1%";
	this.nameEntryField.style.border = "none";
	this.nameEntryField.style.width = 0;
	this.nameEntryField.value = db.player.name;
        db.player.on( "name", (name) =>{
		scope.nameEntryField.value = db.player.name;
		if( lockInput )
			lockInput( scope.nameEntryField.value, scope.nameEntryField.selectionStart );
        	
        } );
	let wasAt = this.nameEntryField.selectionStart;
	this.nameEntryField.addEventListener( "input", (evt)=>{
		if( lockInput )
			lockInput( scope.nameEntryField.value, scope.nameEntryField.selectionStart );
		 
	});
        function checkCursor() {
		if( lockInput ) {
	        	const isAt = scope.nameEntryField.selectionStart;
        	        if( isAt != wasAt ) {
                		wasAt = isAt;
				lockInput( scope.nameEntryField.value, scope.nameEntryField.selectionStart );
	                }
	                setTimeout( checkCursor, 100 );
                }
        }
	let tabDown = false;
	let lockInput = null;
	this.voxelSelector = null;
	this.clusters = null;
	this.mouseRay = { n : consts.Vector3Zero.clone(), o: new THREE.Vector3().delete() }
	this.mouseClock = new THREE.Clock();
	this.mouseEvents = [];
	this.setDOM = (dom)=>{
	scope.domElement = dom;
		scope.domElement.addEventListener( "pointerlockchange", pointerLockChanged );
		scope.domElement.addEventListener( "pointerlockcerror", pointerLockError );
	 	if( scope.enabled ) scope.enable();
	}
	var mouseButtonCount = 0;
	var mouseScrollX = 0;
	var mouseScrollY = 0;
	var cursorDistance = 650;
	this.bindings = new Map();

	// "Inventory",
	// {
	//   // { code: 123, ctrl: true, shift:true, alt:true }
	//   defaultKeys : [ {code:123} , {code:56}]
	//   ownMouse : mouseUpdateCallback - (evt)
	//   bindings : {
	//		"Exit Inventory" : { defaultKeys: [{code:27}] }
	//   }
	// }

	this.createBinding = function( name, callback ) {

	}
	this.addBinding= function( name, options ) {
	this.bindings.set( name, options );

	}

	this.setCurrentType = function( type ) {
			this.currentAddType = type;
	}
	this.lockTextEntry = function( cb ) {
		lockInput = cb;
                setTimeout( checkCursor, 100 );
	}
	this.setMode = function(mode_){
	mode = mode_;
	}
	this.update = function(delta) {
		switch( mode ) {
		case 0:
			Voxelarium.controls.game.update(delta);
			break;
		case 1:
			Voxelarium.controls.natural.update(delta);
			break;
		}
			
	}

function pointerLockChanged( evt ) {
			console.log( "*shrug* got pointer lock." );

		}
function pointerLockError( evt ) {
			console.log( "*shrug* got pointer lock." );

		}

function mouseEvent( x, y, b, down ) {
		var ev = { x : x,
				y : y,
				button : b,
				delta : scope.mouseClock.getDelta(),
				down : down
		}

		scope.mouseEvents.push( ev );
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

				scope.setMouseRay( Voxelarium.camera, event );

		}
	function onKeyUp( event ) {
		if( event.target !== scope.domElement ){
			return
		}
		if( event.keyCode === 9 ) {
			tabDown = false;
			event.preventDefault();
		}
		else if( mode === 0 && lockInput ) {
			const ev = new KeyboardEvent( event );
			scope.nameEntryField.focus();
			scope.nameEntryField.dispatchEvent( ev );
                        
			return;
		}
		else switch( mode ) {
		case 0:
			//Voxelarium.controls.game.onKeyUp(event);
						event.preventDefault();
			break;
		case 1:
			Voxelarium.controls.natural.onKeyUp(event);
						event.preventDefault();
			break;
		}
	}

	function onKeyDown( event ) {
		if( event.target !== scope.domElement ){
			return
		}

		if( event.keyCode === 82 && event.ctrlKey ) {
			return;
		} else if( event.keyCode === 9 ) {
			if( !tabDown ) {
				mode = 1-mode;
				tabDown = true;
				switch(mode ) {
				case 0:
					document.exitPointerLock();
					Voxelarium.controls.game.enable();
					Voxelarium.controls.natural.disable();
					break;
				case 1:
					if( scope.domElement )
						scope.domElement.requestPointerLock();
					Voxelarium.controls.natural.enable();
					Voxelarium.controls.game.disable();
					break;
				}
			}
						event.preventDefault();
		} else if( event.keyCode === 13 ) {
           	Voxelarium.db.player.setName( scope.nameEntryField.value );
			if( lockInput ) {
				lockInput( null, -1 );
			}
			lockInput = null;
		} else {

			if( mode === 0 && lockInput ) {
				const ev = new KeyboardEvent( event );
				scope.nameEntryField.focus();
				scope.nameEntryField.dispatchEvent( ev );
				return;
			}

			switch( mode ) {
			case 0:
				Voxelarium.controls.game.onKeyDown(event);
				break;
			case 1:
				Voxelarium.controls.natural.onKeyDown(event);
				break;
			}
		}
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
/*
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
*/
		window.removeEventListener( 'keydown', onKeyDown, false );
		window.removeEventListener( 'keyup', onKeyUp, false );
	}
	}

	this.enable = function() {
	this.enabled = true;
	if( scope.domElement ){
		switch(mode ) {
		case 0:
			Voxelarium.controls.natural.enable();
			Voxelarium.controls.natural.disable();
			Voxelarium.controls.game.enable();
			break;
		case 1:
			Voxelarium.controls.game.enable();
			Voxelarium.controls.game.disable();
			Voxelarium.controls.natural.enable();
			break;
		}
/*
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
*/
		window.addEventListener( 'keydown', onKeyDown, false );
		window.addEventListener( 'keyup', onKeyUp, false );
	}

	}


}



export {controls}