
import {SectorCache} from "./Sector.mjs"

const l= {
	inited :false,
}

function init(storage) {
	storage.addEncoders( [ { tag:"wld", p:null, f:encodeWorld } ] );
	storage.addDecoders( [ { tag:"wld", p:null, f:decodeWorld } ] );
}

function encodeWorld( stringifier ) {
	this.encode(stringifier );
}

function decodeWorld( a ) {	
}

class World {
	sectors = new SectorCache();
	
	constructor()
	{

	}
	encode(s) {
		return `wld` + stringifier.stringify( {sectorIndex:this.sectors} );
	}
}

World.init = init;

export {World}