module.exports = function (grunt) {
    var fs = require('fs');

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

    function getTimestampString(stats) {
        return 'T' + stats.ctime.toISOString().
            replace(/[\-:\.TZ]/g, ''). // remove non-digit bits
            slice(0, -3); // remove sub-seconds part, because honestly
    }

    grunt.registerTask('setappjs', 'Move and rename the built JS file', function () {
        var config = grunt.config.get().requirejs.compile.options;

        var oldFilename = grunt.file.expand(config.baseUrl + '/application*')[0];
        var builtFilename = config.out;
        var newFilename;
        var stats;
        var buildName;

        grunt.task.requires('requirejs');
        stats = fs.statSync('./client.js');

        buildName = getTimestampString(stats);

        if (oldFilename) {
            grunt.file.delete(oldFilename);
            console.log('Deleted old app JS file:', oldFilename);
        }

        newFilename = config.baseUrl + '/application.' + buildName + '.js';
        grunt.file.copy(builtFilename, newFilename);
        grunt.file.delete(builtFilename);
        console.log('Moved built app JS file to:', newFilename);
    });

    grunt.registerTask('removesymlinks', 'Remove existing asset symlinks', function () {
        var workerNames = grunt.file.expand('./public/javascript/workers/*.T*.js');
        var cssNames = grunt.file.expand('./public/css/*.T*.css');

        workerNames.concat(cssNames).forEach(function (filename) {
            grunt.file.delete(filename);
            console.log('Deleted symlink:', filename);
        });
    });

    grunt.registerTask('createsymlinks', 'Create symlinks to asset files based on timestamp', function () {
        var workerNames = grunt.file.expand('./public/javascript/workers/*.js');
        var cssNames = grunt.file.expand('./public/css/*.css');

        grunt.task.requires('removesymlinks');

        workerNames.concat(cssNames).forEach(function (filename) {
            var timestamp;
            var nameParts;
            var newName;
            var linkTo = filename.split('/').pop();
            var stats = fs.lstatSync(filename);

            timestamp = getTimestampString(stats);
            nameParts = filename.split('.');
            nameParts.splice(nameParts.length - 1, 0, timestamp);
            newName = nameParts.join('.');
            console.log('Created symlink:', newName, '->', linkTo);
            fs.symlinkSync(linkTo, newName);
        });
    });

    grunt.registerTask('link', ['removesymlinks', 'createsymlinks']);
    grunt.registerTask('build', ['requirejs', 'setappjs']);
    grunt.registerTask('default', ['link', 'build']);
};
