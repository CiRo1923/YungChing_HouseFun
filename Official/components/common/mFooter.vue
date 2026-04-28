<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'

const project = useBuyProjectStore()
const { device } = storeToRefs(project)
const { onResize } = useBuyProjectActions()
const isDeviceM = computed(() => device.value === 'm')
const stores = readonly([
  {
    id: 'appStore',
    src: 'common/app_store.svg',
    href: 'javascript:;',
  },
  {
    id: 'googlePlay',
    src: 'common/google_play.svg',
    href: 'javascript:;',
  },
])

const privacy = readonly([
  {
    id: 'intellectualProperty',
    label: '智慧財產權聲明',
    href: 'javascript:;',
  },
  {
    id: 'privacy',
    label: '隱私權聲明',
    href: 'javascript:;',
  },
  {
    id: 'service',
    label: '服務聲明',
    href: 'javascript:;',
  },
  {
    id: 'note',
    label: '非經正式書面同意，禁止轉貼節錄',
  },
])

const links = readonly([
  [
    {
      label: '好房網 HouseFun',
      icon: 'icon_line',
      href: 'javascript:;',
    },
    {
      label: '好房網買屋 - 小房',
      icon: 'icon_line',
      href: 'javascript:;',
    },
    {
      label: '好房網新建案',
      icon: 'icon_line',
      href: 'javascript:;',
    },
    {
      label: '好房網 TV',
      icon: 'icon_line',
      href: 'javascript:;',
    },
  ],
  [
    {
      label: '好房網買屋',
      icon: 'icon_facebook',
      href: 'javascript:;',
    },
    {
      label: '好房網社群',
      icon: 'icon_facebook',
      href: 'javascript:;',
    },
    {
      label: '好房網 NEWS',
      icon: 'icon_facebook',
      href: 'javascript:;',
    },
  ],
  [
    {
      label: 'Youtube',
      icon: 'icon_youtube',
      href: 'javascript:;',
    },
    {
      label: 'Instagram',
      icon: 'icon_instagram',
      href: 'javascript:;',
    },
    {
      label: 'Threads',
      icon: 'icon_threads',
      href: 'javascript:;',
    },
  ],
])

onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <div
    class="m-fooetr bg-[--white] tm:mt-[20px] tm:px-[16px] tm:pb-[24px] tm:pt-[16px] p:mt-[55px] p:py-[32px]"
  >
    <div class="m-footer-container mx-auto pt:flex p:max-w-[1200px]">
      <div class="m-footer-information text-[12px] tracking-default text-[--gray-666] pt:grow">
        <ul class="flex items-center gap-x-[8px]">
          <li v-for="(item, index) in stores" :key="`${item.id}_${index}`">
            <a :href="item.href" class="block" target="_blank" rel="noopener">
              <CommonImgSrc
                :src="item.src"
                :setClass="{
                  main: 'h-[40px] w-[160px]',
                }"
              />
            </a>
          </li>
        </ul>
        <p class="mt-[16px]">好房國際股份有限公司 (統編 28006949) 負責建置及維護</p>
        <BuyMSeparator
          :items="privacy"
          :config="{
            isHiddenItem: false,
          }"
          :setClass="{
            main: '--horizontal --gap-x-16 flex-wrap',
          }"
          v-slot="{ item }"
        >
          <a :href="item.href" target="_blank" rel="noopener" v-if="item.href">
            {{ item.label }}
          </a>
          <p v-else>{{ item.label }}</p>
        </BuyMSeparator>
      </div>
      <div class="m-footer-links space-y-[16px] tracking-default pt:shrink-0" v-if="!isDeviceM">
        <p class="text-[16px] text-[--green-6a2d]">關注好房網</p>
        <ul class="flex gap-x-[32px] text-[12px] leading-[1.33] text-[--gray-999]">
          <li v-for="(link, index) in links" :key="`links_${index}`">
            <ul class="space-y-[8px]">
              <li v-for="(item, idx) in link" :key="`links_${link.label}_${idx}_${index}`">
                <a
                  :href="item.href"
                  class="inline-flex items-center gap-x-[4px]"
                  target="_blank"
                  rel="noopener"
                >
                  <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" />
                  <em>{{ item.label }}</em>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style></style>
