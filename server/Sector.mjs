
const cacheFullSize = 50;

class SectorCache {
	head =null;
	tail =null;
	count = 0;	
	add(s){
		// only node, no sorting...
		if( !this.head )  {	
			this.tail = this.head = { s:s, next:null, me:{o:cache,m:"head"} };
			
		} else {
			// cheap insert at head... look for this later.
			this.head = { s:s, next:this.head, me:{o:cache,m:"head"} };
			this.head.next.me = this.head;
			this.head.next.m = "next";
		}
		this.count++;
		if( this.count > cacheFullSize ) {
			const t = this.tail;
			this.tail = this.tail.me.o;
			this.drop( t );
		}
	}
	get(x,y,z) {
		let n = this.head
		for( ; n; n = n.next ) {
			if( n.s.x === x && n.s.y === y && n.s.z === z )
				break;
		}
		if( n )
			return n.s;
		return null;
	}
	drop(n) {
		n.me.o[n.me.m] = n.next;
		this.count--;
	}
}

class Sector{
	x=0;
	y=0;
	z=0;
	id=null;
	data = null;
	
	constructor(){
		
	}
	setPos(x,y,z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

Sector.load = function(x,y,z) {
}


export {SectorCache};
export {Sector};