
export const l = {
	storage : null,
	rootDir : null,
	configFile : null,
	waiters : [],
	dbs : [],
	expectations : new Map(),
	config : {
       	userIndex : null, // reference of the index root
    },
    saveConfig() {
        return l.configFile.write( l.config );
    },
	storageSetupResolve: null,
	storageSetup : null,

}

l.storageSetup = new Promise( (res,rej)=>{
	l.storageSetupResolve = res;
});
