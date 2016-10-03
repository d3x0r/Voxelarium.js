"use strict";
var voxels = require( "./voxels.js")


Voxelarium.BasicMesher = function(  ) {
    var mesher = {
		Culler : function( cluster ) {
            var culler = {
              cluster : cluster,
    			cullSector : function( sector, internal_faces, interesting_faces ) {
    				if( internal_faces )
    					Render_Basic.SectorUpdateFaceCulling( sector, false );
    				else
    					Render_Basic.SectorUpdateFaceCulling_Partial( sector, interesting_faces, false );
    			},

    			cullSingleVoxel : function ( _Sector, offset ) {

    				var Offset = new Array(19);//uint[19];
    				var VoxelState = new Array(19);
    				var Voxel;
    				var sector = new Array(19);

    				var ExtFaceState;
    				var IntFaceState;

    				if( !( sector[Voxelarium.RelativeVoxelOrds.INCENTER] = _Sector ) ) return;
    				Offset[Voxelarium.RelativeVoxelOrds.INCENTER] = offset;
                    var cluster = _Sector.cluster;
    				Offset[Voxelarium.RelativeVoxelOrds.LEFT] = offset - ( 1 * cluster.sectorSizeY );
    				Offset[Voxelarium.RelativeVoxelOrds.RIGHT] = offset + ( 1 * cluster.sectorSizeY );
    				Offset[Voxelarium.RelativeVoxelOrds.AHEAD] = offset + ( 1 * cluster.sectorSizeX * cluster.sectorSizeY );
    				Offset[Voxelarium.RelativeVoxelOrds.BEHIND] = offset - ( 1 * cluster.sectorSizeX * cluster.sectorSizeY );
    				Offset[Voxelarium.RelativeVoxelOrds.ABOVE] = offset + ( 1 );
    				Offset[Voxelarium.RelativeVoxelOrds.BELOW] = offset - ( 1 );

    				if( 0 == ( ( offset / cluster.sectorSizeY ) % cluster.sectorSizeX ) )
    				{
    					if( !( sector[Voxelarium.RelativeVoxelOrds.LEFT] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.LEFT] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.LEFT] += ( cluster.sectorSizeX * cluster.sectorSizeY );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.LEFT] = _Sector;

    				if( (cluster.sectorSizeX-1) == ( ( offset / cluster.sectorSizeY ) % cluster.sectorSizeX ) )
    				{
    					if( null == ( sector[Voxelarium.RelativeVoxelOrds.RIGHT] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.RIGHT] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.RIGHT] -= ( cluster.sectorSizeX * cluster.sectorSizeY );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.RIGHT] = _Sector;

    				if( (cluster.sectorSizeZ-1) == ( ( offset / cluster.sectorSizeY ) % cluster.sectorSizeX ) )
    				{
    					if( null == ( sector[Voxelarium.RelativeVoxelOrds.AHEAD] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.INFRONT - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.AHEAD] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.AHEAD] -= ( cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.AHEAD] = _Sector;

    				if( 0 == ( ( offset / ( cluster.sectorSizeY * cluster.sectorSizeX ) ) % cluster.sectroSizeZ ) )
    				{
    					if( null == ( sector[Voxelarium.RelativeVoxelOrds.BEHIND] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.BEHIND] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.BEHIND] += ( cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.BEHIND] = _Sector;

    				if( (cluster.sectorSizeY-1) == ( offset % cluster.sectorSizeY ) )
    				{
    					if( null == ( sector[Voxelarium.RelativeVoxelOrds.ABOVE] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.ABOVE] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.ABOVE] -= ( cluster.sectorSizeY );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.ABOVE] = _Sector;

    				if( 0 == ( offset % cluster.sectorSizeY ) )
    				{
    					if( null == ( sector[Voxelarium.RelativeVoxelOrds.BELOW] = _Sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1] ) )
    						sector[Voxelarium.RelativeVoxelOrds.BELOW] = VoxelWorld.WorkingFullSector;
    					Offset[Voxelarium.RelativeVoxelOrds.BELOW] += ( cluster.sectorSizeY );
    				}
    				else
    					sector[Voxelarium.RelativeVoxelOrds.BELOW] = _Sector;

    				// Computing absolute memory pointer of blocks
    				for( var i = 0; i < 7; i++ )
    				{
    					sector[i].data.sleepState.clear( Offset[i] );
    					sector[i].Flag_IsActiveVoxels = true;

    					//Voxel_Address[i] = sector[i].Data.Data[Offset[i]];
    					VoxelType = ( sector[i].data.data[Offset[i]] );
    					if( ( VoxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY ) != 0 )
    						sector[i].Flag_Render_Dirty = true;
    					if( ( VoxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_DRAWTRANSPARENTRENDERING ) != 0 )
    						sector[i].Flag_Render_Dirty_Transparent = true;
    					VoxelState[i] = ( VoxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS );
    				}

    				VoxelType = _Sector.data.data[Offset[Voxelarium.RelativeVoxelOrds.INCENTER]];

    				// Getting case subtables.

    				ExtFaceState = Voxelarium.ExtFaceStateTable[VoxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
    				IntFaceState = Voxelarium.IntFaceStateTable[VoxelType.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];

    				// Computing face culling for center main stored voxel.

    				FaceCulling[Offset[Voxelarium.RelativeVoxelOrds.INCENTER]]
    												= (( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.LEFT]] & Voxelarium.FACEDRAW_Operations.LEFT )
    													   | ( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.RIGHT]] & Voxelarium.FACEDRAW_Operations.RIGHT )
    													   | ( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.INFRONT]] & Voxelarium.FACEDRAW_Operations.AHEAD )
    													   | ( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.BEHIND]] & Voxelarium.FACEDRAW_Operations.BEHIND )
    													   | ( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.ABOVE]] & Voxelarium.FACEDRAW_Operations.ABOVE )
    													   | ( IntFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.BELOW]] & Voxelarium.FACEDRAW_Operations.BELOW ))
    													   ;

    				// Computing face culling for nearboring voxels faces touching center voxel.
    				{
    					var Culler;
    					var Culling;
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.LEFT].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;

    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.LEFT];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.RIGHT ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.LEFT]] & Voxelarium.FACEDRAW_Operations.RIGHT ) );
    						Culling[ofs] = val;

    					}
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.RIGHT].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;
    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.RIGHT];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.LEFT ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.RIGHT]] & Voxelarium.FACEDRAW_Operations.LEFT ) );
    						Culling[ofs] = val;
    					}
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.AHEAD].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;
    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.AHEAD];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.BEHIND ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.AHEAD]] & Voxelarium.FACEDRAW_Operations.BEHIND ) );
    						Culling[ofs] = val;
    					}
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.BEHIND].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;
    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.BEHIND];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.AHEAD ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.BEHIND]] & Voxelarium.FACEDRAW_Operations.AHEAD ) );
    						Culling[ofs] = val;
    					}
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.ABOVE].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;
    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.ABOVE];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.BELOW ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.ABOVE]] & Voxelarium.FACEDRAW_Operations.BELOW ) );
    						Culling[ofs] = val;
    					}
    					if( ( Culler = sector[Voxelarium.RelativeVoxelOrds.BELOW].Culler ) != null )
    					{
    						Culling = Culler.FaceCulling;
    						var ofs = Offset[Voxelarium.RelativeVoxelOrds.BELOW];
    						var val = ( ( Culling[ofs] & ( ~Voxelarium.FACEDRAW_Operations.ABOVE ) )
    							| ( ExtFaceState[VoxelState[Voxelarium.RelativeVoxelOrds.BELOW]] & Voxelarium.FACEDRAW_Operations.ABOVE ) );
    						Culling[ofs] = val;
    					}
    				}
    				// printf("State[Center]:%x [Left]%x [Right]%x [INFRONT]%x [BEHIND]%x [ABOVE]%x [BELOW]%x\n",VoxelState[Voxelarium.RelativeVoxelOrds.INCENTER],VoxelState[Voxelarium.RelativeVoxelOrds.LEFT],VoxelState[Voxelarium.RelativeVoxelOrds.RIGHT],VoxelState[Voxelarium.RelativeVoxelOrds.INFRONT],VoxelState[Voxelarium.RelativeVoxelOrds.BEHIND],VoxelState[Voxelarium.RelativeVoxelOrds.ABOVE],VoxelState[Voxelarium.RelativeVoxelOrds.BELOW]);
    			},

    			cullSingleVoxel2 : function( x, y, z ) {
    				var sector = cluster.getSector( x / cluster.sectorSizeX, y / cluster.sectorSizeY, z / cluster.sectorSizeZ );
    				var offset = ( ( ( x % cluster.sectorSizeX ) * cluster.sectorSizeY )
    								+ ( y % cluster.sectorSizeY )
    								+ ( ( z % cluster.sectorSizeZ ) << ( cluster.sectorSizeY + cluster.sectorSizeX ) ) );
    				CullSingleVoxel( sector, offset );
    			}
            }

            culler.FaceCulling = new Array(cluster.sectorSize);
            var n;
            for( n = 0; n < cluster.sectorSize; n++ )
                culler.FaceCulling[n] = 0xFF;
            return culler;
        }
        , sectorTable : new Array(27)
		, SectorDataTable : new Array(27)
		, BlocMatrix : [new Array(9),new Array(9),new Array(9)]

    , initCulling : function( sector ) {
      var tmp = sector.data.FaceCulling = new Array( sector.cluster.sectorSize );
      for( var n = 0; n < tmp.length; n++ )
        tmp[n] = 0xFF;
    }
		,SectorUpdateFaceCulling : function ( sector, isolated )
		{
			var MissingSector;
      var cluster = sector.cluster;
			var tmpp;
			var i;
      var sectorTable = this.sectorTable;
      var SectorDataTable = this.SectorDataTable;
      var BlocMatrix = this.BlocMatrix;

			if( isolated ) MissingSector = cluster.WorkingEmptySector;
			else MissingSector = cluster.WorkingFullSector;

			// (Voxelarium.FACEDRAW_Operations.ABOVE | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.BEHIND);
			for( i = 0; i < 27; i++ ) sectorTable[i] = MissingSector;
			sectorTable[0] = sector; if( sectorTable[0] == null ) { return; }
			sectorTable[1] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1]; if( sectorTable[1] == null ) { sectorTable[1] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.LEFT; }
			sectorTable[2] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1]; if( sectorTable[2] == null ) { sectorTable[2] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.RIGHT; }
			sectorTable[3] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1]; if( sectorTable[3] == null ) { sectorTable[3] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.BEHIND; }
			sectorTable[6] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1]; if( sectorTable[6] == null ) { sectorTable[6] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.AHEAD; }
			sectorTable[9] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1]; if( sectorTable[9] == null ) { sectorTable[9] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.BELOW; }
			sectorTable[18] = sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1]; if( sectorTable[18] == null ) { sectorTable[18] = MissingSector; sectorTable[0].PartialCulling |= Voxelarium.FACEDRAW_Operations.ABOVE; }
			for( i = 0; i < 27; i++ ) SectorDataTable[i] = sectorTable[i].data.data;


			var xc, yc, zc;
			var xp, yp, zp;
			var xpp, ypp, zpp;
			var info;

      const tables = sector.cluster.lookupTables;
			//sectorTable[0].Flag_Void_Regular = true;
			//sectorTable[0].Flag_Void_Transparent = true;

			for( xc = 0; xc < cluster.sectorSizeX; xc++ )
			{
				xp = xc + 1; xpp = xc + 2;
				for( zc = 0; zc < cluster.sectorSizeZ; zc++ )
				{
					zp = zc + 1; zpp = zc + 2;

					// Prefetching the bloc matrix (only 2 rows)
					//    BlocMatrix[1][0] = SectorDataTable[(VoxelSector.tables.tableX[xc ]+tables.tableY[0]+tables.tableZ[zc ])][tables.ofTableX[xc]+tables.ofTableY[0]+tables.ofTableZ[zc]];
					BlocMatrix[1][1] = SectorDataTable[( tables.tableX[xp] + tables.tableY[0] + tables.tableZ[zc] )][tables.ofTableX[xp] + tables.ofTableY[0] + tables.ofTableZ[zc]];
					//    BlocMatrix[1][2] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[0]+tables.tableZ[zc ])][tables.ofTableX[xpp]+tables.ofTableY[0]+tables.ofTableZ[zc ]]
					BlocMatrix[1][3] = SectorDataTable[( tables.tableX[xc] + tables.tableY[0] + tables.tableZ[zp] )][tables.ofTableX[xc] + tables.ofTableY[0] + tables.ofTableZ[zp]];
					BlocMatrix[1][4] = SectorDataTable[( tables.tableX[xp] + tables.tableY[0] + tables.tableZ[zp] )][tables.ofTableX[xp] + tables.ofTableY[0] + tables.ofTableZ[zp]];
					BlocMatrix[1][5] = SectorDataTable[( tables.tableX[xpp] + tables.tableY[0] + tables.tableZ[zp] )][tables.ofTableX[xpp] + tables.ofTableY[0] + tables.ofTableZ[zp]];
					//    BlocMatrix[1][6] = SectorDataTable[(tables.tableX[xc ]+tables.tableY[0]+tables.tableZ[zpp])][tables.ofTableX[xc ]+tables.ofTableY[0]+tables.ofTableZ[zpp]]
					BlocMatrix[1][7] = SectorDataTable[( tables.tableX[xp] + tables.tableY[0] + tables.tableZ[zpp] )][tables.ofTableX[xp] + tables.ofTableY[0] + tables.ofTableZ[zpp]];
					//    BlocMatrix[1][8] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[0]+tables.tableZ[zpp])][tables.ofTableX[xpp]+tables.ofTableY[0]+tables.ofTableZ[zpp]]

					//    BlocMatrix[2][0] = SectorDataTable[(tables.tableX[xc ]+tables.tableY[1]+tables.tableZ[zc ])][tables.ofTableX[xc ]+tables.ofTableY[1]+tables.ofTableZ[zc ]]
					BlocMatrix[2][1] = SectorDataTable[( tables.tableX[xp] + tables.tableY[1] + tables.tableZ[zc] )][tables.ofTableX[xp] + tables.ofTableY[1] + tables.ofTableZ[zc]];
					//    BlocMatrix[2][2] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[1]+tables.tableZ[zc ])][tables.ofTableX[xpp]+tables.ofTableY[1]+tables.ofTableZ[zc ]]
					BlocMatrix[2][3] = SectorDataTable[( tables.tableX[xc] + tables.tableY[1] + tables.tableZ[zp] )][tables.ofTableX[xc] + tables.ofTableY[1] + tables.ofTableZ[zp]];
					BlocMatrix[2][4] = SectorDataTable[( tables.tableX[xp] + tables.tableY[1] + tables.tableZ[zp] )][tables.ofTableX[xp] + tables.ofTableY[1] + tables.ofTableZ[zp]];
					BlocMatrix[2][5] = SectorDataTable[( tables.tableX[xpp] + tables.tableY[1] + tables.tableZ[zp] )][tables.ofTableX[xpp] + tables.ofTableY[1] + tables.ofTableZ[zp]];
					//    BlocMatrix[2][6] = SectorDataTable[(tables.tableX[xc ]+tables.tableY[1]+tables.tableZ[zpp])][tables.ofTableX[xc ]+tables.ofTableY[1]+tables.ofTableZ[zpp]]
					BlocMatrix[2][7] = SectorDataTable[( tables.tableX[xp] + tables.tableY[1] + tables.tableZ[zpp] )][tables.ofTableX[xp] + tables.ofTableY[1] + tables.ofTableZ[zpp]];
					//    BlocMatrix[2][8] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[1]+tables.tableZ[zpp])][tables.ofTableX[xpp]+tables.ofTableY[1]+tables.ofTableZ[zpp]]

					for( yc = 0; yc < cluster.sectorSizeY; yc++ )
					{
						yp = yc + 1; ypp = yc + 2;

						// Scrolling bloc matrix by exchangingypp references.
						tmpp = BlocMatrix[0];
						BlocMatrix[0] = BlocMatrix[1];
						BlocMatrix[1] = BlocMatrix[2];
						BlocMatrix[2] = tmpp;

						// Fetching a new bloc of data slice;
                        var hereOfs;

						//      BlocMatrix[2][0] = SectorDataTable[(tables.tableX[xc ]+tables.tableY[ypp]+tables.tableZ[zc ])].Data;    [tables.ofTableX[xc ]+tables.ofTableY[ypp]+tables.ofTableZ[zc ]]
						BlocMatrix[2][1] = SectorDataTable[( tables.tableX[xp] + tables.tableY[ypp] + tables.tableZ[zc] )][tables.ofTableX[xp] + tables.ofTableY[ypp] + tables.ofTableZ[zc]];
						//      BlocMatrix[2][2] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[ypp]+tables.tableZ[zc ])].Data;	   [tables.ofTableX[xpp]+tables.ofTableY[ypp]+tables.ofTableZ[zc ]]
						BlocMatrix[2][3] = SectorDataTable[( tables.tableX[xc] + tables.tableY[ypp] + tables.tableZ[zp] )][tables.ofTableX[xc] + tables.ofTableY[ypp] + tables.ofTableZ[zp]];
						BlocMatrix[2][4] = SectorDataTable[( tables.tableX[xp] + tables.tableY[ypp] + tables.tableZ[zp] )][tables.ofTableX[xp] + tables.ofTableY[ypp] + tables.ofTableZ[zp]];
						BlocMatrix[2][5] = SectorDataTable[( tables.tableX[xpp] + tables.tableY[ypp] + tables.tableZ[zp] )][tables.ofTableX[xpp] + tables.ofTableY[ypp] + tables.ofTableZ[zp]];
                        if( !BlocMatrix[2][5] ){
                            console.log( "voxel in sector has become undefined.")
                            return;
                            //debugger
                        }
						//      BlocMatrix[2][6] = SectorDataTable[(tables.tableX[xc ]+tables.tableY[ypp]+tables.tableZ[zpp])].Data;	   [tables.ofTableX[xc ]+tables.ofTableY[ypp]+tables.ofTableZ[zpp]]
						BlocMatrix[2][7] = SectorDataTable[( tables.tableX[xp] + tables.tableY[ypp] + tables.tableZ[zpp] )][tables.ofTableX[xp] + tables.ofTableY[ypp] + tables.ofTableZ[zpp]];
						//      BlocMatrix[2][8] = SectorDataTable[(tables.tableX[xpp]+tables.tableY[ypp]+tables.tableZ[zpp])].Data;	   [tables.ofTableX[xpp]+tables.ofTableY[ypp]+tables.ofTableZ[zpp]]

						// Compute face culling info
						info = 0;
						if( BlocMatrix[1][4] )
						{
                            let MainVoxelDrawInfo = BlocMatrix[1][4].properties.DrawInfo;
							let SubTable = Voxelarium.IntFaceStateTable[MainVoxelDrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];

							info |= ( ( SubTable[BlocMatrix[1][1].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.BEHIND );
							info |= ( ( SubTable[BlocMatrix[1][7].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.AHEAD );
							info |= ( ( SubTable[BlocMatrix[1][3].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.LEFT );
							info |= ( ( SubTable[BlocMatrix[1][5].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.RIGHT );
							info |= ( ( SubTable[BlocMatrix[0][4].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.BELOW );
							info |= ( ( SubTable[BlocMatrix[2][4].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS] ) & Voxelarium.FACEDRAW_Operations.ABOVE );
						}

						// Write face culling info to face culling table
                        sector.data.FaceCulling[tables.ofTableX[xp] + tables.ofTableY[yp] + tables.ofTableZ[zp]] = info;
					}
				}
			}

		}


		,SectorUpdateFaceCulling_Partial : function ( cluster, sector
					, FacesToDraw, Isolated )
		{
			var MissingSector;
			var Sector_In, Sector_Out;
			var i;
			var CuledFaces;
			var Off_Ip, Off_In, Off_Op, Off_Out, Off_Aux;
			var VoxelData_In, VoxelData_Out;
			var VoxelFC_In;
			var x, y, z;
			var FaceState;
			//extern ushort IntFaceStateTable[][8];

			x = sector.pos.x;
			y = sector.pos.y;
			z = sector.pos.z;

			if( Isolated ) MissingSector = cluster.WorkingEmptySector;
			else MissingSector = cluster.WorkingFullSector;

			Sector_In = sector; if( Sector_In == null ) return ( 0 );
			Sector_Out = null;  // again a redundant assignment
			CuledFaces = 0;

			// Top Side
      VoxelFC_In = Sector_In.data.FaceCulling;
      VoxelData_In = Sector_In.data;

			if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.ABOVE ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1])
           || ( Sector_Out = MissingSector ) )  )
				{
					VoxelData_Out = Sector_Out.data;

					for( Off_Ip = cluster.sectorSizeY - 1, Off_Op = 0;
						Off_Ip < ( cluster.sectorSizeY * cluster.sectorSizeX );
						Off_Ip += cluster.sectorSizeY,
						Off_Op += cluster.sectorSizeY ) // x (0..15)
					{
						for( Off_Aux = 0;
							Off_Aux < ( cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ );
							Off_Aux += ( cluster.sectorSizeX * cluster.sectorSizeY ) ) // z (0..15)
						{
							Off_In = Off_Ip + Off_Aux;
							Off_Out = Off_Op + Off_Aux;
							FaceState = Voxelarium.IntFaceStateTable[VoxelData_In.data[Off_In].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][VoxelData_Out.data[Off_Out].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
							if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.ABOVE;
							else VoxelFC_In[Off_In] &= ( ( ~Voxelarium.FACEDRAW_Operations.ABOVE ) & 0xFF );
						}
					}
					CuledFaces |= Voxelarium.FACEDRAW_Operations.ABOVE;
				}
			// Bottom Side

			if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.BELOW ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1]) || ( Sector_Out = MissingSector)) != null )
				{
					VoxelData_Out = Sector_Out.data;

					for( Off_Ip = 0, Off_Op = cluster.sectorSizeY - 1;
						 Off_Ip < ( cluster.sectorSizeY * cluster.sectorSizeZ );
						 Off_Ip += cluster.sectorSizeY,
						 Off_Op += cluster.sectorSizeY ) // x (0..15)
					{
						for( Off_Aux = 0;
							 Off_Aux < ( cluster.sectorSizeX * cluster.sectorSizeY * cluster.sectorSizeZ );
							 Off_Aux += ( cluster.sectorSizeX * cluster.sectorSizeY ) ) // z (0..15)
						{
							Off_In = Off_Ip + Off_Aux;
							Off_Out = Off_Op + Off_Aux;
							Voxel_In = VoxelData_In.data[Off_In];
							Voxel_Out = VoxelData_Out.data[Off_Out];
							//ZVoxelType * VtIn =  VoxelTypeTable[ Voxel_In ];
							//ZVoxelType * VtOut = VoxelTypeTable[ Voxel_Out ];


							FaceState = Voxelarium.IntFaceStateTable[Voxel_In.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][Voxel_Out.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];

							//FaceState = IntFaceStateTable[ VoxelTypeTable[ VoxelData_In.Data[Off_In] ].DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS ][ VoxelTypeTable[ VoxelData_Out.Data[Off_Out] ].DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS ];
							if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.BELOW;
							else VoxelFC_In[Off_In] &= ( ~Voxelarium.FACEDRAW_Operations.BELOW & 0xFF );
						}
					}
					CuledFaces |= Voxelarium.FACEDRAW_Operations.BELOW;
				}
					// Left Side

					if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.LEFT ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT - 1]) || ( Sector_Out = MissingSector)) != null )
				{
					VoxelData_Out = Sector_Out.data;
					// VoxelData_In[63]=1;
					// VoxelData_In[63 + cluster.sectorSizeY*15 ]=14; // x
					// VoxelData_In[63 + cluster.sectorSizeY * cluster.sectorSizeX * 15] = 13; // z

					for( Off_Ip = 0, Off_Op = (cluster.sectorSizeY * ( cluster.sectorSizeX - 1 ));
						Off_Ip < ( cluster.sectorSizeY * cluster.sectorSizeX * cluster.sectorSizeZ );
						Off_Ip += ( cluster.sectorSizeY * cluster.sectorSizeX ),
						Off_Op += ( cluster.sectorSizeY * cluster.sectorSizeX ) ) // z (0..15)
					{
						for( Off_Aux = 0; Off_Aux < cluster.sectorSizeY; Off_Aux++ ) // y (0..63)
						{
							Off_In = Off_Ip + Off_Aux;
							Off_Out = Off_Op + Off_Aux;
							//VoxelData_In[Off_In]=1; VoxelData_Out[Off_Out]=14;
							FaceState = Voxelarium.IntFaceStateTable[VoxelData_In.data[Off_In].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][VoxelData_Out.data[Off_Out].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
							if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.LEFT;
							else VoxelFC_In[Off_In] &= ( ~Voxelarium.FACEDRAW_Operations.LEFT & 0xFF );
						}
					}
					CuledFaces |= Voxelarium.FACEDRAW_Operations.LEFT;
				}

			// Right Side

			if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.RIGHT ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1]) || ( Sector_Out = MissingSector)) != null )
				{
					VoxelData_Out = Sector_Out.data;

					for( Off_Ip = ( cluster.sectorSizeY * ( cluster.sectorSizeX - 1 )), Off_Op = 0;
						Off_Op < ( cluster.sectorSizeY * cluster.sectorSizeX * cluster.sectorSizeZ );
						Off_Ip += ( cluster.sectorSizeY * cluster.sectorSizeX ), Off_Op += ( cluster.sectorSizeY * cluster.sectorSizeX ) ) // z (0..15)
					{
						for( Off_Aux = 0; Off_Aux < cluster.sectorSizeY; Off_Aux++ ) // y (0..63)
						{
							Off_In = Off_Ip + Off_Aux;
							Off_Out = Off_Op + Off_Aux;
							FaceState = Voxelarium.IntFaceStateTable[VoxelData_In.data[Off_In].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][VoxelData_Out.data[Off_Out].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
							if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.RIGHT; else VoxelFC_In[Off_In] &= ( ~Voxelarium.FACEDRAW_Operations.RIGHT & 0xFF );
						}
					}
					CuledFaces |= Voxelarium.FACEDRAW_Operations.RIGHT;
				}

			// Front Side

			if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.AHEAD ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1]) || ( Sector_Out = MissingSector)) != null )
				{
					VoxelData_Out = Sector_Out.data;

					for( Off_Ip = ( cluster.sectorSizeY * cluster.sectorSizeX * ( cluster.sectorSizeZ - 1 ) ), Off_Op = 0;
						Off_Op < ( cluster.sectorSizeY * cluster.sectorSizeX );
						Off_Ip += cluster.sectorSizeY, Off_Op += cluster.sectorSizeY ) // x (0..15)
					{
						for( Off_Aux = 0; Off_Aux < cluster.sectorSizeY; Off_Aux++ ) // y (0..63)
						{
							Off_In = Off_Ip + Off_Aux;
							Off_Out = Off_Op + Off_Aux;
							FaceState = Voxelarium.IntFaceStateTable[VoxelData_In.data[Off_In].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][VoxelData_Out.data[Off_Out].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
							if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.AHEAD;
							else VoxelFC_In[Off_In] &= ( ~Voxelarium.FACEDRAW_Operations.AHEAD & 0xFF );
						}
					}
					CuledFaces |= Voxelarium.FACEDRAW_Operations.AHEAD;
				}

			// Back Side

			if( ( FacesToDraw & Voxelarium.FACEDRAW_Operations.BEHIND ) != 0 )
				if( ( ( Sector_Out = sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1] ) || ( Sector_Out = MissingSector ) ) != null )
						{
							VoxelData_Out = Sector_Out.data;

							for( Off_Ip = 0, Off_Op = ( cluster.sectorSizeY * cluster.sectorSizeX * ( cluster.sectorSizeZ - 1 ) );
								Off_Ip < ( cluster.sectorSizeY * cluster.sectorSizeX );
								Off_Ip += cluster.sectorSizeY, Off_Op += cluster.sectorSizeY ) // x (0..15)
							{
								for( Off_Aux = 0; Off_Aux < cluster.sectorSizeY; Off_Aux++ ) // y (0..63)
								{
									Off_In = Off_Ip + Off_Aux;
									Off_Out = Off_Op + Off_Aux;
									FaceState = Voxelarium.IntFaceStateTable[VoxelData_In.data[Off_In].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS][VoxelData_Out.data[Off_Out].properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_CULLINGBITS];
									if( FaceState != 0 ) VoxelFC_In[Off_In] |= Voxelarium.FACEDRAW_Operations.BEHIND; else VoxelFC_In[Off_In] &= ( ~Voxelarium.FACEDRAW_Operations.BEHIND & 0xFF );
								}
							}
							CuledFaces |= Voxelarium.FACEDRAW_Operations.BEHIND;
						}

			//sector.PartialCulling ^= CuledFaces & ( Voxelarium.FACEDRAW_Operations.ABOVE | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.BEHIND );
			//sector.PartialCulling &= ( Voxelarium.FACEDRAW_Operations.ABOVE | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.BEHIND );
			if( CuledFaces != 0 )
			{
				//Log.log( "sector {0} {1} {2} is dirty", sector.pos.x, sector.pos.y, sector.pos.z );
				Sector_Out.Flag_Render_Dirty = true;
        Sector_In.Flag_Render_Dirty = true;
			}

			return ( CuledFaces );
		}

		, UpdateCulling : function ( Location, ImportanceFactor )
		{
			if( Location.sector == null )
			{
				return;
			}
			Location.sector.cluster.culler.CullSingleVoxel( Location.sector, Location.Offset );

			Location.sector.Flag_IsModified |= ImportanceFactor;
		}

		, SetVoxel_WithCullingUpdate : function ( VoxelType
							, ImportanceFactor
							, CreateExtension
							, Location )
		{
			if( !Location.sector )
				return false;

			// Delete Old voxel extended informations if any
			var Voxel = Location.sector.data.data[Location.Offset];
			var OtherInfos = Location.sector.data.otherInfos[Location.Offset];

			if( OtherInfos )
			{
				if( VoxelType.properties.Is_HasAllocatedMemoryExtension ) Voxel.deleteVoxelExtension( otherInfos );
			}

			// Storing Extension
			if( VoxelType.createVoxelExtension )
				Location.sector.Data.OtherInfos[Location.Offset] = VoxelType.createVoxelExtension();

			// Storing Voxel

			Location.sector.data.data[Location.Offset] = VoxelType;

			if( VoxelType.properties.Is_Active )
				Location.sector.Flag_IsActiveVoxels = true;

			UpdateCulling( Location, ImportanceFactor );
			return ( true );
		}

		, MakeSectorRenderingData : function ( sector )
		{
			var face = new THREE.Vector4( 255, 0, 0, 255 ), edge = new THREE.Vector4( 0, 0, 0, 255 );
			var power = 400;
			var x, y, z;
			var ofs;
			var info;
			var cube;
			/* build sector geometry */
      var cluster = sector.cluster;
			var Offset;
			var cubx, cuby, cubz;
			var Sector_Display_x, Sector_Display_y, Sector_Display_z;
			var Draw;
            var P0,P1,P2,P3,P4,P5,P6,P7;

            if( !sector.solid_geometry ) {
                sector.solid_geometry = cluster.getGeometryBuffer();
                sector.Flag_Render_Dirty = true;
            }
            if( !sector.data.FaceCulling )
            {
                sector.culler = cluster.mesher.culler;
                this.initCulling( sector );
              }
			// Display list creation or reuse.
			if( sector.Flag_Render_Dirty )
			{
				var geometry = sector.solid_geometry;
				var voxelSize = cluster.voxelUnitSize;
				var FaceCulling = sector.data.FaceCulling;
				//Log.log( "Is Dirty Building sector {0} {1} {2}", sector.pos.x, sector.pos.y, sector.pos.z );
				Sector_Display_x = ( sector.pos.x * cluster.sectorSizeX * voxelSize );
				Sector_Display_y = ( sector.pos.y * cluster.sectorSizeY * voxelSize );
				Sector_Display_z = ( sector.pos.z * cluster.sectorSizeZ * voxelSize );

				sector.Flag_Void_Regular = true;
				sector.Flag_Void_Transparent = true;
				sector.Flag_Void_Custom = true;
                //sector.physics.Empty = true;
				{
					geometry.clear();
					/*
					Log.log( "sector is {6} {7} {8} near l{0} r{1} ab{2} bl{3} bh{4} ah{5}"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.LEFT-1] != null ) ? "Yes" : "no"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.RIGHT - 1] != null ) ? "Yes" : "no"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.ABOVE - 1] != null ) ? "Yes" : "no"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.BELOW - 1] != null ) ? "Yes" : "no"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.BEHIND - 1] != null ) ? "Yes" : "no"
						, ( sector.near_sectors[Voxelarium.RelativeVoxelOrds.AHEAD - 1] != null ) ? "Yes" : "no"
						, sector.pos.x, sector.pos.y, sector.pos.z
						);
					*/
          sector.data.data.forEach( (voxel,Offset)=>
					{
                        if( geometry.available > 256000 ){
                            debugger;
                            return;
                        }
                        if( !voxel ) return;
						{
							{
								info = FaceCulling[Offset];

								if( voxel && info != Voxelarium.FACEDRAW_Operations.NONE )
								{
                                    if( voxel.properties.DrawInfo === Voxelarium.ZVOXEL_DRAWINFO_VOID )
                                        Draw = false;
									else if( voxel.properties.Draw_TransparentRendering )
										{ Draw = false; sector.Flag_Void_Transparent = false; }
									else
										{ Draw = true; sector.Flag_Void_Regular = false; }
								}
								else
									Draw = false;

								if( Draw )
								{
									var box = voxel.TextureCoords;
									var face_is_shaded;

									if( !Voxelarium.Settings.use_basic_material &&
                      ( voxel.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_SHADER ) != 0 )
									{
										face = voxel.properties.FaceColor;
										edge = voxel.properties.EdgeColor;
										power = voxel.properties.EdgePower;
										face_is_shaded = true;
									}
									else 
                   {
                    cube = voxel;
	                  face_is_shaded = false; // uses texture instead of algorithm
                  }


									if( info != 0 )
									{
										//Log.log( "Set sector {0} {1} {2} offset {3}   {4:x}", sector.pos.x, sector.pos.y, sector.pos.z, Offset, info );
										//sector.physics.SetVoxel( Offset );
									}
									else
									{
										//sector.physics.ClearVoxel( Offset );
										//continue;
									}


                  cubx = Sector_Display_x + voxelSize * ( Math.floor( Offset / cluster.sectorSizeY ) % cluster.sectorSizeX );
									cuby = Sector_Display_y + voxelSize * ( ( Offset ) % cluster.sectorSizeY );
									cubz = Sector_Display_z + voxelSize * ( Math.floor( Offset / (cluster.sectorSizeX * cluster.sectorSizeY ) ) % cluster.sectorSizeZ );
									//cubx = ( x * voxelSize + Sector_Display_x );
									//cuby = ( y * voxelSize + Sector_Display_y );
									//cubz = ( z * voxelSize + Sector_Display_z );

									if( 0 != ( voxel.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_SPECIALRENDERING ))
									{ /*VoxelTypeTable[cube].SpecialRender( cubx, cuby, cubz ); */
										console.log( "Need to add custom pass for special render" );
										return;//continue;
									}

									P0 = new THREE.Vector3( cubx, cuby, cubz );
									P1 = new THREE.Vector3( cubx + voxelSize, cuby, cubz );
									P2 = new THREE.Vector3( cubx + voxelSize,cuby, cubz + voxelSize );
									P3 = new THREE.Vector3( cubx, cuby, cubz + voxelSize );
									P4 = new THREE.Vector3( cubx, cuby + voxelSize, cubz );
									P5 = new THREE.Vector3( cubx + voxelSize, cuby + voxelSize, cubz );
									P6 = new THREE.Vector3( cubx + voxelSize, cuby + voxelSize, cubz + voxelSize );
									P7 = new THREE.Vector3( cubx, cuby + voxelSize, cubz + voxelSize );

									//Left
									if( ( info & Voxelarium.FACEDRAW_Operations.LEFT ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P4 , P0, P3, P7 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.LEFT], P3, P7, P0, P4, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.LEFT], P3, P7, P0, P4, voxel.textureCoords );
									}

									// Right
									if( ( info & Voxelarium.FACEDRAW_Operations.RIGHT ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P5, P6, P2, P1 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.RIGHT], P1, P5, P2, P6, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.RIGHT], P1, P5, P2, P6, voxel.textureCoords );
									}
									//Front
									if( ( info & Voxelarium.FACEDRAW_Operations.BEHIND ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P0, P4, P5, P1 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.BEHIND], P0, P4, P1, P5, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.BEHIND], P0, P4, P1, P5, voxel.textureCoords );
									}

									//Back
									if( ( info & Voxelarium.FACEDRAW_Operations.AHEAD ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P2, P6, P3, P7 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.AHEAD], P2, P6, P3, P7, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.AHEAD], P2, P6, P3, P7, voxel.textureCoords );
									}

									// Top
									if( ( info & Voxelarium.FACEDRAW_Operations.ABOVE ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P4, P7, P5, P6 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.ABOVE], P4, P7, P5, P6, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.ABOVE], P4, P7, P5, P6, voxel.textureCoords );
									}

									// Bottom
									if( ( info & Voxelarium.FACEDRAW_Operations.BELOW ) != 0 )
									{
										//Log.log( "Add {0} {1} {2} {3}", P0, P1, P3, P2 );
										if( face_is_shaded )
											geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.BELOW], P3, P0, P2, P1, face, edge, power );
										else
											geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.BELOW], P3, P0, P2, P1, voxel.textureCoords );
									}
								}
								//else
								//	sector.physics.ClearVoxel( Offset );
							}
						}
					});
				}
        geometry.markDirty();
				sector.Flag_Render_Dirty = false;
			}
		}

        , fixed_lists : false

		, MakeSectorRenderingData_Sorted : function ( sector, viewed_as
											, centerX, centerY, centerZ )
		{
			if( sector.Flag_Void_Transparent )
				return;

			if( !fixed_lists )
			{
				for( var n = 19; n < 27; n++ )
					for( var m = 0; m < 3; m++ )
						OrderedFaces[n][m] = 0;
				fixed_lists = true;
			}

            var face = new THREE.Vector4( 256, 0, 0, 256 ), edge = new THREE.Vector4( 0, 0, 0, 256 );
			var power = 400;
			var x, y, z;
			var info;
			var sorted_draw_info = sorted_draw_infos[viewed_as];
			var cube, prevcube;
			/* build sector geometry */

			var Offset;
			var cubx, cuby, cubz;
			var Sector_Display_x, Sector_Display_y, Sector_Display_z;
			var Draw;

			var P0, P1, P2, P3, P4, P5, P6, P7;

			//Log.log( "Building sector {0} {1} {2}", sector.pos.x, sector.pos.y, sector.pos.z );
			// Display list creation or reuse.
			var geometry = sector.transparent_geometry;
			var voxelSize = sector.cluster.voxelUnitSize;
			var FaceCulling = sector.data.FaceCulling;
			Sector_Display_x = ( sector.pos.x * sector.Size_x * voxelSize );
			Sector_Display_y = ( sector.pos.y * sector.Size_y * voxelSize );
			Sector_Display_z = ( sector.pos.z * sector.Size_z * voxelSize );

			var SectorIndexes = SortedSectorIndexes[viewed_as];
			/*
			if( geometry.transparent_render_sorting != viewed_as )
			{
				geometry.transparent_render_sorting = viewed_as;
				sector.Flag_Render_Dirty_Transparent = true;
				geometry.sortedX = -1;
			}
			if( viewed_as == Voxelarium.RelativeVoxelOrds.INCENTER )
			{
				if( center_sorted_x != centerX
					|| center_sorted_y != centerY
					|| center_sorted_z != centerZ )
				{
					sector.Flag_Render_Dirty_Transparent = true;
					BuildSortListInSector( centerX, centerY, centerZ );
				}
			}
			*/
			if( sector.Flag_Render_Dirty_Transparent )
			{
				//Log.log( "Regnerate Alpha Geometry {0} {1} {2}", sector.pos.x, sector.pos.y, sector.pos.z );
				{
					var face_is_shaded = true;
					var view_order_list = null;
					geometry.Clear();

					prevcube = 0;
					for( var OffsetIndex = 0; OffsetIndex < VoxelSector.ZVOXELBLOCKCOUNT; OffsetIndex++ )
					{
						{
							{
								Offset = SectorIndexes[OffsetIndex];

								cube = sector.data.data[Offset];
								info = FaceCulling[Offset];// & (Voxelarium.FACEDRAW_Operations.ALL_BITS);// sorted_draw_info;
								//info = (Voxelarium.FACEDRAW_Operations)FaceCulling[Offset] & sorted_draw_info;

								if( cube && ( info )!= Voxelarium.FACEDRAW_Operations.NONE )
								{
									Draw = cube.properties.Draw_TransparentRendering;
								}
								else
									Draw = false;

								if( Draw )
								{
									var box;
									if( prevcube !== cube )
									{
										box = voxel.textureCoords;
										if( ( cube.properties.DrawInfo & Voxelarium.ZVOXEL_DRAWINFO_SHADER ) != 0 )
										{
											face = cube.properties.FaceColor;
											edge = cube.properties.EdgeColor;
											power = cube.properties.EdgePower;
											face_is_shaded = true;
										}
										else
											face_is_shaded = false;
									}
									prevcube = cube;

									cubx = ( Offset / cluster.sectorSizeY ) % cluster.sectorSizeX;
									cuby = ( Offset ) % cluster.sectorSizeY;
									cubz = ( Offset / (cluster.sectorSizeX * cluster.sectorSizeY ) ) % cluster.sectorSizeZ;

									P0.X = cubx; P0.Y = cuby; P0.Z = cubz;
									P1.X = cubx + voxelSize; P1.Y = cuby; P1.Z = cubz;
									P2.X = cubx + voxelSize; P2.Y = cuby; P2.Z = cubz + voxelSize;
									P3.X = cubx; P3.Y = cuby; P3.Z = cubz + voxelSize;
									P4.X = cubx; P4.Y = cuby + voxelSize; P4.Z = cubz;
									P5.X = cubx + voxelSize; P5.Y = cuby + voxelSize; P5.Z = cubz;
									P6.X = cubx + voxelSize; P6.Y = cuby + voxelSize; P6.Z = cubz + voxelSize;
									P7.X = cubx; P7.Y = cuby + voxelSize; P7.Z = cubz + voxelSize;


									if( viewed_as < 1 )
									{
										if( cubx < centerX )
											if( cuby < centerY )
												if( cubz < centerZ )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD];
											else
												if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD];
										else
											if( cuby < centerY )
											if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD];
										else
												if( cubz < centerZ )
											view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND];
										else
											view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD];
									}
									else if( viewed_as < 7 )
									{
										switch( viewed_as )
										{
										case Voxelarium.RelativeVoxelOrds.LEFT:
											if( cuby < centerY )
												if( cubz < centerZ )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD];
											else
												if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD];
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT:
											if( cuby < centerY )
												if( cubz < centerZ )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD];
											else
												if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD];
											break;
										case Voxelarium.RelativeVoxelOrds.AHEAD:
											if( cuby < centerY )
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD];
											else
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD];
											break;
										case Voxelarium.RelativeVoxelOrds.BEHIND:
											if( cuby < centerY )
												if( cubz < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND];
											else
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND];
											break;
										case Voxelarium.RelativeVoxelOrds.ABOVE:
											if( cubz < centerZ )
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_BEHIND];
											else
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_ABOVE_AHEAD];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE_AHEAD];
											break;
										case Voxelarium.RelativeVoxelOrds.BELOW:
											if( cubz < centerZ )
												if( cubz < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_BEHIND];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_BEHIND];
											else
												if( cubx < centerX )
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BELOW_AHEAD];
												else
													view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BELOW_AHEAD];
											break;
										}
									}
									else if( viewed_as < 19 )
									{
										switch( viewed_as )
										{
										case Voxelarium.RelativeVoxelOrds.LEFT_AHEAD:
											if( cuby < centerY )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD:
											if( cuby < centerY )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.LEFT_BEHIND:
											if( cuby < centerY )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND:
											if( cuby < centerY )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD:
											if( cubx < centerX )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_ABOVE];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.BELOW_AHEAD:
											if( cubx < centerX )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_BELOW];
											break;
										case Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND:
											if( cubx < centerX )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_ABOVE];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.BELOW_BEHIND:
											if( cubx < centerX )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_BELOW];
											break;
										case Voxelarium.RelativeVoxelOrds.LEFT_ABOVE:
											if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_ABOVE];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.LEFT_BELOW:
											if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_BEHIND_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.LEFT_AHEAD_BELOW];
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT_ABOVE:
											if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_ABOVE];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_ABOVE];
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT_BELOW:
											if( cubz < centerZ )
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND_BELOW];
											else
												view_order_list = OrderedFaces[Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD_BELOW];
											break;
										}
									}
									else
										view_order_list = OrderedFaces[viewed_as];
									for( var f = 0; f < 6; f++ )
									{
										switch( view_order_list[f] )
										{
										case Voxelarium.RelativeVoxelOrds.LEFT:
											//Left
											if( ( info & Voxelarium.FACEDRAW_Operations.LEFT ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P4 , P0, P3, P7 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.LEFT], P3, P7, P0, P4, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.LEFT], P3, P7, P0, P4, voxel.textureCoords );
											}
											break;
										case Voxelarium.RelativeVoxelOrds.RIGHT:

											// Right
											if( ( info & Voxelarium.FACEDRAW_Operations.RIGHT ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P5, P6, P2, P1 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.RIGHT], P1, P5, P2, P6, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.RIGHT], P1, P5, P2, P6, voxel.textureCoords );
											}
											break;
										case Voxelarium.RelativeVoxelOrds.BEHIND:
											//Front
											if( ( info & Voxelarium.FACEDRAW_Operations.BEHIND ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P0, P4, P5, P1 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.BEHIND], P0, P4, P1, P5, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.BEHIND], P0, P4, P1, P5, voxel.textureCoords );
											}
											break;
										case Voxelarium.RelativeVoxelOrds.AHEAD:
											//Back
											if( ( info & Voxelarium.FACEDRAW_Operations.AHEAD ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P2, P6, P3, P7 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.AHEAD], P2, P6, P3, P7, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.AHEAD], P2, P6, P3, P7, voxel.textureCoords );
											}
											break;
										case Voxelarium.RelativeVoxelOrds.ABOVE:
											// Top
											if( ( info & Voxelarium.FACEDRAW_Operations.ABOVE ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P4, P7, P5, P6 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.ABOVE], P4, P7, P5, P6, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.ABOVE], P4, P7, P5, P6, voxel.textureCoords );
											}
											break;
										case Voxelarium.RelativeVoxelOrds.BELOW:
											// Bottom
											if( ( info & Voxelarium.FACEDRAW_Operations.BELOW ) != 0 )
											{
												//Log.log( "Add {0} {1} {2} {3}", P0, P1, P3, P2 );
												if( face_is_shaded )
													geometry.AddQuad( normals[Voxelarium.RelativeVoxelOrds.BELOW], P3, P0, P2, P1, face, edge, power );
												else
													geometry.AddQuadTexture( normals[Voxelarium.RelativeVoxelOrds.BELOW], P3, P0, P2, P1, voxel.textureCoords );
											}
											break;
										}
									}
								}
							}
						}
					}
				}
                geometry.markDirty();

				sector.Flag_Render_Dirty_Transparent = false;
			}
		}



		, sorted_draw_infos : new Array( 27)
        , SortedSectorIndexes : new Array(27) //ushort[27][];
		, center_sorted_x : -1
        , center_sorted_y : 0
        , center_sorted_z : 0

		/// <summary>
		/// Build the INCENTER order list.
		/// </summary>
		/// <param name="x">voxel position of viewpoint</param>
		/// <param name="y">voxel position of viewpoint</param>
		/// <param name="z">voxel position of viewpoint</param>
		, BuildSortListInSector : function ( cluster, eye_x, eye_y, eye_z )
		{
			var x, y, z;
			var tmpx, tmpy, tmpz;
			var d;
			var val;
			if( center_sorted_x != eye_x || center_sorted_y != eye_y || center_sorted_z != eye_z )
			{
				var n;
				center_sorted_x = eye_x;
				center_sorted_y = eye_y;
				center_sorted_z = eye_z;
				// x, y, z po
				sorter.Clear();
				for( x = 0; x < cluster.sectorSizeX; x++ )
					for( y = 0; y < cluster.sectorSizeY; y++ )
						for( z = 0; z < cluster.sectorSizeZ; z++ )
						{
							val = (ushort)( x * cluster.sectorSizeY + y + z * cluster.sectorSizeX * cluster.sectorSizeY );
							tmpx = x - eye_x;
							tmpy = y - eye_y;
							tmpz = z - eye_z;
							d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
							sorter.Add( d, val );
						}

				var Indexes;
				Indexes = SortedSectorIndexes[0];
				n = VoxelSector.ZVOXELBLOCKCOUNT;
                sorter.forEach( (index)=>{
					// retrieved closest to furthest so... reverse storing it.
					Indexes[--n] = index;
                })
			}
		}


		, BuildSortList : function (  )
		{
			var x, y, z;
			var tmpx, tmpy, tmpz;
			var d;
			var val;
			var binaryOutput = new ushort[VoxelSector.ZVOXELBLOCKCOUNT];
			var binaryOutputIndex = 0;

            var sorter = Voxelarium.sorters[cluster.sectorSize];
            if( !sorter )
                sorter = Voxelarium.sorters[cluster.sectorSize] = Voxelarium.SortingTree( cluster.sectorSize );
			//start_steps += 27;
			sorter.AutoBalance = true;

			var i;
			for( i = Voxelarium.RelativeVoxelOrds.INCENTER;
						i <= Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT_BELOW; i++ )
			{
				var Indexes;
				var n, m;
				var xval, zval;
				Indexes = SortedSectorIndexes[i] = new ushort[VoxelSector.ZVOXELBLOCKCOUNT];
				n = 0;
				m = VoxelSector.ZVOXELBLOCKCOUNT - 1;
				sorter.Clear();
				switch( i )
				{
					case Voxelarium.RelativeVoxelOrds.INCENTER:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL;
						// no information; this one has to be done custom.
						break;
					case Voxelarium.RelativeVoxelOrds.LEFT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.LEFT;
						//for( n = 0; n < VoxelSector.ZVOXELBLOCKCOUNT; n++ )
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)(zval + y); //(ushort)( binaryOutput[n] );
									//x = ( val >> VoxelSector.ZVOXELBLOCSHIFT_Y ) & VoxelSector.ZVOXELBLOCMASK_X;
									//y = ( val  ) & VoxelSector.ZVOXELBLOCMASK_Y;
									//z = ( val >> ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) & VoxelSector.ZVOXELBLOCMASK_Z;
									tmpx = cluster.sectorSizeX - x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									//Log.log("Add {0} {1} {2}  {3}", x, y, z, d);
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.RIGHT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.RIGHT;
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.ABOVE;
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.BELOW;
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = cluster.sectorSizeY - y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.AHEAD;
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ Voxelarium.FACEDRAW_Operations.BEHIND;
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;

					case Voxelarium.RelativeVoxelOrds.LEFT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ (Voxelarium.FACEDRAW_Operations.LEFT|Voxelarium.FACEDRAW_Operations.AHEAD);
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.RIGHT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.AHEAD );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.LEFT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.BEHIND );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.RIGHT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.BEHIND );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y - ( cluster.sectorSizeY / 2 );
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;

					case Voxelarium.RelativeVoxelOrds.ABOVE_LEFT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_RIGHT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.BEHIND | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									val = (ushort)( x * cluster.sectorSizeY + y + z * cluster.sectorSizeX * cluster.sectorSizeY );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;

					case Voxelarium.RelativeVoxelOrds.ABOVE_LEFT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_RIGHT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_LEFT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.BEHIND |Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									val = (ushort)( x * cluster.sectorSizeY + y + z * cluster.sectorSizeX * cluster.sectorSizeY );
									tmpx = cluster.sectorSizeX - x;
									tmpy = y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.ABOVE_RIGHT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.BEHIND |Voxelarium.FACEDRAW_Operations.ABOVE );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;

					case Voxelarium.RelativeVoxelOrds.BELOW_LEFT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.BELOW );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_RIGHT:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.BELOW );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = z - ( cluster.sectorSizeZ / 2 );
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.BEHIND | Voxelarium.FACEDRAW_Operations.BELOW );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = cluster.sectorSizeY - y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.AHEAD | Voxelarium.FACEDRAW_Operations.BELOW );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x - ( cluster.sectorSizeX / 2 );
									tmpy = cluster.sectorSizeY - y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;

					case Voxelarium.RelativeVoxelOrds.BELOW_LEFT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.AHEAD );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_RIGHT_AHEAD:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.AHEAD );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_LEFT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.LEFT | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.BEHIND );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = cluster.sectorSizeX - x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
					case Voxelarium.RelativeVoxelOrds.BELOW_RIGHT_BEHIND:
						sorted_draw_infos[i] = Voxelarium.FACEDRAW_Operations.ALL ^ ( Voxelarium.FACEDRAW_Operations.RIGHT | Voxelarium.FACEDRAW_Operations.BELOW | Voxelarium.FACEDRAW_Operations.BEHIND );
						for( x = 0; x < cluster.sectorSizeX; x++ )
						{
							xval = x * cluster.sectorSizeY;
							for( z = 0; z < cluster.sectorSizeZ; z++ )
							{
								zval = xval + z * cluster.sectorSizeX * cluster.sectorSizeY;
								for( y = 0; y < cluster.sectorSizeY; y++ )
								{
									val = (ushort)( zval + y );
									tmpx = x;
									tmpy = cluster.sectorSizeY - y;
									tmpz = cluster.sectorSizeZ - z;
									d = ( tmpx * tmpx ) + ( tmpy * tmpy ) + ( tmpz * tmpz );
									sorter.Add( d, val );
								}
							}
						}
						break;
				}

				n = VoxelSector.ZVOXELBLOCKCOUNT;
				sorcer.forEach( ()=>
    				{
    					// retrieved closest to furthest so... reverse storing it.
    					//Log.log( "index is {0} {1} {2}"
    					//	, ( index >> VoxelSector.ZVOXELBLOCSHIFT_Y ) & VoxelSector.ZVOXELBLOCMASK_X
    					//	, index & VoxelSector.ZVOXELBLOCMASK_Y
    					//	, ( index >> ( VoxelSector.ZVOXELBLOCSHIFT_X + VoxelSector.ZVOXELBLOCSHIFT_Y ) ) & VoxelSector.ZVOXELBLOCMASK_Z );
    					Indexes[--n] = index;
    				} );
				start_percent = ( ++start_step * 100 ) / start_steps;


				// strong test to make sure every offset is represented once.
				// paranoid debugging.
				/*
				if( i != Voxelarium.RelativeVoxelOrds.INCENTER )
				{
					int ofs, check;
					for( ofs = 0; ofs < VoxelSector.ZVOXELBLOCKCOUNT; ofs++ )
					{
						for( check = 0; check < VoxelSector.ZVOXELBLOCKCOUNT; check++ )
						{
							if( Indexes[check] == ofs )
								break;
						}
						if( check == VoxelSector.ZVOXELBLOCKCOUNT )
							Debugger.Break();
					}
				}
				*/
			}
		}
    }

    return mesher;
}

