<script setup>
const emits = defineEmits(['click:renewal', 'click:golden', 'click:autoRefresh'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const items = computed(() => {
  const { is10DayExpired, dateExpired, isGolden, amountAutoRefresh, _checked } = props.data

  return [
    {
      icon: is10DayExpired ? 'icon_exclamation_o' : 'icon_check_solid',
      label: '刊登資訊',
      content: is10DayExpired ? `${dateExpired} 即到期` : `${dateExpired} 到期`,
      button: {
        text: '續刊',
        onClick: () => {
          // 有 props.data popup 會出現單一一筆樣式
          emits('click:renewal', props.data)
        },
      },
      class: {
        main: [
          _checked.value ? '--bg-white' : '--bg-gray',
          is10DayExpired ? '--border-orange' : '--border-gray',
        ],
        label: is10DayExpired ? 'text-[--orange-e646]' : '',
        // 不指定顏色就繼承 body 的 --black,與下方黃金曝光、自動刷新一致;
        // 快到期仍要橘色警示,那是提示不是配色
        container: is10DayExpired ? 'text-[--orange-e646]' : '',
        button: {
          main: '--border-gray-e5 --bg-white --text-gray-666',
        },
      },
    },
    {
      icon: 'icon_diamond',
      label: '黃金曝光',
      content: isGolden ? `${dateExpired} 到期` : '成交速度 ↑ 2.5 倍！',
      button: {
        text: '設定',
        onClick: () => {
          emits('click:golden', props.data)
        },
      },
      class: {
        main: !isGolden
          ? '--bg-yellow --border-yellow'
          : _checked.value
            ? '--bg-white --border-gray'
            : '--bg-gray --border-gray',
        label: !isGolden ? 'text-[--orange-e646]' : '',
        button: {
          main: !isGolden
            ? '--border-transparent --bg-green-6a2d --text-white'
            : '--border-gray-e5 --bg-white --text-gray-666',
          text: !isGolden ? 'font-semibold' : '',
        },
      },
    },
    {
      icon: 'icon_check_solid',
      label: '自動刷新',
      content: `每日次數 (${amountAutoRefresh})`,
      button: {
        text: '增加',
        onClick: () => {
          emits('click:autoRefresh', props.data)
        },
      },
      class: {
        main: ['--border-gray', _checked.value ? '--bg-white' : '--bg-gray'],
        button: {
          main: '--border-gray-e5 --bg-white --text-gray-666',
        },
      },
    },
  ]
})
</script>

<template>
  <ul class="space-y-[8px] p:min-w-[320px]">
    <li v-for="(item, index) in items" :key="`${item.label}_${index}`">
      <PageBuyListItemSettingItem
        :label="item.label"
        :config="{
          icon: item.icon,
        }"
        :setClass="item.class"
      >
        {{ item.content }}
        <template #tools>
          <BuyMAnchor
            :text="item.button.text"
            :setClass="{
              main: ['--oval --h-30 --px-15', item.class.button.main],
              text: item.class.button.text,
            }"
            @click="item.button.onClick"
          />
        </template>
      </PageBuyListItemSettingItem>
    </li>
  </ul>
</template>
