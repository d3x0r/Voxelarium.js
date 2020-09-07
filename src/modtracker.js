
import {Voxelarium} from "./Voxelarium.core.js"

import "./packedboolarray.js" 
Voxelarium.ModificationTracker = function(size) {
    return {
        lastCycle : -1,
        cycle : 0,
        modified : Voxelarium.PackedBoolArray( size ),
        clear : function(){ this.lastCycle = this.cycle; modified.clear(); },
        setCycle : function(cycle) { this.cycle = cycle },
        get : function( offset ) { if( this.lastCycle != this.cycle ) return false; return this.modified.get(offset); },
        set : function( offset ) { if( this.lastCycle != this.cycle ) this.clear();  this.modified.set(offset); }
    }
}
