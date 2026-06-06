<script setup>
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
  getScopeValue,
  getSpan,
  getColumnClass,
} = useTableCore(props)
</script>

<template>
  <div class="m-table --default" :class="[setClass.main, { '--thead-fixed': config.isTheadFixed }]">
    <div class="m-table-container scrollbar --y" :class="setClass.container" ref="containerRef">
      <table class="m-table-content w-full" :class="setClass.content" ref="tableContentRef">
        <thead
          class="m-table-thead"
          :class="[setClass.thead, { '--fixed': isTheadFixedActive }]"
          :style="fixedTheadStyle"
          ref="theadRef"
        >
          <tr class="m-table-thead-tr text-center" :class="setClass.theadTr">
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

<style src="@css/_modules/buy/mTable.css"></style>
<style lang="postcss">
:root {
  --table-default-thtd-pc-px: 5px;
  --table-default-thtd-tabled-px: 5px;
  --table-default-thtd-mobile-px: 5px;

  --table-default-tbody-tr-pc-border-b: 1px;
  --table-default-tbody-tr-tabled-border-b: 1px;
  --table-default-tbody-tr-mobile-border-b: 1px;

  --table-default-thead-th-pc-py: 8px;
  --table-default-thead-th-tabled-py: 5px;
  --table-default-thead-th-mobile-py: 5px;

  --table-default-thead-th-pc-text: 16px;
  --table-default-thead-th-tabled-text: 14px;
  --table-default-thead-th-mobile-text: 14px;

  --table-default-tbody-td-pc-py: 15px;
  --table-default-tbody-td-tabled-py: 10px;
  --table-default-tbody-td-mobile-py: 10px;

  --table-default-tbody-td-pc-text: 16px;
  --table-default-tbody-td-tabled-text: 14px;
  --table-default-tbody-td-mobile-text: 14px;

  --table-default-thead-th-color: var(--gray-666);
  --table-default-tbody-td-color: var(--gray-666);
  --table-default-tbody-tr-border-color: var(--gray-e5);
}

.m-table {
  &.\-\-default {
    .m-table-thead-th,
    .m-table-tbody-td {
      @apply px-[--table-default-thtd-px];
    }

    .m-table-thead-th {
      font-size: var(--table-default-thead-th-text);

      @apply py-[--table-default-thead-th-py] text-[--table-default-thead-th-color];
    }

    .m-table-tbody-tr {
      border-bottom: var(--table-default-tbody-tr-border-b) solid
        var(--table-default-tbody-tr-border-color);
    }

    .m-table-tbody-td {
      font-size: var(--table-default-tbody-td-text);

      @apply py-[--table-default-tbody-td-py] text-[--table-default-tbody-td-color];
    }
  }
}

@screen p {
  .m-table {
    &.\-\-default {
      --table-default-thtd-px: var(--table-default-thtd-pc-px);
      --table-default-thead-th-py: var(--table-default-thead-th-pc-py);
      --table-default-thead-th-text: var(--table-default-thead-th-pc-text);

      --table-default-tbody-tr-border-b: var(--table-default-tbody-tr-pc-border-b);
      --table-default-tbody-td-py: var(--table-default-tbody-td-pc-py);
      --table-default-tbody-td-text: var(--table-default-tbody-td-pc-text);
    }
  }
}

@screen t {
  .m-table {
    &.\-\-default {
      --table-default-thtd-px: var(--table-default-thtd-tabled-px);
      --table-default-thead-th-py: var(--table-default-thead-th-tabled-py);
      --table-default-thead-th-text: var(--table-default-thead-th-tabled-text);

      --table-default-tbody-tr-border-b: var(--table-default-tbody-tr-tabled-border-b);
      --table-default-tbody-td-py: var(--table-default-tbody-td-tabled-py);
      --table-default-tbody-td-text: var(--table-default-tbody-td-tabled-text);
    }
  }
}

@screen m {
  .m-table {
    &.\-\-default {
      --table-default-thtd-px: var(--table-default-thtd-mobile-px);
      --table-default-thead-th-py: var(--table-default-thead-th-mobile-py);
      --table-default-thead-th-text: var(--table-default-thead-th-mobile-text);
      --table-default-tbody-tr-border-b: var(--table-default-tbody-tr-mobile-border-b);

      --table-default-tbody-td-py: var(--table-default-tbody-td-mobile-py);
      --table-default-tbody-td-text: var(--table-default-tbody-td-mobile-text);
    }
  }
}
</style>
