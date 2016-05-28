
Voxelarium.Voxels = {
	types : [],
	add : function( type, properties,reaction ) {
        	this.types.push( this[type] = { properties : properties
				, reaction : reaction
			 	, createVoxelExtension : null
				, deleteVoxelExtension : null
				, TextureCoords : {}
			} );
			if( !properties.DrawInfo )
				properties.DrawInfo = Voxelarium.ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY;
			return this[type];
		}
/*
Is_PlayerCanPassThrough = false;
Draw_TransparentRendering = false;
Draw_FullVoxelOpacity = true;
DrawInfo = VoxelGlobalSettings.ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY;
ExtensionType = 0;
Is_VoxelExtension = false;
Is_HasAllocatedMemoryExtension = false;
MiningHardness = 1000.0f;
MiningType = 2;
Is_NoType = false;
Is_UserTypeTransformable = true;
Is_Harming = false;
FrictionCoef = 0.001;
Grip_Horizontal = 0.9;
Grip_Vertical = 0.0;
Is_SpaceGripType = false;
Is_KeepControlOnJumping = true;
HarmingLifePointsPerSecond = 0.0;
Is_Active = false;
Is_CanBeReplacedBy_Water = false;
Is_CanBeReplacedBy_GreenAcid = false;
Is_CanBeReplacedBy_MustardGaz = false;
Is_CombinableWith_GreenAcid = true;
Is_CanTriggerBomb = false;
Is_Liquid = false;
Is_Gaz = false;
Is_Interface_StoreBlock = false;
Is_Interface_PushBlock = false;
Is_Interface_PullBlock = false;
Is_Interface_GetInfo = false;
Is_Interface_SetInfo = false;
Is_Pumpable_ByPump_T1 = false;
Is_Pumpable_ByPump_T2 = false;
Is_Loadable_ByLoader_L1 = true;
BvProp_MoveableByTreadmill = true;
BvProp_FastMoving = false;
Is_Rideable = false;
Is_HasHelpingMessage = false;
BvProp_CanBePickedUpByRobot = true;
BvProp_XrRobotPickMinLevel = 1;
BvProp_PrRobotReplaceMinLevel = 0;
BvProp_PrRobotPickMinLevel = 0;
BvProp_PrRobotMoveMinLevel = 0;
BvProp_AtomicFireResistant = false;
BvProp_EgmyT1Resistant = false;
LiquidDensity = 0.0;
BlastResistance = 1;
FabInfo = null;
Documentation_PageNum = 0;
*/

}

require( "./voxels/voxel_1.js" )
