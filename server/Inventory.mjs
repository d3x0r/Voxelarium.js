
class Inventory{
	items = {};
	
	constructor(){
	}
	add( type, amount ) {
		const n = items[type];
		if( "undefined" === typeof n )  {
			items[type] = amount;
		} else {
			items[type] += amount;
		}
		return true;
	}
	sub( type, amount ) {
		const n = items[type];
		if( "undefined" === typeof n )  {
			return false;
		} else {
			if( amount < items[type] ) {
				items[type] -= amount;
				return true;
			}
		}
		return false;
	}
}

export {Inventory}