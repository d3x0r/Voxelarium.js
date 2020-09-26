
import {Voxelarium} from "./Voxelarium.core.js"

import  "./cluster.js"
import {fonts} from "./voxel.fonts.js";

const typeCache = new Map();

Voxelarium.World = function() {
    const world = {
        clusters : [],

        createCluster( mesher, voxelUnitSize ) {
            var cluster = Voxelarium.Cluster(32,32,32);
            cluster.mesher = mesher;
            cluster.voxelUnitSize = voxelUnitSize || 20;
            cluster.getGeometryBuffer = Voxelarium.Settings.use_basic_material
                ? Voxelarium.GeometryBasicBuffer
                : Voxelarium.GeometryBuffer;
            world.clusters.push( cluster );
            return cluster;
        },

        createTextCluster( text, v, mesher, font, voxelUnitSize ) {
            var cluster = Voxelarium.Cluster(120*8,8,1);
            cluster.mesher = mesher;
            cluster.voxelUnitSize = voxelUnitSize || 20;
            cluster.getGeometryBuffer = Voxelarium.GeometryBufferMono;
            world.clusters.push( cluster );
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
		const voxelUnitSize = opts.size || 1;

		let voxelTypeCache = typeCache.get(v);
		if( !voxelTypeCache ) typeCache.set(v,voxelTypeCache = {});
		const charCache = voxelTypeCache.chars;
		const pos = { x:0, y:0};

		function renderChar( ch ) {
		        var cluster = Voxelarium.Cluster(8,8,1);
			cluster.mesher = mesher;
	        	cluster.voxelUnitSize = voxelUnitSize;
        		cluster.getGeometryBuffer = Voxelarium.GeometryBufferMono;
	        	fonts.drawCharacter( cluster, {x:0,y:0}, v, ch, font )
		
			voxelTypeCache[ch] = [];//{ cluster: cluster, sector:sector, threeObject:threeObject };
			cluster.SectorList.forEach( (sector)=>{
				mesher.MakeSectorRenderingData( sector );
				voxelTypeCache[ch].push( { cluster: cluster, sector:sector, chars:[] } );
			} );
		}



		const newWord = new THREE.Object3D();

		function putch(word, xofs, ch ) {
			// reuse the same cached geometry for the character.
			for( const data of voxelTypeCache[ch] ) {
				const threeObject = new THREE.Mesh( data.sector.solid_geometry.geometry, opts.shader );
				threeObject.userData = {
					cluster:data.cluster,
					sector:data.sector
				}
				threeObject.onBeforeRender = data.sector.solid_geometry.updateUniforms.bind( threeObject, opts );
				//objectData.chars.push( threeObject );
				//threeObject.onBeforeRender = data.sector.solid_geometry.updateUniforms.bind( data.sector.THREE_solid, opts );
				threeObject.position.add( new THREE.Vector3( xofs, 0, 0 ) );
				word.add( threeObject );
			}
		}


		const resultPhrase =  {
			object: newWord,
			
			setText(text){
				const o = this.object;
				for( var i = o.children.length - 1; i >= 0; i--) {
					o.remove(o.children[i]);
				}


				//newWord.userData = objectData;
				for( var n = 0; n < text.length; n++ ) {
					var ch = text.codePointAt(n);
					if( !voxelTypeCache[ch] ) {
						renderChar(ch);
					}
					putch( o, n*(8*voxelUnitSize), ch );
				}

				
			},
                        mouseOver( ray ) {
				console.log( "detect if the mouse is voer this?" );
			}
		}

		resultPhrase.setText( text );
		return resultPhrase;
		// so it can be added to the scene?
	}

    }
	return world;
}
