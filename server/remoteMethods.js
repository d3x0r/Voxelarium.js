
console.log( "Extending socket." );
const send_ = this.send.bind(this);
this.send = (msg)=>{
	//console.log( "hijacked send." );
	send_(msg);
};

const l = {
	data : null
};
