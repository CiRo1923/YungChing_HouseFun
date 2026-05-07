<script setup>
import SettingItem from '@pages/buy/list/_components/SettingItem.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const datas = computed(() => {
  const { dateExpired, isGolden, dateUp, amountAutoRefresh } = props.data

  return [
    {
      icon: 'icon_check_solid',
      label: '刊登資訊',
      content: `${dateExpired} 到期`,
      button: {
        text: '續刊',
        onClick: () => {
          // alert('續刊')
        },
      },
      class: {
        main: '--bg-gray --border-gray',
        button: {
          main: '--border-gray-e5 --bg-white --text-gray-666',
          text: 'font-normal',
        },
      },
    },
    {
      icon: 'icon_diamond',
      label: '黃金曝光',
      content: isGolden ? `${dateUp} 到期` : '成交速度 ↑ 2.5 倍！',
      button: {
        text: '設定',
        onClick: () => {
          // alert('設定')
        },
      },
      class: {
        main: !isGolden ? '--bg-yellow --border-yellow' : '--bg-gray --border-gray',
        label: !isGolden ? 'text-[--orange-e646]' : '',
        button: {
          main: !isGolden
            ? '--border-transparent --bg-green-6a2d --text-white'
            : '--border-gray-e5 --bg-white --text-gray-666',
          text: !isGolden ? 'font-semibold' : 'font-normal',
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
          // alert('增加')
        },
      },
      class: {
        main: '--bg-gray --border-gray',
        button: {
          main: '--border-gray-e5 --bg-white --text-gray-666',
          text: 'font-normal',
        },
      },
    },
  ]
})
</script>

<template>
  <ul class="order-3 p:min-w-[320px] p:space-y-[6px]">
    <li v-for="(item, index) in datas" :key="`${item.label}_${index}`">
      <SettingItem
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
      </SettingItem>
    </li>
  </ul>
</template>

<style lang="postcss"></style>
