(function($, databind){
	if(!$) return;
	$.fn.databind = function(data){
		return this.each(function(){
			databind(this, data);
		});
	};
})(jQuery, databind);