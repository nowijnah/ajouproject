module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    // 모든 스타일 규칙 비활성화
    "quotes": "off",
    "max-len": "off", 
    "comma-dangle": "off",
    "key-spacing": "off",
    "object-curly-spacing": "off",
    "indent": "off",
    "no-trailing-spaces": "off",
    "arrow-parens": "off",
    "eol-last": "off"
  }
};