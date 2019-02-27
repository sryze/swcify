"use strict";

var stream = require("stream");
var util   = require("util");
var path   = require("path");
var swc = require("@swc/core");
var fs = require("fs");
var defatuls = require("./config");


module.exports = buildTransform();
module.exports.configure = buildTransform;

// Allow projects to import this module and check `foo instanceof swcify`
// to see if the current stream they are working with is one created
// by SWCify.
Object.defineProperty(module.exports, Symbol.hasInstance, {
  value: function hasInstance(obj) {
    return obj instanceof SwcifyStream;
  },
});

function buildTransform(opts) {
  return function (filename, config) {

    var _flags = config._flags || {}
    config = Object.assign({}, config)
    delete config._flags

    // unwrap nested config
    if (config.config) {
      config = config
    }

    var basedir = path.resolve(_flags.basedir || ".");
    try {
      // read filepath config
      // read .swcrc relative to basedir
      // Browserify doesn't actually always normalize the filename passed
      // to transforms, so we manually ensure that the filename is relative
      var configPath = path.resolve(basedir, '.swcrc');
      var configJSON = fs.readFileSync(configPath, 'utf-8')
      var parsedConfig = JSON.parse(configJSON)
      config = Object.assign({}, defatuls, opts, parsedConfig, config)
    }
    catch (e) {
      // no config found, falling back to default options
      // create current config from options extended with the config
      config = Object.assign({}, defatuls, opts, config)
    }

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
    transform(buf.toString(), this._opts.config, function(err, result) {
      if (err) callback(err)
      else {
        var code = result !== null ? result.code : data;
        self.push(code);
        self._code.push(code);
        self._sourceMap.push(result && result.map)
        callback();
      }
    })
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

function transform(data, opts, done) {
  swc.transform(data, opts).then(function (data) {
    done(null, data)
  }, done);
}
