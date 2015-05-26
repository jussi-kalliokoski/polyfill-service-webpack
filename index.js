"use strict";

var ModuleParserHelpers = require("webpack/lib/ModuleParserHelpers");
var ModuleAliasPlugin = require("enhanced-resolve/lib/ModuleAliasPlugin");
var NullFactory = require("webpack/lib/NullFactory");
var ConstDependency = require("webpack/lib/dependencies/ConstDependency");
var autopolyfiller = require("autopolyfiller");
var path = require("path");

function jsonDependency (objectFactory) {
    return function (expr) {
        var dep = new ConstDependency("(" + JSON.stringify(objectFactory()) + ")", expr.range);
        dep.loc = expr.loc;
        this.state.current.addDependency(dep);
        return true;
    };
}


function getPolyfillUrl (options, polyfills) {
    var defaultFeatureNames = Object.keys(options.defaultFeatures);
    var features = defaultFeatureNames.map(function (feature) {
        return feature + (options.defaultFeatures[feature].length > 0 ?
            "|" + options.defaultFeatures[feature] : "");
    }).concat(polyfills.filter(function (feature) {
        return defaultFeatureNames.indexOf(feature) === -1;
    }));

    var polyfillUrl = options.cdnOrigin + "/v1/polyfill.";
    if ( options.minify ) polyfillUrl += "min.";
    polyfillUrl += options.type;
    polyfillUrl += "?callback=" + options.callback;

    if ( features.length > 0 ) polyfillUrl += "&features=" + features;
    if ( options.flags.length > 0 ) polyfillUrl += "&flags=" + options.flags;
    if ( options.libVersion ) polyfillUrl += "&libVersion=" + encodeURIComponent(options.libVersion);
    if ( options.unknown ) polyfillUrl += "&unknown=" + options.unknown;

    return polyfillUrl;
}

module.exports = function PolyfillServicePlugin (options) {
    options = options || {};
    options = {
        cdnOrigin: options.cdnOrigin || "https://cdn.polyfill.io",
        minify: options.minify || false,
        type: options.type || "js",
        callback: options.callback || "onPolyfillsLoaded",
        features: options.features || null,
        defaultFeatures: options.defaultFeatures || {},
        flags: options.flags || [],
        libVersion: options.libVersion || "",
        unknown: options.unknown || "",
    };

    return { apply: function (compiler) {
        var polyfillServiceUrl = "";

        compiler.plugin("compilation", function (compilation) {
            compilation.dependencyFactories.set(ConstDependency, new NullFactory());
            compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());

            var polyfills = options.features;

            compilation.plugin("optimize-tree", function (chunks, modules, callback) {
                var loader = compilation.modules.filter(function (module) {
                    return module.rawRequest === "__polyfill_service_loader__";
                })[0];

                if ( !loader ) {
                    // `__load_polyfills__()` not called, nothing to do.
                    return callback();
                }

                if ( !polyfills ) {
                    polyfills = modules
                        .filter(function (module) {
                            return Boolean(module._source);
                        })
                        .reduce(function (polyfiller, module) {
                            return polyfiller.add(module._source._value);
                        }, autopolyfiller())
                        .polyfills;
                }

                polyfillServiceUrl = getPolyfillUrl(options, polyfills);
                compilation.rebuildModule(loader, callback);
            });
        });

        compiler.parser.plugin("expression __POLYFILL_SERVICE_PLUGIN_CALLBACK_NAME__", jsonDependency(function () {
            return options.callback;
        }));

        compiler.parser.plugin("expression __POLYFILL_SERVICE_URL__", jsonDependency(function () {
            return polyfillServiceUrl;
        }));

        compiler.parser.plugin("expression __load_polyfills__", function () {
            return ModuleParserHelpers.addParsedVariable(this, "__load_polyfills__", "require(\"__polyfill_service_loader__\")");
        });

        compiler.resolvers.normal.apply(new ModuleAliasPlugin({
            __polyfill_service_loader__: path.join(__dirname, "loader.js"),
        }));
    } };
};
