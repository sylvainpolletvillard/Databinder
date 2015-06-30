databind.extensions.every = databind.extensions.all = function(f){
	return Array.isArray(this) && this.every(typeof f == "function" ? f : function(o){ return o[f]; });
};