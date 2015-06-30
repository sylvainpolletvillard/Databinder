databind.extensions.not = function(p){
	return Array.isArray(this) ? this.filter(function(o){ return !o[p]; }) : this != p;
};
