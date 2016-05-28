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
		Pos_x : x, Pos_y : y, Pos_z : z,

		// Version control : Added for handling better world evolution.
		ZoneType : 0,     // The type of the zone.
		ZoneVersion : 0,  // The version of the generator used for this zone.
		GeneratorVersion : 0, // Main generator version. Updated at world change.
		RingNum : 0,

		cluster : cluster,

		data : { data : new Array( cluster.sectorSize )
				, sleepState : Voxelarium.PackedBoolArray( cluster.sectorSize )
            	, otherInfos : []
            	},
		ModifTracker : Voxelarium.ModificationTracker( cluster.sectorSize ),

        mesher : null,

		THREE_solid : null,
        solid_geometry : null,
		transparent_geometry: null,
		custom_geometry: null,

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

			if( CubeValue.ExtensionType )
				this.data.otherInfos[offset] = Activator.CreateInstance( VoxelTypeManager.VoxelTable[CubeValue].ExtensionType );
			else
				this.data.otherInfos[offset] = null;
		},

		getCube : function( x, y, z ) {
			var offset = getOffset( x, y, z );
			return ( newSector.data.data[Offset] );
		},

		MakeSector : function() {
			var x, y, z;
			var Cnt;

			if( this.Pos_y < 0 ) { Cnt = Voxelarium.Voxels.types[0]; this.Flag_Void_Regular = false; this.Flag_Void_Transparent = true; }
			else { Cnt = null; this.Flag_Void_Regular = true; this.Flag_Void_Transparent = true; }
			for( z = 0; z < this.size_x; z++ )
			{
				for( y = 0; y < this.size_y; y++ )
				{
					for( x = 0; x < this.size_x; x++ )
					{
						newSector.SetCube( x, y, z, Cnt );
					}
				}
			}
		},

		getVoxelRef : VoxelRef,


        }
        return newSector;
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

function VoxelRef( x, y, z )
{
	var result = { sector : this
			, offset : 0
			, x : x, y : y, z : z
		 	, wx : this.Pos_x * this.size_x + x
			, wy : this.Pos_y * this.size_y + y
			, wz : this.Pos_z * this.size_z + z
			, voxelType : null
			, cluster : this.cluster
			, voxelExtension : null
			, forEach : forEach
			, clone : function() { return this.sector.getVoxelRef( this.x, this.y, this.z ) }
			, getNearVoxel : GetVoxelRef
			 }

	{
		result.offset = ( x * this.size_y )  + y + ( z * ( this.size_x * this.size_z) );
		result.voxelType = this.data.data[result.offset];
		result.voxelExtension = sector.data.otherInfos[result.offset];
	}
}

	function forEach( voxelRef2, not_zero, callback )
	{
		var voxelRef1 = this;
		if( voxelRef1.sector == null || voxelRef2.sector == null )
			return not_zero ? 1 : 0;
		if( voxelRef1.sector.cluster !== voxelRef2.sector.cluster )
			return not_zero ? 1 : 0;
		var cluster = voxelRef1.sector.cluster;

		var v1x = voxelRef1.wx;
		var v1y = voxelRef1.wy;
		var v1z = voxelRef1.wz;
		var v2x = voxelRef2.wx;
		var v2y = voxelRef2.wy;
		var v2z = voxelRef2.wz;
		var del_x = v2x - voxelRef1x;
		var del_y = v2y - voxelRef1y;
		var del_z = v2z - voxelRef1z;
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
										let v = cluster.getVoxelRef( x, y, z );
										if( v ) {
											let val = callback( v );
											if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
										z += incx;
									}
									erry += abs_y;
									if( erry > 0 )
									{
										erry -= abs_x;
										y += incy;
									}
									{
										let v = cluster.getVoxelRef( x, y, z );
										if( v ) {
											let val = callback( v );
											if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
							var z = v1x;
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
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
						// z is longest path
						{
							var x = v1x;
							var z = v1x;
							for( var y = v1y + incy; y != v2y; y += incy )
							{
								errx += abs_x;
								if( errx > 0 )
								{
									errx -= abs_y;
									x += incx;
								}
								{
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
									z += incx;
								}
								{
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
						let v = cluster.getVoxelRef( x, y, z );
						if( v ) {
							let val = callback( v );
							if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
							var z = v1x;
							for( var y = v1y + incy; y != v2y; y += incy )
							{
								errz += abs_z;
								if( errz > 0 )
								{
									errz -= abs_y;
									z += incz;
								}
								{
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
									let v = cluster.getVoxelRef( x, y, z );
									if( v ) {
										let val = callback( v );
										if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
						let v = cluster.getVoxelRef( x, y, z );
						if( v ) {
							let val = callback( v );
							if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
							let v = cluster.getVoxelRef( x, y, z );
							if( v ) {
								let val = callback( v );
								if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
									return val;
							}
						}
					else
						for( var z = v2z + 1; z < v1z; z++ )
						{
							let v = cluster.getVoxelRef( x, y, z );
							if( v ) {
								let val = callback( v );
								if( ( !not_zero && val != 0 ) || ( not_zero && val == 0 ) )
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
