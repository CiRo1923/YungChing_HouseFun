<script setup>
import '@css/_modules/common/mFooter/variables.css'
import '@css/_modules/common/mFooter/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const isDeviceM = computed(() => device.value === 'm')

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const stores = readonly([
  {
    id: 'appStore',
    src: 'common/app_store.svg',
    alt: 'App Store 下載',
    href: 'javascript:;',
  },
  {
    id: 'googlePlay',
    src: 'common/google_play.svg',
    alt: 'Google Play 下載',
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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-footer" :class="setClass.main">
    <div class="m-footer-container">
      <div class="m-footer-information">
        <ul class="m-footer-stores">
          <li v-for="(item, index) in stores" :key="`${item.id}_${index}`">
            <a :href="item.href" class="m-footer-store-anchor" target="_blank" rel="noopener">
              <CommonImgSrc
                :src="item.src"
                :alt="item.alt"
                :setClass="{
                  main: 'm-footer-store-image',
                }"
              />
            </a>
          </li>
        </ul>
        <p class="m-footer-company">好房國際股份有限公司 (統編 28006949) 負責建置及維護</p>
        <CommonMSeparator
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
        </CommonMSeparator>
      </div>
      <div class="m-footer-links" v-if="!isDeviceM">
        <p class="m-footer-links-title">關注好房網</p>
        <ul class="m-footer-links-group">
          <li v-for="(link, index) in links" :key="`links_${index}`">
            <ul class="m-footer-links-items">
              <li v-for="(item, idx) in link" :key="`links_${link.label}_${idx}_${index}`">
                <a :href="item.href" class="m-footer-link" target="_blank" rel="noopener">
                  <CommonSvgIcon :icon="item.icon" class="m-footer-link-icon" />
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
