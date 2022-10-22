
import {Voxelarium} from "./Voxelarium.core.js"


import {JSOX} from "../common/JSOX.js"

const l = {
	playerId : localStorage.getItem( "playerId" ),
	serviceId : null,
	requiredLoad : 0,
}

function makeSocket( addr, protocol ) {
	try {
	const ws = new WebSocket( addr, protocol
			,{
				perMessageDeflate: false,
				//ca : config.caRoot
			}
		);
	return ws;
	}catch(err) {
		console.log( "Is this errror?", err );
	}
}

class Db  {
	websocket = null;
	onComplete = null;
	connected = false;
	events = {};
	on(a,b){
		if( "function" === typeof b ) {
			events[a] = b;
		} else {
			events[a](b);
		}
	}
	animate() {
		// called every half second during animation loop
		// this allows sending/retreiving external player positions.
	}
	player = {
		positionUpdate : false,
	        name: "Player One",
		
		setName(name) {
                	db.websocket.setName( name );
                }
                , events_ : {}
		, on(event,arg) {
			if( "function" === typeof arg ) {
				if( event in this.events_ ) {
					this.events_[event].push( arg );
				}else {
					this.events_[event] = [arg];
				}
			} else {
				if( event in this.events_ ) {
					this.events_[event].forEach( cb=>cb(arg) );
				}
			}
		}
	}
	world = {
        id : null,
		currentCluster : null,
		set cluster(val) {
			db.world.currentCluster = val;
		},
        loadWorld( id,cb,required ) {
            return db.websocket.loadWorld(id).then( (world)=>{
                db.world.id = world.id;
                console.log( "should load voxels from the world itself...")
                initialVoxelTypeLoad(cb,required)

            }).catch( (id)=>{
                db.world.id = id;
                initialVoxelTypeLoad(cb,required)
            })
        },
		loadSector( into ) {
			console.log( "loadsomething:", into );
			db.send( {op:"load", wid:this.id, pos:into.pos  } );	
		},
		storeSector( sector ) {
            db.send( {op:"store", wid:this.id, sector:sector.stringify() })
		},
		voxelInfo: null
	}

	constructor() {
		//
		l.playerId = "none";
		if( this.websocket ) {
			this.connect( this.websocket );
		}
	}
	connect(  info ) {
		console.log( "can use info?", info );
		const ws = this.websocket = makeSocket( (location.protocol==="https:"?"wss://":"ws://") + location.host + "/" + (l.playerId? '/~'+ l.playerId:'')  , "VOXDB" );
		l.serviceId = info.key;
		if( ws ) {
			ws.onmessage = this.handleMessage.bind(this);
			ws.onopen = this.onOpen.bind(this);
			ws.onerror = (err)=>{
				console.log( "GER ERROR?" );
				this.connected = true;
				this.player.on("name", this.player.name = "No Server..." );
					if( this.onComplete ) {
						this.onComplete();
					}			
			};
		}
	}
	onOpen() {
		this.send( {op:"init", sid:l.serviceId } );
	}
	init(cb,required) {
		if( required ) l.requiredLoad = required;
		if( this.connected )
			initialVoxelTypeLoad(cb,required);
		else
			this.onComplete = ()=>initialVoxelTypeLoad(cb,required);
	}
	send( msg_ ) {
		const msg = JSOX.stringify( msg_ );
		this.websocket.send( msg );		
	}
	handleMessage( evt ) {	
		const msg = JSOX.parse( evt.data );
		if( msg.op === "init" ) {
			l.playerId = msg.id;
			localStorage.setItem( "playerId", msg.id );
                        if( "name" in msg )
	                        this.player.on( "name", this.player.name = msg.name );
                        try {
				var f = new Function( "JSON", "localStorage", msg.code );
				f.call( this.websocket, JSOX, localStorage );
				console.log( "Call oncomplete:", this.onComplete );
				this.connected = true;
				if( this.onComplete ) {
					this.onComplete();
					this.onComplete = null;
				}
			} catch( err ) {
				console.log( "Function compilation error:", err,"\n", msg.code );
			}		
		} else if( msg.op === "ident" ) {
			l.name = msg.name;
			db.on("name");
		} else {
	            db.websocket.handleMessage( msg );
		}
	}
	
	
}
const db = new Db();

Voxelarium.db = db;

export {db};










function loadVoxels(cb, val){
	var count = val.voxelTypeCount;
	console.log( "have " , count )

	db.world.voxelInfo.path( "voxelTypes" ).map().on( (data,field)=>{
		console.log( "map in voxelTypes" );
		var t = Voxelarium.Voxels.types[Number(field)];
      if( t ) return;
      //console.log( "reloading ", field, data.ID)
      t = Voxelarium.Voxels.types[data.ID] = eval( data.code );

      if( data.texture ) {
	console.log( "add count:", count );
        count++;
        ( t.image = new Image() ).src = (t.textureData = data.texture);

          t.image.onload = ()=> {
             //console.log( "Wait until load to setup coords")
             t.textureCoords = Voxelarium.TextureAtlas.add( t.image )
             //console.log( "pending ", count );
		console.log( "count:", count );
             if( !--count ) { console.log( "ZERO!" ); cb(); }
          }

      }else {
	count--;
	}	
	console.log( "count:", count );
      if( !--count ) cb();
  });
}


