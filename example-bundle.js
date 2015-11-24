var Builder = require('systemjs-builder');

// optional constructor options
// sets the baseURL and loads the configuration file
var builder = new Builder("/", "config.js");

builder
    .bundle('example/app.js', 'example/app-bundle.js')
    .then(function () {
        console.log('Build complete');
    })
    .catch(function (err) {
        console.log('Build error');
        console.log(err);
    });
    