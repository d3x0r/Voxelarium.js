
Voxelarium.D = function( valname, value ) {
    if( typeof valname == "object" ) {
        Object.keys(valname).forEach( (key)=>{
            Object.defineProperty(Voxelarium, key, { value:valname[key], writable: false })
        })
    } else
        Object.defineProperty(Voxelarium, valname, { writable: false })
}
Voxelarium.Enum = function( valname, value ) {
    if( typeof valname == "object" ) {
        Object.keys(valname).forEach( (key)=>{
            Object.defineProperty(Voxelarium, key, { value:valname[key], writable: false })
            Object.keys(valname[key]).forEach( (evalue)=>{
                Object.defineProperty(Voxelarium[key], evalue, { value:valname[key][evalue], writable: false })

            })
        })
    } else
        Object.defineProperty(Voxelarium, valname, { writable: false })
}


Voxelarium.D( {
        ZVOXEL_DRAWINFO_VOID : 0,
//public const int ZVOXEL_DRAWINFO_NOTVOID = 1;
    ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY : 1,
  ZVOXEL_DRAWINFO_DRAWTRANSPARENTRENDERING : 2,
  ZVOXEL_DRAWINFO_SPECIALRENDERING : 8,
  ZVOXEL_DRAWINFO_SHADER : 16,
  ZVOXEL_DRAWINFO_DECAL : 32,  // image is used over shader output
})
Voxelarium.D( {
    ZVOXEL_DRAWINFO_CULLINGBITS : ( /*ZVOXEL_DRAWINFO_NOTVOID |*/ Voxelarium.ZVOXEL_DRAWINFO_DRAWFULLVOXELOPACITY | Voxelarium.ZVOXEL_DRAWINFO_DRAWTRANSPARENTRENDERING )
});


Voxelarium.Enum( {
    FACEDRAW_Operations : {
			LEFT : 0x00001
		, RIGHT : 0x00002
		, AHEAD : 0x00004
		, BEHIND : 0x00008
		, ABOVE : 0x00010
		, BELOW : 0x00020
		, LEFT_HAS_ABOVE : 0x00000400
		, LEFT_HAS_BELOW : 0x00000800
		, LEFT_HAS_AHEAD : 0x00001000
		, LEFT_HAS_BEHIND : 0x00002000
		, RIGHT_HAS_ABOVE : 0x00004000
		, RIGHT_HAS_BELOW : 0x00008000
		, RIGHT_HAS_AHEAD : 0x00010000
		, RIGHT_HAS_BEHIND : 0x00020000
		, ABOVE_HAS_LEFT : 0x00000400//LEFT_HAS_ABOVE
		, ABOVE_HAS_RIGHT : 0x00004000//RIGHT_HAS_ABOVE
		, ABOVE_HAS_AHEAD : 0x00040000
		, ABOVE_HAS_BEHIND : 0x00080000
		, BELOW_HAS_LEFT : 0x00000800//LEFT_HAS_BELOW
		, BELOW_HAS_RIGHT : 0x00008000//RIGHT_HAS_BELOW
		, BELOW_HAS_AHEAD : 0x00100000
		, BELOW_HAS_BEHIND : 0x00200000
		, AHEAD_HAS_LEFT : 0x00001000//LEFT_HAS_AHEAD
		, AHEAD_HAS_RIGHT : 0x00100000//RIGHT_HAS_AHEAD
		, AHEAD_HAS_ABOVE : 0x00040000//ABOVE_HAS_AHEAD
		, AHEAD_HAS_BELOW : 0x00100000//BELOW_HAS_AHEAD
		, BEHIND_HAS_LEFT : 0x00002000//LEFT_HAS_BEHIND
		, BEHIND_HAS_RIGHT : 0x00020000//RIGHT_HAS_BEHIND
		, BEHIND_HAS_ABOVE : 0x00080000//ABOVE_HAS_BEHIND
		, BEHIND_HAS_BELOW : 0x00200000//BELOW_HAS_BEHIND
		, ALL : ( 1|2|4|8|16|32 /* LEFT | RIGHT | AHEAD | BEHIND | ABOVE | BELOW */ )
		, NONE : 0x00000
		, FLANK : ( 1|2|4|8 /* LEFT | RIGHT | AHEAD | BEHIND */ )
		, UD : ( 16|32 /*ABOVE | BELOW*/ )
		, ALL_BITS : 0x3FFFFF
    }});


