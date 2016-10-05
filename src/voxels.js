
Voxelarium.Voxels = {
	types : [],
	add : function( type, properties,reaction ) {
        	//this.types.push(
						this[type] = {
						 ID : this.types.length
                		, name : type
                		, properties : properties
				, reaction : reaction
			 	, createVoxelExtension : null
				, deleteVoxelExtension : null
				, textureCoords : {}
				, image : null
				, texture : null
				, codeData : null
				, textureData : null
			}
		  //);
			if( typeof properties.DrawInfo === "undefined" )
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

Voxelarium.Voxels.types.push(
Voxelarium.Voxels.add( "Void", {
      Is_PlayerCanPassThrough : true,
      Draw_TransparentRendering : false,
      Draw_FullVoxelOpacity : false,
      DrawInfo : Voxelarium.ZVOXEL_DRAWINFO_VOID,
      Is_Harming : false,
      FrictionCoef : 0.0001,
      Grip_Vertical : 0.0,
      Grip_Horizontal : 0.8,
      Is_SpaceGripType : false,
      Is_KeepControlOnJumping : true,
      Is_Active : false,
      Is_CanBeReplacedBy_Water : true,
      Is_CombinableWith_GreenAcid : false,
      Is_CanBeReplacedBy_GreenAcid : true,
      Is_CanBeReplacedBy_MustardGaz : true,
      BvProp_CanBePickedUpByRobot : false,
      BvProp_XrRobotPickMinLevel : 255,
      BvProp_PrRobotReplaceMinLevel : 0,
      BvProp_PrRobotPickMinLevel : 255,
      BvProp_PrRobotMoveMinLevel : 0,
      BvProp_AtomicFireResistant : true,
      Is_Liquid : false,
      Is_Gaz : true,
      Is_Loadable_ByLoader_L1 : false,
      BvProp_MoveableByTreadmill : false,
      BvProp_EgmyT1Resistant : false,
      LiquidDensity : 0.0,
} ) );

Voxelarium.Voxels.getIndex = function( type ) {
	var types = Voxelarium.Voxels.types;
	return types.findIndex( (v)=>v === type );
}

var xhrObj;
Voxelarium.Voxels.load = function( cb ) {
	var n = 1
	xhrObj = new XMLHttpRequest();
	//var xhrObj2 = new XMLHttpRequest();
	loadAVoxel( n, cb );
}

function loadAVoxel( n, cb ) {
	{
		try {
			xhrObj.open('GET', `./src/voxels/voxel_${n}.js`);
			//xhrObj.responseType = "text";
			//xhrObj.response = "";
			xhrObj.send(null);
			xhrObj.onerror = (err)=>{
				  //console.log( "require ", n );
		      //console.log( err );
					cb();
					return;
			};
			xhrObj.onload = ()=>{
				if( !xhrObj.status || xhrObj.status === 200 ) {
					//console.log( "load ", n)
					Voxelarium.Voxels.types.push( eval(xhrObj.responseText) );
					var t = Voxelarium.Voxels.types[n];

					t.codeData = xhrObj.responseText;
					xhrObj.open('GET', `./src/voxels/images/voxel_${n}.png`);
					xhrObj.onerror = (err)=>{
						 console.log( "error:", err);
				     loadAVoxel( n+1, cb );
				  }
					xhrObj.send(null);
					xhrObj.onload = ()=>{
						if( xhrObj.responseText.length > 0 ) {
							( t.image = new Image() ).src = xhrObj.responseText;
							t.textureData = xhrObj.response;
							t.image.onerror = (err)=>{ console.log( "image load error?", err)}
							//console.log( t );
							if( true || !t.image.width )
							{
								t.image.onload = ()=> {
									 //console.log( "Waited until load to setup coords", t)
								   t.textureCoords = Voxelarium.TextureAtlas.add( t.image )
							  }
							} else {
								//console.log( "don't have to delay load?")
							  //t.textureCoords = Voxelarium.TextureAtlas.add( t.image )
						  }
						}
						loadAVoxel( n+1, cb );
					}
				}
				else {
					console.log( "All completed... out of loadables...")
					cb();
				}
			}
			//require( `./voxels/voxel_${n}.js` )
		}
		catch( err ) {
			console.log( "require ", n );
	        	console.log( err );
				cb();
		}
	}

}

//Voxelarium.Voxels.types[0] = Voxelarium.Voxels.types.Void;
//Voxelarium.Voxels.types[1] = Voxelarium.Voxels.types["BlackRock Blue"];
