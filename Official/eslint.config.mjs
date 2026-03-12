import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // 你不想管屬性順序就直接關掉
    'vue/attributes-order': 'off',
    'vue/attribute-hyphenation': [
      'error',
      'never',
      {
        autofix: true,
      },
      {
        ignore: [],
        ignoreTags: [],
      },
    ],
    'vue/no-v-html': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'any',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
  },
})
