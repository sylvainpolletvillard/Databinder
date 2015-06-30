databind.extensions.some = function(f){
	if(f === undefined){ return (Array.isArray(this) ? this.length : +this) > 0; }
	return Array.isArray(this) && this.some(typeof f == "function" ? f : function(o){ return o[f]; });
};