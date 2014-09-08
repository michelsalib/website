'use strict';

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        ts: {
            options: {                                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
                target:      'es5',                            // 'es3' (default) | 'es5'
                module:      'commonjs',                       // 'amd' (default) | 'commonjs'
                sourcemap:   true,                             // true  (default) | false
                declaration: false,                            // true | false  (default)
                comments:    true,                             // true | false (default)
                fast:        'never'
            },
            dev: {
                src: ['src/**/*.ts', 'app.ts', 'server.ts']
            }
        }
    });
};
