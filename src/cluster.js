
require( "./constants.js");
require( "./reactor.js" );

Voxelarium.Cluster = function( x, y, z ) {
    var cluster = {
        mesher : null,
        WorkingFullSector : null,
        WorkingEmptySector: null,

        //VoxelGameEnvironment GameEnv;
        //internal SectorRingList SectorEjectList;
        SectorList : [],

        //internal RenderInterface renderer;
        //VoxelSector[] SectorTable;
        //internal VoxelTypeManager VoxelTypeManager;
        //internal SectorLoader SectorLoader;
        sectorSizeX : x || 32,
        sectorSizeY : y || 32,
        sectorSizeZ : z || 32,
        sectorSize : 0, // filled in later

        voxelUnitSize : 20,

        sectorHashSize_x : 8,
        sectorHashSize_y : 8,
        sectorHashSize_z : 8,
        TableSize : 0,//SectorHashSize_x * SectorHashSize_y * SectorHashSize_z,
        SectorTable : new Array( 16*16*16 ),

        location : new THREE.Matrix4(),
        UniverseNum : 0,
        lookupTables : null
        ,createSector : function( x, y, z ) {
            var sector = Voxelarium.Sector( this, x, y, z );
            this.SectorList.push( sector );

            var hashOfs;
            sector.next = this.SectorTable[ hashOfs = ( x % this.sectorHashSize_x
                                + ( y % this.sectorHashSize_y ) * ( this.sectorHashSize_x )
                                + ( z % this.sectorHashSize_z ) * (this.sectorHashSize_y*this.sectorHashSize_x) ) ];
            if( sector.next )
                sector.next.pred = sector;
            this.SectorTable[hashOfs] = sector;

			var n;
			for( n = 0; n < 6; n++ )
			{
				var near_sec = this.getSector( x + Voxelarium.NormalBasePosition[n].x
												  , y + Voxelarium.NormalBasePosition[n].y
												  , z + Voxelarium.NormalBasePosition[n].z
                                                  , true );
				if( near_sec != null )
				{
					sector.near_sectors[n] = near_sec;
					near_sec.near_sectors[n ^ 1] = sector;
				}
			}
            return sector;
        }

        ,getVoxelRef : function( v, x, y, z ) {
            var sx = x / this.sectorSizeX;
            var sy = y / this.sectorSizeY;
            var sz = z / this.sectorSizeZ;
            //var subx = ( sx % 1 ) * sectorSizeX;
            //var suby = ( sy % 1 ) * sectorSizeY;
            //var subz = ( sz % 1 ) * sectorSizeZ;
            var wx = Math.Floor( sx );
            var wy = Math.Floor( sy );
            var wz = Math.Floor( sz );
            var sector = this.getSector( wx, wy, wz );
            if( sector )
                return sector.VoxelRef( x, y, z )
        }
        , setCube : function( x, y, z, cube ){
            var sx = x / this.sectorSizeX;
            var sy = y / this.sectorSizeY;
            var sz = z / this.sectorSizeZ;
            var subx = ( sx % 1 ) * this.sectorSizeX;
            var suby = ( sy % 1 ) * this.sectorSizeY;
            var subz = ( sz % 1 ) * this.sectorSizeZ;
            var wx = Math.floor( sx );
            var wy = Math.floor( sy );
            var wz = Math.floor( sz );
            var sector = this.getSector( wx, wy, wz );

            sector.setCube( subx, suby, subz, cube );
        }
        , getSector : function( x, y, z, do_not_create ) {
            var base;
            base = this.SectorTable[ x % this.sectorHashSize_x
                                + ( y % this.sectorHashSize_y ) * ( this.sectorHashSize_x )
                                + ( z % this.sectorHashSize_z ) * ( this.sectorHashSize_y*this.sectorHashSize_x) ];
            while( base
                && ( ( base.Pos_x !== x )
                    || ( base.Pos_y !== y )
                    || ( base.Pos_z !== z ) ) )
                base = base.next;
            if( !do_not_create )
                if( !base )
                    base = this.createSector( x, y, z )
            return base;
        }
        , getGeometryBuffer : null
    }
    cluster.sectorSize = cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ;

    cluster.WorkingFullSector = Voxelarium.Sector( cluster );
    cluster.WorkingFullSector.Pos_y = -1;
    cluster.WorkingFullSector.MakeSector();
    cluster.WorkingEmptySector= Voxelarium.Sector( cluster );
    cluster.WorkingFullSector.Pos_y = 0;
    cluster.WorkingFullSector.MakeSector();

    cluster.TableSize = cluster.sectorHashSize_x * cluster.sectorHashSize_y * cluster.sectorHashSize_z;
    cluster.SectorTable = new Array( cluster.TableSize );
    cluster.lookupTables = InitStatics( cluster.sectorSizeX, cluster.sectorSizeY, cluster.sectorSizeZ )
    // maybe reactor is universal?
    cluster.reactor = Voxelarium.Reactor( cluster );

    return cluster;
}

var SectorTables = []; // cache of lookup tables
function InitStatics( x,y,z)
		{
			var tables = SectorTables.find( (tab)=>{ return( tab.x==x && tab.y==y && tab.z == z ) });
			if( !tables )
			{
				tables = {
					x: x,
					y: y,
					z: z,
					tableX : new Array( x+2 ),
					tableY : new Array( y+2 ),
					tableZ : new Array( z+2 ),
					ofTableX : new Array( x+2 ),
					ofTableY : new Array( y+2 ),
					ofTableZ : new Array( z+2 )
				}
				tables.tableX.forEach( (elem)=>{elem=0})
				console.log( "tableX init is ", tables.tableX)
				tables.tableX[0] = 1;
				tables.tableX[x + 1] = 2;
				tables.tableZ[0] = 3;
				tables.tableZ[y + 1] = 6;
				tables.tableY[0] = 9;
				tables.tableY[z + 1] = 18;
				for( var n = 0; n < y + 2; n++ )
					tables.ofTableY[n] = ( ( ( n == 0 ) ? ( y - 1 ) : ( n == ( y + 1 ) ) ? 0 : ( n - 1 ) ) );
				for(  n = 0; n < x + 2; n++ )
					tables.ofTableX[n] = ( ( ( n == 0 ) ? ( x - 1 ) : ( n == ( x + 1 ) ) ? 0 : ( n - 1 ) ) * y );
				for(  n = 0; n < z + 2; n++ )
					tables.ofTableZ[n] = ( ( ( n == 0 ) ? ( z - 1 ) : ( n == ( z + 1 ) ) ? 0 : ( n - 1 ) ) * y * z );
				SectorTables.push( tables );
			}
			return tables;
		}
