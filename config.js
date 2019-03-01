module.exports = {
  jsc: {
    target: "es5",
    parser: {
      syntax: "ecmascript",
      jsx: true,
      numericSeparator: false,
      classPrivateProperty: false,
      privateMethod: false,
      classProperty: true,
      functionBind: false,
      decorators: false,
      decoratorsBeforeExport: false
    },
    transform: {
      react: {
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
        throwIfNamespace: true,
        development: true,
        useBuiltins: true
      },
      optimizer: {
        globals: {
          vars: {
            __DEBUG__: "true"
          }
        }
      }
    }
  },
  module: {
    type: "commonjs",
    strict: false,
    strictMode: true,
    lazy: false,
    noInterop: false
  },
  minify: false
}

