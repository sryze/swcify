"use strict";

var stream = require("stream");
var util   = require("util");
var path   = require("path");
var swc = require("@swc/core");
var fs = require("fs");
var defatuls = require("./config");

module.exports = buildTransform();
module.exports.configure = buildTransform;


// TODO: essentially we have to handle all CLI-tool options
// some of them are taken from browserify flags

// Allow projects to import this module and check `foo instanceof swcify`
// to see if the current stream they are working with is one created
// by SWCify.
Object.defineProperty(module.exports, Symbol.hasInstance, {
  value: function hasInstance(obj) {
    return obj instanceof SwcifyStream;
  },
});

function buildTransform(opts) {
  var configCache = {}

  return function (filename, config) {

    var _flags = config._flags || {}
    config = Object.assign({}, config)
    delete config._flags

    // unwrap nested config
    if (config.config) {
      config = config
    }

    var basedir = path.resolve(_flags.basedir || ".");
    var configPath = path.resolve(basedir, '.swcrc');

    var configJSON, parsedConfig = configCache[configPath];

    // if no cached config found - try to read from file
    if (!parsedConfig && fs.existsSync(configPath)) {
      // read filepath config
      // read .swcrc relative to basedir
      // Browserify doesn't actually always normalize the filename passed
      // to transforms, so we manually ensure that the filename is relative
      configJSON = fs.readFileSync(configPath, 'utf-8');
      // bad config will throw error
      parsedConfig = JSON.parse(configJSON)
      configCache[configPath] = parsedConfig
    }

    // no config found, falling back to default options
    // create current config from options extended with the config
    config = Object.assign({}, defatuls, opts, parsedConfig, config)

    // normalize config quirks
    if (!config.sourceMaps) delete config.sourceMaps

    return new SwcifyStream({
      config: config,
      filename: path.resolve(basedir, filename)
    });
  };
}

class SwcifyStream extends stream.Transform {
  constructor(opts) {
    super();
    this._code = [];
    this._sourceMap = [];
    if (!opts) opts = {}
    this._opts = opts;
  }

  _transform(buf, enc, callback) {
    var self = this

    swc.transform(buf.toString(), this._opts.config).then(function(result) {
      var code = result !== null ? result.code : data;
      self.push(code);
      self._code.push(code);
      self._sourceMap.push(result && result.map)
      callback();
    }, callback)
  }

  _flush(callback) {
    // Merge the buffer pieces after all are available, instead of one at a time,
    // to avoid corrupting multibyte characters.
    this.emit("swcify", {
      code: this._code.join('')
      // FIXME: how to join sourcemaps
    }, this._opts.filename);
    callback()
  }
}
