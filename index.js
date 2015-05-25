"use strict";

var ModuleParserHelpers = require("webpack/lib/ModuleParserHelpers");
var ModuleAliasPlugin = require("enhanced-resolve/lib/ModuleAliasPlugin");
var autopolyfiller = require("autopolyfiller");
var path = require("path");

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
        compiler.plugin("compilation", function (compilation) {
            var polyfills = options.features;

            if ( !polyfills ) {
                var polyfiller = autopolyfiller();

                compilation.plugin("succeed-module", function (module) {
                    polyfiller = polyfiller.add(module._source._value);
                    polyfills = polyfiller.polyfills;
                });
            }

            compilation.plugin("seal", function () {
                var url = getPolyfillUrl(options, polyfills);
                var loader = compilation.modules.filter(function (module) {
                    return module.rawRequest === "__polyfill_service_loader__";
                })[0];

                loader._source._value = loader._source._value
                    .replace("$POLYFILL_SERVICE_PLUGIN_CALLBACK_NAME$", JSON.stringify(options.callback))
                    .replace("$POLYFILL_SERVICE_URL$", JSON.stringify(url));
            });
        });

        compiler.parser.plugin("expression __load_polyfills__", function () {
            return ModuleParserHelpers.addParsedVariable(this, "__load_polyfills__", "require(\"__polyfill_service_loader__\")");
        });

        compiler.resolvers.normal.apply(new ModuleAliasPlugin({
            __polyfill_service_loader__: path.join(__dirname, "loader.js"),
        }));
    } };
};
