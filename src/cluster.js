
require( "./constants.js");
require( "./reactor.js" );

Voxelarium.Cluster = function( x, y, z, props ) {
    var cluster = {
        mesher : null,
        WorkingFullSector : null,
        WorkingEmptySector: null,

        SectorList : [],

        sectorSizeX : x || 32,
        sectorSizeY : y || 32,
        sectorSizeZ : z || 32,
        sectorSize : 0, // filled in later

        voxelUnitSize : props && props.unitSize || 20,

        sectorHashSize_x : 8,
        sectorHashSize_y : 8,
        sectorHashSize_z : 8,
        TableSize : 0,//SectorHashSize_x * SectorHashSize_y * SectorHashSize_z,
        SectorTable : new Array( 8*8*8 ),

        pivot : new THREE.Vector3(),
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

        ,getVoxelRef : function( is3dSpaceCoords, x, y, z ) {
            if( is3dSpaceCoords ) {
              x = Math.floor( x / this.voxelUnitSize );
              y = Math.floor( y / this.voxelUnitSize );
              z = Math.floor( z / this.voxelUnitSize );
            }
            var sx = Math.floor( x / this.sectorSizeX );
            var sy = Math.floor( y / this.sectorSizeY );
            var sz = Math.floor( z / this.sectorSizeZ );
            //if( !is3dSpaceCoords) {
              //console.log( `Get ${sx} ${sy} ${sz}`)
            //}
            var sector = cluster.getSector( sx, sy, sz, true );
            if( sector ) {
                return sector.getVoxelRef( x % this.sectorSizeX, y % this.sectorSizeY, z % this.sectorSizeZ);
            } else {
                // pass world coordinates, since there's no sector to give a base position
                return Voxelarium.VoxelRef( cluster, null, x, y, z );
            }
            return null;
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
                && ( ( base.pos.x !== x )
                    || ( base.pos.y !== y )
                    || ( base.pos.z !== z ) ) )
                base = base.next;
            if( !do_not_create )
                if( !base )
                    base = this.createSector( x, y, z )
            return base;
        }
        , getGeometryBuffer : null
    }

    cluster.TableSize = cluster.sectorHashSize_x * cluster.sectorHashSize_y * cluster.sectorHashSize_z;
    cluster.sectorSize = cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ;
    cluster.lookupTables = InitStatics( cluster.sectorSizeX, cluster.sectorSizeY, cluster.sectorSizeZ )

    cluster.SectorTable = new Array( cluster.TableSize );
    // maybe reactor is universal?
    cluster.reactor = Voxelarium.Reactor( cluster );

    Object.defineProperties( cluster
        , { 'sectorSizeX' : {writeable:false}
            , 'sectorSizeY' : {writeable:false}
            , 'sectorSizeZ' : {writeable:false}
            , 'sectorSize' : {writeable:false}
            , 'sectorHashSize_x' : {writeable:false}
            , 'sectorHashSize_y' : {writeable:false}
            , 'sectorHashSize_z' : {writeable:false}
            , 'TableSize' : {writeable:false}
            , 'voxelUnitSize' : {writeable:false}
            , 'lookupTables' : {writeable:false}
            , 'SectorTable' : {writeable:false}
            , 'reactor' : {writeable:false}
        } )


    cluster.WorkingFullSector = Voxelarium.Sector( cluster );
    cluster.WorkingFullSector.Pos_y = -1;
    cluster.WorkingFullSector.MakeSector( Voxelarium.Voxels.types[1] );
    cluster.WorkingEmptySector= Voxelarium.Sector( cluster );
    cluster.WorkingEmptySector.Pos_y = 0;
    cluster.WorkingEmptySector.MakeSector( Voxelarium.Voxels.types[0] );


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
				//tables.tableX.forEach( (elem)=>{elem=0})
				//console.log( "tableX init is ", tables.tableX)
				tables.tableX[0] = 1;
				tables.tableX[x + 1] = 2;
				tables.tableZ[0] = 3;
				tables.tableZ[y + 1] = 6;
				tables.tableY[0] = 9;
				tables.tableY[z + 1] = 18;
                n = 0;
                tables.ofTableX[n] = ( ( ( n == 0 ) ? ( x - 1 ) : ( n == ( x + 1 ) ) ? 0 : ( n - 1 ) ) * y );
                tables.ofTableY[n] = ( ( ( n == 0 ) ? ( y - 1 ) : ( n == ( y + 1 ) ) ? 0 : ( n - 1 ) ) );
                tables.ofTableZ[n] = ( ( ( n == 0 ) ? ( z - 1 ) : ( n == ( z + 1 ) ) ? 0 : ( n - 1 ) ) * y * z );
                n = x+1;
                tables.ofTableX[n] = ( ( ( n == 0 ) ? ( x - 1 ) : ( n == ( x + 1 ) ) ? 0 : ( n - 1 ) ) * y );
                tables.ofTableY[n] = ( ( ( n == 0 ) ? ( y - 1 ) : ( n == ( y + 1 ) ) ? 0 : ( n - 1 ) ) );
                tables.ofTableZ[n] = ( ( ( n == 0 ) ? ( z - 1 ) : ( n == ( z + 1 ) ) ? 0 : ( n - 1 ) ) * y * z );
        for(  n = 1; n < x + 1; n++ ) {
					tables.ofTableX[n] = ( ( ( n == 0 ) ? ( x - 1 ) : ( n == ( x + 1 ) ) ? 0 : ( n - 1 ) ) * y );
                    tables.tableX[n] = 0;
        }
				for( var n = 1; n < y + 1; n++ ){
					tables.ofTableY[n] = ( ( ( n == 0 ) ? ( y - 1 ) : ( n == ( y + 1 ) ) ? 0 : ( n - 1 ) ) );
                    tables.tableY[n] = 0;
        }
				for(  n = 1; n < z + 1; n++ ) {
					tables.ofTableZ[n] = ( ( ( n == 0 ) ? ( z - 1 ) : ( n == ( z + 1 ) ) ? 0 : ( n - 1 ) ) * y * z );
          tables.tableZ[n] = 0;
        }
				SectorTables.push( tables );
			}
            Object.defineProperties( tables
                , { "x" : { writable:false}
                ,  "y" : { writable:false}
                ,  "z" : { writable:false}
                ,  "tableX" : { writable:false}
                ,  "tableY" : { writable:false}
                ,  "tableZ" : { writable:false}
                ,  "ofTableX" : { writable:false}
                ,  "ofTableY" : { writable:false}
                ,  "ofTableZ" : { writable:false}
            });
            Object.freeze( tables.tableX );
            Object.freeze( tables.tableY );
            Object.freeze( tables.tableZ );
            Object.freeze( tables.ofTableX );
            Object.freeze( tables.ofTableY );
            Object.freeze( tables.ofTableZ );
			return tables;
		}
