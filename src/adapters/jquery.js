(function($, databind){
	if(!$) return;

	$.fn.databind = function(action){
		return this.each(function(){
			var databinding = databind(this);
			if(action in databinding) {
				databinding[action].apply(databinding, [].slice.call(arguments, 1));
			}
		});
	};
})(jQuery, databind);