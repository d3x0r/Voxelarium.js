
import {Voxelarium} from "./Voxelarium.core.js"
import {consts,Vector4Pool,Vector3Pool} from "../three.js/personalFill.js"

import  "./constants.js";
import  "./reactor.js" ;

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
        lookupTables : null,
	THREE_solid : new THREE.Object3D(),
        rayCast(o,n){return rayCast(cluster,o,n); },
        events_ : {}
	, on(event,arg) {
		if( "function" === typeof arg ) {
			if( event in cluster.events_ ) {
				cluster.events_[event].push( arg );
			}else {
				cluster.events_[event] = [arg];
			}
		} else {
			if( event in cluster.events_ ) {
				cluster.events_[event].forEach( cb=>cb(arg) );
			}
		}
	}
        ,createSector : function( x, y, z ) {
            var sector = Voxelarium.Sector( cluster, x, y, z );
            cluster.SectorList.push( sector );

            var hashOfs;
            sector.next = cluster.SectorTable[ hashOfs = ( x % cluster.sectorHashSize_x
                                + ( y % cluster.sectorHashSize_y ) * ( cluster.sectorHashSize_x )
                                + ( z % cluster.sectorHashSize_z ) * (cluster.sectorHashSize_y*cluster.sectorHashSize_x) ) ];
            if( sector.next )
                sector.next.pred = sector;
            cluster.SectorTable[hashOfs] = sector;

			var n;
			for( n = 0; n < 6; n++ )
			{
				var near_sec = cluster.getSector( x + Voxelarium.NormalBasePosition[n].x
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
              x = Math.floor( x / cluster.voxelUnitSize );
              y = Math.floor( y / cluster.voxelUnitSize );
              z = Math.floor( z / cluster.voxelUnitSize );
            }
            var sx = Math.floor( x / cluster.sectorSizeX );
            var sy = Math.floor( y / cluster.sectorSizeY );
            var sz = Math.floor( z / cluster.sectorSizeZ );
            //if( !is3dSpaceCoords) {
              //console.log( `Get ${sx} ${sy} ${sz}`)
            //}
            var sector = cluster.getSector( sx, sy, sz, true );
            if( sector ) {
                return sector.getVoxelRef( x % cluster.sectorSizeX, y % cluster.sectorSizeY, z % cluster.sectorSizeZ);
            } else {
                // pass world coordinates, since there's no sector to give a base position
                return Voxelarium.VoxelRef( cluster, null, x, y, z );
            }
            return null;
        }
        , setCube : function( x, y, z, cube ){
            var sx = x / cluster.sectorSizeX;
            var sy = y / cluster.sectorSizeY;
            var sz = z / cluster.sectorSizeZ;
            var subx = ( sx % 1 ) * cluster.sectorSizeX;
            var suby = ( sy % 1 ) * cluster.sectorSizeY;
            var subz = ( sz % 1 ) * cluster.sectorSizeZ;
            var wx = Math.floor( sx );
            var wy = Math.floor( sy );
            var wz = Math.floor( sz );
            var sector = cluster.getSector( wx, wy, wz );

            sector.setCube( subx, suby, subz, cube );
        }
        , getSector : function( x, y, z, do_not_create ) {
            var base;
            base = cluster.SectorTable[ x % cluster.sectorHashSize_x
                                + ( y % cluster.sectorHashSize_y ) * ( cluster.sectorHashSize_x )
                                + ( z % cluster.sectorHashSize_z ) * ( cluster.sectorHashSize_y*cluster.sectorHashSize_x) ];
            while( base
                && ( ( base.pos.x !== x )
                    || ( base.pos.y !== y )
                    || ( base.pos.z !== z ) ) )
                base = base.next;
            if( !do_not_create )
                if( !base )
                    base = cluster.createSector( x, y, z )
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
// x,y,z are sizes... this is precomputed multipliers
// based on the dimension of the sectors in the cluter.
// there shouldn't be very many combinations of these, so a
// linear lookup should be fine; and the table is saved
// with the cluster once it is found.
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


function  rayCast(cluster, o, forward )
{
    var Out = null;
  var Delta_h = Vector4Pool.new(),Delta_v = Vector4Pool.new(),Delta_s = Vector4Pool.new();
  var Offset_h = Vector4Pool.new(), Offset_v = Vector4Pool.new(), Offset_s = Vector4Pool.new();
  var Norm_h = Vector3Pool.new(), Norm_v = Vector3Pool.new(), Norm_s = Vector3Pool.new();
  var Collision_h = Vector4Pool.new(), Collision_v = Vector4Pool.new(), Collision_s = Vector4Pool.new();

  var ActualCube_x,ActualCube_y,ActualCube_z;
  var NewCube_x,NewCube_y,NewCube_z;
  var Collide_X, Collide_Y, Collide_Z;
  var i;

  var Norm = forward;

  Collide_X = Collide_Y = Collide_Z = false;

  if (Norm.x >= 0.01 )
  {
    Collide_X = true;
    Delta_h.x = 1.0;
    Delta_h.y = Norm.y / Norm.x;
    Delta_h.z = Norm.z / Norm.x;
    Delta_h.w = 0;
    Delta_h.w = Delta_h.length();

    Collision_h.x = (Math.floor(o.x / cluster.voxelUnitSize) + 1.0)*cluster.voxelUnitSize;
    Collision_h.y = (Collision_h.x - o.x) * Delta_h.y + o.y;
    Collision_h.z = (Collision_h.x - o.x) * Delta_h.z + o.z;
    Collision_h.w = (Collision_h.x - o.x) * Delta_h.w;

    Offset_h.x = cluster.voxelUnitSize;
    Offset_h.y = Delta_h.y * cluster.voxelUnitSize;
    Offset_h.z = Delta_h.z * cluster.voxelUnitSize;
    Offset_h.w = Delta_h.w * cluster.voxelUnitSize;
    Norm_h.x = Offset_h.x/2;// / (cluster.voxelUnitSize/2);
    Norm_h.y = 0 / (cluster.voxelUnitSize/2);
    Norm_h.z = 0 / (cluster.voxelUnitSize/2);
  }
  else if (Norm.x <= -0.01)
  {
    Collide_X = true;

    Delta_h.x = 1.0;
    Delta_h.y = Norm.y / -Norm.x;
    Delta_h.z = Norm.z / -Norm.x;
    Delta_h.w = 0;
    Delta_h.w = Delta_h.length();

    Collision_h.x = (Math.floor(o.x / cluster.voxelUnitSize))*cluster.voxelUnitSize;
    Collision_h.y = (o.x - Collision_h.x) * Delta_h.y + o.y;
    Collision_h.z = (o.x - Collision_h.x) * Delta_h.z + o.z;
    Collision_h.w = (o.x - Collision_h.x) * Delta_h.w;
    Offset_h.x = -cluster.voxelUnitSize;
    Offset_h.y = Delta_h.y * cluster.voxelUnitSize;
    Offset_h.z = Delta_h.z * cluster.voxelUnitSize;
    Offset_h.w = Delta_h.w * cluster.voxelUnitSize;
    Norm_h.x = Offset_h.x/2;// / (cluster.voxelUnitSize/2);
    Norm_h.y = 0 / (cluster.voxelUnitSize/2);
    Norm_h.z = 0 / (cluster.voxelUnitSize/2);
  }

  if (Norm.y >= 0.01 )
  {
    Collide_Y = true;
    Delta_v.x = Norm.x / Norm.y;
    Delta_v.y = 1.0;
    Delta_v.z = Norm.z / Norm.y;
    Delta_v.w = 0;
    Delta_v.w = Delta_v.length();

    Collision_v.y = (Math.floor(o.y / cluster.voxelUnitSize)+1) * cluster.voxelUnitSize;
    var dely = (Collision_v.y - o.y);
    Collision_v.x = dely * Delta_v.x + o.x;
    Collision_v.z = dely * Delta_v.z + o.z;
    Collision_v.w = dely * Delta_v.w;
    Offset_v.y = cluster.voxelUnitSize;
    Offset_v.x = Delta_v.x * cluster.voxelUnitSize;
    Offset_v.z = Delta_v.z * cluster.voxelUnitSize;
    Offset_v.w = Delta_v.w * cluster.voxelUnitSize;
    Norm_v.x = 0 / (cluster.voxelUnitSize/2);
    Norm_v.y = Offset_v.y/2;// / (cluster.voxelUnitSize/2);
    Norm_v.z = 0 / (cluster.voxelUnitSize/2);
  }
  else if (Norm.y <= -0.01)
  {
    Collide_Y = true;
    Delta_v.x = Norm.x / -Norm.y;
    Delta_v.y = 1.0;
    Delta_v.z = Norm.z / -Norm.y;
    Delta_v.w = 0;
    Delta_v.w = Delta_v.length();

    Collision_v.y = (Math.floor(o.y / cluster.voxelUnitSize)) * cluster.voxelUnitSize;
    var dely = (o.y-Collision_v.y );
    Collision_v.x = (dely) * Delta_v.x + o.x;
    Collision_v.z = (dely) * Delta_v.z + o.z;
    Collision_v.w = (dely) * Delta_v.w;

    Offset_v.y = -cluster.voxelUnitSize;
    Offset_v.x = Delta_v.x * cluster.voxelUnitSize;
    Offset_v.z = Delta_v.z * cluster.voxelUnitSize;
    Offset_v.w = Delta_v.w * cluster.voxelUnitSize;
    Norm_v.x = 0 / (cluster.voxelUnitSize/2);
    Norm_v.y = Offset_v.y/2;// / (cluster.voxelUnitSize/2);
    Norm_v.z = 0 / (cluster.voxelUnitSize/2);
  }

  if (Norm.z >= 0.01)
  {
    Collide_Z = true;
    Delta_s.x = Norm.x / Norm.z;
    Delta_s.y = Norm.y / Norm.z;
    Delta_s.z = 1.0;
    Delta_s.w = 0;
    Delta_s.w = Delta_s.length();
    Collision_s.z = (Math.floor(o.z / cluster.voxelUnitSize) + 1.0)*cluster.voxelUnitSize;
    Collision_s.x = (Collision_s.z - o.z) * Delta_s.x + o.x;
    Collision_s.y = (Collision_s.z - o.z) * Delta_s.y + o.y;
    Collision_s.w = (Collision_s.z - o.z) * Delta_s.w;

    Offset_s.x = Delta_s.x * cluster.voxelUnitSize;
    Offset_s.y = Delta_s.y * cluster.voxelUnitSize;
    Offset_s.z = cluster.voxelUnitSize;
    Offset_s.w = Delta_s.w * cluster.voxelUnitSize;
    Norm_s.x = 0 / (cluster.voxelUnitSize/2);
    Norm_s.y = 0 / (cluster.voxelUnitSize/2);
    Norm_s.z = Offset_s.z/2;// / (cluster.voxelUnitSize/2);
  }
  else if (Norm.z <= -0.01)
  {
    Collide_Z = true;
    Delta_s.x = Norm.x / -Norm.z;
    Delta_s.y = Norm.y / -Norm.z;
    Delta_s.z = 1.0;
    Delta_s.w = 0;
    Delta_s.w = Delta_s.length();
    Collision_s.z = (Math.floor(o.z / cluster.voxelUnitSize) )*cluster.voxelUnitSize;
    Collision_s.x = (o.z - Collision_s.z) * Delta_s.x + o.x;
    Collision_s.y = (o.z - Collision_s.z) * Delta_s.y + o.y;
    Collision_s.w = (o.z - Collision_s.z) * Delta_s.w;

    Offset_s.x = Delta_s.x * cluster.voxelUnitSize;
    Offset_s.y = Delta_s.y * cluster.voxelUnitSize;
    Offset_s.z = - cluster.voxelUnitSize;
    Offset_s.w = Delta_s.w * cluster.voxelUnitSize;

    Norm_s.x = 0 / (cluster.voxelUnitSize/2);
    Norm_s.y = 0 / (cluster.voxelUnitSize/2);
    Norm_s.z = Offset_s.z/2;// / (cluster.voxelUnitSize/2);
  }



//  printf("yaw: %04lf pitch: %lf Offset_y:%lf Offset_z:%lf xyz:%lf %lf %lf NXYZ:%lf %lf %lf Dxyz:%lf %lf %lf", yaw,pitch, Delta_h.y, Delta_h.z,x,y,z, Norm_h.x, Norm_h.y, Norm_h.z, Delta_h.x, Delta_h.y, Delta_h.z);
 //printf("Angle (y:%lf p:%lf) XYZ:(%lf %lf %lf) Off(%lf %lf %lf %lf) Coll(%lf %lf %lf %lf) Norm(%lg %lg %lf) :\n", yaw,pitch,x,y,z, Offset_s.x, Offset_s.y, Offset_s.z, Offset_s.w, Collision_s.x, Collision_s.y, Collision_s.z, Collision_s.w, Norm_s.x,Norm_s.y, Norm_s.z);

  var Match_h = 0;
  var Match_s = 0;
  var Match_v = 0;
  var Cycle = 1;
  var MinW = 1000000.0;
  var ref;
  //console.log( '-------------------------');
  for (i=0;i<150;i++)
  {

    // Horizontal X axis.
    if (Collide_X)
    {
      if (Match_h==0 && Collision_h.w < MinW)
      {
        ActualCube_x = Math.floor((Collision_h.x - Norm_h.x) / cluster.voxelUnitSize);
        ActualCube_y = Math.floor((Collision_h.y - Norm_h.y) / cluster.voxelUnitSize);
        ActualCube_z = Math.floor((Collision_h.z - Norm_h.z) / cluster.voxelUnitSize);
        NewCube_x = Math.floor((Collision_h.x + Norm_h.x) / cluster.voxelUnitSize);
        NewCube_y = Math.floor((Collision_h.y + Norm_h.y) / cluster.voxelUnitSize);
        NewCube_z = Math.floor((Collision_h.z + Norm_h.z) / cluster.voxelUnitSize);
        if( ( ref = cluster.getVoxelRef( false, NewCube_x, NewCube_y, NewCube_z) ) && ref.sector && !ref.voxelType.properties.Is_PlayerCanPassThrough)
        {
            //console.log( `x check ${NewCube_x}  ${NewCube_y}  ${NewCube_z}    ${ActualCube_x} ${ActualCube_y} ${ActualCube_z}  ${MinW}  ${Collision_h.w}`)
            Out = { PredPointedVoxel : new THREE.Vector3( ActualCube_x, ActualCube_y, ActualCube_z ),
                    PointedVoxel : new THREE.Vector3( NewCube_x, NewCube_y, NewCube_z ),
                    ref : ref
                    };
          // printf(" MATCH_H: %lf\n",Collision_h.w);
          Match_h = Cycle;
          MinW = Collision_h.w;
        } else if( ref ) ref.delete();
      }
    }

    // Horizontal Z axis.

    if (Collide_Z)
    {
      if (Match_s == 0 && Collision_s.w < MinW)
      {
        ActualCube_x = Math.floor((Collision_s.x - Norm_s.x) / cluster.voxelUnitSize);
        ActualCube_y = Math.floor((Collision_s.y - Norm_s.y) / cluster.voxelUnitSize);
        ActualCube_z = Math.floor((Collision_s.z - Norm_s.z) / cluster.voxelUnitSize);
        NewCube_x = Math.floor((Collision_s.x + Norm_s.x) / cluster.voxelUnitSize);
        NewCube_y = Math.floor((Collision_s.y + Norm_s.y) / cluster.voxelUnitSize);
        NewCube_z = Math.floor((Collision_s.z + Norm_s.z) / cluster.voxelUnitSize);
        //console.log( `z check ${NewCube_x}  ${NewCube_y}  ${NewCube_z}  ${MinW}  ${Collision_s.w} `)
        if( ( ref = cluster.getVoxelRef( false, NewCube_x, NewCube_y, NewCube_z) ) && ref.sector && !ref.voxelType.properties.Is_PlayerCanPassThrough)
        {
            //console.log( `z check ${NewCube_x}  ${NewCube_y}  ${NewCube_z}  ${MinW}  ${Collision_s.w} `)
          Out = { PredPointedVoxel : new THREE.Vector3( ActualCube_x, ActualCube_y, ActualCube_z ),
                  PointedVoxel : new THREE.Vector3( NewCube_x, NewCube_y, NewCube_z ),
                  ref : ref
                   };
          // printf(" MATCH_S: %lf\n",Collision_s.w);
          Match_s = Cycle;
          MinW = Collision_s.w;
        } else if( ref ) ref.delete();
      }
    }

    // Vertical Y axis.

    if (Collide_Y)
    {
      if (Match_v==0 && Collision_v.w < MinW)
      {
        ActualCube_x = Math.floor((Collision_v.x - Norm_v.x) / cluster.voxelUnitSize);
        ActualCube_y = Math.floor((Collision_v.y - Norm_v.y) / cluster.voxelUnitSize);
        ActualCube_z = Math.floor((Collision_v.z - Norm_v.z) / cluster.voxelUnitSize);
        NewCube_x = Math.floor((Collision_v.x + Norm_v.x) / cluster.voxelUnitSize);
        NewCube_y = Math.floor((Collision_v.y + Norm_v.y) / cluster.voxelUnitSize);
        NewCube_z = Math.floor((Collision_v.z + Norm_v.z) / cluster.voxelUnitSize);
        if( ( ref = cluster.getVoxelRef( false, NewCube_x, NewCube_y, NewCube_z) ) && ref.sector && !ref.voxelType.properties.Is_PlayerCanPassThrough )
        {
            //console.log( `y check ${NewCube_x}  ${NewCube_y}  ${NewCube_z}  ${MinW}  ${Collision_v.w} `)
          Out = { PredPointedVoxel : new THREE.Vector3( ActualCube_x, ActualCube_y, ActualCube_z ),
                  PointedVoxel : new THREE.Vector3( NewCube_x, NewCube_y, NewCube_z ),
                  ref : ref
                   };
          // printf(" MATCH_V: %lf\n",Collision_v.w);
          Match_v = Cycle;
          MinW = Collision_v.w;
        } else if( ref ) ref.delete();
      }
    }

      //printf(" Match (H:%lf S:%lf V:%lf) \n", Collision_h.w, Collision_s.w, Collision_v.w);
      if (Match_h>0 && (Match_h - Cycle)<-100) return Out;
      if (Match_s>0 && (Match_s - Cycle)<-100) return Out;
      if (Match_v>0 && (Match_v - Cycle)<-100) return Out;

    Collision_h.x += Offset_h.x; Collision_h.y += Offset_h.y; Collision_h.z += Offset_h.z; Collision_h.w += Offset_h.w;
    Collision_v.x += Offset_v.x; Collision_v.y += Offset_v.y; Collision_v.z += Offset_v.z; Collision_v.w += Offset_v.w;
    Collision_s.x += Offset_s.x; Collision_s.y += Offset_s.y; Collision_s.z += Offset_s.z; Collision_s.w += Offset_s.w;
    Cycle ++;
  }
  Delta_h.delete();
  Delta_v.delete();
  Delta_s.delete();
  Offset_h.delete();
  Offset_v.delete();
  Offset_s.delete();
  Norm_h.delete();
  Norm_v.delete();
  Norm_s.delete();
  Collision_h.delete();
  Collision_v.delete();
  Collision_s.delete();

  return Out;
}

