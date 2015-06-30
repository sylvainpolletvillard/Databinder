databind.extensions.sort = function(f){
	return Array.isArray(this) ? this.sort(f) : [];
};