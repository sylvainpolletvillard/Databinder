module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n'
						+ '    MIT License - © <%= grunt.template.today("yyyy") %> syllab.fr */\n'
			},
			build: {
				src: '<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
			},
			jquery_adapter: {
				src: 'build/databinder.jquery.js',
				dest: 'build/databinder.jquery.min.js'
			}
		},
		qunit: {
			all: ['test/index.html']
		},
		jshint: {
			all: ['databinder.js','databinder.extensions.js','jquery.adapter.js'],
			options: {
				sub: true
			}
		},
		concat: {
			jquery_adapter: {
				src: ['databinder.js','jquery.adapter.js'],
				dest: 'build/databinder.jquery.js'
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');

	// Default task(s).
	grunt.registerTask('default', ['jshint','qunit','concat:jquery_adapter','uglify']);

};