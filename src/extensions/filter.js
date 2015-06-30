databind.extensions.filter = function(f){
	if(typeof f === "string"){ return Array.isArray(this) && this.filter(function(o){ return o[f]; }); }
	return Array.isArray(this) ? this.filter(f, this) : [];
};