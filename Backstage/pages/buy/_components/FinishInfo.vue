<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'

const buyPorject = useBuyProjectStore()
const { publishResponse } = storeToRefs(buyPorject)

const emits = defineEmits(['click:golden', 'click:autoRefresh'])
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const items = shallowReadonly([
  {
    title: '黃金曝光',
    icon: 'icon_diamond',
    label:
      '每天只要 <span class="text-[--orange-e646]">3.3</span> 元，成交速度提升 <span class="text-[--orange-e646]">3</span> 倍',
    content: {
      type: 'string',
      value: '加速成交小秘訣，開通黃金曝光，提高物件的曝光度，有效提升成交速度。',
    },
    button: {
      text: '立即開通黃金曝光 >',
      onClick: () => {
        emits('click:golden')
      },
    },
  },
  {
    title: '自動刷新',
    icon: 'icon_double_star',
    label: '刊登期間，每天於以下時間<span class="text-[--orange-e646]">免費刷新排序</span>',
    content: {
      type: 'times',
      value: publishResponse.value.listRefreshTime,
    },
    button: {
      text: '加購或更改刷新時間 >',
      onClick: () => {
        emits('click:autoRefresh')
      },
    },
  },
])
</script>

<template>
  <div :class="setClass.main">
    <p class="text-center text-[--gray-666] p:text-[16px]">
      資料更新需要大約 1-3 分鐘<br class="pt:hidden" />
      <small class="m:hidden">，</small>請於 1-3 分鐘後重新整理網頁確認
    </p>
    <ul class="m:space-y-[16px] tm:mt-[16px] pt:flex pt:justify-center p:mt-[24px] p:gap-x-[8px]">
      <li
        class="flex p:w-[400px]"
        v-for="(item, index) in items"
        :key="`${item.title}_${item.icon}_${index}`"
      >
        <div
          class="flex flex-1 flex-col gap-y-[24px] rounded-[15px] bg-[--gray-f7] py-[32px] tm:px-[16px] p:px-[40px]"
        >
          <p class="flex shrink-0 items-center justify-center gap-x-[5px] text-[--green-6a2d]">
            <CommonSvgIcon :icon="item.icon" class="h-[18px] w-[18px]" />
            <b class="text-[20px] font-medium">{{ item.title }}</b>
          </p>
          <div class="grow space-y-[8px] tracking-wider">
            <b class="font-semibold" v-html="item.label" />
            <p
              class="text-[14px]"
              v-if="item.content.type === 'string'"
              v-html="item.content.value"
            />
            <ul class="flex items-center gap-x-[16px]" v-if="item.content.type === 'times'">
              <li
                class="flex-1"
                v-for="(time, idx) in item.content.value"
                :key="`${time}_${idx}_${index}`"
              >
                <BuyMTagDefault
                  :text="time"
                  :setClass="{
                    main: '--h-35 --px-8 --bg-orange-feea w-full',
                    text: 'text-[14px] font-semibold',
                  }"
                />
              </li>
            </ul>
          </div>
          <div class="shrink-0 text-center">
            <BuyMAnchor
              :text="item.button.text"
              :setClass="{
                main: '--oval --h-35 --px-20 --py-5 --bg-green-6a2d --text-white',
              }"
              @click="item.button.onClick"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
