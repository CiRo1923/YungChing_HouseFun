import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

const refValueAssignmentRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require .value when assigning to refs created by ref()',
    },
    fixable: 'code',
    schema: [],
    messages: {
      requireValue:
        "Assign to '{{ name }}.value' instead of '{{ name }}' for refs created by ref().",
    },
  },
  create(context) {
    const refNames = new Set()

    return {
      VariableDeclarator(node) {
        if (node.id?.type !== 'Identifier') return
        if (node.init?.type !== 'CallExpression') return

        const callee = node.init.callee
        const isRefCall =
          (callee?.type === 'Identifier' && callee.name === 'ref') ||
          (callee?.type === 'Identifier' && callee.name === 'shallowRef')

        if (isRefCall) {
          refNames.add(node.id.name)
        }
      },
      AssignmentExpression(node) {
        if (node.left?.type !== 'Identifier') return
        if (!refNames.has(node.left.name)) return

        context.report({
          node: node.left,
          messageId: 'requireValue',
          data: {
            name: node.left.name,
          },
          fix(fixer) {
            return fixer.replaceText(node.left, `${node.left.name}.value`)
          },
        })
      },
    }
  },
}

export default createConfigForNuxt(
  {},
  {
    languageOptions: {
      globals: {
        defineNuxtPlugin: 'readonly',
      },
    },
    plugins: {
      local: {
        rules: {
          'require-ref-value-assignment': refValueAssignmentRule,
        },
      },
    },
    rules: {
      'local/require-ref-value-assignment': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': [
        'error',
        'never',
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
  }
)
