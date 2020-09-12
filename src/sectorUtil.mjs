import {BitStream} from "../src/bitstream.mjs"

function stringifySector( s ) {
			var v = v|| VoxelCompressor();
			var data = v.CompressVoxelData( s.data.data );
			var n = 0;
			var string = "";
			//var sv = new StringView( data.data );
			//var testString = sv.toString();
			//var testString2 = '\u0008\u0000\u0000\u0001\u0002\u0033\u00ef'
			for( n = 0; n < data.bytes_used; n++ ) {
				var val = data.data[n];
				if( !val )
					string += "\\0";
				else {
					var out = String.fromCodePoint( val );
					if( out === "\\" )
						string += "\\/";
					else if( out === "/" )
						string += "\\|";
					else
						string += out;
				}
			}

			var array = new ArrayBuffer(string.length);
			var escape = false;
			var out = 0;
			for( n = 0; n < string.length; n++ )
				{ var val = string.codePointAt( n );
					if( escape ) {
						if( val === 48 )
							val = 0;
						escape = false;
					}else {
						if( val == 92 ) {
							escape = true;
							continue;
						}
					}
					array[out++] = val;
					//console.log( val )
				 };
				 //console.log( "Buffer was", data.data );
				 //console.log( "which became", string );

				 {
					 var test_out = [];
					 console.log( "decoding string just encoded to see if it's valid;if failed, debugger; will trigger")
                                         var a = JSON.stringify(string);
					 var xfer = JSON.parse( a );
					 if( xfer !== string )
					 	debugger;
					 decodeString( string, test_out );
					 if( test_out.length === data.data.length ) {
						 for( var n = 0; n < test_out.length; n++ ) {
							 if( test_out[n] !== data.data[n] )
							 	debugger;

						 }
					 }
				 }
			 s.cachedString = string;
			return string;
		}

function       	decode  ( string ) {
			console.log( "decode", string );
			if( string === s.cachedString )
				return; // already have this as the thing.
			s.cachedString = string;
			decodeString( string, s.data.data )
			s.Flag_Render_Dirty = true;
			s.cluster.mesher.SectorUpdateFaceCulling( this, true )
			//basicMesher.SectorUpdateFaceCulling_Partial( cluster, sector, Voxelarium.FACEDRAW_Operations.ALL, true )
			s.cluster.mesher.MakeSectorRenderingData( this );

			}



    }

function decodeString( string, into ){
	var bytes = 0;
			for( var n = 0; n < string.length; n++ ){
				if( string[n] === '\\' ) {
					continue;
				} else bytes++;
			}

			var buffer = new ArrayBuffer(bytes);
			bytes = 0;
			for( var n = 0; n < string.length; n++ ){
				if( string[n] === '\\' ) {
					if( string[n+1] === '0' )
						buffer[bytes++] = 0;
					else if( string[n+1] === '/' )
						buffer[bytes++] = '\\';
					else if( string[n+1] === '|' )
						buffer[bytes++] = '/';
					else
						throw new Error( "Invalid encoding" );
					n++;
					continue;
				}
				else
					buffer[bytes++] = string.codePointAt( n );
			}


			var v = v|| VoxelCompressor();
			var data = v.DecompressVoxelData( buffer, into );

		}


    return newSector;
}



/// <summary>
/// Handles compressing and decompressing ushort array that is the sector content
/// </summary>
function WriteCubes ( stream, bits, count, index )
{
	// 1 count 2 bits = 3   vs 9
	// 1 count 3 bits = 4   vs 10
	// 1 count  4 bits  = 5     vs 11
	// 1 count  5 bits  = 6     vs 12
	// 1 count  6 bits  = 7     vs 13
	// 1 count  7 bits  = 8     vs 14

	// 2 count 2 bits = 6   vs 9
	// 2 count 3 bits = 8   vs 10
	// 2 count  4 bits  = 10    vs 11
	// 2 count  5 bits  = 12    vs 12
	// 2 count  6 bits  = 14    vs 13
	// 2 count  7 bits  = 16    vs 14

	// 3 count 2 bits = 9   vs 9
	// 3 count 3 bits = 12  vs 10
	// 3 count  4 bits  = 15    vs 11
	// 3 count  5 bits  = 18    vs 12
	// 3 count  6 bits  = 21    vs 13
	// 3 count  7 bits  = 24    vs 14


	if( ( (bits +1) * count ) <= ( 7 + bits ) )
	{
		for( var n = 0; n < count; n++ )
		{
			stream.write( 0, 1 );
			stream.write( index, bits );
		}
	}
	else
	{
		stream.write( 1, 1 );
		//Log.log( "Write count {0}", count );
		/*
		if( ( count & 0x8000 ) != 0 )
		{
			stream.Write( ( ( count >> 15 ) & 0x1F ) | 0x20, 7 );
			stream.Write( ( ( count >> 10 ) & 0x1F ) | 0x20, 7 );
			stream.Write( ( ( count >> 5 ) & 0x1F ) | 0x20, 7 );
			stream.Write( ( ( count  ) & 0x1F ), 7 );
		}
		else */
		count -= 2; // always at least 1, and then this value always starts at atleast 2; and very small delta sets can be 3, but typically 2.
		if( ( count & 0xFC00 ) != 0 )
		{
			stream.write( ( ( count >> 10 ) & 0x1F ) | 0x20, 6 );
			stream.write( ( ( count >> 5 ) & 0x1F ) | 0x20, 6 );
			stream.write( ( ( count ) & 0x1F ), 6 );
		}
		else if( ( count & 0xFFE0 ) != 0 )
		{
			stream.write( ( ( count >> 5 ) & 0x1F ) | 0x20, 6 );
			stream.write( ( ( count ) & 0x1F ) , 6 );
		}
		else
		{
			stream.write( ( ( count ) & 0x1F ), 6 );
		}
		//stream.Write( count, 16 );
		stream.write( index, bits );
	}

}

