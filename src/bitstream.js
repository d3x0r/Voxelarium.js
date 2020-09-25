

var bit_masks = [];
for( var mask = 0, n = 0; n <= 32; n++ )
{
    bit_masks[n] = mask;
    mask = ( mask << 1 ) | 1;
}


Voxelarium.BitStream = function( base_buffer )
{
    var stream =
	{
		storage : base_buffer || new ArrayBuffer(512 /*available*/),
		available : ( base_buffer && base_buffer.byteLength ) || 512,
        used : 0,
		used_bits : 0,

		getBytes : function(  ) {
			return { data : stream.storage, bytes_used : stream.used + 1 };
		},

		expand : function()
		{
			var new_size = stream.available * 2;
			var new_storage = new ArrayBuffer(new_size);
            for( var n = 0; n < stream.available; n++ )
                new_storage[n] = stream.storage[n];
			stream.storage = new_storage;
			stream.available = new_size;

		},

		seek : function( position )
		{
			if( (position >> 3) >= stream.available )
				throw new Error( "attempt to seek beyond end of data" );

			stream.used = position >> 3;
			stream.used_bits = position & 0x7;
		},

		write : function( value, bits )
		{
			if( bits > 64 )
				throw new Error( "Attempt to write more bits than data passed" );
			var tmp;
			if( stream.used == stream.available ) Expand();
			tmp = stream.storage[stream.used] || 0;
			tmp |= (value << stream.used_bits)&0xFF;
			stream.storage[stream.used] = tmp;
			var bit_counter = 8 - stream.used_bits;
			stream.used_bits += bits;
			while( stream.used_bits >= 8 )
			{
				stream.used_bits -= 8;
				stream.used++;
				if( stream.used == stream.available ) stream.expand();
				if( stream.used_bits > 0 )
				{
					tmp = 0;
					stream.storage[stream.used] = ( value >> ( bit_counter ) ) & 0xFF;
				}
			}
		},


		read : function( bits )
		{
			if( bits > 64 )
				throw new error( "Attempt to read more bits than data passed" );
			var tmp;
			//if( stream.used == stream.available )
			//	throw new Error( "No more data" );
			tmp = stream.storage[stream.used];
			var result = ( tmp >> stream.used_bits );
			var bit_counter = 8 - stream.used_bits;
			stream.used_bits += bits;
			while( stream.used_bits >= 8 )
			{
				stream.used_bits -= 8;
				stream.used++;
				if( stream.used_bits > 0 )
				{
					tmp = stream.storage[stream.used];
					result |= ( tmp << ( bit_counter ) ) & 0xFF;
					stream.bit_counter += 8;
				}
			}
			result &= bit_masks[bits];
            return result;
		}
	}
    return stream;
}



Voxelarium.BitStream.GetMinBitsNeededForValue = function( value )
{
    var n;
   for( n = 1; n <= 32; n++ ) {
       if( ( ( value & bit_masks[n] ) ^ value ) == 0 )
            break;
   }
   return n;
}
