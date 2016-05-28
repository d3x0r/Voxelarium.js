

exports.drawCharacter = function drawCharacter( cluster, pos, v, c, font ) {
    var pchar;
    if( pchar = font.characters[c] ) {
        var data  = pchar.data;
		// background may have an alpha value -
		// but we should still assume that black is transparent...
		var size = pchar.sz;
		var width = pchar.w;
		if( ( font.flags & 3 ) == 0/*FONT_FLAG_MONO*/ )
		{
			var CharDatax = CharData1;
			var inc = Math.floor( (pchar.sz+7)/8 );
		}
		else if( ( font.flags & 3 ) == 1/*FONT_FLAG_2BIT*/ )
		{
			var CharDatax = CharData2;
			var inc = Math.floor((pchar.sz+3)/4);
		}
		else if( ( font.flags & 3 ) == 3 || ( font.flags & 3 )  == 2 )
		{
			var CharDatax = CharData8;
			var inc = (char.sz);
		}

        if( ( font.flags & 3 ) == 0 ) {
            return drawMonoChar( cluster, pos, v, pchar, font, CharDatax, inc );
        }
    }
}

//---------------------------------------------------------------------------
function CharData8( bits, ofs, bit ) { return bits[ofs+bit]; }
//---------------------------------------------------------------------------
function CharData2( bits, ofs, bit ) { return (bits[ofs+bit>>2] >> (2*(bit&3)))&3; }
//---------------------------------------------------------------------------
function CharData1( bits, ofs, bit ) { return (bits[ofs+(bit>>3)] >> (bit&7))&1; }


function drawMonoChar( cluster, pos, v, pchar, font, CharDatax, inc ) {
    var line_target;
    var y = pos.y + ( font.baseline + pchar.asc );
    var x = pos.x + ( pchar.ofs );
    var line = 0;//UseFont.baseline - pchar.ascent;
    var dOfs = 0;
    var line_target =  pchar.asc - pchar.dsc;//(UseFont.baseline - pchar.asc) + ( UseFont.baseline - pchar.descent );
    var data  = pchar.data;
    var size = pchar.sz;
    for(;
         line <= line_target;
         line++ )
    {
        for( var bit = 0; bit < size; bit++ )
        {
            var chardata = CharDatax( data, dOfs, bit );
            if( chardata )
                cluster.setCube( x + bit, y - line, 0, v );
        }
        dOfs += inc;
    }
    return pchar.w;
}
