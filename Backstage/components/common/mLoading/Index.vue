<script setup>
/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。這裡給的是形狀不是成品:載入動畫長什麼樣,
  每個站都不一樣,多半是整支重畫。蓋過去等於把那個站的動畫換成這裡的,
  而那不會報錯,要看到載入中的畫面才發現。

  **畫面結構隨專案改,但最外層的 class 一律是 `m-loading`。**
  資料夾名與組件 class 是一組(規則 componentClass 在看),
  改掉那個名字之後,這支元件的樣式與它自己就對不起來了。 */

import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    isFixed: false,
    ...props.config,
  }
})
</script>

<template>
  <div class="m-loading" :class="{ '--fixed': config.isFixed }">
    <!-- --card:浮在遮罩上時要有卡片外觀;直接放在 popup 裡的情境不帶它 -->
    <CommonMLoadingContainer
      :setClass="{
        container: '--card',
      }"
    >
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>
