module.exports = function(grunt, merge) {

	var list_bindings = [];
	grunt.file.recurse('src/bindings', function(abspath, rootdir, subdir, filename) {
		list_bindings.push(filename.replace(/\.js$/,''));
	});

	var list_extensions = [];
	grunt.file.recurse('src/extensions', function(abspath, rootdir, subdir, filename) {
		list_extensions.push(filename.replace(/\.js$/,''));
	});

	grunt.config('prompt', {
		custom_build:  {
			options: {
				questions: [
					{
						config: 'bindings', // arbitrary name or config for any other grunt task
						type: 'checkbox', // list, checkbox, confirm, input, password
						message: 'Choose the bindings to bundle in your custom Databinder build:', // Question to ask the user, function needs to return a string,
						default: ['default_binding'], // default value if nothing is entered
						choices: list_bindings
						//filter:  function(value){}, // modify the answer
						//when: function(answers){} // only ask this question when this function returns true
					},{
						config: 'extensions', // arbitrary name or config for any other grunt task
						type: 'checkbox', // list, checkbox, confirm, input, password
						message: 'Choose the extensions to bundle in your custom Databinder build:', // Question to ask the user, function needs to return a string,
						default: [], // default value if nothing is entered
						choices: list_extensions
						//filter:  function(value){}, // modify the answer
						//when: function(answers){} // only ask this question when this function returns true
					}
				],

				then: function(selected){

					var src = grunt.config('concat.dist.src');
					src.splice.apply(src, [src.indexOf("src/bindings/*.js"), 1].concat(selected.bindings.map(function(name){ return 'src/bindings/'+name+'.js'; })));
					src.splice.apply(src, [src.indexOf("src/extensions/*.js"), 1].concat(selected.extensions.map(function(name){ return 'src/extensions/'+name+'.js'; })));

					grunt.config('concat.dist_custom', merge(grunt.config('concat.dist'), {
						options: {
							banner: "/* \n"
							+ " <%= pkg.name %> custom build \n"
							+ " @version <%= pkg.version %> \n"
							+ " @author  <%= pkg.author %> \n"
							+ " @license <%= pkg.license %> \n"
							+ " @website <%= pkg.homepage %> \n"
							+ " Included bindings: " + selected.bindings.join(', ') + "\n"
							+ " Included extensions: " + selected.extensions.join(', ') + "\n"
							+ "*/\n\n"
							+ ";(function(global){\n"
						},
						src: src,
						dest: 'dist/<%= pkg.name.toLowerCase() %>.custom.js'
					}));

					grunt.config('concat.dist_custom_umd', merge(grunt.config("concat.dist_umd"), {
						options: {
							banner: "/* \n"
							+ " <%= pkg.name %> UMD version of custom build \n"
							+ " @version <%= pkg.version %> \n"
							+ " @author  <%= pkg.author %> \n"
							+ " @license <%= pkg.license %> \n"
							+ " @website <%= pkg.homepage %> \n"
							+ " Included bindings: " + selected.bindings.join(', ') + "\n"
							+ " Included extensions: " + selected.extensions.join(', ') + "\n"
							+ "*/\n\n"
							+ "(function (globals, factory) {\n"
							+ " if (typeof define === 'function' && define.amd) define(factory); // AMD\n"
							+ " else if (typeof exports === 'object') module.exports = factory(); // Node\n"
							+ " else globals[DB_GLOBAL] = factory(); // globals\n"
							+ "}(this, function () {\n"
						},
						src: src,
						dest: 'dist/<%= pkg.name.toLowerCase() %>.custom.umd.js'
					}));

					//TODO: figure out why uglify tasks does not match newly created files
					grunt.task.run(['concat:dist_custom','concat:dist_custom_umd','uglify']);
				}
			}

		}
	});

	return ['prompt:custom_build'];

};