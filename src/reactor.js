
Voxelarium.Reactor = function( world ) {
    var reactor = {
     StepOne : true,
     CycleNum : 0,
     world: world,

    processSectors : function ( world, LastLoopTime )
    {
        var x, y, z;

        var LowActivityTrigger;

        //Log.log( "Begin Reaction Processing" );
        var Sectors_processed = 0;
        var Voxels_Processed = 0;

        reactor.cycle++;

        if( !reactor.stepOne ) return;

        world.sectors.forEach( (Sector)=>{

            Sectors_processed++;

            LowActivityTrigger = Sector.Flag_IsActiveLowRefresh
                && ( ( ( CycleNum ) & Sector.LowRefresh_Mask ) == 0 );
            Sector.ModifTracker.SetActualCycleNum( CycleNum );
            if( Sector.Flag_IsActiveVoxels | LowActivityTrigger )
            {
                for( x = 0; x <= 6; x++ )
                {
                    if( Sector.near_sectors[x] != null )
                        Sector.near_sectors[x].ModifTracker.SetActualCycleNum( CycleNum );
                }

                var Extension = Sector.data.otherInfos;
                var VoxelP = Sector.data.data;

                var zofs, xofs;
                var IsActiveVoxels = false;
                MainOffset = 0;
                var RSx = Sector.Pos_x * Sector.size_x;
                var RSy = Sector.Pos_y * Sector.size_y;
                var RSz = Sector.Pos_z * Sector.size_z;
                var vref = {
                    world : world,
                    sector : Sector,
                }
                var sleep = Sector.data.sleepState;
                Sector.data.data.forEach( (voxel, MainOfset)=>{
                    if( sleep.get( MainOffset ) )
                        return;

                    vref.VoxelExtension = Extension[MainOffset];
                    vref.Type = VoxelP[MainOffset]
                    if( vref.Type.properties.Is_Active )
                    {

                        if( !Sector.ModifTracker.Get( MainOffset ) ) // If voxel is already processed, don't process it once more in the same cycle.
                        {
                            Voxels_Processed++;
                            vref.wx = RSx + ( vref.x = x );
                            vref.wy = RSy + ( vref.y = y );
                            vref.wz = RSz + ( vref.z = z );
                            vref.offset = MainOffset;
                            Sector.ModifTracker.Set(SecondaryOffset[i]);
                            try
                            {
                                if( vref.Type.React( vref, LastLoopTime ) )
                                    IsActiveVoxels = true;
                                else
                                    vref.Sector.data.sleepState.set( vref.offset );

                            }
                            catch( err )
                            {
                                console.log( "Voxel Reaction Exception : ", err );
                            }
                        }
                    }
                    else
                        sleep.set( MainOffset );
                    Sector.Flag_IsActiveVoxels = IsActiveVoxels;
                })
            }
        })
        //StepOne = false;
        //Log.log( "Finish Reaction Processing {0} {1} ", Sectors_processed, Voxels_Processed );
    }

    }
    return reactor;
}
