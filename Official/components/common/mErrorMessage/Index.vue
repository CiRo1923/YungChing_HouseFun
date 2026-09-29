<script setup>
/* 顯示一則欄位錯誤訊息的文字元件。

  由表單欄位元件使用:欄位驗證失敗時,把訊息文字傳進 message,
  這支負責用統一的樣式呈現。訊息內容與何時該顯示由欄位元件決定,
  這支不做判斷,只負責外觀。

  獨立成一支的原因:全站的錯誤訊息要長得一樣 ——
  圖示、顏色與圖文間距集中在這裡,調整一次即全站生效。

  **字級也在這裡定。** 判準是問「第二個地方用它的時候,這個值會不會不一樣?」
  錯誤訊息的答案是不會 —— 它到處都在用,但到處都該長一樣。
  交出去的話,每一種欄位都要傳同一組值,而那幾份遲早會各自飄移:
  改字級要記得每一處都改,漏掉的那一處不會報錯,只是它的訊息比別人大一號。

  某一個地方真的要不一樣時,那一處用 setClass 覆寫。 */

import './.css/variables.css'
import './.css/common.css'

const props = defineProps({
  message: {
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

/* 圖示的名字。全站的錯誤訊息用同一個,所以預設就填在這裡 ——
  使用端不必每一處都傳一次(漏傳的那一處不會報錯,只是少了圖示)。
  某一處要換成別的圖示時,用 config.icon 蓋掉。 */
const config = computed(() => {
  return {
    icon: 'icon_exclamation_o',
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <small class="m-error-message" :class="setClass.main">
    <!-- 沒有設定圖示就整個不畫 —— 畫一個名字是空的圖示,
      出來的是一塊看不見卻佔著寬度的空白,而且沒有任何訊息。 -->
    <CommonMSvgIcon :icon="config.icon" class="m-error-message-icon" v-if="config.icon" />
    <em class="m-error-message-text">{{ props.message }}</em>
  </small>
</template>
