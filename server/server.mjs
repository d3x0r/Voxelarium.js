// mostly just a copy of sack.vfs/tests/testWsHttp.js

const colons = import.meta.url.split(':');
const where = colons.length===2?colons[1].substr(1):colons[2];
const nearIdx = where.lastIndexOf( "/" );
const nearPath = where.substr(0, nearIdx );

import {sack} from "sack.vfs"
import config from "../config.jsox"
import path from "path";

import {db} from "./db.mjs"
import {openServer} from "sack.vfs/apps/http-ws";
import {uExpress} from "sack.vfs/apps/http-ws/uexpress";
import {enableLogin,getUser} from "@d3x0r/user-database-remote/enableLogin";

const app = uExpress();

const myPort = Number(process.env.PORT) || config.serve.port ||5000;
//const AsyncFunction = Object.getPrototypeOf( async function() {} ).constructor;


import {UserDbRemote} from "@d3x0r/user-database-remote"

//import * as blah from "@d3x0r/user-database/service"; // host service locally
//console.log( "BLAH:", blah );
//import {loginAccept,loginConnect,loginRequest} from "@d3x0r/user-database/service"; // host service locally

process.env.LOGIN_PORT = config.login.port;
//const udb =  await import( "@d3x0r/user-database" );

//console.log( "Got UDB:", udb );
//const dbx = await import( "@d3x0r/user-database/service" ); // start service locally
//console.log( 'dbx =', dbx );

if(0)
	UserDbRemote.open( {
		configPath : nearPath + '/../',
		connect(ws) {
			console.log( "Voxelarium service registry....connected to login service" );
			db.userDbConnect(ws);
		}
	})



let serverOpts;
const server = openServer(  serverOpts = { //npmPath:"../"
		//, resourcePath:".."
		configPath : nearPath + '/../',
		commonPath : "common/",
		port: myPort
		 }, accept, connect );

enableLogin( server, app, (msg)=>{
	console.log( "expect callback..." );
	const id = sack.Id();
	const user = msg;
	console.log( "Told to expect a user: does this result with my own unique ID?", msg, id );
//	connections.set( id, user );
	
	// lookup my own user ? Prepare with right object?
	// connections.set( msg.something, msg ) ;	
	return id;

} );

//console.log( "is there a handler yet?", udb.UserDb.socketHandleRequest);
//server.addHandler( loginRequest );
server.addHandler( app.handle );

//server.addHandler( udb.UserDb.socketHandleRequest );
console.log( "voxelarium serving on " + serverOpts.port );
db.init( );

function accept( ws ) {
	const protocol = ws.headers['Sec-WebSocket-Protocol'];
	console.log( "Connection received with : ", protocol );
	if( protocol === "VOXDB" ) {
		this.accept();
	} else {
		this.reject();
   }
	return;
};

function connect( ws ) {
	//const protocol = ws.headers['Sec-WebSocket-Protocol'];
	console.log( "route connect..." );
	db.connect( ws );
};
