<script setup>
import ImgSrc from '@components/common/ImgSrc.vue'
import SvgIcon from '@components/common/SvgIcon.vue'
import Anchor from '@components/buy/mAnchor.vue'

import { useHouseStore } from '@stores/buy/house.js'

const house = useHouseStore()
const { broker } = storeToRefs(house)
const personalInfo = computed(() => {
  return [
    {
      id: 'store',
      label: '店鋪',
      icon: 'icon_store',
      href: 'javascript:;',
    },
    {
      id: 'certification',
      label: '已認證',
      icon: 'icon_certification',
    },
  ]
})
const companyInfo = computed(() => {
  return [
    {
      id: 'company',
      label: '公司名',
      value: `永慶房屋 (股) 公司`,
    },
    {
      id: 'branch',
      label: '分店',
      value: `天母高島屋直營店`,
    },
  ]
})
</script>

<template>
  <div class="flex gap-x-[20px]">
    <div class="shrink-0 space-y-[5px] text-center">
      <ImgSrc
        :setClass="{
          main: 'h-[80px] w-[80px] rounded-full bg-[--gray-999]',
        }"
      />
      <span
        class="account-info-community inline-flex h-[24px] items-center rounded-[8px] px-[8px] text-[--white]"
      >
        <SvgIcon icon="icon_flag" class="h-[18px] w-[18px]" />
        <em class="text-[14px]">社區通</em>
      </span>
    </div>
    <ul class="grow tracking-default">
      <li class="mb-[8px]">
        <ul class="flex items-center gap-x-[10px] m:flex-wrap">
          <li class="m:mb-[5px] m:w-full">
            <p class="text-[20px]">曾慧饌</p>
          </li>
          <template v-for="(item, index) in personalInfo" :key="`${item.id}_${index}`">
            <li class="flex items-center">
              <Anchor
                :text="item.label"
                :href="item.href"
                :config="{
                  icon: {
                    name: item.icon,
                    position: 'left',
                  },
                }"
                :setClass="{
                  main: 'text-[--green-8b0d]',
                  icon: 'h-[18px] w-[18px]',
                  text: 'text-[14px] font-normal underline',
                }"
                v-if="item.href || item.onClick"
              />
              <p
                class="inline-flex items-center gap-x-[3px] text-[--green-8b0d]"
                v-if="!item.href && !item.onClick"
              >
                <SvgIcon :icon="item.icon" class="h-[18px] w-[18px]" />
                <em class="text-[14px]">{{ item.label }}</em>
              </p>
            </li>
          </template>
        </ul>
      </li>
      <li
        class="text-[--gray-666]"
        v-for="(item, index) in companyInfo"
        :key="`${item.id}_${index}`"
      >
        <p class="text-[14px]">{{ item.value }}</p>
      </li>
      <li class="mt-[8px]">
        <p class="text-[20px]">
          <a :href="`tel:02-33169977`">02-33169977</a>
          <small class="text-[14px]"> 分機</small>
          54194
        </p>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
.account-info-community {
  background-image: linear-gradient(90deg, var(--green-8b0d), var(--blue-4a7f));
}
</style>
