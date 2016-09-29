"use strict";

require( "./packedboolarray.js")
require( "./modtracker.js")



Voxelarium.Sector = function( cluster, x, y, z ) {

	var newSector = {
        next : null,
		pred : null,

		GlobalList_Next : null,
		GlobalList_Pred : null,

		near_sectors : new Array(27), // can index with relativeOrds-1 (self is not in this array)

		handle_x : 0, handle_y:0, handle_z : 0, // used in Genesis templates; 'origin' of this sector
		pos : new THREE.Vector3( x, y, z ),

		// Version control : Added for handling better world evolution.
		ZoneType : 0,     // The type of the zone.
		ZoneVersion : 0,  // The version of the generator used for this zone.
		GeneratorVersion : 0, // Main generator version. Updated at world change.
		RingNum : 0,

		cluster : cluster,

		data : { data : new Array( cluster.sectorSize )
				, sleepState : Voxelarium.PackedBoolArray( cluster.sectorSize )
            	, otherInfos : []
							, FaceCulling : null
            	},
		ModifTracker : Voxelarium.ModificationTracker( cluster.sectorSize ),

        mesher : null,

		THREE_solid : null,
        solid_geometry : null,
		transparent_geometry: null,
		custom_geometry: null,
		cachedString : null,

		enableGeometry : function() {
			this.solid_geometry = Voxelarium.GeometryBuffer();
			this.transparent_geometry = Voxelarium.GeometryBuffer();
			//this.custom_geometry = Voxelarium.GeometryBuffer();
		},

		getOffset : function( x, y, z ) {
			return cluster.lookupTables.ofTableX[x+1] + cluster.lookupTables.ofTableY[y+1] + cluster.lookupTables.ofTableZ[z+1];

			var offset;
			offset = ( y % this.cluster.sectorSizeY )
				+ ( ( x % this.cluster.sectorSizeX ) * this.cluster.sectorSizeY )
				+ ( ( z % this.cluster.sectorSizeZ ) * ( this.cluster.sectorSizeY * this.cluster.sectorSizeX ) );
			return offset;
		},

		setCube : function( x, y, z, CubeValue ) {
			var offset = this.getOffset( x, y, z );
			this.data.data[offset] = CubeValue;

			if( CubeValue && CubeValue.extension )
				this.data.otherInfos[offset] = CubeValue.extension();
			else
				this.data.otherInfos[offset] = null;
			this.Flag_Render_Dirty = true;
		},

		getCube : function( x, y, z ) {
			var offset = getOffset( x, y, z );
			return ( newSector.data.data[Offset] );
		},

		MakeSector : function( type ) {
			var x, y, z;
			var Cnt;
			if( type ) Cnt = type;
			else if( this.Pos_y < 0 ) { Cnt = Voxelarium.Voxels.types[0]; this.Flag_Void_Regular = false; this.Flag_Void_Transparent = true; }
			else { Cnt = null; this.Flag_Void_Regular = true; this.Flag_Void_Transparent = true; }
			for( z = 0; z < this.cluster.sectorSizeX; z++ )
			{
				for( y = 0; y < this.cluster.sectorSizeY; y++ )
				{
					for( x = 0; x < this.cluster.sectorSizeZ; x++ )
					{
						newSector.setCube( x, y, z, Cnt );
					}
				}
			}
		},

		getVoxelRef : function(x,y,z) {
			if( x < 0 ) x += this.cluster.sectorSizeX;
			if( y < 0 ) y += this.cluster.sectorSizeY;
			if( z < 0 ) z += this.cluster.sectorSizeZ;
			 return makeVoxelRef( this.cluster, this, x, y, z ); },

		stringify : function() {
			var v = v|| VoxelCompressor();
			var data = v.CompressVoxelData( this.data.data );
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
					 decodeString( string, test_out );
					 if( test_out.length === data.data.length ) {
						 for( var n = 0; n < test_out.length; n++ ) {
							 if( test_out[n] !== data.data[n] )
							 	debugger;

						 }
					 }
				 }
			 this.cachedString = string;
			return string;
		},

		decode : function( string ) {
			console.log( "decode", string );
			if( string === this.cachedString )
				return; // already have this as the thing.
			this.cachedString = string;
			decodeString( string, this.data.data )
			this.Flag_Render_Dirty = true;
			this.cluster.mesher.SectorUpdateFaceCulling( this, true )
			//basicMesher.SectorUpdateFaceCulling_Partial( cluster, sector, Voxelarium.FACEDRAW_Operations.ALL, true )
			this.cluster.mesher.MakeSectorRenderingData( this );

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


function VoxelCompressor() {
		/*
						{
						VoxelDataCompressor vdc = new VoxelDataCompressor();
						ushort[] decompress = new ushort[32 * 32 * 32];
						byte[] data;
						int bytes;
						vdc.CompressVoxelData( Sector.Data.Data, out data, out bytes );
						Log.log( "compressed sector is {0}", bytes, 0 );
						vdc.DecompressVoxelData( data, decompress );
						{
							int n;
							for( n = 0; n < 32 * 32 * 32; n++ )
								if( decompress[n] != Sector.Data.Data[n] )
								{
									int a = 3;
								}
						}
					}

		*/

			/// <summary>
			/// Handles compressing and decompressing ushort array that is the sector content
			/// </summary>
	var vc = {

			WriteCubes : function( stream, bits, count, index )
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

			},

			CompressVoxelData : function( data )
			{
				var stream = Voxelarium.BitStream();
				var len = data.length;
				var n;
				var types = [];

				for( n = 0; n < len; n++ )
				{
					var vox = Voxelarium.Voxels.getIndex( data[n] )
					if( types.findIndex( (v) => v===vox ) < 0 )
						types.push( vox );
				}

				var bits = Voxelarium.BitStream.GetMinBitsNeededForValue( types.length - 1 ); // 4 is 0,1,2,3; needs only 2 bits...
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
							vc.WriteCubes( stream, bits, count, index );
						index = types.findIndex( (v)=>(v=== cube ) );
						prior_cube = cube;
						count = 1;
					}
					else
						count++;
				}
				vc.WriteCubes( stream, bits, count, index );

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
			},

			DecompressVoxelData : function(  data, result )
			{
				var stream;
				var DataBytes;
				{
					stream = Voxelarium.BitStream( data );
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

		}
	return vc;
}

function NearVoxelRef() {
	var result = {
	 sector:this,
	 voxelType:null,
	 offset:0,
	 voxelExtension:null
 	}
	result.voxelType = this.data.data[result.offset];
	result.voxelExtension = this.data.otherInfos[result.offset];
	 return result;
}

function VoxelRef( x, y, z ) {
}

var refPool = [];

Voxelarium.VoxelRef = makeVoxelRef


function makeVoxelRef( cluster, sector, x, y, z )
{
	var result;
	result = refPool.pop();
	if( !result ) {
		result = { sector : sector
				, offset : 0
				, x : x, y : y, z : z
			 	, wx : sector?(sector.pos.x * cluster.sectorSizeX + x):x
				, wy : sector?(sector.pos.y * cluster.sectorSizeY + y):y
				, wz : sector?(sector.pos.z * cluster.sectorSizeZ + z):z
				, voxelType : null
				, cluster : cluster
				, voxelExtension : null
				, forEach : forEach
				, delete : function() { refPool.push( this ); }
				, clone : function() { return this.sector.getVoxelRef( this.x, this.y, this.z ) }
				, getNearVoxel : GetVoxelRef
				 }
		Object.seal( result );
	}
	else {
		result.sector = sector;
		result.offset = 0;
		result.x = x;
		result.y = y;
		result.z = z;
		result.wx = sector?(sector.pos.x * cluster.sectorSizeX + x):x
		result.wy = sector?(sector.pos.y * cluster.sectorSizeY + y):y
		result.wz = sector?(sector.pos.z * cluster.sectorSizeZ + z):z
		result.voxelType = null;
		result.cluster = cluster;
		result.voxelExtension = null;
	}
    if( sector ) {
		// wx coords will still be accurate even if the sub-range and origin sector move now.
		if( result.x < 0 ) { result.x += cluster.sectorSizeX; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT] || result.sector ) }
		if( result.y < 0 ) { result.y += cluster.sectorSizeY; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW] || result.sector ) }
		if( result.z < 0 ) { result.z += cluster.sectorSizeZ; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD] || result.sector ) }
		if( result.x >= cluster.sectorSizeX ) { result.x -= cluster.sectorSizeX; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT] || result.sector ) }
		if( result.y >= cluster.sectorSizeY ) { result.y += cluster.sectorSizeY; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE] || result.sector ) }
		if( result.z >= cluster.sectorSizeZ ) { result.z += cluster.sectorSizeZ; result.sector = ( result.sector && result.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND] || result.sector ) }

		result.offset = ( result.x * cluster.sectorSizeY )  + result.y + ( result.z * ( cluster.sectorSizeY * cluster.sectorSizeX ) );
		  result.voxelType = sector.data.data[result.offset]
		  if( !result.voxelType )
		  	return null;
		  result.voxelExtension = sector.data.otherInfos[result.offset];
    }
	return result;
}

	function forEach( voxelRef2, not_zero, callback )
	{
		var voxelRef1 = this;
		//if( voxelRef1.sector == null || voxelRef2.sector == null )
		//	return not_zero ? 1 : 0;
		if( voxelRef1.cluster !== voxelRef2.cluster )
			return not_zero ? 1 : 0;
		var cluster = voxelRef1.cluster;

		var v1x = voxelRef1.wx;
		var v1y = voxelRef1.wy;
		var v1z = voxelRef1.wz;
		var v2x = voxelRef2.wx;
		var v2y = voxelRef2.wy;
		var v2z = voxelRef2.wz;
		var del_x = v2x - v1x;
		var del_y = v2y - v1y;
		var del_z = v2z - v1z;
		var abs_x = del_x < 0 ? -del_x : del_x;
		var abs_y = del_y < 0 ? -del_y : del_y;
		var abs_z = del_z < 0 ? -del_z : del_z;
		// cannot use iterate if either end is undefined.
		if( del_x != 0 )
		{
			if( del_y != 0 )
			{
				if( del_z != 0 )
				{
					if( abs_x > abs_y || ( abs_z > abs_y ) )
					{
						if( abs_z > abs_x )
						{
							// z is longest path
							var erry = -abs_z / 2;
							var errx = -abs_z / 2;
							var incy = del_y < 0 ? -1 : 1;
							var incx = del_x < 0 ? -1 : 1;
							var incz = del_z < 0 ? -1 : 1;
							{
								var x = v1x;
								var y = v1y;
								for( var z = v1z + incz; z != v2z; z += incz )
								{
									errx += abs_x;
									if( errx > 0 )
									{
										errx -= abs_z;
										x += incx;
									}
									erry += abs_y;
									if( erry > 0 )
									{
										erry -= abs_z;
										y += incy;
									}
									{
										let v = cluster.getVoxelRef( false, x, y, z );
										if( v ) {
											let val = callback( v );
											if( val !== v ) v.delete();
											if( ( !not_zero && val ) || ( not_zero && !val ) )
												return val;
										}
									}
								}
							}
						}
						else
						{
							// x is longest.
							var erry = -abs_x / 2;
							var errz = -abs_x / 2;
							var incy = del_y < 0 ? -1 : 1;
							var incx = del_x < 0 ? -1 : 1;
							var incz = del_z < 0 ? -1 : 1;
							{
								var y = v1y;
								var z = v1z;
								for( var x = v1x + incx; x != v2x; x += incx )
								{
									errz += abs_z;
									if( errz > 0 )
									{
										errz -= abs_x;
										z += incz;
									}
									erry += abs_y;
									if( erry > 0 )
									{
										erry -= abs_x;
										y += incy;
									}
									{
										let v = cluster.getVoxelRef( false, x, y, z );
										if( v ) {
											let val = callback( v );
											if( val !== v ) v.delete();
											if( ( !not_zero && val ) || ( not_zero && !val ) )
												return val;
										}
									}
								}
							}
						}
					}
					else
					{
						// y is longest.
						var errx = -abs_y / 2;
						var errz = -abs_y / 2;
						var incy = del_y < 0 ? -1 : 1;
						var incx = del_x < 0 ? -1 : 1;
						var incz = del_z < 0 ? -1 : 1;
						{
							var x = v1x;
							var z = v1z;
							for( var y = v1y + incy; y != v2y; y += incy )
							{
								errx += abs_x;
								if( errx > 0 )
								{
									errx -= abs_y;
									x += incx;
								}
								errz += abs_z;
								if( errz > 0 )
								{
									errz -= abs_y;
									z += incz;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
				}
				else
				{
					// z is constant
					if( abs_x > abs_y )
					{
						// x is longest
						var erry = -abs_x / 2;
						var incy = del_y < 0 ? -1 : 1;
						var incx = del_x < 0 ? -1 : 1;
						{
							var y = v1y;
							var z = v1z;
							for( var x = v1x + incx; x != v2x; x += incx )
							{
								erry += abs_y;
								if( erry > 0 )
								{
									erry -= abs_x;
									y += incy;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
					else
					{
						// y is longest.
						var errx = -abs_y / 2;
						var incy = del_y < 0 ? -1 : 1;
						var incx = del_x < 0 ? -1 : 1;
						{
							var x = v1x;
							var z = v1z;
							for( var y = v1y + incy; y != v2y; y += incy )
							{
								errx += abs_x;
								if( errx > 0 )
								{
									errx -= abs_y;
									x += incx;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
				}
			}
			else
			{
				if( del_z != 0 )
				{
					if( abs_x > abs_z )
					{
						// x is longest.
						var errz = -abs_x / 2;
						var incx = del_x < 0 ? -1 : 1;
						var incz = del_z < 0 ? -1 : 1;
						{
							var y = v1y;
							var z = v1z;
							for( var x = v1x + incx; x != v2x; x += incx )
							{
								errz += abs_z;
								if( errz > 0 )
								{
									errz -= abs_x;
									z += incz;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
					else
					{
						// z is longest path
						var errx = -abs_z / 2;
						var incx = del_x < 0 ? -1 : 1;
						var incz = del_z < 0 ? -1 : 1;
						{
							var x = v1x;
							var y = v1y;
							for( var z = v1z + incz; z != v2z; z += incz )
							{
								errx += abs_x;
								if( errx > 0 )
								{
									errx -= abs_z;
									x += incx;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
				}
				else
				{
					// x is only changing.
					var incx = del_x < 0 ? -1 : 1;
					for( var x = v1x + incx; x != v2x; x += incx )
					{
						let v = cluster.getVoxelRef( false, x, y, z );
						if( v ) {
							let val = callback( v );
							if( val !== v ) v.delete();
							if( ( !not_zero && val ) || ( not_zero && !val ) )
								return val;
						}
					}
				}
			}
		}
		else
		{
			if( del_y != 0 )
			{
				if( del_z != 0 )
				{
					if( abs_y > abs_z )
					{
						// y is longest.
						var errz = -abs_y / 2;
						var incy = del_y < 0 ? -1 : 1;
						var incz = del_z < 0 ? -1 : 1;
						{
							var x = v1x;
							var z = v1z;
							for( var y = v1y + incy; y != v2y; y += incy )
							{
								errz += abs_z;
								if( errz > 0 )
								{
									errz -= abs_y;
									z += incz;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
					else
					{
						// z is longest path
						var erry = -abs_z / 2;
						var incy = del_y < 0 ? -1 : 1;
						var incz = del_z < 0 ? -1 : 1;
						{
							var x = v1x;
							var y = v1y;
							for( var z = v1z + incz; z != v2z; z += incz )
							{
								erry += abs_y;
								if( erry > 0 )
								{
									erry -= abs_z;
									y += incy;
								}
								{
									let v = cluster.getVoxelRef( false, x, y, z );
									if( v ) {
										let val = callback( v );
										if( val !== v ) v.delete();
										if( ( !not_zero && val ) || ( not_zero && !val ) )
											return val;
									}
								}
							}
						}
					}
				}
				else
				{
					// no del_x, no del_z
					// y is only changing.
					var incy = del_y < 0 ? -1 : 1;
					for( var y = v1y + incy; y != v2y; y += incy )
					{
						let v = cluster.getVoxelRef( false, x, y, z );
						if( v ) {
							let val = callback( v );
							if( val !== v ) v.delete();
							if( ( !not_zero && val ) || ( not_zero && !val ) )
								return val;
						}
					}
				}
			}
			else
			{
				// no del_x, no del_y...
				if( del_z != 0 )
				{
					if( del_z > 0 )
						for( var z = v1z + 1; z < v2z; z++ )
						{
							let v = cluster.getVoxelRef( false, x, y, z );
							if( v ) {
								let val = callback( v );
								if( val !== v ) v.delete();
								if( ( !not_zero && val ) || ( not_zero && !val ) )
									return val;
							}
						}
					else
						for( var z = v2z + 1; z < v1z; z++ )
						{
							let v = cluster.getVoxelRef( false, x, y, z );
							if( v ) {
								let val = callback( v );
								if( val !== v ) v.delete();
								if( ( !not_zero && val ) || ( not_zero && !val ) )
									return val;
							}
						}

				}
				else
				{
					// no delta diff, nothing to do.
				}
			}
		}
		return not_zero ? 1 : 0;
	}

	function GetVoxelRefs( nearOnly )
	{
		var result = {
			ResultSectors : new Array(nearOnly ? 7 : 19),
			ResultOffsets : new Array(nearOnly ? 7 : 19)
		}
		GetVoxelRefs( ResultSectors, ResultOffsets, nearOnly );
	}

	function GetVoxelRef( direction )
	{
		that = this.clone();
		switch( direction )
		{
		default:
			throw new Error( "Creating voxel ref " + direction + " is not implemented " );
			break;
		case Voxelarium.RelativeVoxelOrds.LEFT:
			that.wx--;
			if( that.x > 0 )
			{
				that.x--;
				that.Offset -= that.sector.Size_y;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.x = (byte)( that.sector.Size_x - 1 );
					that.Offset += that.sector.Size_y * ( that.sector.Size_x - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.RIGHT:
			that.wx++;
			if( that.x < (that.sector.Size_x-1 ) )
			{
				that.x++;
				that.Offset += that.sector.Size_y;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.x = 0;
					that.Offset -= that.sector.Size_y * ( that.sector.Size_x - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BEHIND:
			that.wz--;
			if( that.z > 0 )
			{
				that.z--;
				that.Offset -= that.sector.Size_y*that.sector.Size_x;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.z = (byte)( that.sector.Size_z - 1 );
					that.Offset += ( that.sector.Size_x * that.sector.Size_y * ( that.sector.Size_z - 2 ) );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.AHEAD:
			that.wz++;
			if( that.z < ( that.sector.Size_z - 1 ) )
			{
				that.z++;
				that.Offset += that.sector.Size_y*that.sector.Size_x;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.z = 0;
					that.Offset -= ( that.sector.Size_x * that.sector.Size_y * ( that.sector.Size_z - 2 ) );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BELOW:
			that.wy--;
			if( that.y > 0 )
			{
				that.y--;
				that.Offset--;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.y = (byte)( that.sector.Size_y - 1 );
					that.Offset += ( that.sector.Size_y - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.ABOVE:
			that.wy++;
			if( that.y < ( that.sector.Size_y - 1 ) )
			{
				that.y++;
				that.Offset++;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.y = 0;
					that.Offset -= ( that.sector.Size_y - 2 );
				}
			}
			break;
		}
		if( that.sector != null )
		{
			that.Type = that.sector.data.data[that.offset];
			that.VoxelExtension = that.sector.data.otherInfos[that.offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
		return that;
	}

	function GetNearVoxelRef( direction )
	{
		var that = GetNearVoxelRef( )
		var cluster = this.sector.cluster;
		that.sector = this.sector;
		that.Offset = this.Offset;
		switch( direction )
		{
		default:
			throw new NotImplementedException( "Creating voxel ref " + direction + " is not implemented " );
			break;
		case Voxelarium.RelativeVoxelOrds.LEFT:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != 0 )
				that.Offset -= that.sector.Size_y;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
			}
			break;
		case Voxelarium.RelativeVoxelOrds.RIGHT:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y )
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BEHIND:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != 0 )
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
			}
			break;
		case Voxelarium.RelativeVoxelOrds.AHEAD:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) )
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BELOW:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != 0 )
				that.Offset--;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
			}
			break;
		case Voxelarium.RelativeVoxelOrds.ABOVE:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != VoxelSector.ZVOXELBLOCMASK_Y )
				that.Offset++;
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
			}
			break;
		}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}


	function GetNearLeftVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != 0 )
				that.Offset -= that.sector.Size_y;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				if( that.sector != null )
					that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearRightVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y )
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				if( that.sector != null )
					that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearAheadVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) )
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
				if( that.sector != null )
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearBehindVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != 0 )
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
				if( that.sector != null )
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearAboveVoxelRef( that,  self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != VoxelSector.ZVOXELBLOCMASK_Y )
				that.Offset++;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
				if( that.sector != null )
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearBelowVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != 0 )
				that.Offset--;
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
				if( that.sector != null )
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
			}
		if( that.sector != null )
		{
			that.Type = self.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}



	function GetNearVoxelRef( that,  self, direction )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
		switch( direction )
		{
		default:
			throw new NotImplementedException( "Creating voxel ref " + direction + " is not implemented " );
			break;
		case Voxelarium.RelativeVoxelOrds.LEFT:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != 0 )
			{
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.RIGHT:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y )
			{
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BEHIND:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != 0 )
			{
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.AHEAD:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) )
			{
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.BELOW:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != 0 )
			{
				that.Offset--;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
				}
			}
			break;
		case Voxelarium.RelativeVoxelOrds.ABOVE:
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != VoxelSector.ZVOXELBLOCMASK_Y )
			{
				that.Offset++;
			}
			else
			{
				that.sector = self.sector.near_sectors[direction - 1];
				if( that.sector != null )
				{
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
				}
			}
			break;
		}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearLeftVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != 0 )
			{
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				if( that.sector != null )
				{
					that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearRightVoxelRef( that,self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y ) ) != VoxelSector.ZVOXELBLOCMASK_X << VoxelSector.ZVOXELBLOCSHIFT_Y )
			{
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				if( that.sector != null )
				{
					that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_X - 2 );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearAheadVoxelRef( that,self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) )
			{
				that.Offset += VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
				if( that.sector != null )
				{
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearBehindVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) ) != 0 )
			{
				that.Offset -= VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
				if( that.sector != null )
				{
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_X * VoxelSector.ZVOXELBLOCSIZE_Y * ( VoxelSector.ZVOXELBLOCSIZE_Z - 2 ) );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearAboveVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != VoxelSector.ZVOXELBLOCMASK_Y )
			{
				that.Offset++;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
				if( that.sector != null )
				{
					that.Offset -= ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetNearBelowVoxelRef( that, self )
	{
		that.sector = self.sector;
		that.Offset = self.Offset;
			if( ( that.Offset & ( VoxelSector.ZVOXELBLOCMASK_Y ) ) != 0 )
			{
				that.Offset--;
			}
			else
			{
				that.sector = self.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
				if( that.sector != null )
				{
					that.Offset += ( VoxelSector.ZVOXELBLOCSIZE_Y - 2 );
				}
			}
		if( that.sector != null )
		{
			that.Type = self.sector.VoxelTypeManager.VoxelTable[that.sector.Data.Data[that.Offset]];
			that.VoxelExtension = that.sector.Data.OtherInfos[that.Offset];
		}
		else
		{
			that.Type = null;
			that.VoxelExtension = null;
		}
	}

	function GetVoxelRefs( nearOnly )
	{
		if( nearOnly )
		{
			var result = new array(7);
			//result[0] = this;
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.LEFT]   , this, Voxelarium.RelativeVoxelOrds.LEFT );
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.RIGHT]  , this, Voxelarium.RelativeVoxelOrds.RIGHT );
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.AHEAD]  , this, Voxelarium.RelativeVoxelOrds.AHEAD );
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.BEHIND] , this, Voxelarium.RelativeVoxelOrds.BEHIND );
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.ABOVE]  , this, Voxelarium.RelativeVoxelOrds.ABOVE );
			GetNearVoxelRef(  result[Voxelarium.RelativeVoxelOrds.BELOW]  , this, Voxelarium.RelativeVoxelOrds.BELOW );
		}
		else
		{
			var result = new VoxelRef[27];
		}
		return result;

	}

	function GetVoxelRefs( ResultSectors,  ResultOffsets,  nearOnly )
	{
		//ResultSectors = new VoxelSector[nearOnly ? 7 : 19];
		//ResultOffsets = new uint[nearOnly ? 7 : 19];

		ResultSectors[Voxelarium.RelativeVoxelOrds.INCENTER] = this.sector;
		var origin = this.Offset.clonse();//( this.x <<VoxelSector.ZVOXELBLOCSHIFT_Y ) + this.y + ( this.z << (VoxelSector.ZVOXELBLOCSHIFT_X +VoxelSector.ZVOXELBLOCSHIFT_Y ) );
		{
			var input = VoxelSector.RelativeVoxelOffsets_Unwrapped;
			var n;
			var idx = 0;
			ResultOffsets[idx] = origin + input[idx]; idx++;
			ResultOffsets[idx] = origin + input[idx]; idx++; //1
			ResultOffsets[idx] = origin + input[idx]; idx++; //2
			ResultOffsets[idx] = origin + input[idx]; idx++; //3
			ResultOffsets[idx] = origin + input[idx]; idx++; //4
			ResultOffsets[idx] = origin + input[idx]; idx++; //5
			ResultOffsets[idx] = origin + input[idx]; idx++; //6
			if( !nearOnly ) for( n = 0; n < 20; n++ ) { ResultOffsets[idx] = origin + input[idx]; idx++; }

			if( this.x == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT]
						= this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector;
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.LEFT - 1, 0]] += ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.LEFT - 1, n]] += ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else if( this.x == ( VoxelSector.ZVOXELBLOCSIZE_X - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.RIGHT - 1, 0]] -= ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.RIGHT - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
			}
			else
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector;
			}
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BELOW - 1, 0]] += ( VoxelSector.ZVOXELBLOCSIZE_Y );
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BELOW - 1, n]] += ( VoxelSector.ZVOXELBLOCSIZE_Y );
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.ABOVE - 1, 0]] -= ( VoxelSector.ZVOXELBLOCSIZE_Y );
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.ABOVE - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_Y );
			}
			else
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
			}

			if( this.z == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BEHIND - 1, 0]] += ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BEHIND - 1, n]] += ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;
				ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.AHEAD - 1, 0]] -= ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
				if( !nearOnly ) for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.AHEAD - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
			}
			else
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;
			}

			// test to make sure resulting offsets are within range.
			//for( n = 0; n < 27; n++ ) if( ResultOffsets[n] & 0xFFFF8000 ) DebugBreak();
		}
		if( nearOnly )
			return;

		if( this.x == 0 )
		{
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else //----------------------------------------------
				{
					// left bound, top bound, front nobound
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector;
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;

					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else //----------------------------------------------
			{
				// left bound, above/below unbound
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] != null ? ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1] : null;
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					// left bound, y unbound z unbound
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
		}
		else if( this.x == ( VoxelSector.ZVOXELBLOCSIZE_X - 1 ) )
		{
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
		}
		else //---------------------------------------------------------
		{
			// left/right unbound... left and right should never be terms of equality
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
			}
			else  //----------------------------------------------
			{
				// x not on bound, y not on bound.
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
			}
		}
	}

	// result set is only 9 (3x3 face)
	function GetVoxelRefs(  ResultSectors,  ResultOffsets, faceOnly )
	{
		var result = {
			ResultSectors : new Array(27),
			ResultOffsets : new Array(27)
		}

		ResultSectors[Voxelarium.RelativeVoxelOrds.INCENTER] = this.sector;
		var origin = ( this.x << VoxelSector.ZVOXELBLOCSHIFT_Y ) + this.y + ( this.z << ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) );
		{
			var input = VoxelSector.RelativeVoxelOffsets_Unwrapped;
			var n;
			for( n = 0; n < 9; n++ )
				ResultOffsets[n] = (uint)(origin + VoxelSector.RelativeVoxelOffsets_Unwrapped[VoxelSector.VoxelFaceGroups[faceOnly, n]]);

			switch( faceOnly )
			{
				case Voxelarium.RelativeVoxelOrds.LEFT:
					if( this.x == 0 )
					{
						for( n = 0; n < 9; n++ )
						{
							ResultSectors[n] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector;
							ResultOffsets[n] += ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
						}
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector;
					}
					break;
				case Voxelarium.RelativeVoxelOrds.RIGHT:
					if( this.x == ( VoxelSector.ZVOXELBLOCSIZE_X - 1 ) )
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
						for( n = 0; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.RIGHT - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_X ) * VoxelSector.ZVOXELBLOCSIZE_Y;
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT] = this.sector;
					}
					break;
				case Voxelarium.RelativeVoxelOrds.ABOVE:
					if( this.y == 0 )
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
						ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BELOW - 1, 0]] += ( VoxelSector.ZVOXELBLOCSIZE_Y );
						for( n = 0; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BELOW - 1, n]] += ( VoxelSector.ZVOXELBLOCSIZE_Y );
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
					}
					break;
				case Voxelarium.RelativeVoxelOrds.BELOW:
					if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
						ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.ABOVE - 1, 0]] -= ( VoxelSector.ZVOXELBLOCSIZE_Y );
						for( n = 0; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.ABOVE - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_Y );
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
					}
					break;
				case Voxelarium.RelativeVoxelOrds.BEHIND:
					if( this.z == 0 )
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
						ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BEHIND - 1, 0]] += ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
						for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.BEHIND - 1, n]] += ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;
					}
					break;
				case Voxelarium.RelativeVoxelOrds.AHEAD:
					if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1]; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;
						ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.AHEAD - 1, 0]] -= ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
						for( n = 1; n < 9; n++ ) ResultOffsets[VoxelSector.VoxelFaceGroups[Voxelarium.RelativeVoxelOrds.AHEAD - 1, n]] -= ( VoxelSector.ZVOXELBLOCSIZE_Z ) * VoxelSector.ZVOXELBLOCSIZE_Y * VoxelSector.ZVOXELBLOCSIZE_X;
					}
					else
					{
						ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector; ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;
					}
					break;
			}
			// test to make sure resulting offsets are within range.
			//for( n = 0; n < 27; n++ ) if( ResultOffsets[n] & 0xFFFF8000 ) DebugBreak();
		}


		if( this.x == 0 )
		{
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else //----------------------------------------------
				{
					// left bound, top bound, front nobound
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD] = this.sector;
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND] = this.sector;

					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else //----------------------------------------------
			{
				// left bound, above/below unbound
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					// left bound, y unbound z unbound
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
		}
		else if( this.x == ( VoxelSector.ZVOXELBLOCSIZE_X - 1 ) )
		{
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE] = this.sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW] = this.sector;
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
			else
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD].near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW];
				}
			}
		}
		else //---------------------------------------------------------
		{
			// left/right unbound... left and right should never be terms of equality
			if( this.y == 0 )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW].near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
			}
			else if( this.y == ( VoxelSector.ZVOXELBLOCSIZE_Y - 1 ) )
			{
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				if( this.z == 0 )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];

				}
				else if( this.z == ( VoxelSector.ZVOXELBLOCSIZE_Z - 1 ) )
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE].near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				}
				else
				{
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
					ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW];
				}
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND];
			}
			else  //----------------------------------------------
			{
				// x not on bound, y not on bound.
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW] = ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT];

				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_LEFT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];

				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD] = ResultSectors[Voxelarium.RelativeVoxelOrds.AHEAD];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
				ResultSectors[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND] = ResultSectors[Voxelarium.RelativeVoxelOrds.BEHIND];
			}
		}
	}
