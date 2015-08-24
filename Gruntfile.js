module.exports = function(grunt) {

	function merge(){
		var out = {};
		for(var a=0; a<arguments.length; a++){
			for (var prop in arguments[a]) {
				if ( arguments[a].hasOwnProperty(prop) ) {
					var val = arguments[a][prop];
					out[prop] = (prop in out && Object.prototype.toString.call(val) === '[object Object]' ? merge(out[prop], val) : val);
				}
			}
		}
		return out;
	}

	grunt.file.defaultEncoding = 'utf-8';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			dist: {
				src: ['src/config.js', 'src/helpers.js', 'src/databinding.js', 'src/scope.js', 'src/binding.js', 'src/databind.js', 'src/bindings/*.js', 'src/extensions/*.js'],
				dest: 'dist/<%= pkg.name.toLowerCase() %>.js',
				options: {
					banner: "/* \n"
					+ " <%= pkg.name %> \n"
					+ " @version <%= pkg.version %> \n"
					+ " @author  <%= pkg.author %> \n"
					+ " @license <%= pkg.license %> \n"
					+ " @website <%= pkg.homepage %> \n"
					+ "*/\n\n"
					+ ";(function(global){\n",
					footer: "\n\nglobal[DB_GLOBAL] = databind;\n})(this);",
					separator: '\n\n'
				}
			},
			jquery_adapter: {
				src: ['dist/<%= pkg.name.toLowerCase() %>.js','src/adapters/jquery.js'],
				dest: 'dist/<%= pkg.name.toLowerCase() %>.jquery.js'
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n'
						+ '   License <%= pkg.license %> - © <%= grunt.template.today("yyyy") %> <%= pkg.homepage %> */\n'
			},
			all: {
				files: [{
					expand: true,
					src: ['dist/**.js', '!dist/**.min.js'],
					dest: 'dist',
					rename: function(destBase, destPath) {
						return destPath.replace('.js', '.min.js');
					}
				}]
			}
		},
		qunit: {
			all: ['test/index.html']
		},
		jshint: {
			all: ['src/**/*.js'],
			options: {
				sub: true
			}
		},

		watch: {
			scripts: {
				files: ['src/**/*.js','test/**/*.js'],
				tasks: ['dist'],
				options: {
					spawn: false
				}
			}
		}

	});

	grunt.config('concat.dist_umd', merge(grunt.config("concat.dist"), {
		dest: 'dist/<%= pkg.name.toLowerCase() %>.umd.js',
		options: {
			banner: "/* \n"
			+ " <%= pkg.name %> - UMD version: Use it with your favorite module loader\n"
			+ " @version <%= pkg.version %> \n"
			+ " @author  <%= pkg.author %> \n"
			+ " @license <%= pkg.license %> \n"
			+ " @website <%= pkg.homepage %> \n"
			+ "*/\n\n"
			+ "(function (globals, factory) {\n"
			+ " if (typeof define === 'function' && define.amd) define(factory); // AMD\n"
			+ " else if (typeof exports === 'object') module.exports = factory(); // Node\n"
			+ " else globals[DB_GLOBAL] = factory(); // globals\n"
			+ "}(this, function () {\n",
			footer: "\nreturn databind;\n}));"
		}
	}));

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-prompt');


	grunt.registerTask('dist', ['jshint','concat:dist','concat:dist_umd','uglify']);
	grunt.registerTask('test', ['qunit']);
	grunt.registerTask('default', ['dist','test']);

	grunt.registerTask('custom_build', require('./custom_build')(grunt, merge));

};