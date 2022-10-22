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

import {UserDbRemote} from "@d3x0r/user-database/serviceLogin"

//const AsyncFunction = Object.getPrototypeOf( async function() {} ).constructor;


process.env.LOGIN_PORT = config.login.port;
const udb =  await import( "@d3x0r/user-database" );

//console.log( "Got UDB:", udb );
const dbx = await import( "@d3x0r/user-database/service" ); // start service locally
//console.log( 'dbx =', dbx );

udb.go.then( ()=>{
	UserDbRemote.open( {
		configPath : nearPath + '/../',
		server:"ws://localhost:"+config.login.port,
		connect(ws) {
			console.log( "Voxelarium service registry....connected to login service" );
			db.userDbConnect(ws);
		}
	})
	server.addHandler( udb.UserDb.socketHandleRequest );
} );
//		udb.server
		


let serverOpts;
const server = openServer(  serverOpts = { //npmPath:"../"
		//, resourcePath:".."
		port: Number(process.env.PORT) || Number(process.argv[2])||8080 }
		, accept, connect );

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
	db.connect( ws );
};
