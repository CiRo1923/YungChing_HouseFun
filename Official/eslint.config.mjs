import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

// .tools/store-composable-imports.ts 為 TS,ESLint 的 .mjs 設定無法直接 import → 以 jiti 載入
const jiti = createJiti(import.meta.url)
const { getStoreComposableImports, getStoreImports } = await jiti.import(
  './.tools/store-composable-imports.ts'
)

const storesDir = fileURLToPath(new URL('./stores', import.meta.url))
const storeGlobals = Object.fromEntries(
  [...getStoreComposableImports(storesDir), ...getStoreImports(storesDir)].map((item) => [
    item.as,
    'readonly',
  ])
)

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

const refValueAccessRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require .value when reading properties of refs (ref/shallowRef/computed/storeToRefs/toRefs).',
    },
    fixable: 'code',
    schema: [],
    messages: {
      requireValue:
        "Read '{{ name }}.value.{{ prop }}' instead of '{{ name }}.{{ prop }}' — '{{ name }}' is a ref and needs .value.",
    },
  },
  create(context) {
    // 回傳「單一 ref」的工廠(const x = ref(...))
    const REF_FACTORIES = new Set(['ref', 'shallowRef', 'computed', 'customRef', 'toRef'])
    // 回傳「物件、每個屬性都是 ref」的工廠(const { a } = storeToRefs(...))
    const REFS_FACTORIES = new Set(['storeToRefs', 'toRefs'])

    // template 內 ref 會自動 unwrap(authToken.longToken 反而正確),故排除 vue-eslint-parser 的
    // template 運算式。注意不能用 type.startsWith('V') —— 那會誤中標準 ESTree 的
    // VariableDeclarator / VariableDeclaration;template 運算式一律包在 VExpressionContainer 內。
    const isInsideTemplate = (node) => {
      for (let n = node.parent; n; n = n.parent) {
        if (n.type === 'VExpressionContainer') return true
      }
      return false
    }

    // 依「作用域鏈」由內而外解析識別字綁定,正確處理 shadowing(區域 let 遮蔽同名 ref)
    const resolveVariable = (scope, name) => {
      for (let s = scope; s; s = s.upper) {
        const found = s.variables.find((v) => v.name === name)
        if (found) return found
      }
      return null
    }

    // 該綁定是否由 ref 工廠 / storeToRefs 解構而來(逐一檢查其宣告 def,而非只看名字)
    const isRefBinding = (variable) => {
      if (!variable) return false
      return variable.defs.some((def) => {
        if (def.type !== 'Variable') return false
        const decl = def.node // VariableDeclarator
        const init = decl.init
        if (init?.type !== 'CallExpression' || init.callee?.type !== 'Identifier') return false
        const name = init.callee.name
        if (decl.id?.type === 'Identifier' && REF_FACTORIES.has(name)) return true
        if (decl.id?.type === 'ObjectPattern' && REFS_FACTORIES.has(name)) return true
        return false
      })
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode()

    return {
      MemberExpression(node) {
        if (node.object?.type !== 'Identifier') return
        if (isInsideTemplate(node)) return

        // 取屬性名:靜態存取用 property.name;computed 只認字面量(authToken['longToken']),
        // 動態鍵(authToken[key])無法判斷,略過。
        const propName = node.computed
          ? node.property?.type === 'Literal'
            ? String(node.property.value)
            : null
          : node.property?.name
        if (propName == null) return
        if (propName === 'value') return // 正確用法

        // 解析 object 綁定,僅在它確實是 ref 時才報錯(避免區域變數 shadowing 造成誤報)
        const variable = resolveVariable(sourceCode.getScope(node), node.object.name)
        if (!isRefBinding(variable)) return

        context.report({
          node,
          messageId: 'requireValue',
          data: {
            name: node.object.name,
            prop: propName,
          },
          fix(fixer) {
            return fixer.insertTextAfter(node.object, '.value')
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
        ...storeGlobals,
        callOnce: 'readonly',
        computed: 'readonly',
        defineNuxtPlugin: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        definePageMeta: 'readonly',
        inject: 'readonly',
        navigateTo: 'readonly',
        nextTick: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeRouteLeave: 'readonly',
        onBeforeUnmount: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        provide: 'readonly',
        readonly: 'readonly',
        shallowReadonly: 'readonly',
        showError: 'readonly',
        ref: 'readonly',
        storeToRefs: 'readonly',
        toValue: 'readonly',
        useAsyncData: 'readonly',
        useCookie: 'readonly',
        useNuxtApp: 'readonly',
        useRequestURL: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useHead: 'readonly',
        useRuntimeConfig: 'readonly',
        useSlots: 'readonly',
        useState: 'readonly',
        unref: 'readonly',
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
          'require-ref-value-access': refValueAccessRule,
        },
      },
    },
    rules: {
      'local/no-duplicate-object-key-values-in-array': 'warn',
      'local/require-ref-value-assignment': 'error',
      'local/require-ref-value-access': 'error',
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
      'vue/v-on-event-hyphenation': [
        'error',
        'never',
        {
          autofix: true,
        },
      ],
      // warn 不是 error —— 既有使用點多為內部 UI 字串,不值得逐一加 disable 註解。
      // 但新增的 v-html(特別是渲染 API 回傳內容的)該被看見;XSS 的真正防線在後端 sanitize。
      'vue/no-v-html': 'warn',
      // 樣式一律走 script setup 的 JS import,<style> 區塊不留(見 css-conventions.md 規則 3)
      'vue/no-empty-component-block': 'warn',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
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
).append({
  // Nitro 在 server/ 下自動注入 h3 helpers(不經 import),ESLint 無從得知 → 明示宣告避免 no-undef
  files: ['server/**/*.{js,mjs,ts}'],
  languageOptions: {
    globals: {
      defineEventHandler: 'readonly',
      getRequestURL: 'readonly',
      sendRedirect: 'readonly',
    },
  },
})
