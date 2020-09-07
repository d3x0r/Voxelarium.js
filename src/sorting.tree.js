import {Voxelarium} from "./Voxelarium.core.js"


Voxelarium.SortingTree = function(Capacity){
    var sorter = {
		/// <summary>
		/// storage type for Sorting Tree
		/// </summary>

		storage : [],
		root : -1,
		used : 0,
        autoBalance : false,
        clear : function() { this.root = -1; this.used = 0; },
        add : Add,
        balance : Balance,
        forEach : foreach
    };

	storage = [];
    for( var n = 0; n < Capacit; n++ )
        storage.push( { key : 0, value : null,
                 lesser : 0, greater : 0, parent : 0, children : 0
            } );

    return sorter;
}

function DumpTree( current, level ) {
	if( current == -1 ) {
		if( root == -1 )
			return;
		console.log( "Start Tree Dump" );
		DumpTree( root, level + 1 );
	} else {
		if( this.storage[current].lesser != -1 ) {
			DumpTree( this.storage[current].lesser, level + 1 );
		}
		console.log( "Cur: " + current + " Par: " + this.storage[current].parent
			+ " Les: " + this.storage[current].lesser
			+ " Grt: " + this.storage[current].greater
			+ " Lev: " + level + " cld: " + this.storage[current].children + "  Key: " + this.storage[current].key + " val: " + this.storage[current].value );
		if( this.storage[current].greater != -1 ) {
			DumpTree( this.storage[current].greater, level + 1 );
		}
	}
}


function RotateLeft( node, node_id )
{
	if( node.parent == -1 )
	{
		root = node.greater;
		this.storage[root].parent = -1;
	}
	else
	{
		if( this.storage[node.parent].lesser == node_id )
			this.storage[node.parent].lesser = node.greater;
		else
			this.storage[node.parent].greater = node.greater;
		this.storage[node.greater].parent = node.parent;
	}
	node.children -= ( this.storage[node.greater].children + 1 );
	node.parent = node.greater;
	var temp = this.storage[node.greater].lesser;
	node.greater = temp;
	this.storage[node.parent].lesser = node_id;
	if( temp >= 0 )
	{
		this.storage[temp].parent = node_id;
		this.storage[node.parent].children -= ( this.storage[temp].children + 1 );
		node.children += ( this.storage[temp].children + 1 );
	}
	this.storage[node.parent].children += ( node.children + 1 );
}

function RotateRight( node, node_id )
{
	if( node.parent == -1 )
	{
		root = node.lesser;
		this.storage[root].parent = -1;
	}
	else
	{
		if( this.storage[node.parent].lesser == node_id )
			this.storage[node.parent].lesser = node.lesser;
		else
			this.storage[node.parent].greater = node.lesser;
		this.storage[node.lesser].parent = node.parent;
	}
	node.children -= ( this.storage[node.lesser].children + 1 );
	node.parent = node.lesser;
	var temp = this.storage[node.lesser].greater;
	node.lesser = temp;
	this.storage[node.parent].greater = node_id;  // actually oldnode.lesser
	if( temp >= 0 )
	{
		this.storage[temp].parent = node_id;
		this.storage[node.parent].children -= ( this.storage[temp].children + 1 );
		node.children += ( this.storage[temp].children + 1 );
	}
	this.storage[node.parent].children += ( node.children + 1 );
}

function Balance( node, node_id )
{
	if( !this.AutoBalance ) return;
    var left_children = node.lesser == -1 ? 0 : ( this.storage[node.lesser].children + 1 );
	var right_children = node.greater == -1 ? 0 : ( this.storage[node.greater].children + 1 );
	if( left_children == 0 )
	{
		if( right_children > 1 )
            RotateLeft( node, node_id );
	}
	else if( right_children == 0 )
	{
		if( left_children > 1 )
		{
			RotateRight( node, node_id );
		}
	}
	else if( right_children > ( left_children * 3 ) )
	{
		RotateLeft( node, node_id );
		Balance( storage[node.lesser], node.lesser );
	}
	else if( left_children > ( right_children * 3 ) )
	{
		RotateRight( node, node_id );
		Balance( storage[node.greater], node.greater );
	}
}

function addNode( node,  parent_id, K,  V ) {
	node.key = K;
	node.value = V;
	node.lesser = -1;
	node.greater = -1;
	node.parent = parent_id;
	node.children = 0;
}


function ScanAdd( node, node_id, K, V )
{
	if( K < node.key )
	{
		if( node.lesser == -1 )
		{
			node.children++;
			this.addNode( storage[used], node_id, K, V );
			node.lesser = used;
			used++;
		}
		else
		{
			node.children++;
			ScanAdd( storage[node.lesser], node.lesser, K, V );
			Balance( node, node_id );
		}
	}
	else if( K >= node.key )
	{
		if( node.greater == -1 )
		{
			node.children++;
			this.addNode( storage[used], node_id, K, V );
			node.greater = used;
			used++;
		}
		else
		{
			node.children++;
			ScanAdd( storage[node.greater], node.greater, K, V );
			Balance( node, node_id );
		}
	}
}

function Add( K, V )
{
	if( root == -1 )
	{
		root = 0;
		this.addNode( this.storage[root], -1, K, V );
		used++;
	}
	else
		ScanAdd( this.storage[root], root, K, V );
}


function foreach( callback ) {
    var current = -1;

	var next;
    while( true ) {
		if( current == -1 )
		{
			current = Tree.root;
			if( current == -1 )
				return false;
			while( ( next = Tree.storage[current].lesser ) != -1 )
				current = next;
            callback( this.storage[current].value );
            continue;
		}
		else if( ( next = Tree.storage[current].greater ) != -1 )
		{
			current = next;
			while( ( next = Tree.storage[current].lesser ) != -1 )
				current = next;
            callback( this.storage[current].value );
            continue;
		}

		else while( ( next = Tree.storage[current].parent ) != -1 )
		{
			// came from lesser, so this is next larger.
			if( Tree.storage[next].lesser == current )
			{
				current = next;
                callback( this.storage[current].value );
                continue;
			}
			else
				current = next;
		}
        break;
    }
}
