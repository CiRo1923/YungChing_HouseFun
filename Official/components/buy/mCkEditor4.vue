<script setup>
const emits = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
const toolbarDefault = readonly([
  {
    name: 'clipboard',
    items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
  },
  { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
  {
    name: 'basicstyles',
    items: [
      'Bold',
      'Italic',
      'Underline',
      'Strike',
      '-',
      'Subscript',
      'Superscript',
      '-',
      'RemoveFormat',
    ],
  },
  {
    name: 'texttransform',
    items: [
      'TransformTextToUppercase',
      'TransformTextToLowercase',
      'TransformTextCapitalize',
      'TransformTextSwitcher',
    ],
  },
  {
    name: 'paragraph',
    items: [
      'JustifyLeft',
      'JustifyCenter',
      'JustifyRight',
      'JustifyBlock',
      '-',
      'NumberedList',
      'BulletedList',
      '-',
      'Outdent',
      'Indent',
      '-',
      'Blockquote',
    ],
  },
  { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
  {
    name: 'insert',
    items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar', 'Smiley', 'PageBreak', 'Iframe'],
  },
  { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
  { name: 'colors', items: ['TextColor', 'BGColor'] },
  // { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
  {
    name: 'document',
    items: ['Source', '-', 'Preview', 'Print'],
  },
])

const editorLength = ref(0)
const model = computed({
  get() {
    return props.modelValue ?? ''
  },
  set(value) {
    emits('update:modelValue', value)
  },
})
const config = computed(() => {
  return {
    loadMessage: null,
    height: 150,
    toolbar: null,
    placeholder: '',
    maxlength: null,
    ...props.config,
  }
})

const toolbar = computed(() => {
  const { toolbar } = config.value
  const onBuildToolbar = () => {
    const aliasMap = new Map([
      ['Uppercase', 'TransformTextToUppercase'],
      ['Lowercase', 'TransformTextToLowercase'],
      ['Capitalize', 'TransformTextCapitalize'],
      ['Switcher', 'TransformTextSwitcher'],
    ])
    const rawTokens = toolbar
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const tokens = rawTokens.map((t) => aliasMap.get(t) ?? t)
    const resultMap = new Map()

    // 先跑 items
    toolbarDefault.forEach((group) => {
      tokens.forEach((token) => {
        if (group.items.includes(token)) {
          if (!resultMap.has(group.name)) {
            resultMap.set(group.name, new Set())
          }
          resultMap.get(group.name).add(token)
        }
      })
    })

    // 再跑 name
    toolbarDefault.forEach((group) => {
      if (tokens.includes(group.name)) {
        resultMap.set(group.name, new Set(group.items))
      }
    })

    // 轉回 CKEditor 結構
    return toolbarDefault
      .filter((group) => resultMap.has(group.name))
      .map((group) => ({
        name: group.name,
        items: Array.from(resultMap.get(group.name)),
      }))
  }

  return toolbar ? onBuildToolbar() : toolbarDefault
})

const editorConfig = computed(() => {
  const { height, placeholder, maxlength } = config.value
  return {
    height,
    toolbar: toolbar.value,
    allowedContent: true,
    editorplaceholder: placeholder,
    extraPlugins: 'editorplaceholder, texttransform, wordcount',
    removePlugins: 'resize, elementspath, exportpdf',
    bodyClass: 'ckeditor-content',
    wordcount: {
      showParagraphs: false,
      showWordCount: false,
      showCharCount: false,
      maxCharCount: maxlength, // 👈 限制字數
    },
    // contentsCss 的 css 檔案無法用 apply 編譯
    contentsCss: [
      '/assets/css/plugins/ckeditor/reset.css',
      '/assets/css/plugins/ckeditor/iframe.css',
    ],
    on: {
      instanceReady(evt) {
        const editor = evt.editor
        // TransformText Rename
        const safeRename = (uiName, label) => {
          const item = editor.ui.get(uiName)

          // 有些版本取不到，或拿到的不是 button
          if (!item || !item._ || !item._.definition) return

          item._.definition.label = label
          // 有些情況下需要更新 title
          if (item._.definition.title) item._.definition.title = label
        }

        safeRename('TransformTextToUppercase', 'Uppercase')
        safeRename('TransformTextToLowercase', 'Lowercase')
        safeRename('TransformTextCapitalize', 'Capitalize')
        safeRename('TransformTextSwitcher', 'Toggle Case')

        // 取得文字長度
        const getLen = () => {
          const t = editor.document.getBody().getText() || ''
          return t.replace(/\s+$/g, '').length // 去掉尾端空白 / 換行
        }

        // 更新文字長度
        const updateLength = () => {
          editorLength.value = getLen()
        }

        const updateLengthAsync = () => {
          Promise.resolve().then(updateLength)
        }

        // 初始化計算一次
        updateLength()

        // 內容有變就更新（最穩）
        editor.on('change', () => {
          // 延後一下，等 paste/IME 實際寫入後再算
          updateLengthAsync()
        })

        // 如果你希望更即時（可選）
        editor.on('afterCommandExec', () => updateLengthAsync)
        editor.on('paste', () => updateLengthAsync)

        // 阻止字數長度
        const max = Number.isFinite(+maxlength) ? +maxlength : null
        if (!max) return

        // 1) 貼上：滿了就直接擋；未滿就允許
        editor.on('paste', (e) => {
          const current = getLen()
          const allowed = max - current

          if (allowed <= 0) {
            e.cancel()
            return
          }

          // CKEditor paste 可能是 HTML
          const raw = String(e.data.dataValue ?? '')

          // 取出純文字（盡量）
          const plain = raw
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>/g, '') // 去掉 tags
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+$/g, '') // 砍掉尾端換行 / 空白

          if (plain.length > allowed) {
            // 截斷到剩餘可貼長度
            e.data.dataValue = plain.slice(0, allowed)
          } else {
            // 直接用純文字（避免把 HTML tag 長度算進來導致超出）
            e.data.dataValue = plain
          }
        })

        // 2) 兜底：任何原因（包含 IME）只要讓字數超過，就 undo 回去
        let rollingBack = false
        editor.on('contentDom', () => {
          const editable = editor.editable()

          if (!editable) return

          editable.on('input', (evt) => {
            if (rollingBack) return
            if (getLen() <= max) return
            rollingBack = true
            editor.once('change', () => {
              rollingBack = false
            })

            editor.execCommand('undo')
          })
        })
      },
    },
  }
})

const setClass = computed(() => {
  return {
    main: '',
    suffix: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-ckeditor4" :class="setClass.main">
    <ClientOnly :fallback="config.loadMessage">
      <ckeditor
        v-model="model"
        :config="editorConfig"
        editor-url="/scripts/plugins/ckeditor/ckeditor.js"
      />
      <div class="m-ckeditor4-suffix" :class="setClass.suffix" v-if="$slots.suffix">
        <slot name="suffix" :maxlength="config.maxlength" :length="editorLength" />
      </div>
    </ClientOnly>
  </div>
</template>

<style src="@css/_plugin/ckeditor4.css" />
<style lang="postcss">
.m-ckeditor4-content {
  @apply text-[16px];
}
</style>
