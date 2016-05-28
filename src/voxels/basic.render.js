
/* for reference */

		function Render( Display display, VoxelGameEnvironment game, VoxelWorld world )
		{
			var Time;
			var RenderedSectors;
			var i;
			var in_centerX, in_centerY, in_centerZ;

			// Update per cycle.
			var UpdatePerCycle = 2;
			var n;

			if( Stat_RefreshWaitingSectorCount < 50 ) UpdatePerCycle = 1;
			if( Stat_RefreshWaitingSectorCount < 500 ) UpdatePerCycle = 2;
			else if( Stat.SectorRefresh_TotalTime < 32 ) UpdatePerCycle = 5;
			Stat_RefreshWaitingSectorCount = 0;

			// Stat Reset

			Stat.SectorRefresh_Count = 0;
			Stat.SectorRefresh_TotalTime = 0;
			Stat.SectorRefresh_MinTime = 0;
			Stat.SectorRefresh_MaxTime = 0;
			Stat.SectorRender_Count = 0;
			Stat.SectorRender_TotalTime = 0;
			Stat.SectorRefresh_Waiting = 0;

			// Renderwaiting system

			for( i = 0; i < 64; i++ ) RefreshToDo[i] = 0;
			for( i = 63; i > 0; i-- )
			{
				n = RefreshWaiters[i];
				if( n > UpdatePerCycle ) n = UpdatePerCycle;
				UpdatePerCycle -= n;
				RefreshToDo[i] = n;
			}
			RefreshToDo[0] = UpdatePerCycle;

			for( i = 0; i < 64; i++ ) RefreshWaiters[i] = 0;

			// Computing Frustum and Setting up Projection
			int Sector_x, Sector_y, Sector_z;
			int x, y, z;

			VoxelSector sector;
			int Priority, PriorityBoost;
			uint Sector_Refresh_Count;

			// Transforming Camera coords to sector coords. One Voxel is 256 observer units. One sector is 16x16x32.
			btVector3 origin;
			Camera.location.getOrigin( out origin );

			Sector_x = ( origin.x >> ( world.VoxelBlockSizeBits + VoxelSector.ZVOXELBLOCSHIFT_X ) );
			Sector_y = ( origin.y >> ( world.VoxelBlockSizeBits + VoxelSector.ZVOXELBLOCSHIFT_Y ) );
			Sector_z = ( origin.z >> ( world.VoxelBlockSizeBits + VoxelSector.ZVOXELBLOCSHIFT_Z ) );

			in_centerX = origin.x & VoxelSector.ZVOXELBLOCMASK_X;
			in_centerY = origin.y & VoxelSector.ZVOXELBLOCMASK_Y;
			in_centerZ = origin.z & VoxelSector.ZVOXELBLOCMASK_Z;


			// Rendering loop
			// Preparation and first rendering pass

			RenderedSectors = 0;
			Sector_Refresh_Count = 0;
			var SectorSphereEntry;
			var SectorsToProcess = SectorSphere.GetEntryCount();

			var Cv = new THREE.Vector4();
            var Cv2 = new THREE.Vector4();
			Cv2.w = 0;
			Cv.w = 0;

			for( var Entry = 0; Entry < SectorsToProcess; Entry++ )
			{
				SectorSphere.GetEntry( Entry, out SectorSphereEntry );

				x = SectorSphereEntry.x + Sector_x;
				y = SectorSphereEntry.y + Sector_y;
				z = SectorSphereEntry.z + Sector_z;

				// for (x = Start_x ; x <= End_x ; x++)
				// for (y = Start_y; y <= End_y ; y++)
				// for (z = Start_z; z <= End_z ; z++)

				// try to see if sector is visible

				bool SectorVisible;

				Cv.x = (float)( ( x ) << ( voxelSizeBits + VoxelSector.ZVOXELBLOCSHIFT_X ) );
				Cv.y = (float)( ( y ) << ( voxelSizeBits + VoxelSector.ZVOXELBLOCSHIFT_Y ) );
				Cv.z = (float)( ( z ) << ( voxelSizeBits + VoxelSector.ZVOXELBLOCSHIFT_Z ) );

				SectorVisible = false;
				Cv2.x = ( 0 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 0 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 0 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 1 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 0 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 0 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 1 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 0 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 1 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 0 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 0 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 1 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 0 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 1 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 0 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 1 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 1 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 0 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 1 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 1 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 1 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );
				Cv2.x = ( 0 * cluster.sectorSizeX * voxelSize ); Cv2.y = ( 1 * cluster.sectorSizeY * voxelSize ); Cv2.z = ( 1 * cluster.sectorSizeZ * voxelSize );
				Cv2.Add( Cv, out Cv2 ); SectorVisible |= Is_PointVisible( Camera.location, Cv2 );

				sector = world.FindSector( x, y, z );
				Priority = RadiusZones.GetZone( x - Sector_x, y - Sector_y, z - Sector_z );
				PriorityBoost = ( SectorVisible && Priority <= 2 ) ? 1 : 0;
				// Go = true;

				if( sector != null )
				{
					if( sector.transparent_geometry.transparent_render_sorting != SectorSphereEntry.relative_pos )
					{
						sector.transparent_geometry.transparent_render_sorting = SectorSphereEntry.relative_pos;
						sector.Flag_Render_Dirty_Transparent = true;
						sector.transparent_geometry.sortedX = -1;
					}
					if( SectorSphereEntry.relative_pos == VoxelSector.RelativeVoxelOrds.INCENTER )
					{
						if( center_sorted_x != in_centerX
							|| center_sorted_y != in_centerY
							|| center_sorted_z != in_centerZ )
						{
							sector.Flag_Render_Dirty_Transparent = true;
							BuildSortListInSector( in_centerX, in_centerY, in_centerZ );
						}
					}


					sector.Flag_IsVisibleAtLastRendering = SectorVisible || Priority >= 3;
					// Display lists preparation
					if( ( sector.Flag_Render_Dirty  || sector.Flag_Render_Dirty_Transparent )
						&& GameEnv.Enable_NewSectorRendering )
					{

						// if (Sector_Refresh_Count < 5 || Priority==4)
						if( ( RefreshToDo[sector.RefreshWaitCount] != 0 ) || sector.Flag_HighPriorityRefresh )
						{

							if ( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING )
								Timer_SectorRefresh.Start();

							RefreshToDo[sector.RefreshWaitCount]--;
							sector.Flag_HighPriorityRefresh = false;

							//Log.log( "Draw sector geometry {0} {1} {2}", sector.Pos_x, sector.Pos_y, sector.Pos_z );

							MakeSectorRenderingData( sector );

							MakeSectorRenderingData_Sorted( sector, SectorSphereEntry.relative_pos
														, in_centerX, in_centerY, in_centerZ );
							//Log.log( "Drew sector geometry {0} {1} {2}", sector.Pos_x, sector.Pos_y, sector.Pos_z );

							Sector_Refresh_Count++;
							sector.RefreshWaitCount = 0;
							Stat.SectorRefresh_Count++;

							if( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING )
							{
								Timer_SectorRefresh.End(); Time = Timer_SectorRefresh.GetResult(); Stat.SectorRefresh_TotalTime += (uint)Time;
								if( Time < Stat.SectorRefresh_MinTime ) Stat.SectorRefresh_MinTime = (uint)Time;
								if( Time > Stat.SectorRefresh_MaxTime ) Stat.SectorRefresh_MaxTime = (uint)Time;
							}
						}
						else
						{
							sector.RefreshWaitCount++;
							if( sector.RefreshWaitCount > 31 ) sector.RefreshWaitCount = 31;
							if( Priority == 4 ) sector.RefreshWaitCount++;
							RefreshWaiters[sector.RefreshWaitCount]++;
							Stat_RefreshWaitingSectorCount++;
							Stat.SectorRefresh_Waiting++;
						}

					}


					// Rendering first pass
					if( sector.Flag_IsVisibleAtLastRendering
						&& ( !sector.Flag_Void_Regular )
						)
					{
						if( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING )
							Timer_SectorRefresh.Start();

						sector.solid_geometry.SetupUniforms( world.TextureAtlas.OpenGl_TextureRef );
						sector.solid_geometry.DrawBuffer();
						//glCallList( ( (ZRender_Interface_displaydata*)sector.DisplayData ).DisplayList_Regular[current_gl_camera] );

						Stat.SectorRender_Count++; RenderedSectors++;

						if( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING ) {
							Timer_SectorRefresh.End(); Time = Timer_SectorRefresh.GetResult(); Stat.SectorRender_TotalTime += (uint)Time;
						}
					}
				}
				else
				{
					if( GameEnv.Enable_LoadNewSector )
						world.RequestSector( x, y, z, Priority + PriorityBoost );
					if( VoxelGlobalSettings.COMPILEOPTION_DRAW_MISSING_SECTORS )
					{
						GL.Disable( EnableCap.DepthTest );
						if( SectorVisible ) // culling
							Render_EmptySector( display, world, x, y, z, 1.0f, 0.3f, 0.1f );
						GL.Enable( EnableCap.DepthTest );
					}
					//return;
				}
			}

			// Second pass rendering
			//GL.Disable( EnableCap.DepthTest );
			//GL.DepthMask( false );
			//glDepthMask( GL_FALSE );

#if !USE_GLES2
			GL.AlphaFunc( AlphaFunction.Greater, 0.2f );
			GL.Enable( EnableCap.AlphaTest );
#endif
			Display.EnableBlending( true );

			for( int Entry = 0; Entry < SectorsToProcess; Entry++ )
			{
				SectorSphere.GetEntry( Entry, out SectorSphereEntry );

				x = SectorSphereEntry.x + Sector_x;
				y = SectorSphereEntry.y + Sector_y;
				z = SectorSphereEntry.z + Sector_z;

				sector = world.FindSector( x, y, z );
				// printf("sector : %ld %ld %ld %lu\n", x, y, z, (uint)(sector != 0));9
				if( sector != null )
				{
					if( sector.Flag_IsVisibleAtLastRendering
					   && ( !sector.Flag_Void_Transparent )
					   )
					{
						if( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING )
							Timer_SectorRefresh.Start();

						sector.transparent_geometry.SetupUniforms( world.TextureAtlas.OpenGl_TextureRef );
						sector.transparent_geometry.DrawBuffer();
						//glCallList( ( (ZRender_Interface_displaydata*)sector.DisplayData ).DisplayList_Transparent[current_gl_camera] );
						Stat.SectorRender_Count++;

						if( VoxelGlobalSettings.COMPILEOPTION_FINETIMINGTRACKING )
						{
							Timer_SectorRefresh.End(); Time = Timer_SectorRefresh.GetResult();
							Stat.SectorRender_TotalTime += (uint)Time;
						}
					}

				}
			}
			GL.Enable( EnableCap.DepthTest );
			Display.EnableBlending( false );

			Timer.End();

			//printf("Frame Time : %lu Rend Sects: %lu Draw Faces :%lu Top:%lu Bot:%lu Le:%lu Ri:%lu Front:%lu Back:%lu\n",Timer.GetResult(), RenderedSectors, Stat_RenderDrawFaces, Stat_FaceTop, Stat_FaceBottom,
			//	   Stat_FaceLeft,Stat_FaceRight,Stat_FaceFront,Stat_FaceBack);

			//printf("RenderedSectors : %lu\n",RenderedSectors);
			//SDL_GL_SwapBuffers( );
		}
