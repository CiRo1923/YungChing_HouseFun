<script setup>
import '@css/_modules/common/mTab/variables.css'
import '@css/_modules/common/mTab/borderBottomVariables.css'
import '@css/_modules/common/mTab/common.css'
import '@css/_modules/common/mTab/borderBottom.css'

import { onMergeTabConfig, useTabCore } from './.composables/useTabCore.js'

import { onResolveByDevice } from '@js/_projectPrototype.js'

/* change 是 select 模式專用的出口 —— 那個模式下不會有 click。
  帶 to / href 的項目要導頁時,由使用端接這個事件自己處理
  (useTabCore 的 onClick 對 URL 項目一律 return,不動 activeIndex)。 */
const emits = defineEmits(['click', 'change', 'changed'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  // select 模式的欄位名。那個模式用 MFormSelect,它內部是 vee-validate 的 Field
  name: {
    type: String,
    default: '',
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
  return onMergeTabConfig(props.config, {
    active: null,
    containerMode: 'multiple', // multiple / single / false
    /* 標頭長什麼樣。可傳單一值,或依裝置設定的物件 { p, pt, tm, t, m }
      —— 例如 { pt: 'default', m: 'select' }:桌機平板是一排 tab、手機收成下拉。
      body 兩種模式完全一樣,換掉的只有標頭那一塊。

      注意:預設寫 null 而不是 'default',**這是必要的**:config 走 onDeepMerge,
          而它遇到「來源是物件、目標是非空的非物件」時會整段跳過 ——
          預設若是 'default' 這個字串,使用端傳的 { tm: 'select' } 會被靜靜吃掉。
          null 是 falsy,那支才會先把它換成 {} 再合併。
          真正的預設值由下面 mode 那個 computed 的 || 'default' 表達。 */
    mode: null, // 'default' | 'select' | { p, pt, tm, t, m }
    schema: {
      id: 'id',
      label: 'label',
    },
  })
})

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

/* device 只會回傳 p | t | m,pt / tm 這種區間設定由 onResolveByDevice 解析。
  都沒對應到時它回 null,所以要兜回 default。 */
const mode = computed(() => onResolveByDevice(config.value.mode, device.value) || 'default')

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerItems: '',
    headerItem: '',
    anchor: '',
    body: '',
    /* select 模式:整包交給 MFormSelect,不是單一 class 字串 ——
      它的字級要走 setClass.dropdownLabel(複用型元件的字級由使用端決定),
      只轉一個 main 的話使用端就沒有管道傳了。鍵名見 mForm/Select.vue。 */
    select: {},
    ...props.setClass,
  }
})

const {
  activeIndex,
  prevIndex,
  direction,
  animating,
  isShowItem,
  onHeaderAs,
  onHeaderBind,
  onClick,
  onTrackTransitionEnd,
} = useTabCore({ config })

const onAnchorClick = (item, index) => {
  onClick(item, index)
  emits('click', { item, index })
}

/* ---- select 模式 ---- */

/* MFormSelect 的 schema 是 { label, value },mTab 的是 { id, label } —— 對應過去。
  value 用 id 而不是 index:index 會隨 items 增刪而變,id 不會。 */
const selectSchema = computed(() => ({
  label: config.value.schema.label,
  value: config.value.schema.id,
}))

const selectConfig = computed(() => ({
  schema: selectSchema.value,
  /* 這不是表單欄位,是換頁籤用的控制項 —— 關掉全部自動驗證。

    注意:關掉的只是「什麼時候自動驗」。MFormSelect 內部是 vee-validate 的 Field,
        **它仍然會註冊進外層的 <Form>** —— 值會出現在那份 form values 裡,
        submit 時的 validate() 也照樣掃得到它(沒給 rules,所以會通過)。
        真的不能有這個欄位的話,就不要在那個位置用 select 模式。 */
  validateEvents: [],
}))

const selectModel = computed({
  get: () => props.items[activeIndex.value]?.[config.value.schema.id] ?? null,
  set: (value) => {
    const index = props.items.findIndex((item) => item[config.value.schema.id] === value)
    if (index === -1) return

    /* 先讓 useTabCore 切狀態,再往外報。
      注意:帶 to / href 的項目 onClick 會直接 return(不動 activeIndex),
          所以那種項目**選了畫面不會變** —— 導頁由使用端接 change 自己處理,
          導完是新的一頁,active 由那邊依路由重算。 */
    onClick(props.items[index], index)
    emits('change', { item: props.items[index], index })
  },
})

/* 注意:device 預設是 'p',而且**沒有全域的更新入口** —— 每一支用到它的元件
    都要自己量一次並掛 resize(mFooter / mNav / mTooltip 都是這樣)。
    少了這兩段,mode 的斷點設定會永遠停在桌機那一邊。 */
onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const onTransitionEnd = async (e) => {
  const changed = await onTrackTransitionEnd(e)
  if (!changed) return

  emits('changed', {
    item: props.items[activeIndex.value],
    index: activeIndex.value,
  })
}
</script>

<template>
  <div class="m-tab --border-bottom" :class="setClass.main">
    <div class="m-tab-header" :class="setClass.header">
      <!-- select 模式:整排 tab 收成一個下拉。body 那半兩種模式共用,不必分 -->
      <CommonMFormSelect
        :name="props.name"
        :options="props.items"
        :config="selectConfig"
        :setClass="setClass.select"
        v-model="selectModel"
        v-if="mode === 'select'"
      />
      <ul class="m-tab-header-items" :class="setClass.headerItems" v-else>
        <li
          class="m-tab-header-item"
          :class="setClass.headerItem"
          v-for="(item, index) in props.items"
          :key="`tab_header_${item[config.schema.id]}_${index}`"
        >
          <component
            :is="onHeaderAs(item)"
            class="m-tab-anchor"
            :class="[
              {
                '--active': index === activeIndex,
              },
              setClass.anchor,
            ]"
            v-bind="onHeaderBind(item)"
            @click="onAnchorClick(item, index)"
          >
            <CommonSvgIcon :icon="item.icon" class="m-tab-icon" v-if="item.icon" />
            <slot name="anchor" :item="item" :index="index">
              <em class="m-tab-anchor-label">{{ item[config.schema.label] }}</em>
            </slot>
          </component>
        </li>
      </ul>
      <slot name="headerTools" />
    </div>
    <div class="m-tab-body" :class="setClass.body">
      <div class="m-table-body-content">
        <!-- 單一區塊 -->
        <ul class="m-tab-body-items" v-if="config.containerMode === 'single'">
          <li class="m-tab-body-item">
            <slot />
          </li>
        </ul>
        <!-- 多個區塊 -->
        <ul
          class="m-tab-body-items"
          :class="[animating, direction]"
          @transitionend="onTransitionEnd"
          v-if="config.containerMode === 'multiple'"
        >
          <template v-for="(item, index) in props.items" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item"
              v-if="!item.href && (index === activeIndex || (isShowItem && index === prevIndex))"
            >
              <slot :name="`content_${item.id}`" :index="index" :item="item" />
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
