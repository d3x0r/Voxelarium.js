import {Voxelarium} from "./Voxelarium.core.js"



Voxelarium.Universe = function(  ) {
    var newUniverse = {
        worlds : [],

        //internal RenderInterface renderer;
        //VoxelSector[] SectorTable;
        //internal VoxelTypeManager VoxelTypeManager;
        //internal SectorLoader SectorLoader;

        internal TextureAtlas TextureAtlas;

    }
    return newUniverse;
}
