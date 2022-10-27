
import {l} from "./db.local.mjs"


l.storageSetup.then( ()=>{
	l.storage.addEncoders( [ { tag:"pwn", p:Pawn, f:pawnEncode } ] );
	l.storage.addDecoders( [ { tag:"pwn", p:Pawn, f:pawnDecode } ] );
})

export class Pawn {
	x=0;
	y=0;
	z=0;
	X=0;
	Y=0;
	Z=0;
	world_id=null;
	sector={x:0,y:0,z:0};
	id=null;
	name = 'Player One';
	nearPawns = [];
	inventory = new Inventory();
	world = null;
	
	constructor( ){
		pawns.forEach( val=>{
			
			this.nearPawns.push( val );
			val.nearPawns.push(this );
		} );
	}
	destruct() {
		pawns.delete( this.id );
	}
	connect(ws){
		this.ws = ws;
	}
	handleClose( code, reason ) {
		console.log( "maybe we should stop tracking this client?" );
	}
	send(msg) {
		const msg_ = JSOX.stringify( msg );
		this.ws.send( msg_ );
	}
        setName(name ) {
        	this.name = name;
                this.store();
        }
        store() {
        	//console.log( "storing pawn...", this );
        	return l.storage.put( this, {id:this.id} )
        }

	handleMessage( msg ) {	
		if( msg.op === "init" ) {
			const expect = l.expectations.get( msg.sid );
			if( !expect ) {
				console.log( "This is not an expected connection! Protocol negotiation failure." );
			}else {
				console.log( "Server Init side connecting to login info...", expect, msg );
				this.id = expect.user;
				l.expectations.delete( msg.sid );

			}

			console.log( "Load this client's state?", msg );
			if( this.id ) 
				l.storage.get( this.id ).then( (pawn)=>{
					//const pawn = new Pawn(ws );
					this.send( { op:"init", code:code, name:this.name, id:this.id } );
				} ).catch( initPawn );
			else 
		        initPawn(this);
			function initPawn(pawn){
				//console.log( "User object doesn't exist yet? ");
                                //const newPawn = 
				l.storage.put( pawn, {id:pawn.id} ).then((id)=>{
					//console.log( "got back same ID?", id, pawn.id );
				} );
				this.send( { op:"init", code:code, name:pawn.name, id:pawn.id } );
			}
		} else if( msg.op === "setName" ) {
			this.setName( msg.name );
		} else if( msg.op === "loadWorld" ) {
		} else {
			console.log( "Unhandled pawn message:", msg);
		}
	}
	encode(s){
        	const z = `{id:${s.stringify(this.id)},name:${s.stringify(this.name)}
				,world:${s.stringify(this.world_id)}
				,pos:{x:${this.x},y:${this.y},z:${this.z}},rot:{x:${this.X},y:${this.Y},z:${this.Z}}}`
        	//console.log( "WTF?", this, z );
		return z;
	}

	joinWorld( world ) {

	}
}

function pawnEncode(stringifer){
	return this.encode(stringifer);
}


function pawnDecode( c, b) {
	switch( true ) {
	case c === "name":
        	this.name = b;
        	return this;
	case c === "pos":
        	this.x = b.x;
        	this.y = b.y;
        	this.z = b.z;
        	return this;
	case c === "rot":
        	this.x = b.x;
        	this.y = b.y;
        	this.z = b.z;
        	return this;
	case c === "world":
        	console.log( "WOrld not recovered..." );
        	//this.world_id = b;
        	return this;
	case c === "id":
        	console.log( "THIS should have a vlaid ID:", b );
        	this.id = b;
        	return this;
        case c === undefined:
        	// final chance - get to replace the whole object.
        	return this;
        default:
        	console.log( "Didn't handle field:", c, b );
        }
	console.log( "DECODE:", this, c, b );
}
