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

const noDuplicateObjectKeyValuesInArrayRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn when array literals reuse the same schema key value such as id',
    },
    schema: [],
    messages: {
      duplicatedValue:
        "Duplicate schema key '{{ propertyName }}' value '{{ value }}' found in the same array literal.",
    },
  },
  create(context) {
    const targetPropertyNames = new Set(['id', 'key'])

    const getPropertyName = (node) => {
      if (!node) return null
      if (node.type === 'Identifier') return node.name
      if (node.type === 'Literal') return String(node.value)

      return null
    }

    const getStaticValue = (node) => {
      if (!node) return null

      if (node.type === 'Literal') {
        return node.value == null ? String(node.value) : String(node.value)
      }

      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis[0]?.value.cooked ?? ''
      }

      return null
    }

    return {
      ArrayExpression(node) {
        const seenValues = new Map()

        node.elements.forEach((element) => {
          if (!element || element.type !== 'ObjectExpression') return

          element.properties.forEach((property) => {
            if (property.type !== 'Property' || property.computed) return

            const propertyName = getPropertyName(property.key)
            if (!targetPropertyNames.has(propertyName)) return

            const value = getStaticValue(property.value)
            if (value == null) return

            const bucketKey = `${propertyName}:${value}`
            const firstProperty = seenValues.get(bucketKey)

            if (firstProperty) {
              context.report({
                node: property.value,
                messageId: 'duplicatedValue',
                data: {
                  propertyName,
                  value,
                },
              })

              return
            }

            seenValues.set(bucketKey, property)
          })
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
        computed: 'readonly',
        defineNuxtPlugin: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        definePageMeta: 'readonly',
        navigateTo: 'readonly',
        nextTick: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeUnmount: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        readonly: 'readonly',
        ref: 'readonly',
        storeToRefs: 'readonly',
        useAsyncData: 'readonly',
        useNuxtApp: 'readonly',
        useRequestURL: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useRuntimeConfig: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        useRequestHeaders: 'readonly',
      },
    },
    plugins: {
      local: {
        rules: {
          'no-duplicate-object-key-values-in-array': noDuplicateObjectKeyValuesInArrayRule,
          'require-ref-value-assignment': refValueAssignmentRule,
        },
      },
    },
    rules: {
      'local/no-duplicate-object-key-values-in-array': 'warn',
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
