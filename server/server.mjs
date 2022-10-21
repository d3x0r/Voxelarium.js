// mostly just a copy of sack.vfs/tests/testWsHttp.js

import {sack} from "sack.vfs"
import config from "../config.jsox"
import path from "path";

import {db} from "./db.mjs"
import {openServer} from "sack.vfs/apps/http-ws";
console.log( "ya?", openServer );
const AsyncFunction = Object.getPrototypeOf( async function() {} ).constructor;

const loginServiceSource = sack.HTTP.get( {method:"GET",hostname:config.login.host, port:config.login.port, path:config.login.script } );
const serviceLoginInit = !loginServiceSource.error && new AsyncFunction( "Import", loginServiceSource.content );
console.log( "code:", loginServiceSource );
let loginService = serviceLoginInit && serviceLoginInit.call( this, (i)=>import(i) );

if( !loginService ) {
	process.env.LOGIN_PORT = config.login.port;
	 const udb = await import( "@d3x0r/user-database/service" );
	console.log( "Got?", udb );
//		udb.server
}
else

loginService.then( (loginService)=>{
	loginService.open( "org.d3x0r.games", "Voxelarium", {
		expect(client) { // callback on-expect
                },

        } );

	console.log( "Login imported and initialized", loginService );
} );

//import {UserDb} from "http://localhost:8089/serviceLogin.js";


let serverOpts;
const server = openServer(  serverOpts = { //npmPath:"../"
		//, resourcePath:".."
		port: Number(process.env.PORT) || Number(process.argv[2])||8080 }
		, accept, connect );
const disk = sack.Volume();
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
