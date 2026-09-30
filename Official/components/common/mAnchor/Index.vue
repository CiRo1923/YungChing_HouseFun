<script setup>
import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

const emits = defineEmits(['click'])
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  to: {
    type: Object,
    default: null,
  },
  href: {
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

const config = computed(() => {
  return {
    as: null,
    icon: null,
    target: null,
    isDisabled: false,
    ...props.config,
  }
})

/* 站內連結用這個框架自己的連結元件,不是 vue-router 那一支 router-link。
  兩者都走得到同一個路由,差別在它多做的兩件事:

    預抓      連結進入可視範圍時就先把那一頁要用的檔案載下來;
              router-link 是點下去才開始下載,慢的那一下使用者看得到
    外部網址  to 給的是完整網址時自動改成一般的連結;
              router-link 會拿去比對路由,比不到就留在原地不動

  **取的方式也不一樣。** 這一支不是全域註冊的元件,是由建置流程在編譯期
  接進來的 —— 所以下面那個動態標籤不能直接寫字串名字。寫字串的話解析不到,
  而解析不到時**不會報錯**:那個名字會被當成一般標籤原樣輸出,
  畫面上是一個點不動的東西。要用 resolveComponent 取,而且要在這一層取
  (它讀的是現在這個元件的環境,搬進 computed 裡就讀不到)。

  另一份範本(不是這個框架的那一份)沒有這支元件,那邊用的就是 router-link ——
  這一段是兩份刻意不同的地方,同步時不要整支覆蓋過去。 */
const routerTag = resolveComponent('NuxtLink')

const as = computed(() => {
  const { as } = config.value

  if (as === 'router') return routerTag
  if (/^(button|submit)$/.test(as)) return 'button'
  if (props.to) return routerTag
  if (props.href) return 'a'
  return 'button'
})

const isRouter = computed(() => as.value === routerTag)

const bind = computed(() => {
  return isRouter.value
    ? {
        to: props.to,
        ...(config.value.target
          ? {
              target: config.value.target,
              rel: 'noopener',
            }
          : {}),
      }
    : as.value === 'a'
      ? {
          href: props.href,
          // 外連預設開新分頁;config.target 可覆寫(如 tel: / mailto: 傳 '_self',
          // 不該先開空白分頁再交給系統處理)。用 ?? 而非 ||,才不會把 '' 也吃掉。
          target: config.value.target ?? '_blank',
          rel: 'noopener',
        }
      : as.value !== 'div'
        ? {
            type: as.value,
          }
        : null
})

const icon = computed(() => {
  const { icon } = config.value
  const isString = icon ? typeof icon === 'string' : true

  return {
    position: isString ? 'right' : icon.position,
    name: isString ? icon : icon.name,
  }
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      text: '',
      icon: '',
    },
    ...props.setClass,
  }
})

const onClick = (e) => {
  const { isDisabled } = config.value
  if (isDisabled) {
    e.preventDefault()
  } else {
    emits('click', e)
  }
}
</script>

<template>
  <component
    :is="as"
    class="m-anchor"
    :class="setClass.main"
    v-bind="bind"
    :disabled="config.isDisabled"
    @click="onClick"
  >
    <slot>
      <CommonMSvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'left' && icon.name"
      />
      <em class="m-anchor-text" :class="setClass.text" v-if="props.text">
        {{ props.text }}
      </em>
      <CommonMSvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'right' && icon.name"
      />
    </slot>
  </component>
</template>
