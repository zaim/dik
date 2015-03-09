// Karma configuration

module.exports = function(config) {
  config.set({

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel/browser-polyfill.js',
      'test/dik.js'
    ],

    // preprocess matching files before serving them to the browser
    // https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.js': ['browserify']
    },

    // enable / disable watching file and executing tests when any file changes
    autoWatch: false,

    // start these browsers
    // https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox', 'Safari'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Browserify config
    browserify: {
      debug: true,
      transform: ['babelify']
    },

    client: {
      // Mocha config, use HTML reporter in karma's debug.html page
      mocha: {
        reporter: 'html'
      }
    }
  })
}
