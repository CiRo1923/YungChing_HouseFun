<script setup>
import '@css/_modules/buy/mTable/variables.css'
import '@css/_modules/buy/mTable/checkboxResponsivVariables.css'
import '@css/_modules/buy/mTable/common.css'
import '@css/_modules/buy/mTable/checkboxResponsiv.css'

import useTableCore from './.composables/useTableCore'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

// 父系透過 @change 取得目前所有被勾選的列
const emits = defineEmits(['change'])

const props = defineProps({
  thead: {
    type: Array,
    default: null,
  },
  tbody: {
    type: Array,
    default: null,
  },
  tfoot: {
    type: Array,
    default: null,
  },
  table: {
    type: Object,
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

const isDeviceM = computed(() => device.value === 'm')

// CheckboxResponsiv 只在「非手機版」才固定 thead（手機版 thead 會被移除），
// 因此把 canFixThead 綁定為 !isDeviceM，讓 isTheadFixedActive 在手機版永遠關閉。
const {
  slots,
  containerRef,
  tableContentRef,
  theadRef,
  config,
  setClass,
  thead,
  tbody,
  tfoot,
  hasTbody,
  hasTfoot,
  isTheadFixedActive,
  fixedTheadStyle,
  isContainerScroll,
  getScopeValue,
  getSpan,
  getColumnClass,
} = useTableCore(props, {
  canFixThead: () => !isDeviceM.value,
})

// 欄位顯示控制：column.isHide 可為 true（全裝置隱藏）或 { p, pt, t, m } 依 device.value 隱藏
const isColumnHide = (column) => {
  const isHide = column?.isHide
  if (!isHide) return false
  if (isHide === true) return true
  return !!isHide[device.value]
}

// 依目前裝置過濾掉要隱藏的欄位（thead / tbody / tfoot 共用，欄位才會對齊）
const visibleThead = computed(() => thead.value.filter((column) => !isColumnHide(column)))

// 勾選欄位 schema：指定「每筆 item」用哪個 key 存勾選 / 禁用狀態，父系可由 config.schema 覆蓋
// 勾選狀態直接寫回 tbody 的該筆資料，父系可不靠 @change、直接讀 tbody 過濾取得
const checkboxSchema = computed(() => {
  return {
    isChecked: 'isChecked', // 每筆 item 存「是否勾選」的 key
    isDisabled: 'isDisabled', // 每筆 item 存「是否禁用」的 key
    ...config.value.schema,
  }
})

const isCheckedKey = computed(() => checkboxSchema.value.isChecked)
const isDisabledKey = computed(() => checkboxSchema.value.isDisabled)

// vee-validate field name（每筆唯一）
const getCheckboxName = (rowIndex) => `checked_tbody_[${rowIndex}]`

// 單筆是否禁用（讀 item 上的 isDisabled key）
const getCheckboxDisabled = (item) => !!item?.[isDisabledKey.value]

// 目前所有被勾選的「整筆資料」（也可由父系直接讀 tbody 過濾 isChecked 取得）
const checkedList = computed(() => {
  return tbody.value.filter((item) => item?.[isCheckedKey.value])
})

const onCheckboxChange = () => {
  emits('change', checkedList.value)
}

// 點整列（tr/td）切換勾選；點到連結/按鈕/表單元件則不觸發（交給它們自己處理）
const onRowToggle = (event, item) => {
  if (getCheckboxDisabled(item)) return
  if (event.target.closest('a, button, input, label, select, textarea')) return

  item[isCheckedKey.value] = !item[isCheckedKey.value]
  onCheckboxChange()
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="m-table --checkbox-responsiv"
    :class="[setClass.main, { '--thead-fixed': config.isTheadFixed }]"
  >
    <div
      class="m-table-container scrollbar --y"
      :class="[setClass.container, { '--scrolling': isContainerScroll }]"
      ref="containerRef"
    >
      <table class="m-table-content" :class="setClass.content" ref="tableContentRef">
        <thead
          class="m-table-thead"
          :class="[setClass.thead, { '--fixed': isTheadFixedActive }]"
          :style="fixedTheadStyle"
          ref="theadRef"
          v-if="!isDeviceM"
        >
          <tr class="m-table-thead-tr" :class="setClass.theadTr">
            <!-- 勾選欄：表頭留空 -->
            <th class="m-table-thead-th" />
            <th
              class="m-table-thead-th"
              :class="[setClass.theadTh, getColumnClass(column, 'thead')]"
              :colspan="getSpan(column, 'thead', 'colspan')"
              :rowspan="getSpan(column, 'thead', 'rowspan')"
              v-for="column in visibleThead"
              :key="`thead_${column.id}`"
            >
              <p :class="setClass.theadLabel" v-html="column.label" />
            </th>
          </tr>
        </thead>

        <tbody class="m-table-tbody" :class="setClass.tbody">
          <template v-if="hasTbody">
            <tr
              class="m-table-tbody-tr"
              :class="[
                setClass.tbodyTr,
                {
                  '--disabled': getCheckboxDisabled(item),
                  '--checked': item[isCheckedKey],
                },
              ]"
              v-for="(item, rowIndex) in tbody"
              :key="`tbody_tr_${rowIndex}`"
              @click="onRowToggle($event, item)"
            >
              <!-- 勾選欄 -->
              <td class="m-table-tbody-td" :class="setClass.tbodyTd">
                <div class="m-table-tbody-checkbox">
                  <CommonMFormCheckBox
                    :name="getCheckboxName(rowIndex)"
                    v-model="item[isCheckedKey]"
                    :config="{
                      mode: 'boolean',
                      isDisabled: getCheckboxDisabled(item),
                    }"
                    :setClass="setClass.checkbox"
                    @change="onCheckboxChange"
                  />
                  <!-- device pt / m 共用 -->
                  <slot
                    name="checkbox"
                    :tbody="tbody"
                    :index="rowIndex"
                    v-if="(!isDeviceM && !$slots.checkbox_pt) || (isDeviceM && !$slots.checkbox_m)"
                  />
                  <!-- device pt 單獨使用 -->
                  <slot
                    name="checkbox_pt"
                    :tbody="tbody"
                    :index="rowIndex"
                    v-if="!isDeviceM && $slots.checkbox_pt"
                  />
                  <!-- device m 單獨使用 -->
                  <slot
                    name="checkbox_m"
                    :tbody="tbody"
                    :index="rowIndex"
                    v-if="isDeviceM && $slots.checkbox_m"
                  />
                </div>
              </td>
              <td
                class="m-table-tbody-td"
                :class="[setClass.tbodyTd, getColumnClass(column, 'tbody')]"
                :colspan="getSpan(column, 'tbody', 'colspan')"
                :rowspan="getSpan(column, 'tbody', 'rowspan')"
                v-for="column in visibleThead"
                :key="`tbody_${rowIndex}_${column.id}`"
              >
                <!-- device pt / m 共用 -->
                <slot
                  :name="column.id"
                  :item="item"
                  :value="getScopeValue(item, column)"
                  :index="rowIndex"
                  :column="column"
                  v-if="
                    (!isDeviceM && !$slots[`${column.id}_pt`]) ||
                    (isDeviceM && !$slots[`${column.id}_m`])
                  "
                >
                  <BuyMTableTBodyValue :value="getScopeValue(item, column)" :config="column" />
                </slot>
                <!-- device pt 單獨使用 -->
                <slot
                  :name="`${column.id}_pt`"
                  :item="item"
                  :value="getScopeValue(item, column)"
                  :index="rowIndex"
                  :column="column"
                  v-if="!isDeviceM && $slots[`${column.id}_pt`]"
                >
                  <BuyMTableTBodyValue :value="getScopeValue(item, column)" :config="column" />
                </slot>
                <!-- device m 單獨使用 -->
                <slot
                  :name="`${column.id}_m`"
                  :item="item"
                  :value="getScopeValue(item, column)"
                  :index="rowIndex"
                  :column="column"
                  v-if="isDeviceM && $slots[`${column.id}_m`]"
                >
                  <BuyMTableTBodyValue :value="getScopeValue(item, column)" :config="column" />
                </slot>
              </td>
            </tr>
          </template>

          <tr class="m-table-tbody-tr --empty" :class="setClass.tbodyTr" v-else>
            <td
              class="m-table-tbody-td --empty"
              :class="setClass.tbodyTd"
              :colspan="visibleThead.length + 1"
            >
              <div class="m-table-no-data" :class="setClass.noData">
                <CommonSvgIcon :icon="config.noData.icon" v-if="config.noData.icon" />
                <p v-html="config.noData.message" />
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot class="m-table-tfoot" :class="setClass.tfoot" v-if="hasTfoot">
          <tr
            class="m-table-tfoot-tr"
            :class="setClass.tfootTr"
            v-for="(item, rowIndex) in tfoot"
            :key="`tfoot_tr_${rowIndex}`"
          >
            <td
              class="m-table-tfoot-td"
              :class="[setClass.tfootTd, getColumnClass(column, 'tfoot')]"
              v-for="column in visibleThead"
              :key="`tfoot_${rowIndex}_${column.id}`"
            >
              <slot
                :name="`${column.id}-tfoot`"
                :item="item"
                :value="getScopeValue(item, column)"
                :index="rowIndex"
                :column="column"
              >
                <BuyMTableTBodyValue :value="getScopeValue(item, column)" :config="column" />
              </slot>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="m-table-footer" :class="setClass.footer" v-if="slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>
