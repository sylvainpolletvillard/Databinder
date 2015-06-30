databind.extensions.number = function(){
	return (Array.isArray(this) ? this.length : Number(this));
};