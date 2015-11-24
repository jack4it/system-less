var inBrowser = typeof window !== "undefined";

if (inBrowser) {
    exports.translate = function (load) {
        return System.import("less/lib/less-browser")
            .then(function (c) {
                return c(window, {
                    async: true,
                    errorReporting: "Console"
                });
            })
            .then(function (lessc) {
                return lessc.render(load.source, { filename: load.name.replace(/^file:(\/+)?/i, '') });
            })
            .then(function (output) {
                // output.css = string of css
                // output.map = string of sourcemap
                // output.imports = array of string filenames of the imports referenced

                var style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = output.css;
                document.getElementsByTagName('head')[0].appendChild(style);

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

    exports.bundle = function (loads, compileOpts) {
        var stubDefines = loads.map(function (load) {
            return (compileOpts.systemGlobal || "System") + ".register('" + load.name + "', [], false, function() {});";
        }).join('\n');

        var compilePromise = function (load) {
            return Promise.resolve(System._nodeRequire("less"))
                .then(function (lessc) {
                    return lessc.render(load.source, { filename: load.name.replace(/^file:(\/+)?/i, '') })
                })
                .then(function (output) {
                    // output.css = string of css
                    // output.map = string of sourcemap
                    // output.imports = array of string filenames of the imports referenced

                    return output.css;
                })
        };

        return Promise.all(loads.map(compilePromise))
            .then(function (cssResults) {
                return [stubDefines, cssInject, "('" + escape(cssResults.join("")) + "');"].join('\n');
            });
    };
}
