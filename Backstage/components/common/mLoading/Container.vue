<script setup>
/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。這裡給的是形狀不是成品:一個轉圈的元素
  加一行文字,連那句文案都是要換掉的。蓋過去等於把那個站的載入畫面
  換成這裡的,而那不會報錯,要等到某一次載入中才看得出來。

  與 Index.vue 是一組,兩支要一起接:那一支是外框與定位,
  這一支是裡面顯示的內容。 */

import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="m-loading-container" :class="props.setClass?.container">
    <i class="m-loading-spinner" />
    <p class="m-loading-text">
      <slot>資料讀取中，感謝您耐心等候！</slot>
    </p>
  </div>
</template>
