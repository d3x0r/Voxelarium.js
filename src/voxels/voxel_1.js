


Voxelarium.Voxels.add( "BlackRockType", {
		VoxelTypeName:"BlackRock Blue",
		Draw_TransparentRendering:0,
		Draw_FullVoxelOpacity:1,
		MiningHardness : 2000,
		MiningType     : 1,
		Documentation_PageNum : 1322,
		EdgeColor : new THREE.Vector4( 101/256,126/256,229/256, 1.0 ),
		FaceColor : new THREE.Vector4( 0,0,0,1 ),
		EdgePower : 400,
		DrawInfo : Voxelarium.ZVOXEL_DRAWINFO_SHADER | Voxelarium.ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY
	},
	( self, tick )=>false );