function CompressVoxelData( s, data )
{
	var stream = BitStream();
	var len = data.length;
	var n;
	var types = [];

	for( n = 0; n < len; n++ )
	{
		var vox = Voxelarium.Voxels.getIndex( data[n] )
		if( types.findIndex( (v) => v===vox ) < 0 )
			types.push( vox );
	}

	var bits = BitStream.GetMinBitsNeededForValue( types.length - 1 ); // 4 is 0,1,2,3; needs only 2 bits...
	//bits = (bits + 7 ) & 0xf8;
	stream.seek( 16 ); // seek bit count
	stream.write( bits, 8 );
	stream.write( types.length-1, bits );
	types.forEach( (type)=>{
		stream.write( type, 16 ); } );
	var prior_cube = 0xFFFF, cube;
	var index = 0;
	var count = 0;
	            for( n = 0; n < len; n++ )
	{
		var cube = Voxelarium.Voxels.getIndex( data[n] )
		if( prior_cube != cube )
		{
			if( count > 0 )
				WriteCubes( stream, bits, count, index );
			index = types.findIndex( (v)=>(v=== cube ) );
			prior_cube = cube;
			count = 1;
		}
		else
			count++;
	}
	WriteCubes( stream, bits, count, index );

	var result = stream.getBytes();
	result.data[0] = (( result.bytes_used ) & 0xFF);
	result.data[1] = ( ( result.bytes_used ) >> 8);
	// already compressed as can be.
	if( result.bytes_used < 20 )
		return result;

	/* can gzip the stream at this point too and save 10-20% more */
	/*
	MemoryStream final_stream = new MemoryStream();
	final_stream.Seek( 2, SeekOrigin.Begin );
	//DeflateStream gz_stream = new DeflateStream( final_stream, CompressionMode.Compress );
	//GZipStream gz_stream = new GZipStream( final_stream, CompressionMode.Compress );
	GZipStream gz_stream = new GZipStream( final_stream, CompressionLevel.Fastest );
	//for( n = 2; n < bytes_used; n++ )
	//	gz_stream.WriteByte( result[n] );
	gz_stream.Write( result, 2, bytes_used - 2 );
	gz_stream.Close();
	result = final_stream.ToArray();//.GetBuffer();
	Log.log( "Compressed another {0}%", (float)( 100.0f * (float)( bytes_used - result.Length ) / ( bytes_used - 2 ) ) );
	// store old length so we know how much to request decompressing.
	result[0] = (byte)( ( bytes_used ) & 0xFF );
	result[1] = (byte)( ( bytes_used ) >> 8 );
	bytes_used = result.Length;// (int)final_stream.Length;
	gz_stream.Dispose();
	*/
	return result;
}

function DecompressVoxelData(  data, result )
{
	var stream;
	var DataBytes;
	{
		stream = BitStream( data );
		stream.seek( 16 ); // seek by bit position
	}
	var types = [];

	var bits;
	var TypeCount;
	bits = stream.read( 8);
	TypeCount = stream.read( bits );
	TypeCount++; // always at least one.
	var n;
	for( n = 0; n < TypeCount; n++ )
	{
		var val;
		val = stream.read( 16 );
		var assertVal;
		assertVal = Voxelarium.Voxels.types[val];
		if( assertVal )
			types.push( assertVal );
		else
			types.push( Voxelarium.Voxels.Void );
	}

	var outpos = 0;
	do
	{
		var vox;
		var val;
		var count;
		val = stream.read( 1 );
		if( val == 0 )
		{
			val = stream.read( bits );
			vox = types[val];
			if( !vox ) debugger;
			result[outpos++] = vox;
		}
		else
		{
			var count_tmp;
			count_tmp = stream.read( 6  );
			count = count_tmp & 0x1F;
			if( ( count_tmp & 0x20 ) != 0 )
			{
				count <<= 5;
				count_tmp = stream.read( 6 );
				count |= count_tmp & 0x1F;
				if( ( count_tmp & 0x20 ) != 0 )
				{
					count <<= 5;
					count_tmp = stream.read( 6 );
					count |= count_tmp & 0x1F;
				}
			}
			count += 2;
			//stream.Read( 16, out count );
			//Log.log( "Read count {0}", count );
			val = stream.read( bits );
			vox = types[val];
			if( !vox ) {
				vox = types[0];
				debugger;
			}
			//console.log( "Set vox to ", vox )
			for( n = 0; n < count; n++ )
				result[outpos++] = vox;
		}
	} while( outpos < result.length );

}

export { DecompressVoxelData, CompressVoxelData }
