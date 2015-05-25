"use strict";

var callbacks = [];
var loaded = false;
var loading = false;

window[$POLYFILL_SERVICE_PLUGIN_CALLBACK_NAME$] = function () {
    loaded = true;
    while ( callbacks.length > 0 ) {
        callbacks.shift()();
    }
};

function loadPolyfills () {
    if ( !loading ) {
        loading = true;
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.async = true;
        script.src = $POLYFILL_SERVICE_URL$;
        head.appendChild(script);
    }

    return function (callback) {
        if ( loaded ) { return callback(); }
        callbacks.push(callback);
    };
}

module.exports = loadPolyfills;
