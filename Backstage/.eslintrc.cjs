module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    '@nuxtjs/eslint-config', // 你已經裝了
    'plugin:nuxt/recommended',
    'plugin:vue/vue3-recommended',
    'prettier', // 關掉跟 prettier 衝突的 eslint 規則
  ],
  plugins: ['prettier'],
  rules: {
    // 讓 ESLint 以 prettier 結果為準（有差異就報錯）
    'prettier/prettier': 'error',

    // 下面這些是常見一致性規則（可依你團隊喜好微調）
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
}
