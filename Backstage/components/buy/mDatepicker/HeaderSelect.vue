<script setup>
import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

/* headerMode: 'select' —— 年月各一個下拉,日曆留在原地。

  另外兩種模式各有一個做不到的地方:
    'string'  年月是純文字,只能用箭頭一個月一個月翻
    'panel'   點年月把整片日曆換成年 / 月清單,跳年月時日曆會消失

  要從 2026-09 跳到 2020-03,前者要按 78 次箭頭,後者是日曆整片消失兩次。
  下拉展開時只蓋住標題列下方那一塊,日曆一直在。

  **這支不分年月。** 它只認「fields 陣列,每一項是一個下拉」——
  要出現幾個、各自列什麼由呼叫端決定。分年月寫兩套的話,
  只到月的精度(沒有「選月」可言)就得再加一組條件,而那些條件會散在兩邊。 */
const props = defineProps({
  /* 每一項是一個下拉:
       key      'year' | 'month',選了之後回報是哪一個
       label    收合時顯示的文字
       value    目前選中的值,用來標出清單裡的那一項
       options  [{ key, label, value, disabled }] */
  fields: {
    type: Array,
    default: () => [],
  },
  prevDisabled: {
    type: Boolean,
    default: false,
  },
  nextDisabled: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['prev', 'next', 'select'])

const containerRef = ref(null)

/* 展開的是哪一個下拉 —— 同時只會有一個,所以一個值就夠。
   每個下拉各存一個開關的話,「開這個就要關掉另一個」得自己維護,而那是漏掉就會兩個一起開著。 */
const openedKey = ref('')

const listRefs = ref({})

/* 展開之後把選中那一項捲到清單中央。

  年份有上百筆,不捲的話每次打開都停在最上面 ——
  看到的是與現在無關的那幾年,要自己往下找。

  用 scrollTop 自己算,不用 scrollIntoView:後者會連外層一起捲,
  而這個清單在一個浮層裡、浮層又在頁面裡,結果是整頁跟著跳一下。 */
const onScrollToCurrent = async (key) => {
  await nextTick()

  const $list = listRefs.value[key]

  /* class 以連字號開頭,`.--curr` 不是合法的選擇器(會直接丟例外),
     所以用屬性比對:`~=` 是「空白分隔的其中一個值剛好等於它」。 */
  const $current = $list?.querySelector('[class~="--curr"]')
  if (!$list || !$current) return

  $list.scrollTop = $current.offsetTop - ($list.clientHeight - $current.clientHeight) / 2
}

const onToggle = (key) => {
  openedKey.value = openedKey.value === key ? '' : key

  if (openedKey.value) onScrollToCurrent(key)
}

const onPrev = () => {
  emits('prev')
}

const onNext = () => {
  emits('next')
}

const onSelect = (key, option) => {
  if (option.disabled) return

  openedKey.value = ''
  emits('select', { key, value: option.value })
}

/* 點到這支元件外面就把下拉收起來。

  用捕獲階段:日曆浮層自己也掛了一個「點外面關掉」的監聽,
  那一份會放行浮層內的點擊,所以收下拉不會連整個浮層一起關掉。
  冒泡階段的話,中間任何一層 stopPropagation 都會讓這裡收不到,
  而那時下拉會一直開著。 */
const onDocumentClick = (e) => {
  if (!openedKey.value) return
  if (containerRef.value?.contains(e.target)) return

  openedKey.value = ''
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
})
</script>

<template>
  <ul class="m-datepicker-calendar-header" ref="containerRef">
    <li class="m-datepicker-calendar-header-side">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.prevDisabled"
        @click="onPrev"
      >
        <CommonMSvgIcon icon="chevron_left" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>

    <li class="m-datepicker-calendar-header-container m-datepicker-calendar-select-group">
      <div class="m-datepicker-calendar-select" v-for="field in props.fields" :key="field.key">
        <button
          type="button"
          class="m-datepicker-calendar-select-label"
          :class="{ '--active': openedKey === field.key }"
          @click="onToggle(field.key)"
        >
          <span>{{ field.label }}</span>
          <!-- 箭頭用右向那一支轉過來 —— 展開時再往上翻,不必多一個朝下的圖示 -->
          <CommonMSvgIcon icon="chevron_right" class="m-datepicker-calendar-select-icon" />
        </button>

        <ul
          class="m-datepicker-calendar-select-list"
          :ref="(el) => (listRefs[field.key] = el)"
          v-if="openedKey === field.key"
        >
          <li v-for="option in field.options" :key="option.key">
            <button
              type="button"
              class="m-datepicker-calendar-select-option"
              :class="{
                '--curr': option.value === field.value,
                '--disabled': option.disabled,
              }"
              :disabled="option.disabled"
              @click="onSelect(field.key, option)"
            >
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </li>

    <li class="m-datepicker-calendar-header-side">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.nextDisabled"
        @click="onNext"
      >
        <CommonMSvgIcon icon="chevron_right" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>
  </ul>
</template>
