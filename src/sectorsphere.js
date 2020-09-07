import {Voxelarium} from "./Voxelarium.core.js"


Voxelarium.SectorSphere = function( world, Render_Distance_h, Render_Distance_v ) {
    var sphere = {

		SectorList : null,

		getEntryCount : function() { return SectorList.length; }
		getEntry( EntryNum ) { return SectorList[EntryNum]; }

		static void PartSort( uint Start, uint ItemCount, SphereEntry[] SortBuffer )
		{
			uint i, FirstPartCount, SecondPartCount, FirstPartStart, SecondPartStart, EndPart;
			if( ItemCount <= 1 )
			{
				return;
			}
			SecondPartCount = ItemCount / 2;
			FirstPartCount = ItemCount - SecondPartCount;
			FirstPartStart = Start;
			SecondPartStart = Start + FirstPartCount;
			EndPart = FirstPartStart + ItemCount;

			// Sort subtables

			PartSort( FirstPartStart, FirstPartCount, SortBuffer );
			PartSort( SecondPartStart, SecondPartCount, SortBuffer );

			// Copy first partition into buffer

			for( i = Start; i < SecondPartStart; i++ )
			{
				SortBuffer[i] = SectorList[i];
			}

			// Make partition fusion

			for( i = Start; i < EndPart; i++ )
			{
				if( FirstPartCount > 0 && SecondPartCount > 0 )
				{
					if( SortBuffer[FirstPartStart].SectorDistance <= SectorList[SecondPartStart].SectorDistance ) { SectorList[i] = SortBuffer[FirstPartStart++]; FirstPartCount--; }
					else { SectorList[i] = SectorList[SecondPartStart++]; SecondPartCount--; }
				}
				else
				{
					if( FirstPartCount != 0 ) { SectorList[i] = SortBuffer[FirstPartStart++]; FirstPartCount--; }
					else { SectorList[i] = SectorList[SecondPartStart++]; SecondPartCount--; }
				}
			}
		}

		static void Sort()
		{
			SphereEntry[] SortBuffer;
			SortBuffer = new SphereEntry[nSlots];
			if( nSlots > 0 ) PartSort( 0, nSlots, SortBuffer );
			//SortBuffer;
		}


/*
		public void debugout( string FileSpec )
		{
			StreamWriter sw = new StreamWriter( FileSpec, false );
			int i;
			for( i = 0; i < nSlots; i++ )
			{
				sw.WriteLine( "X:{0} Y:{1} Z:{2} Dist: {3}"
						, SectorList[i].x, SectorList[i].y, SectorList[i].z, SectorList[i].SectorDistance );
			}
			sw.Dispose();
		}
*/

    }

    {
        var x, y, z;
        var Offset;

        var dist_x, dist_y, dist_z;

        var nSlots = ( Render_Distance_h * 2 + 1 ) * ( Render_Distance_h * 2 + 1 ) * ( Render_Distance_v * 2 + 1 );

        SectorList = new SphereEntry[nSlots];
        for( var n = 0; n < nSlots; n++ ) {
            SectorList[n] = {
                 x, y, z,
			public int SectorDistance;
			public VoxelSector.RelativeVoxelOrds relative_pos;}
        }
        Offset = 0;
        for( x = -Render_Distance_h; x <= Render_Distance_h; x++ )
            for( y = -Render_Distance_v; y <= Render_Distance_v; y++ )
                for( z = -Render_Distance_h; z <= Render_Distance_h; z++ )
                {
                    dist_x = x * world.sectorSizeX;
                    dist_y = y * world.sectorSizeY;
                    dist_z = z * world.sectorSizeZ;
                    var entry;
                    SectorList[Offset++].push( entry = { x : x,
                        y : y,
                        z : z,
                        SectorDistance : (dist_x * dist_x + dist_y * dist_y + dist_z * dist_z)
                    } );

                    if( x < 0 )
                        if( y < 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_BELOW_LEFT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_BELOW_LEFT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.BELOW_LEFT;
                        else if( y > 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_ABOVE_LEFT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_ABOVE_LEFT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.ABOVE_LEFT;
                        else
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_LEFT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_LEFT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.LEFT;
                    else if( x > 0 )
                        if( y < 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_BELOW_RIGHT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_BELOW_RIGHT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.BELOW_RIGHT;
                        else if( y > 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_ABOVE_RIGHT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_ABOVE_RIGHT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.ABOVE_RIGHT;
                        else
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_RIGHT;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_RIGHT;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.RIGHT;
                    else
                        if( y < 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_BELOW;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_BELOW;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.BELOW;
                        else if( y > 0 )
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND_ABOVE;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD_ABOVE;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.ABOVE;
                        else
                            if( z < 0 )      entry.relative_pos = Voxelarium.RelativeVoxelOrds.BEHIND;
                            else if( z > 0 ) entry.relative_pos = Voxelarium.RelativeVoxelOrds.AHEAD;
                            else             entry.relative_pos = Voxelarium.RelativeVoxelOrds.INCENTER;
                }

        // Sort the list;

        Sort();
    }

return sphere;
}
