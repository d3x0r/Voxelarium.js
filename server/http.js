var path = require('path');
var http = require('http');
var fs = require('fs');

var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 24680;
var ip = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var Gun = require('gun');
var gun = Gun({
	file: 'data.json',
	s3: {
		key: '', // AWS Access Key
		secret: '', // AWS Secret Token
		bucket: '' // The bucket you want to save into
	}
});

var server = http.createServer(function(req, res){
	//console.log( req );
      //  console.log( req.url );

	if(gun.wsp.server(req, res)){
        	console.log( "websock request?" );
		return; // filters gun requests!
	}
        var url = req.url;

				// NTS HACK! SHOULD BE ITS OWN ISOLATED MODULE! //
//	var reply = {headers: {'Content-Type': tran.json, rid: req.headers.id, id: gun.wsp.msg()}};
	//	//		if(req && req.url && req.url.pathname && req.url.pathname.indexOf('gun.nts') >= 0){
	//				return cb({headers: reply.headers, body: {time: Gun.time.is() }});
	//			}
				// NTS END! SHOULD HAVE BEEN ITS OWN MODULE //
				// ALL HACK! SHOULD BE ITS OWN MODULE OR CORE? //
        //if( url.startsWith( "/three.js" ) )
        //	url = ".." + url;
        //console.log( url );

	var stream = fs.createReadStream(path.join(__dirname+"/..", url))
	stream.on('error',function(){ // static files!
	        console.log( "Failed so...?" );
		if( url === "/" ) {
			res.end(fs.readFileSync(path.join(__dirname+"/..", 'index.html'))); // or default to index
		}
		else {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end();
		}
	});

	if( url.endsWith( ".js" ) ) {
    //console.log( "it's app/javascript... do ppipe..." );
		res.writeHead(200, {'Content-Type': 'application/javascript'});
	} else if( url.endsWith( ".css" ) )
		res.writeHead(200, {'Content-Type': 'text/css'});
	else if( url.endsWith( ".png" ) ){
		stream.on( 'data', function( img) {
			//console.log( "Send back iamge", img)
			//var img = stream.read()
			//console.log( "read is", img );
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.write( "data:image/png;base64," );
			res.end( new Buffer(img).toString('base64') );
			//res.end();
		})
		return;
	}
	else
		res.writeHead(200, {'Content-Type': 'text/html'});

	stream.pipe(res); // stream
});
gun.wsp(server);
server.listen(port, ip);

console.log('Server started on port ' + port + ' with /gun');
