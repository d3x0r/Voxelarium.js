// mostly just a copy of sack.vfs/tests/testWsHttp.js

import {sack} from "sack.vfs"
import path from "path";

import {db} from "./db.mjs"

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

server.onrequest( function( req, res ) {

	var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
		 req.connection.remoteAddress ||
		 req.socket.remoteAddress ||
		 req.connection.socket.remoteAddress;
	//ws.clientAddress = ip;

	pending.push( req.url );
        
	//console.log( "Received request:", req.url );
	if( req.url === "/" ) req.url = "/index.html";
	var filePath = "." + unescape(req.url);
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	//console.log( ":", extname, filePath )
	switch (extname) {
		  case '.js':
		  case '.mjs':
			  contentType = 'text/javascript';
			  break;
		  case '.css':
			  contentType = 'text/css';
			  break;
		  case '.json':
			  contentType = 'application/json';
			  break;
		  case '.png':
			  contentType = 'image/png';
			  break;
		  case '.jpg':
			  contentType = 'image/jpg';
			  break;
		  case '.wav':
			  contentType = 'audio/wav';
			  break;
                case '.crt':
                        contentType = 'application/x-x509-ca-cert';
                        break;
                case '.pem':
                        contentType = 'application/x-pem-file';
                        break;
                  case '.wasm': case '.asm':
                  	contentType = 'application/wasm';
                        break;
	}
	if( disk.exists( filePath ) ) {
		res.writeHead(200, { 'Content-Type': contentType });
		//console.log( "Read:", "." + req.url );
		res.end( disk.read( filePath ) );
	} else {
		console.log( "Failed request: ", req.url );
		res.writeHead( 404 );
		res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
	}
} );

server.onaccept( function ( ws ) {
	const protocol = ws.headers['Sec-WebSocket-Protocol'];
	console.log( "Connection received with : ", protocol );
	if( protocol === "VOXDB" ) {
		this.accept();
	} else
		this.reject();
	return;
} );

server.onconnect( function (ws) {
	//const protocol = ws.headers['Sec-WebSocket-Protocol'];
	db.connect( ws );
} );
