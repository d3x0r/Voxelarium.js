
import {sack} from "sack.vfs";
import {BloomNHash} from  "./common/bloomNHash.mjs" ;

import {World} from "./World.mjs";
import {Inventory} from "./Inventory.mjs"

const l = {
	storage : null,
	rootDir : null,
	configFile : null,
        waiters : [],
	dbs : [],
	config : {
       		userIndex : null, // reference of the index root
       	},
        saveConfig() {
        	return l.configFile.write( l.config );
        }
}
//console.log( "sack:", sack );
const JSOX = sack.JSOX

const code = sack.Volume.readAsString( "server/remoteMethods.js" );

const pawns = new Map();

//JSOX.

class Pawn {
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
	handleMessage( msg ) {	
		if( msg.op === "init" ) {
			const pawn = this;
			console.log( "Load this client's state?", this );
			if( this.id ) 
				l.storage.get( this.id ).then( (pawn)=>{
					//const pawn = new Pawn(ws );
					this.send( { op:"init", code:code, id:this.id } );
				} ).catch( initPawn );
			else initPawn();
			function initPawn(){
				console.log( "User object doesn't exist yet? ");
                                //const newPawn = 
				l.storage.put( pawn, {id:pawn.id} ).then((id)=>{
					console.log( "cannot write ID?", id );
				} );
				pawn.send( { op:"init", code:code, id:pawn.id } );
			}
		} else if( msg.op === "asdf" ) {
		} else {
		}
	}
	encode(s){
		return `pwn{name:${s.stringify(this.name)}
				,world:${s.stringify(this.world_id)}
				,pos:{x:${this.x},y:${this.y},z:${this.z}},rot:{x:${this.X},y:${this.Y},z:${this.Z}}}`;
	}
}

function pawnEncode(stringifer){
	return this.encode(stringifer);
}


function pawnDecode() {
	const a = this;
	const p = new Pawn();
        if( !a ) {
        	console.log("Decode pawn null?" );
                return p;
        }
	p.name = a.name;
        
	p.x = a.x;
	p.y = a.y;
	p.z = a.z;
	p.X = a.X;
	p.Y = a.Y;
	p.Z = a.Z;
	p.world_id = a.world;
	if( p.world_id )
		l.storage.get( p.world_id ).then( world=>{	
			p.world = world;
			
		} ).catch( ()=>{
			console.log( "Error, world no longer exists?" );
			
		} );
        return p;
}

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
			l.storage.addEncoders( [ { tag:"pwn", p:Pawn, f:pawnEncode } ] );
			l.storage.addDecoders( [ { tag:"pwn", p:Pawn, f:pawnDecode } ] );
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
					console.log( "Fatal.", err );
        			} );
			});
		}
	}
	connect(ws) {

		const id = ws.url.split("~");
		let pawn = null;		
		if( id.length === 2 ) {
			l.storage.get( id[1] ).then( pawn_=>{
				console.log( "Reloaded pawn:", pawn_ );
				if( !pawn_ ) {
					pawn = createPawn(db)
				} else {
					pawn = pawn_;
				}
				finishConnect( db, pawn );
			} ).catch(err=>{
				console.log( "Error getting object:", err );
			} );
		} else {
			pawn = createPawn(db)
		}

		function createPawn(db) {
			const pawn = new Pawn();
			l.storage.put( pawn ).then( id=>{
				pawn.id = id
				finishConnect( db,pawn );
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
	onObject( msg ) {
		const pawn = db.reading;
		if( msg.op === "init" ){
			console.log( "Remote wants to do something" );
			pawn.handleMessage( msg );
		} else {
			console.log( "Received unhandled:", msg );
		}
	}
	handleMessage(pawn,msg_){
		this.reading = pawn;
		this.JSOXStream.write( msg_ );
		
	}
	handleClose(code,reason){
		
	}	
	
}

const db = new Db();

export {db} ;



/*

const l = {
	rootDir : null,
        configFile : null,
	userIndex : null,
        waiters : [],
	config : {
       		userIndex : null
       	},
        saveConfig() {
        	return l.configFile.write( l.config );
        }
};

function wait(cb)
	{
	//console.log( "wait...", l.userIndex );
        if( !l.userIndex ) 
        	return new Promise( (res,rej)=>{
                	l.waiters.push( {cb:cb,res:res,rej:rej} ) 
                } );
        return cb();
}                                                   

class userDb {
	constructor() {
		
	}
	getUser( id ) {
        	return wait( ()=>l.userIndex.get( id ) );
	}
	addUser( id, user ) {
		return wait( ()=>l.userIndex.set( id, user ) );
	}
}
function loadUserIndex(id) {
	if( id )
		store.get(id).then( (hash)=>{
			l.userIndex = hash;
                        //console.log( "HASH:", hash );
                        for( let waiter of l.waiters )
                        	waiter.res( waiter.cb() );
		} ).catch(err=>{
			console.log( "Failed to reload index?" );;
		} );
	else {
		const hash = new bloom();
		//console.log( "HASH", id );
		hash.store().then( (id)=>{
			l.config.userIndex = id;
                        for( let waiter of l.waiters )
                        	waiter.res( waiter.cb() );
			l.saveConfig();
			return id;
		} );                                       
	}
}

*/


function loadConfig() {
	console.log( "LOAD CONFIG" );
	if( !l.config.userIndex ) {
        	//l.userIndex = bloom();
                console.log( "NEW HASH" );
		/*
		store.put( l.config.userIndex ).then( (id)=>{
			 l.config.userIndex = id;
                         l.saveConfig();
	                for( let waiter of l.waiters )
                        	waiter.res( waiter.cb() );
		} );
	        */
        }else {
        	console.log( "Reload index?" );
		/*
		store.get( l.config.userIndex ).then( (obj)=>{
			l.userIndex = obj;
                        console.log( "Got index; doing waiters.", obj,l.waiters );
                        for( let waiter of l.waiters )
                        	waiter.res( waiter.cb() );
		} );
		*/
	}
	
}

