/**
 * @author d3x0r / https://github.com/d3x0r
 */
import * as THREE from "./build/three.module.js"


function controls( object, domElement ) {

    this.object = object;
	this.domElement =  domElement ;

  this.setDOM = (dom)=>{
	scope.domElement = dom;
	if( enabled ) scope.enable();
	//else this.disable();		
  }
	
	let enabled = true;

	// 65 /*A*/, 83 /*S*/, 68 /*D*/
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40
        , A:65, S:83, D:68, W:87, SPACE:32, C:67 };

	// internals
//const moveSpeed = 12 * 0.0254;

let mps = 1/8.0;
let kmph = mps*(60*60)/(1000);

let runScalar = 1;
let moveSpeed = ( 1*kmph ) /runScalar ;
	var scope = this;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;

	var lastPosition = new THREE.Vector3();

	this.setMPS= function(n) {
		mps = n/32;
		kmph = mps*(60*60)/(1000);

		runScalar = 1;
		moveSpeed = ( 1*kmph ) /runScalar ;
	}

	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateRight = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta += angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	this.rotateDown = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta += angle;

	};

	this.update = function ( tick ) {

    touchUpdate();

    scope.object.matrix.motion.rotation.x = -phiDelta;
    scope.object.matrix.motion.rotation.y = thetaDelta;
    scope.object.matrix.move( tick );
    scope.object.matrix.rotateRelative( 0, 0, -scope.object.matrix.roll );
    scope.object.matrixWorldNeedsUpdate = true;

    thetaDelta = 0;
    phiDelta = 0;
	};



	function onMouseDown( event ) {
		if ( enabled === false ) return;

		event.preventDefault();

		rotateStart.set( event.clientX, event.clientY );

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( enabled === false ) return;

		event.preventDefault();

                if( "movementX" in event ) {
		rotateDelta.set( event.movementX, event.movementY );

               }else      {
		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );
                }

        rotateDelta.x = 16 * (rotateDelta.x / window.innerWidth)
        rotateDelta.y = 16 * (rotateDelta.y / window.innerHeight)

		scope.rotateLeft( 2 * Math.PI * rotateDelta.x  );
		scope.rotateUp( 2 * Math.PI * rotateDelta.y );

		rotateStart.copy( rotateEnd );

	}

	function onMouseUp( event ) {

		if ( enabled === false ) return;
		if ( scope.userRotate === false ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );


	}

	function onMouseWheel( event ) {

		if ( enabled === false ) return;
		if ( scope.userZoom === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			//scope.zoomOut();

		} else {

			//scope.zoomIn();

		}

	}

	this.onKeyDown = onKeyDown;
	this.onKeyUp = onKeyUp;
	function onKeyDown( event ) {
	         //event.preventDefault();
		if ( enabled === false ) return;
		if ( scope.userPan === false ) return;
    
		switch ( event.keyCode ) {
            case scope.keys.SPACE:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.y = moveSpeed;
                break;
            case scope.keys.C:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.y = -moveSpeed;
                break;
            case scope.keys.A:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.x = -moveSpeed;
				break;
			case scope.keys.W:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.z = moveSpeed;
				break;
			case scope.keys.S:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.z = -moveSpeed;
				break;
			case scope.keys.D:
	    	event.preventDefault();
                scope.object.matrix.motion.speed.x = moveSpeed;
				break;
		}

	}

	this.onKeyUp = onKeyUp;
	function onKeyUp( event ) {

	         event.preventDefault();

        switch ( event.keyCode ) {
            case scope.keys.SPACE:
                scope.object.matrix.motion.speed.y = 0;
                break;
            case scope.keys.C:
                scope.object.matrix.motion.speed.y = 0;
                break;

            case scope.keys.A:
                scope.object.matrix.motion.speed.x = 0;
				break;
			case scope.keys.W:
                scope.object.matrix.motion.speed.z = 0;
				break;
			case scope.keys.S:
                scope.object.matrix.motion.speed.z = 0;
				break;
			case scope.keys.D:
                scope.object.matrix.motion.speed.x = 0;
				break;
        }
		//switch ( event.keyCode ) {

		//		break;
		//}

	}

var touches = [];
if( typeof TouchList !== "undefined" )
	TouchList.prototype.forEach = function(c){ for( var n = 0; n < this.length; n++ ) c(this[n]); }

function touchUpdate() {
  if( touches.length == 1 ){
    var t = touches[0];
    if( t.new )
    {
      rotateStart.set( t.x, t.y );
      t.new = false;
    }
    else {

            rotateEnd.set( t.x, t.y );
      		rotateDelta.subVectors( rotateEnd, rotateStart );

            rotateDelta.x = -2 * (rotateDelta.x / window.innerWidth)
            rotateDelta.y = - 2 * (rotateDelta.y / window.innerHeight)
      		scope.rotateLeft( Math.PI/2 * rotateDelta.x   );
      		scope.rotateUp( Math.PI/2 * rotateDelta.y );
            console.log( rotateDelta )
      		rotateStart.copy( rotateEnd );

    }
  }
}

function onTouchStart( e ) {
  e.preventDefault();
  e.changedTouches.forEach( (touch)=>{
    touches.push( {ID:touch.identifier,
      x : touch.clientX,
      y : touch.clientY,
      new : true
    })
  })
}

function onTouchMove( e ) {
  e.preventDefault();
  e.changedTouches.forEach( (touchChanged)=>{
    var touch = touches.find( (t)=> t.ID === touchChanged.identifier );
    if( touch ) {
      touch.x = touchChanged.clientX;
      touch.y = touchChanged.clientY;
    }
  })
}

function onTouchEnd( e ) {
  e.preventDefault();
  e.changedTouches.forEach( (touchChanged)=>{
    var touchIndex = touches.findIndex( (t)=> t.ID === touchChanged.identifier );
    if( touchIndex >= 0 )
       touches.splice( touchIndex, 1 )
  })
}

    function ignore(event) {
        event.preventDefault();
    }
	enabled = false;
    this.disable = function() {
	this.enabled = false;
	if( scope.domElement ) {
    	scope.domElement.removeEventListener( 'contextmenu', ignore, false );
    	scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
    	scope.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
    	scope.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    	//window.removeEventListener( 'keydown', onKeyDown, false );
    	//window.removeEventListener( 'keyup', onKeyUp, false );	
	}
    }
    let firstEnable = true;
    this.enable = function() {
	enabled = true;
	if( scope.domElement ) {
    	scope.domElement.addEventListener( 'contextmenu', ignore, false );
    	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
    	scope.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
      	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );
      	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );


    	scope.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    	//window.addEventListener( 'keydown', onKeyDown, false );
    	//window.addEventListener( 'keyup', onKeyUp, false );
	}
        if( firstEnable )  {
	        this.object.matrix.origin.copy( this.object.position );
                firstEnable = false;
        }
    }

};

//THREE.NaturalCamera.

controls.prototype = Object.create( THREE.EventDispatcher.prototype );

export {controls}