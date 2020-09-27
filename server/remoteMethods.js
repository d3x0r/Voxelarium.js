
console.log( "Extending socket." );
const send_ = this.send.bind(this);

this.setName = function( name ) {
	this.send( {op:'setName',name:name } );
}

this.send = (msg)=>{
	if( "string" === typeof msg ) 
		send_(msg);
        else 
        	send_( JSON.stringify( msg ) )
};

const l = {
	data : null
};
