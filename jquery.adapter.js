(function($, databind){
	if(!$) return;

	$.fn.databind = function(data){
		return this.each(function(){
			var databinding = databind(this);
			if(data !== undefined) {
				databinding.set(data);
			}
		});
	};

	$.each(["get","set","reset"], function(i, action){
		$.fn["databind_"+action] = function(){
			var args = arguments;
			return this.each(function(){
				var databinding = databind(this);
				databinding[action].apply(databinding, args);
			});
		};
	});

})(jQuery, databind);