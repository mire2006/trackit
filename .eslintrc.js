module.exports = {
    root: true,
    env: {
      node: true,
      browser: true, 
      es2021: true 
    },
    extends: [
      "plugin:vue/vue3-essential",
      "eslint:recommended"
    ],
    parserOptions: {
      parser: "@babel/eslint-parser",
      requireConfigFile: false,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'warn'
    },
    globals: {
      defineProps: "readonly",
      defineEmits: "readonly",
      defineExpose: "readonly",
      withDefaults: "readonly"
    }
  };
