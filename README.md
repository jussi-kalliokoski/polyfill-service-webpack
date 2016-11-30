# PolyfillServicePlugin

This is a [webpack](http://webpack.github.io/docs/) plugin that detects required polyfills using [autopolyfiller](https://github.com/azproduction/autopolyfiller) and loads them from [Polyfill service](https://cdn.polyfill.io/v1/docs/).

## Installation

```
npm install polyfill-service-webpack
```

and then add the `PolyfillServicePlugin` to the webpack config:

```javascript
var PolyfillServicePlugin = require("polyfill-service-webpack");
var webpackConfig = {
    plugins: [
        new PolyfillServicePlugin({
            minify: true,
            callback: "onPolyfillsLoaded",
            defaultFeatures: {
                "Object.assign": ["always"],
            },
            flags: [],
            libVersion: ">0.0.0",
            unknown: "polyfill",
        }),
    ],
};
```

After that, you can invoke the special function `__load_polyfills__` from your JS:

```javascript
// request the polyfills
var polyfillsLoaded = __load_polyfills__();

polyfillsLoaded(function () {
    // do something when the polyfills have loaded
});
```

## Options

### `minify`

* type: `boolean`.
* default: `false`.

Whether to minify the result. If false, debugging information will be inserted.

### `callback`

* type: `string`.
* default: `onPolyfillsLoaded`.

What name to use for the global callback triggered when the polyfills have loaded.

### `defaultFeatures`

* type: `object`.
* default: `{}`.

A map of features to include regardless of whether they're detected. The keys are the feature names and the values are arrays of flags to apply. See the [docs](https://cdn.polyfill.io/v1/docs/api) for further information about the flags.

### `flags`

* type: `array`.
* default: `[]`.

A list of flags to apply to every feature.

### `libVersion`

* type: `string`.
* default: empty.

Version of the polyfill collection to use. Accepts any valid semver expression. If not specified, the latest version of the library is used.

### `unknown`

* type: `string`
* default: empty

What to do when the user agent is not recognized. See the [docs](https://cdn.polyfill.io/v1/docs/api).
