

//FastBit_Array_32k
import {Voxelarium} from "./Voxelarium.core.js"


Voxelarium.PackedBoolArray = function ( size ){
    if( !size )
        size = 32*32*32;
    var pba = {
        _bits : new ArrayBuffer( Math.floor( ( size + 31 ) /32 ) * 4 ),
        bits : null,
        get : function( bit ) { return ( this.bits[bit>>5] & 1 << ( bit & 0x1f ) ) !== 0; },
        set : function( bit ) { this.bits[bit>>5] |= 1 << ( bit & 0x1f ); },
        clear : function( bit ) { this.bits[bit>>5] &= ~(1 << ( bit & 0x1f )) },
        clearAll : function() { for( var n = 0; n < bits.length; n++) bits[n] = 0; }
    };
    pba.bits = new Uint32Array( pba._bits );
    return pba;

}
