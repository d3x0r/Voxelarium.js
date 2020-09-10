import * as THREE from "../three.js/build/three.module.js"

const gradients = [];
let Version = 0;

class TimeGradient {
	stages = [];
        stage = 0;
        tick_ = 0;
        scalar = null;
	version = Version-1;
	value = null;
        
	constructor( scalarFunc, steps ){
        	if( steps instanceof TimeGradient ) {
                	this.stages = steps.stages;
                        this.scalar = steps.scalar;
                	return;
                }
		if( steps ) for( let step of steps ) this.addStage( step.span, step.value );
        	//this.stages = steps;
                this.scalar = scalarFunc;
		gradients.push(this);
        }
        destruct(){
		var i = gradients.findIndex(g=>g===this);
		if( i >= 0 ) gradients.splice( i, 1 );
	}
        addStage( span, value ) {
        	this.stages.push( {span:span, value:value} );
		return this;
        }

	changed() {
		return ( this.version != Version );
	}
	getValue() {
		if( this.version != Version ) {
	                const nextStage = ( (this.stage+1) < this.stages.length )?this.stage+1:0;
			this.version = Version;
       		        this.value = this.scalar( this.stages[this.stage].value, this.stages[nextStage].value, this.tick_ / this.stages[this.stage].span );
		}
		return this.value;			
	}        

        setTick(tick){
        	this.stage = 0;
                let lastGood = 0;
                while( tick > 0 ) {
                	lastGood = this.stage;
                	tick -= this.stages[this.stags].span;
                        this.stage++;
			if( this.stage >= this.stages.length ) this.stage = 0;
                }
                this.stage = lastGood;
                tick += this.stages[this.stage].span;
                this.tick_ = tick;
                if( this.scalar ) {
	                const nextStage = ( stages < stage.length )?this.stage+1:0;
        	        this.scalar( this.stages[stage].value, this.stages[nextStage].value, this.tick_ / this.stages[stage].span );
                }
        }
        get delta() {
        	return this.tick_/this.stages[this.stage].span;
        }
        
        tick(delta){
        	if( this.stage < this.stages.length ) {
			delta += this.tick_;
	        	while( ( delta ) > this.stages[this.stage].span ) {
				delta -= this.stages[this.stage].span;
                        	this.stage++;
                                if( this.stage >= this.stages.length ) this.stage = 0;
                        }
                        this.tick_ = delta;
                        const nextStage = ( this.stage < this.stages.length )?this.stage+1:0;
			//this.version = Version;
                        //return this.scalar( this.stages[stage].value, this.stages[nextStage].value, this.tick_ / this.stages[stage].span );
                }
                return undefined;
        }
}

TimeGradient.arrayScalar = function(a,b,t) {
		return new THREE.Vector4( a[0]*(1-t)+b[0]*(t),a[1]*(1-t)+b[1]*(t),a[2]*(1-t)+b[2]*(t), 1 );
	}

TimeGradient.colorScalar = function(a,b,t) {
		return new THREE.Color( a.x*(1-t)+b.x*(t),a.y*(1-t)+b.y*(t),a.z*(1-t)+b.z*(t),a.w*(1-t)+b.w*(t) );
	}
TimeGradient.update = function(delta) {
	Version++;
	for( let span of gradients )
		span.tick(delta)
}

export {TimeGradient}
