
import {Voxelarium} from "./Voxelarium.core.js"

import  "./cluster.js"
import {fonts} from "./voxel.fonts.js";

const typeCache = new Map();

Voxelarium.World = function() {
    return {
        clusters : [],

        createCluster( mesher, voxelUnitSize ) {
            var cluster = Voxelarium.Cluster(32,32,32);
            cluster.mesher = mesher;
            cluster.voxelUnitSize = voxelUnitSize || 20;
            cluster.getGeometryBuffer = Voxelarium.Settings.use_basic_material
                ? Voxelarium.GeometryBasicBuffer
                : Voxelarium.GeometryBuffer;
            this.clusters.push( cluster );
            return cluster;
        },

        createTextCluster( text, v, mesher, font, voxelUnitSize ) {
            var cluster = Voxelarium.Cluster(256*8,8,1);
            cluster.mesher = mesher;
            cluster.voxelUnitSize = voxelUnitSize || 20;
            cluster.getGeometryBuffer = Voxelarium.GeometryBufferMono;
            this.clusters.push( cluster );
            //var sector = cluster.createSector( 0, 0, 0 );
            var pos = { x:0, y:0};

            for( var n = 0; n < text.length; n++ ) {
                var ch = text.codePointAt(n);

                var w = fonts.drawCharacter( cluster, pos, v, ch, font )
                pos.x += w;
            }


            return cluster;
        },
	
        createDynamicTextCluster( text, opts ) {
		const v = opts.type;
		const mesher = opts.mesher;
		const font = opts.font;
		const voxelUnitSize = opts.size;

		let voxelTypeCache = typeCache.get(v);
		if( !voxelTypeCache ) typeCache.set(v,voxelTypeCache = {});
		const charCache = voxelTypeCache.chars;
		const pos = { x:0, y:0};
		let xofs = 0;
		for( var n = 0; n < text.length; n++ ) {
                        var ch = text.codePointAt(n);
			xofs = n*8;
			if( !voxelTypeCache[ch] ) {
			        var cluster = Voxelarium.Cluster(8,8,1);
	                	cluster.mesher = mesher;
	                	cluster.voxelUnitSize = voxelUnitSize || 1;
        			cluster.getGeometryBuffer = Voxelarium.GeometryBufferMono;
	                        fonts.drawCharacter( cluster, pos, v, ch, font )
				
				voxelTypeCache[ch] = [];//{ cluster: cluster, sector:sector, threeObject:threeObject };
				cluster.SectorList.forEach( (sector)=>{
					mesher.MakeSectorRenderingData( sector );
					voxelTypeCache[ch].push( { cluster: cluster, sector:sector, chars:[] } );
				} );
			}
		}

		const newWord = new THREE.Object3D();
		const objectData = {
			chars : [],
			
		};

		newWord.userData = objectData;
		for( var n = 0; n < text.length; n++ ) {
			var ch = text.codePointAt(n);
			xofs = n*8;
			// reuse the same cached geometry for the character.
			for( const data of voxelTypeCache[ch] ) {
				const threeObject = new THREE.Mesh( data.sector.solid_geometry.geometry, opts.shader );
				threeObject.userData = {
					cluster:data.cluster,
					sector:data.sector
				}
				objectData.chars.push( threeObject );
				//threeObject.onBeforeRender = data.sector.solid_geometry.updateUniforms.bind( data.sector.THREE_solid, opts );
				threeObject.position.add( new THREE.Vector3( xofs, 0, 0 ) );
				newWord.add( threeObject );
			}
		}
	
		// so it can be added to the scene?
		return {
			object: newWord,
			
			setText(text){
			}
		}
	}

    }
}
