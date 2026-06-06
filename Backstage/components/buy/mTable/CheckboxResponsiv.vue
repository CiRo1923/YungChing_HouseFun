<script setup>
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
    <div class="m-table-container scrollbar --y" :class="setClass.container" ref="containerRef">
      <table class="m-table-content w-full" :class="setClass.content" ref="tableContentRef">
        <thead
          class="m-table-thead"
          :class="[setClass.thead, { '--fixed': isTheadFixedActive }]"
          :style="fixedTheadStyle"
          ref="theadRef"
          v-if="!isDeviceM"
        >
          <tr class="m-table-thead-tr text-center" :class="setClass.theadTr">
            <!-- 勾選欄：表頭留空 -->
            <th class="m-table-thead-th" />
            <th
              class="m-table-thead-th font-normal"
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
              class="m-table-tbody-tr transition-colors duration-300"
              :class="[
                setClass.tbodyTr,
                getCheckboxDisabled(item) ? 'cursor-not-allowed' : 'cursor-pointer',
                { '--checked': item[isCheckedKey] },
              ]"
              v-for="(item, rowIndex) in tbody"
              :key="`tbody_tr_${rowIndex}`"
              @click="onRowToggle($event, item)"
            >
              <!-- 勾選欄 -->
              <td class="m-table-tbody-td" :class="setClass.tbodyTd">
                <div class="m:flex m:items-center m:gap-x-[4px]">
                  <BuyMFormCheckBox
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

<style src="@css/_modules/buy/mTable.css"></style>
<style lang="postcss">
:root {
  --table-checkbox-responsiv-thtd-first-last-pc-px: 16px;
  --table-checkbox-responsiv-thtd-first-last-tabled-px: 10px;

  --table-checkbox-responsiv-thtd-pc-px: 5px;
  --table-checkbox-responsiv-thtd-tabled-px: 4px;

  --table-checkbox-responsiv-thead-th-pc-py: 8px;
  --table-checkbox-responsiv-thead-th-tabled-py: 5px;
  --table-checkbox-responsiv-thead-th-pc-text: 16px;
  --table-checkbox-responsiv-thead-th-tabled-text: 14px;

  --table-checkbox-responsiv-tbody-tr-pc-border-b: 1px;
  --table-checkbox-responsiv-tbody-tr-tabled-border-b: 1px;
  --table-checkbox-responsiv-tbody-tr-mobile-border-b: 1px;

  --table-checkbox-responsiv-tbody-tr-mobile-py: 24px;

  --table-checkbox-responsiv-tbody-tr-mobile-px: 16px;

  --table-checkbox-responsiv-tbody-td-pc-py: 15px;
  --table-checkbox-responsiv-tbody-td-tabled-py: 10px;

  --table-checkbox-responsiv-thead-th-color: var(--gray-333);
  --table-checkbox-responsiv-tbody-tr-border-color: var(--gray-e5);
  --table-checkbox-responsiv-tbody-tr-background-color: transparent;
  --table-checkbox-responsiv-tbody-tr-checked-background-color: var(--gray-f7);
  --table-checkbox-responsiv-tbody-td-color: var(--gray-666);
}

.m-table {
  &.\-\-checkbox-responsiv {
    .m-table-tbody-tr {
      border-bottom: var(--table-checkbox-responsiv-tbody-tr-border-b) solid
        var(--table-checkbox-responsiv-tbody-tr-border-color);

      &:not(.--checked) {
        @apply bg-[--table-checkbox-responsiv-tbody-tr-background-color];
      }

      &.\-\-checked {
        @apply bg-[--table-checkbox-responsiv-tbody-tr-checked-background-color];
      }
    }

    .m-table-tbody-td {
      @apply text-[--table-checkbox-responsiv-tbody-td-color];
    }
  }
}

@screen p {
  .m-table {
    &.\-\-checkbox-responsiv {
      --table-checkbox-responsiv-thtd-first-last-px: var(
        --table-checkbox-responsiv-thtd-first-last-pc-px
      );
      --table-checkbox-responsiv-thtd-px: var(--table-checkbox-responsiv-thtd-pc-px);
      --table-checkbox-responsiv-thead-th-py: var(--table-checkbox-responsiv-thead-th-pc-py);
      --table-checkbox-responsiv-thead-th-text: var(--table-checkbox-responsiv-thead-th-pc-text);

      --table-checkbox-responsiv-tbody-tr-border-b: var(
        --table-checkbox-responsiv-tbody-tr-pc-border-b
      );
      --table-checkbox-responsiv-tbody-td-py: var(--table-checkbox-responsiv-tbody-td-pc-py);
      /* --table-checkbox-responsiv-tbody-td-text: var(--table-checkbox-responsiv-tbody-td-pc-text); */
    }
  }
}

@screen pt {
  .m-table {
    &.\-\-checkbox-responsiv {
      .m-table-thead-th,
      .m-table-tbody-td {
        &:not(:first-child) {
          @apply pl-[--table-checkbox-responsiv-thtd-px];
        }

        &:first-child {
          @apply w-[calc(var(--table-checkbox-responsiv-thtd-px)_+_var(--table-checkbox-responsiv-thtd-first-last-pc-px)_+_18px)] pl-[--table-checkbox-responsiv-thtd-first-last-pc-px];
        }

        &:not(:last-child) {
          @apply pr-[--table-checkbox-responsiv-thtd-px];
        }

        &:last-child {
          @apply pr-[--table-checkbox-responsiv-thtd-first-last-pc-px];
        }
      }

      .m-table-thead-th {
        font-size: var(--table-checkbox-responsiv-thead-th-text);

        @apply py-[--table-checkbox-responsiv-thead-th-py] text-[--table-checkbox-responsiv-thead-th-color];
      }

      .m-table-tbody-td {
        @apply py-[--table-checkbox-responsiv-tbody-td-py];
      }
    }
  }
}

@screen t {
  .m-table {
    &.\-\-checkbox-responsiv {
      --table-checkbox-responsiv-thtd-first-last-px: var(
        --table-checkbox-responsiv-thtd-first-last-tabled-px
      );
      --table-checkbox-responsiv-thtd-px: var(--table-checkbox-responsiv-thtd-tabled-px);
      --table-checkbox-responsiv-thead-th-py: var(--table-checkbox-responsiv-thead-th-tabled-py);
      --table-checkbox-responsiv-thead-th-text: var(
        --table-checkbox-responsiv-thead-th-tabled-text
      );

      --table-checkbox-responsiv-tbody-tr-border-b: var(
        --table-checkbox-responsiv-tbody-tr-tabled-border-b
      );
      --table-checkbox-responsiv-tbody-td-py: var(--table-checkbox-responsiv-tbody-td-tabled-py);
      /* --table-checkbox-responsiv-tbody-td-text: var(--table-checkbox-responsiv-tbody-td-tabled-text); */
    }
  }
}

@screen m {
  .m-table {
    --table-checkbox-responsiv-tbody-tr-border-b: var(
      --table-checkbox-responsiv-tbody-tr-mobile-border-b
    );

    &.\-\-checkbox-responsiv {
      .m-table-tbody,
      .m-table-tbody-tr,
      .m-table-tbody-td {
        @apply block;
      }

      .m-table-tbody-tr {
        @apply px-[--table-checkbox-responsiv-tbody-tr-mobile-px] py-[--table-checkbox-responsiv-tbody-tr-mobile-py];
      }
    }
  }
}
</style>
