<script setup>
import './.css/common.css'

/* 固定在畫面底部的常駐列。固定的那一刻它就脫離文檔流了,底下的東西會被蓋住 ——
  所以這裡把量到的高度寫進 --fixed-bottom-height,由版型那一層讓位:
  assets/css/_common/layout.css 的 .l-footer 補等高的 padding,
  components/buy/mTop 的回到頂端按鈕也依它往上移。
  沒有任何一支固定列的頁面讀到的是 0,版面完全不受影響。

  高度用量測而不是寫死:內容一行還是兩行、字級調一次都會變,
  寫死的那個數字與實際對不上時不會報錯,只會變成底下被蓋住或空一塊。 */
const FIXED_BOTTOM_VAR = '--fixed-bottom-height'

const barRef = ref(null)
let barObserver = null

const onSetFixedBottomHeight = (height) => {
  document.documentElement.style.setProperty(FIXED_BOTTOM_VAR, `${height}px`)
}

/* 只有真的固定住的時候才回報。使用端可以只讓它在某個斷點固定(m:--fixed),
  其他斷點它留在文檔流裡,本來就不會蓋住任何東西 —— 那時要回報 0。
  判斷看的是實際算出來的 position,而不是現在是哪一個斷點:
  斷點由使用端的 modifier 決定,這裡跟著結果走就不會有第二份判斷。 */
const onUpdateFixedBottomHeight = () => {
  const el = barRef.value

  if (!el || getComputedStyle(el).position !== 'fixed') {
    onSetFixedBottomHeight(0)

    return
  }

  onSetFixedBottomHeight(el.offsetHeight)
}

watch(barRef, (el) => {
  barObserver?.disconnect()
  barObserver = null

  if (!el) {
    onSetFixedBottomHeight(0)

    return
  }

  onUpdateFixedBottomHeight()
  barObserver = new ResizeObserver(onUpdateFixedBottomHeight)
  barObserver.observe(el)
})

/* 跨斷點時 position 變了、尺寸卻不一定變,那種情況 ResizeObserver 不會觸發 ——
  少了 resize 這一道,換到另一個斷點之後回報的還是上一個斷點的值。 */
onMounted(() => {
  window.addEventListener('resize', onUpdateFixedBottomHeight)
})

/* 變數掛在 documentElement 上,不會隨元件卸載自動消失 ——
  離開這一頁務必歸零,否則下一頁底下會殘留一段沒有人知道從哪來的空白。 */
onUnmounted(() => {
  window.removeEventListener('resize', onUpdateFixedBottomHeight)

  barObserver?.disconnect()
  barObserver = null
  onSetFixedBottomHeight(0)
})
</script>

<template>
  <div class="m-fixed-bar" ref="barRef">
    <slot />
  </div>
</template>
