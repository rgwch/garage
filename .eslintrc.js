module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "jquery": true
  },
  "extends": "eslint:recommended",
  parserOptions: {
    "sourceType": "module",
    "ecmaVersion": 2017
  },
  "rules": {
    "no-console": "off",
    "indent": [
      "off",
      4
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "off",
      "double"
    ],
    "semi": [
      "off",
      "never"
    ]
  }
};