const normals = [ THREE.Vector3Zero
        , THREE.Vector3Left
        , THREE.Vector3Right
        , THREE.Vector3Ahead
        , THREE.Vector3Behind
        , THREE.Vector3Above
        , THREE.Vector3Below ];


Voxelarium.OrderedFaces = [
    // CENTER
          null
    // LEFT 1
        , null
    // RIGHT 2
        , null
    // AHEAD 3
        , null
    // BEHIND 4
        , null
    // ABOVE 5
        , null
    // BELOW 6
        , null
    // LEFT_ABOVE  7
        , null
    // RIGHT_ABOVE 8
        , null
    // AHEAD_ABOVE 9
        , null
    // BEHIND_ABOVE  10
        , null
    // LEFT_AHEAD 11
        , null
    // RIGHT_AHEAD 12
        , null
    // LEFT_BELOW 13
        , null
    //RIGHT_BELOW //14
        , null
    //INFRONT_BELOW //15
        , null
    //BEHIND_BELOW  //16
        , null
    //LEFT_BEHIND   //17
        , null
    //BEHIND_RIGHT   //18
        , null
    // LEFT_AHEAD_ABOVE   // 19
        , [ Voxelarium.RelativeVoxelOrds.LEFT, Voxelarium.RelativeVoxelOrds.AHEAD,Voxelarium.RelativeVoxelOrds.ABOVE,Voxelarium.RelativeVoxelOrds.BELOW,Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.RIGHT ]
    // RIGHT_AHEAD_ABOVE  // 20
        , [ Voxelarium.RelativeVoxelOrds.RIGHT, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.LEFT ]
    // LEFT_AHEAD_BELOW   // 21
        , [ Voxelarium.RelativeVoxelOrds.LEFT, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.RIGHT ]
    // RIGHT_AHEAD_BELOW  // 22
        , [ Voxelarium.RelativeVoxelOrds.RIGHT, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.LEFT ]
    // LEFT_BEHIND_ABOVE  // 23
        , [ Voxelarium.RelativeVoxelOrds.LEFT, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.RIGHT ]
    // RIGHT_BEHIND_ABOVE // 24
        , [ Voxelarium.RelativeVoxelOrds.RIGHT, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.LEFT ]
    // LEFT_BEHIND_BELOW  // 25
        , [ Voxelarium.RelativeVoxelOrds.LEFT, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.RIGHT ]
    // RIGHT_BEHIND_BELOW // 26
        , [ Voxelarium.RelativeVoxelOrds.RIGHT, Voxelarium.RelativeVoxelOrds.BEHIND, Voxelarium.RelativeVoxelOrds.BELOW, Voxelarium.RelativeVoxelOrds.ABOVE, Voxelarium.RelativeVoxelOrds.AHEAD, Voxelarium.RelativeVoxelOrds.LEFT ]
    ];

Voxelarium.mesher = { sorters : [] }