Voxelarium.Enum( { RelativeVoxelOrds : {
	INCENTER :0
   , LEFT     :1
   , RIGHT :2
   , INFRONT :3
   , AHEAD : 3 //RelativeVoxelOrds.INFRONT
   , BEHIND  :4
   , ABOVE   :5
   , BELOW   :6

   , LEFT_ABOVE :7
   , ABOVE_LEFT : 7//RelativeVoxelOrds.LEFT_ABOVE
   , RIGHT_ABOVE :8
   , ABOVE_RIGHT : 8//RelativeVoxelOrds.RIGHT_ABOVE

   , INFRONT_ABOVE :9
   , AHEAD_ABOVE : 9// RelativeVoxelOrds.INFRONT_ABOVE
   , ABOVE_AHEAD : 9//RelativeVoxelOrds.INFRONT_ABOVE

   , BEHIND_ABOVE  :10
   , ABOVE_BEHIND : 10//RelativeVoxelOrds.BEHIND_ABOVE

   , LEFT_AHEAD   :11
   , AHEAD_LEFT : 11//RelativeVoxelOrds.LEFT_AHEAD

   , RIGHT_AHEAD   :12
   , AHEAD_RIGHT : 12//RelativeVoxelOrds.RIGHT_AHEAD

   , LEFT_BELOW :13
   , BELOW_LEFT : 13//RelativeVoxelOrds.LEFT_BELOW
   , RIGHT_BELOW :14
   , BELOW_RIGHT : 14//RelativeVoxelOrds.RIGHT_BELOW
   , INFRONT_BELOW :15
   , AHEAD_BELOW : 15//RelativeVoxelOrds.INFRONT_BELOW
   , BELOW_AHEAD : 15//RelativeVoxelOrds.INFRONT_BELOW
   , BEHIND_BELOW  :16
   , BELOW_BEHIND : 16//RelativeVoxelOrds.BEHIND_BELOW

   , LEFT_BEHIND   :17
   , BEHIND_LEFT : 17//RelativeVoxelOrds.LEFT_BEHIND
   , BEHIND_RIGHT   :18
   , RIGHT_BEHIND : 18//RelativeVoxelOrds.BEHIND_RIGHT


   , LEFT_AHEAD_ABOVE   : 19
   , RIGHT_AHEAD_ABOVE  : 20
   , LEFT_AHEAD_BELOW   : 21
   , RIGHT_AHEAD_BELOW  : 22
   , LEFT_BEHIND_ABOVE  : 23
   , RIGHT_BEHIND_ABOVE : 24
   , LEFT_BEHIND_BELOW  : 25
   , RIGHT_BEHIND_BELOW : 26

   , LEFT_ABOVE_AHEAD : 19//RelativeVoxelOrds.LEFT_AHEAD_ABOVE   //: 19
   , RIGHT_ABOVE_AHEAD : 20//RelativeVoxelOrds.RIGHT_AHEAD_ABOVE  // : 20
   , LEFT_BELOW_AHEAD : 21//RelativeVoxelOrds.LEFT_AHEAD_BELOW     //: 21
   , RIGHT_BELOW_AHEAD : 22//RelativeVoxelOrds.RIGHT_AHEAD_BELOW   //: 22
   , LEFT_ABOVE_BEHIND : 23//RelativeVoxelOrds.LEFT_BEHIND_ABOVE  //: 23
   , RIGHT_ABOVE_BEHIND : 24//RelativeVoxelOrds.RIGHT_BEHIND_ABOVE// : 24
   , LEFT_BELOW_BEHIND : 25//RelativeVoxelOrds.LEFT_BEHIND_BELOW  //: 25
   , RIGHT_BELOW_BEHIND : 26//RelativeVoxelOrds.RIGHT_BEHIND_BELOW// : 26

   , ABOVE_AHEAD_LEFT : 19//RelativeVoxelOrds.LEFT_AHEAD_ABOVE   //: 19
   , ABOVE_AHEAD_RIGHT : 20//RelativeVoxelOrds.RIGHT_AHEAD_ABOVE  // : 20
   , BELOW_AHEAD_LEFT : 21//RelativeVoxelOrds.LEFT_AHEAD_BELOW    // : 21
   , BELOW_AHEAD_RIGHT : 22//RelativeVoxelOrds.RIGHT_AHEAD_BELOW  // : 22
   , ABOVE_BEHIND_LEFT : 23//RelativeVoxelOrds.LEFT_BEHIND_ABOVE  //: 23
   , ABOVE_BEHIND_RIGHT : 24//RelativeVoxelOrds.RIGHT_BEHIND_ABOVE //: 24
   , BELOW_BEHIND_LEFT : 25//RelativeVoxelOrds.LEFT_BEHIND_BELOW  //: 25
   , BELOW_BEHIND_RIGHT : 26//RelativeVoxelOrds.RIGHT_BEHIND_BELOW// : 26

   , AHEAD_ABOVE_LEFT : 19//RelativeVoxelOrds.LEFT_AHEAD_ABOVE   //: 19
   , AHEAD_ABOVE_RIGHT : 20//RelativeVoxelOrds.RIGHT_AHEAD_ABOVE //  : 20
   , AHEAD_BELOW_LEFT : 21//RelativeVoxelOrds.LEFT_AHEAD_BELOW   //  : 21
   , BEHIND_ABOVE_LEFT : 22//RelativeVoxelOrds.LEFT_BEHIND_ABOVE // : 23
   , AHEAD_BELOW_RIGHT : 23//RelativeVoxelOrds.RIGHT_AHEAD_BELOW //  : 22
   , BEHIND_ABOVE_RIGHT : 24//RelativeVoxelOrds.RIGHT_BEHIND_ABOVE //: 24
   , BEHIND_BELOW_LEFT : 25//RelativeVoxelOrds.LEFT_BEHIND_BELOW  //: 25
   , BEHIND_BELOW_RIGHT : 26//RelativeVoxelOrds.RIGHT_BEHIND_BELOW //: 26

   , ABOVE_LEFT_AHEAD : 19//RelativeVoxelOrds.LEFT_AHEAD_ABOVE  // : 19
   , ABOVE_RIGHT_AHEAD : 20//RelativeVoxelOrds.RIGHT_AHEAD_ABOVE //  : 20
   , BELOW_LEFT_AHEAD : 21//RelativeVoxelOrds.LEFT_AHEAD_BELOW    // : 21
   , BELOW_RIGHT_AHEAD : 22//RelativeVoxelOrds.RIGHT_AHEAD_BELOW  // : 22
   , ABOVE_LEFT_BEHIND : 23//RelativeVoxelOrds.LEFT_BEHIND_ABOVE  //: 23
   , ABOVE_RIGHT_BEHIND : 24//RelativeVoxelOrds.RIGHT_BEHIND_ABOVE //: 24
   , BELOW_LEFT_BEHIND : 25//RelativeVoxelOrds.LEFT_BEHIND_BELOW  //: 25
   , BELOW_RIGHT_BEHIND : 26//RelativeVoxelOrds.RIGHT_BEHIND_BELOW //: 26

   , AHEAD_LEFT_ABOVE : 19//RelativeVoxelOrds.LEFT_AHEAD_ABOVE  // : 19
   , AHEAD_RIGHT_ABOVE : 20//RelativeVoxelOrds.RIGHT_AHEAD_ABOVE //  : 20
   , AHEAD_LEFT_BELOW : 21//RelativeVoxelOrds.LEFT_AHEAD_BELOW   //  : 21
   , AHEAD_RIGHT_BELOW : 22//RelativeVoxelOrds.RIGHT_AHEAD_BELOW //  : 22
   , BEHIND_LEFT_ABOVE : 23//RelativeVoxelOrds.LEFT_BEHIND_ABOVE // : 23
   , BEHIND_RIGHT_ABOVE : 24//RelativeVoxelOrds.RIGHT_BEHIND_ABOVE //: 24
   , BEHIND_LEFT_BELOW : 25//RelativeVoxelOrds.LEFT_BEHIND_BELOW  //: 25
   , BEHIND_RIGHT_BELOW : 26//RelativeVoxelOrds.RIGHT_BEHIND_BELOW //: 26
}})


