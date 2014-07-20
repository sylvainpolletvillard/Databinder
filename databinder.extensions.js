databind.extensions.equals = function(x){ return this == x; };
databind.extensions.number = function(){
	return (Array.isArray(this) ? this.length : +this);
};
databind.extensions.none = function(fn){
	return this === null || this === undefined || this.length === 0 || (fn !== undefined	&& Array.isArray(this) && !this.some(fn));
};
databind.extensions.moreThan = function(n){
	return (Array.isArray(this) ? this.length : +this) > n;
};
databind.extensions.between = function(start, end){
	var n = (Array.isArray(this) ? this.length : +this);
	return n >= start && n <= end;
};
databind.extensions.every = function(f){
	return Array.isArray(this) && this.every(typeof f == "function" ? f : function(){ return this[f]; });
};
databind.extensions.some = function(f){
	if(f === undefined){ return (Array.isArray(this) ? this.length : +this) > 0; }
	if(typeof f === "string"){ return Array.isArray(this) && this.some(function(){ return this[f]; }); }
	return Array.isArray(this) && this.some(f);
};
databind.extensions.sort = function(f){
	return Array.isArray(this) ? this.sort(f) : [];
};
databind.extensions.filter = function(f){
	if(typeof f === "string"){ return Array.isArray(this) && this.filter(function(){ return this[f]; }); }
	return Array.isArray(this) ? this.filter(f) : [];
};
databind.extensions.date = function(){ return new Date(this).toLocaleDateString(); };
databind.extensions.time = function(){ return new Date(this).toLocaleTimeString(); };
databind.extensions.floor = function(n){
	var f = Math.pow(10, n|0);
	return Math.floor( f * (+this) ) / f;
};
databind.extensions.ceil = function(n){
	var f = Math.pow(10, n|0);
	return Math.ceil( f * (+this) ) / f;
};
databind.extensions.round = function(n){
	var f = Math.pow(10, n|0);
	return Math.round( f * (+this) ) / f;
};
databind.extensions.trim = String.prototype.trim;
databind.extensions.lowercase = String.prototype.toLowerCase;
databind.extensions.uppercase = String.prototype.toUpperCase;
databind.extensions.capitalize = function(){
	return String(this).charAt(0).toUpperCase() + String(this).slice(1);
};