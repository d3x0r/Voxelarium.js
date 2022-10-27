
import {sack} from "sack.vfs";
import {BloomNHash} from  "@d3x0r/bloomnhash" ;

import {World} from "./World.mjs";
import {Inventory} from "./Inventory.mjs"
import {l} from "./db.local.mjs"

//console.log( "sack:", sack );
const JSOX = sack.JSOX

function loadRemote() {
    try {
        return sack.Volume.readAsString( "server/remoteMethods.js" );
    } catch(err ) {
        try {
	        return sack.Volume.readAsString( "remoteMethods.js" );
        }catch(err2) {
            console.log( "failed:", err, err2 );
       	}
    }
}

const code = loadRemote();

const pawns = new Map();

import {Pawn} from "./pawn.mjs"
//JSOX.

function onLoadConfig() {
	for( let db of l.dbs ) db.ready && db.ready()
}


class Db  {
	storage = null;
	ready = null;
	reading = null;
	JSOXStream = JSOX.begin( this.onObject.bind(this) );
	constructor() {  
	   	l.dbs.push(this);
	}
	init(cb) {
		this.read = cb;
		if( !l.storage ){
			console.log( "Server initialzied storage" );
			l.storage = new sack.ObjectStorage( "server.os" );
			//l.storage.addEncoders( [ { tag:"pwn", p:Pawn, f:pawnEncode } ] );
			//l.storage.addDecoders( [ { tag:"pwn", p:Pawn, f:pawnDecode } ] );
			BloomNHash.hook( l.storage );
			l.storage.getRoot().then( (root)=> {
				l.rootDir = root;
	                	root.open( "dbConfig.jsox" ).then( file=>{
	                                l.configFile = file;
        		        	file.read().then( (filebuf)=>{
						if( !filebuf ) {
							console.log( "open always works?" );
	                       	        		file.write( l.config );
						} else{
	        	        			Object.assign( l.config, filebuf );
                        		                //console.log( "ASDF?", this );
        				                console.log( "Config:", filebuf );
		                			onLoadConfig();
						}
					} );
                                } ).catch( (err)=>{
		                	root.create( "dbConfig.jsox" ).then( file=>{
		                                l.configFile = file;
						console.log( "open always works?" );
	                       	        	file.write( l.config );
					} );
					console.log( "Fatal.", err );
        			} );
			});
			l.storageSetupResolve();
		}
	}
	connect(ws) {

		const id = ws.url.split("~");
		let pawn = null;		
		if( id.length === 2 ) {
            //console.log( "Attempting to reload pawn?", id );
			const connectPawn = pawn_=>{
				//console.log( "Reloaded pawn:", pawn_ );
				if( !pawn_ ) {
					pawn = createPawn(db)
				} else {
					pawn = pawn_;
				}
				finishConnect( db, pawn );
			};
			l.storage.get( id[1] ).then( connectPawn ).catch(err=>{				
				console.log( "Error getting object:", err );              		
				pawn = createPawn(db);
			} );
		} else {
            console.log( "No connection identifier..." );
			pawn = createPawn(db)
		}

		function createPawn(db) {
			const pawn = new Pawn();
			// reinit.
            pawn.store().then( id=>{
				pawn.id = id
				console.log( "Got the ID, can now write the id...",id );
				pawn.store();  // write again... 
				finishConnect( db,pawn );
				pawn.send( { op:"init", code:code, name:pawn.name, id:pawn.id } );
			} );
			return pawn;
		}
		function finishConnect(db,p) {
			p.connect(ws);
			pawns.set( p.id, p );
			ws.on("message", db.handleMessage.bind(db, p ) );
			ws.on("close", db.handleClose.bind(db ) );
		}
	}
	userDbConnect( ws ) {
		ws.on( "expect", db.addExpectation );		
	}
	onObject( msg ) {
		db.reading.handleMessage( msg );
	}
	handleMessage(pawn,msg_){
		this.reading = pawn;
		// the callback doesn't have a dynamic parameter, so set the state above
		// (hooray for single threading)
		this.JSOXStream.write( msg_ );
	}
	handleClose(code,reason){
		console.log( "Got a closed connection:", code, reason );
		console.log( "often we re-connect, but we'll have to re-request a token from login...");
	}	
	addExpectation( info ) {
		const nextID = sack.Id();
		console.log( "Expect received?", info );
		l.expectations.set( nextID, info );
		return nextID;

	}	
}

const db = new Db();
export {db} ;

