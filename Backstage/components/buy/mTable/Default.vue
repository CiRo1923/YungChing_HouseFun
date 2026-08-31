<script setup>
import '@css/_modules/buy/mTable/variables.css'
import '@css/_modules/buy/mTable/defaultVariables.css'
import '@css/_modules/buy/mTable/common.css'
import '@css/_modules/buy/mTable/default.css'

import useTableCore from './.composables/useTableCore'

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

// Default 在所有裝置都會固定 thead，因此 canFixThead 維持預設 true
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
} = useTableCore(props)
</script>

<template>
  <div class="m-table --default" :class="[setClass.main, { '--thead-fixed': config.isTheadFixed }]">
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
        >
          <tr class="m-table-thead-tr" :class="setClass.theadTr">
            <th
              class="m-table-thead-th"
              :class="[setClass.theadTh, getColumnClass(column, 'thead')]"
              :colspan="getSpan(column, 'thead', 'colspan')"
              :rowspan="getSpan(column, 'thead', 'rowspan')"
              v-for="column in thead"
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
              :class="setClass.tbodyTr"
              v-for="(item, rowIndex) in tbody"
              :key="`tbody_tr_${rowIndex}`"
            >
              <td
                class="m-table-tbody-td"
                :class="[setClass.tbodyTd, getColumnClass(column, 'tbody')]"
                :colspan="getSpan(column, 'tbody', 'colspan')"
                :rowspan="getSpan(column, 'tbody', 'rowspan')"
                v-for="column in thead"
                :key="`tbody_${rowIndex}_${column.id}`"
              >
                <slot
                  :name="column.id"
                  :item="item"
                  :value="getScopeValue(item, column)"
                  :index="rowIndex"
                  :column="column"
                >
                  <BuyMTableTBodyValue :value="getScopeValue(item, column)" :config="column" />
                </slot>
              </td>
            </tr>
          </template>

          <tr class="m-table-tbody-tr --empty" :class="setClass.tbodyTr" v-else>
            <td class="m-table-tbody-td --empty" :class="setClass.tbodyTd" :colspan="thead.length">
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
              v-for="column in thead"
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

