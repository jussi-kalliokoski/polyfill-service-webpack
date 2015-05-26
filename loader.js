"use strict";

var callbacks = [];
var loaded = false;
var loading = false;

window[__POLYFILL_SERVICE_PLUGIN_CALLBACK_NAME__] = function () {
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
        script.src = __POLYFILL_SERVICE_URL__;
        head.appendChild(script);
    }

    return function (callback) {
        if ( loaded ) { return callback(); }
        callbacks.push(callback);
    };
}

module.exports = loadPolyfills;
