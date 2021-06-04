// mostly just a copy of sack.vfs/tests/testWsHttp.js

import {sack} from "sack.vfs"
import path from "path";

import {db} from "./db.mjs"

const AsyncFunction = Object.getPrototypeOf( async function() {} ).constructor;

const loginServiceSource = sack.HTTP.get( {method:"GET",hostname:"localhost", port:8089, path:"/serviceLogin.mjs" } );
const serviceLoginInit = new AsyncFunction( "Import", loginServiceSource.content );
const loginService = serviceLoginInit.call( this, (i)=>import(i) );

loginService.then( (loginService)=>{
	loginService.open( "org.d3x0r.games", "Voxelarium", {
		expect(client) { // callback on-expect
                },

        } );

	console.log( "Login imported and initialized", loginService );
} );

//import {UserDb} from "http://localhost:8089/serviceLogin.js";


var serverOpts;
var server = sack.WebSocket.Server( serverOpts = { port: Number(process.argv[2])||8080 } )
var disk = sack.Volume();
console.log( "serving on " + serverOpts.port );

db.init( );

const pending = [];
let busy = 0;
function tickPendingMsg() {
	if( pending.length ) {
        	if( busy != pending.length ) {
                	busy = pending.length
                } else {
	        	const msg = pending.join( ", " );
        	        console.log( "Requests: ", msg );
        		pending.length = 0;
                }
        }
        setTimeout( tickPendingMsg, 500 );
}
tickPendingMsg();



const mimeTypes = {
	'.js'  :'text/javascript',
	'.mjs' :'text/javascript',
	'.css' :'text/css',
	'.json':'application/json',
	'.png' :'image/png',
	'.jpg' :'image/jpg',
	'.wav' :'audio/wav',
	'.crt' :'application/x-x509-ca-cert',
	'.pem' :'application/x-pem-file',
	'.wasm':'application/wasm',
	'.asm' :'application/wasm',
};



server.onrequest( function( req, res ) {
	/*
	const ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
		 req.connection.remoteAddress ||
		 req.socket.remoteAddress ||
		 req.connection.socket.remoteAddress;
	*/
	//ws.clientAddress = ip;

	pending.push( req.url );

        const parts = unescape(req.url).split('/');
        if( parts.length == 2 ) {
        }else if( parts.length > 2 ) {
            if( parts[1] === 'node_modules' ) {
                switch( parts[2] ) {
                case "@d3x0r":
                case "jsox":
                	break;
		default:
			res.writeHead( 404 );
			res.end( "<HTML><HEAD><title>404</title></HEAD><BODY>404</BODY></HTML>");
                        return;
                }
            }
        }
        if( parts[parts.length-1] == "" ) {
            parts[parts.length-1] = 'index.html';
        }
	//console.log( "Received request:", req.url );
	//if( req.url === "/" ) req.url = "/index.html";
	
	const filePath = "." + parts.join('/');
	const extname = path.extname(filePath);
	var contentType = 'text/html';
	//console.log( ":", extname, filePath )
        if( extname in mimeTypes )
            contentType = mimeTypes[extname];

	if( disk.exists( filePath ) ) {
		res.writeHead(200, { 'Content-Type': contentType });
		//console.log( "Read:", "." + req.url );
		res.end( disk.read( filePath ) );
	} else {
		console.log( "Failed request: ", req.url );
		res.writeHead( 404 );
		res.end( "<HTML><HEAD><title>404</title></HEAD><BODY>404</BODY></HTML>");
	}
} );

server.onaccept( function ( ws ) {
	const protocol = ws.headers['Sec-WebSocket-Protocol'];
	console.log( "Connection received with : ", protocol );
	if( protocol === "VOXDB" ) {
		this.accept();
	} else {
		this.reject();
        }
	return;
} );

server.onconnect( function (ws) {
	//const protocol = ws.headers['Sec-WebSocket-Protocol'];
	db.connect( ws );
} );
