databind.extensions.none = function(fn){
	return this === null	||
		this === undefined ||
		this.length === 0 ||
		(Array.isArray(this) && !this.some(typeof f == "function" ? f : function(o){ return o[f]; }));
};