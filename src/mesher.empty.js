"use strict";
import * as THREE from "../three.js/build/three.module.js"

import {voxels} from  "./voxels.js"


class emptyMesher {
     mesher = {
		Culler : 

	 function initCulling( sector ) {
      var tmp = sector.data.FaceCulling = new Array( sector.cluster.sectorSize );
      for( var n = 0; n < tmp.length; n++ )
        tmp[n] = 0xFF;
    }
		function SectorUpdateFaceCulling( sector, isolated )
		{
		}


		 function SectorUpdateFaceCulling_Partial( cluster, sector
					, FacesToDraw, Isolated )
		{

			return ( CuledFaces );
		}

		function UpdateCulling( Location, ImportanceFactor )
		{
			if( Location.sector == null )
		}

		 function SetVoxel_WithCullingUpdate( VoxelType
							, ImportanceFactor
							, CreateExtension
							, Location )
		{
		}

		, function MakeSectorRenderingData( sector )
		{
		}

		, MakeSectorRenderingData_Sorted : function ( sector, viewed_as
											, centerX, centerY, centerZ )
		{

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
		}
    }

    return mesher;
}


//Voxelarium.mesher = { sorters : [] }
