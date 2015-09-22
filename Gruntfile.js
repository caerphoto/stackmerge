module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        requirejs: {
            compile: {
                options: {
                    baseUrl: './public/javascript',
                    name: 'main',
                    out: './client.js',
                    paths: {
                        requireLib: 'lib/require',
                        backbone: 'lib/backbone-min',
                        underscore: 'lib/underscore-min',
                        jquery: 'lib/jquery-custom.min',
                        mustache: 'lib/mustache.min'
                    },
                    shim: {
                        jquery: {
                            exports: '$'
                        }
                    },
                    include: ['requireLib']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask('setBuildName', 'Move and rename the built JS file', function () {
        var config = grunt.config.get().requirejs.compile.options;
        var oldFilename = grunt.file.expand('./public/javascript/application*')[0];
        var builtFilename = config.out;
        var newFilename;
        var fs = require('fs');
        var stats;
        var buildName;

        //grunt.task.requires('requirejs');
        stats = fs.statSync('./client.js');

        buildName = stats.ctime.toISOString().
            replace(/[\-:\.TZ]/g, ''). // remove non-digit bits
            slice(0, -3); // remove sub-seconds part, because honestly

        if (oldFilename) {
            grunt.file.delete(oldFilename);
            console.log('Deleted old file:', oldFilename);
        }

        newFilename = config.baseUrl + '/application-' + buildName + '.js';
        grunt.file.copy(builtFilename, newFilename);
        grunt.file.delete(builtFilename);
        console.log('Moved built file to:', newFilename);
    });

    grunt.registerTask('default', ['requirejs', 'setBuildName']);
};