const IntFaceStateTable = [
          [ // State 0: Clear = no FullOpaque = no TranspRend = no
            0 , // Clear = 1 FullOpaque = 0 TranspRend = 0
            0 , // Clear = 0 FullOpaque = 1 TranspRend = 0
            0 , // Clear = 0 FullOpaque = 0 TranspRend = 1
            0 , // Clear = 0 FullOpaque = 1 TranspRend = 1
          ] ,
          [ // State 2: Clear = no FullOpaque = yes TranspRend = no
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 1 FullOpaque = 0 TranspRend = 0
            0 , // Clear = 0 FullOpaque = 1 TranspRend = 0
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 0 TranspRend = 1
            0 , // Clear = 0 FullOpaque = 1 TranspRend = 1
            ],
          [ // State 4 : Clear = no FullOpaque = no TranspRend = yes
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 1 FullOpaque = 0 TranspRend = 0
            0  , // Clear = 0 FullOpaque = 1 TranspRend = 0
            0 , // Clear = 0 FullOpaque = 0 TranspRend = 1
            0 , // Clear = 0 FullOpaque = 1 TranspRend = 1
          ],
          null/*new VoxelSector.FACEDRAW_Operations[]{ // State 5: Clear = yes FullOpaque = yes TranspRend = yes
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 1 FullOpaque = 0 TranspRend = 0
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 0
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 0 TranspRend = 1
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 1
          }*/,
      ];

      Voxelarium.IntFaceStateTable = IntFaceStateTable;

