var inBrowser = typeof window !== "undefined";

if (inBrowser) {

    // map that assigns an import to a set of modules that must be refreshed when that import is updated
    var importToModules = {}
    // register with the hotReloader wich must be present at `SystemhotReloader`
    if (typeof System.hotReloader !== "undefined") {
        console.log("hot reload: configuring hot reload for less")
        System.hotReloader.on('change', function(moduleName) {
            System.normalize(moduleName).then(function(normalizedName) {
                var modules = importToModules[normalizedName]
                if (modules) {
                    return Promise.all(modules).map(function(module) {
                        System.delete(module)
                        return System.import(module)
                    })
                }
            })
        })
    }

    exports.translate = function (load) {
        return System.import("less/lib/less-browser")
        .then(function (lesscWrapper) {
            return lesscWrapper(window, {
                async: true,
                errorReporting: "Console"
            });
        })
        .then(function (lessc) {
            return lessc.render(load.source, {
                filename: load.name.replace(/^file:(\/+)?/i, '')
            });
        })
        .then(function (output) {
            // output.css = string of css
            // output.map = string of sourcemap
            // output.imports = array of string filenames of the imports referenced

            // add this module to the map of modules to refresh for each import
            for (var i = 0; i < output.imports.length; i++) {
                if (typeof importToModules[output.imports[i]] === "undefined") {
                    importToModules[output.imports[i]] = [load.name]
                } else {
                    var modules = importToModules[output.imports[i]]
                    if (modules.indexOf(load.name) === -1) {
                        modules.push(load.name)
                    }
                }
            }

            var styleId = encodeURI(load.name)
            var style = document.getElementById(styleId)
            if (!style) {
                var style = document.createElement('style');
                style.id = styleId
                style.setAttribute('type', 'text/css');
                document.getElementsByTagName('head')[0].appendChild(style);
            }
            style.textContent = output.css;

            load.metadata.format = 'defined';
        });
    };
} else {
    var cssInject = "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";

    var escape = function (source) {
        return source
        .replace(/(["\\])/g, '\\$1')
        .replace(/[\f]/g, '\\f')
        .replace(/[\b]/g, '\\b')
        .replace(/[\n]/g, '\\n')
        .replace(/[\t]/g, '\\t')
        .replace(/[\r]/g, '\\r')
        .replace(/[\ufeff]/g, '')
        .replace(/[\u2028]/g, '\\u2028')
        .replace(/[\u2029]/g, '\\u2029');
    };

    exports.translate = function (load) {
        load.metadata.format = 'defined';
    };

    exports.bundle = function (loads, compileOpts, outputOpts) {
        var stubDefines = loads.map(function (load) {
            return (compileOpts.systemGlobal || "System") + ".register('" + load.name + "', [], false, function() {});";
        }).join('\n');

        var lessc = System._nodeRequire("less");
        var compilePromise = function (load) {
            return lessc.render(load.source, {
                filename: load.name.replace(/^file:(\/+)?/i, '')
            })
            .then(function (output) {
                // output.css = string of css
                // output.map = string of sourcemap
                // output.imports = array of string filenames of the imports referenced

                return output.css;
            })
        };

        var cssOptimize = outputOpts.minify && outputOpts.cssOptimize !== false;
        var CleanCSS = System._nodeRequire("clean-css");
        var cleaner = new CleanCSS({
            advanced: cssOptimize,
            agressiveMerging: cssOptimize,
            mediaMerging: cssOptimize,
            restructuring: cssOptimize,
            shorthandCompacting: cssOptimize,

            ////sourceMap: !!outputOpts.sourceMaps,
            ////sourceMapInlineSources: outputOpts.sourceMapContents
        });

        return Promise.all(loads.map(compilePromise))
            .then(function (cssResults) {
                var all = cssResults.join("");
                var minified = cleaner.minify(all).styles;
                return [stubDefines, cssInject, "('" + escape(minified) + "');"].join('\n');
            });
    };
}