function initialVoxelTypeLoad(cb,required) {
    console.log( "Loading initial voxels...")
    Voxelarium.Voxels.load( ()=>{
        var voxelTypes = {};
        var n = 0;
        Voxelarium.Voxels.types.forEach( (type)=>{
            if( !type.ID ) return;
            n++;
            voxelTypes[ type.ID ] = { ID:type.ID, code: type.codeData, texture : type.textureData};
        });
	db.world.voxelInfo = { voxelTypes : voxelTypes, voxelTypeCount : n };

        cb();
    }, required );
}


function doDefaultInit( data ) {
    if( !db.player.id ) {
        console.log( "do default init... pick a player ID and give him an initial world_id")

        db.player.id = new Date().getTime();
        db.player.world_id = 0;

        console.log( "put local.id=player.id")

        db.player.local.path("id").put( db.player.id )

        console.log( "put local.world_id=player.world_id")

        db.player.local.path("world_id").put( db.player.world_id )

        console.log( "done putting world_id")
    }else {
        console.log( "skipped redundant init")
    }
    // the val() in init will fire here; so global gets initialized in normal path...
}

function doDefaultInitTrigger() {
    console.log( "put init=true")
	  db.player.local.path( "init" ).put( true );
    console.log( "local put init has finished for inital Db Kick;" );
}

function doDefaultGlobalInitTrigger() {
    console.log( " kick global?")
    db.player.global.path( "init" ).put( true );
    console.log( "global put init has finished for inital Db Kick")

}

function playerConnect( val, field ) {
  //console.log( "player has connected", val, field );
}
/*


var defaultTimeout;
var defaultGlobalTimeout;
db.init = function( cb ) {
    // defaultTimeout = setTimeout( doDefaultInitTrigger, 250 );
    db.player.local.path("id").not( doDefaultInit ).val( (data)=>{
        console.log( "value is ", data)
        //clearTimeout( defaultTimeout );
        db.player.id = data;
        db.globalDb.path( "player" ).map( playerConnect );
        db.player.global = db.globalDb.path( "player" ).path( data );
        console.log( "going to request world_id...")
        db.player.local.path("world_id").val( (data)=> {
            console.log( "received world_id", data)
          db.player.world_id = data;
          db.world.db = db.globalDb.path( "world" ).path( db.player.world_id );
          db.player.global.map().val( playerConnect );
          db.player.global.path("position").on( playerPositionChange );
          loadWorld( cb );
        } );
        console.log( "requested world id - done with val callback")
    })
    //db.player.local.path("id").put( new Date().getTime() )
}

db.animate = function() {
    //db.player.put( {position:Voxelarium.camera.position} )
    if( !db.player.global )
        return;
    var m = Voxelarium.camera.matrix;
    var oldq = db.player._quat
    var newq = db.player.quat.setFromRotationMatrix( m );
    var oldo = db.player._origin
    var newo = db.player.origin.copy( m.origin );


    if( oldq.x !== newq.x ||
        oldq.y !== newq.y ||
        oldq.z !== newq.z ||
        oldq.w !== newq.w ||
        oldo.x !== newo.x ||
        oldo.y !== newo.y ||
        oldo.z !== newo.z )
    {
        var a = ( oldo.x - newo.x );
        var b = ( oldo.y - newo.y );
        var c = ( oldo.z - newo.z );

        var d = ( oldq.x - newq.x );
        var e = ( oldq.y - newq.y );
        var f = ( oldq.z - newq.z );
        var g = ( oldq.w - newq.w );
        //console.log( `a is ${a*a+b*b+c*c}  b is ${d*d+e*e+f*f+g*g}`)
        if( ( a*a+b*b+c*c > 0.001 )
            ||( d*d+e*e+f*f+g*g > 0.001 ) )
        {
            var pos_msg = {qx:newq.x,qy:newq.y,qz:newq.z,qw:newq.w
                            ,ox:m.origin.x,oy:m.origin.y,oz:m.origin.z}
            //console.log( "put", pos_msg )
            //db.player.local.path( "position").put( pos_msg )
            db.player.global.path( "position").put( pos_msg )
            oldq.copy( newq );
            oldo.copy( newo );
        }
    }
}


function storeSector( sector ) {
    if( !db.world.cluster )
      db.world.cluster = sector.cluster;
    addListener( sector );
    //console.log( "put sector update " )
    var string;
      this.db.path(getPath(sector)).put( string = sector.stringify() );
      console.log( "put-ed sector update ", string )
}

function loadSector( sector ) {
      addListener( sector );
      //this.db.path(getPath(sector)).on( cb );
}

//gun.get( `org.d3x0r.voxelarium.universe.${universe}.player.${self}`)

	

*/