const ExtFaceStateTable = [
          [ // State 0: Clear = no FullOpaque = no TranspRend = no
            0 , // Clear = 1 FullOpaque = 0 TranspRend = 0
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 0
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 0 TranspRend = 1
            Voxelarium.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 1
        ],
          [ // State 2: Clear = no FullOpaque = yes TranspRend = no
            0  , // Clear = 0 FullOpaque = 0 TranspRend = 0
            0  , // Clear = 0 FullOpaque = 1 TranspRend = 0
            0  , // Clear = 0 FullOpaque = 0 TranspRend = 1
            0  , // Clear = 1 FullOpaque = 1 TranspRend = 1
        ],
          [ // State 4 : Clear = no FullOpaque = no TranspRend = yes
            0 , // Clear = 1
            Voxelarium.FACEDRAW_Operations.ALL_BITS  , // Clear = 0 FullOpaque = 1 TranspRend = 0
            0  , // FullOpaque = 0 TranspRend = 1
            0  , // FullOpaque = 1 TranspRend = 1
          ],
         null/* new VoxelSector.FACEDRAW_Operations[8]{ // State 7: Clear = yes FullOpaque = yes TranspRend = yes
            0   , // Clear = 1 FullOpaque = 0 TranspRend = 0
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 0
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 0 TranspRend = 1
            VoxelSector.FACEDRAW_Operations.ALL_BITS , // Clear = 0 FullOpaque = 1 TranspRend = 1
          }*/
      ];
      Voxelarium.ExtFaceStateTable = ExtFaceStateTable;

function ZBlocPosN( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;
}

    const NormalBasePosition = Voxelarium.NormalBasePosition = [
          new ZBlocPosN ( -1, 0, 0 )
          , new ZBlocPosN ( 1, 0, 0 )
          , new ZBlocPosN( 0, 0, 1 )
          , new ZBlocPosN( 0, 0, -1 )
          , new ZBlocPosN( 0, 1, 0 )
          , new ZBlocPosN( 0, -1, 0 ) ];
