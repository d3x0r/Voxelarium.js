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

const app = uExpress();

app.get( "/config.jsox", (req,res)=>{
console.log( "express hook?", req.url ,res);
	const headers = {
		'Content-Type': "text/javascript",
	}
	res.writeHead( 200, headers );

	const resultContent = "import {JSOX} from '/node_modules/jsox/lib/jsox.mjs';export const config = JSOX.parse( '" + JSOX.stringify(config) + "')";
	res.end( resultContent );

} ) 

const myPort = Number(process.env.PORT) || config.serve.port ||5000;
//const AsyncFunction = Object.getPrototypeOf( async function() {} ).constructor;


import {UserDbRemote} from "@d3x0r/user-database/serviceLogin"
import * as blah from "@d3x0r/user-database/service"; // host service locally
console.log( "BLAH:", blah );
import {loginAccept,loginConnect,loginRequest} from "@d3x0r/user-database/service"; // host service locally

process.env.LOGIN_PORT = config.login.port;
const udb =  await import( "@d3x0r/user-database" );

//console.log( "Got UDB:", udb );
//const dbx = await import( "@d3x0r/user-database/service" ); // start service locally
//console.log( 'dbx =', dbx );

//udb.go.then( ()=>{

	UserDbRemote.open( {
		configPath : nearPath + '/../',
		server:"ws://localhost:"+config.login.port,
		port : myPort,
		connect(ws) {
			console.log( "Voxelarium service registry....connected to login service" );
			db.userDbConnect(ws);
		}
	})

//} );
//		udb.server
		


let serverOpts;
const server = openServer(  serverOpts = { //npmPath:"../"
		//, resourcePath:".."
		port: myPort
		 }, accept, connect );

//console.log( "is there a handler yet?", udb.UserDb.socketHandleRequest);
server.addHandler( loginRequest );
server.addHandler( app.handle );
server.addHandler( udb.UserDb.socketHandleRequest );
console.log( "voxelarium serving on " + serverOpts.port );
db.init( );

function accept( ws ) {
	const protocol = ws.headers['Sec-WebSocket-Protocol'];
	console.log( "Connection received with : ", protocol );
	if( loginAccept.call( this, ws ) ){
		// handled by login services.
		console.log( "login Accept took this." );
		return;
	}
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
	if( loginConnect.call( this, ws ) ){
		// handled by login services.
		console.log( "login Connect took this." );
		return;
	}
	db.connect( ws );
};
