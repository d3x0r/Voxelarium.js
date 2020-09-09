
import {sack} from "sack.vfs";

//console.log( "sack:", sack );
const JSOX = sack.JSOX

const code = sack.Volume.readAsString( "server/remoteMethods.js" );

const pawns = new Map();


class Pawn {
	x=0;
	y=0;
	z=0;
	X=0;
	Y=0;
	Z=0;
	id=null;
	nearPawns = [];
	
	constructor( ws ){
		pawns.forEach( val=>{
			this.nearPawns.push( val );
			val.nearPawns.push(this );
		} );
		const id = ws.url.split("~");
		this.id = id[1] || sack.id();
		//console.log("ID:", id[1], this.id );
		this.ws = ws;
		ws.on("message", this.handleMessage.bind( this ));
		ws.on("close", this.handleClose.bind( this ));
	}
	
	handleClose( code, reason ) {
		console.log( "maybe we should stop tracking this client?" );
	}
	send(msg) {
		const msg_ = JSOX.stringify( msg );
		this.ws.send( msg_ );
	}
	handleMessage( msg_ ) {	
		const msg = JSOX.parse( msg_ );
		if( msg.op === "init" ) {
			console.log( "Load this client's state?" );
			this.send( { op:"init", code:code, id:this.id } );
		} else if( msg.op === "asdf" ) {
		} else {
		}
	}

}

class Db  {
	storage = null;
	constructor() {  
	
	}
	init() {
		storage = new sack.ObjectStorage( "server.os" );
		console.log( "Initalize storage? " );
	}
	connect(ws) {
		const pawn = new Pawn(ws );
		pawns.set( pawn.id, pawn );
	}
	
	
}

const db = new Db();

export {db} ;
