databind.extensions.moreThan = function(n){
	return (Array.isArray(this) ? this.length : +this) > n;
};