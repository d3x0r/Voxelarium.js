//const onMsg_ = this.on
console.log( "Extending socket." );
const send_ = this.send.bind(this);

this.setName = function( name ) {
	this.send( {op:'setName',name:name } );
}

this.handleMessage = function( msg ) {
	if( msg.op === "world" ) {
		if( msg.id ) l.world.rej(msg.id );
		else l.world.res( msg.world )
	}else if( msg.op === "sector" ) {

	}
}

this.loadWorld = function(id ) {
	const e = {p:null,res:null,rej:null}
	const p = new Promise( (res,rej) =>{
		e.res = res; e.rej = rej;
	})
	e.p = p;
	l.world = e;
	this.send( {op:"loadWorld", id:id})

}

this.send = (msg)=>{
	if( "string" === typeof msg ) 
		send_(msg);
    else 
        send_( JSON.stringify( msg ) )
};

const l = {
	data : null,
	world : null
};
