<script setup>
const buyHouse = useBuyHouseStore()
const { broker } = storeToRefs(buyHouse)

const items = computed(() => {
  return [
    {
      id: 'certification',
      label: '社區達人',
      icon: 'icon_flag',
      class: 'text-[--orange-e646]',
    },
    {
      id: 'store',
      label: '店鋪',
      icon: 'icon_store',
      href: broker.value.storeUrl,
      class: 'text-[--green-8b0d]',
    },
  ]
})
const companyInfo = computed(() => {
  return [
    {
      id: 'company',
      label: '公司名',
      value: broker.value.store,
    },
    {
      id: 'branch',
      label: '分店',
      value: broker.value.brand,
    },
  ]
})
</script>

<template>
  <!-- <pre>
    {{ broker }}
  </pre> -->
  <div class="flex gap-x-[12px]">
    <CommonImgSrc
      :src="broker.imageUrl ?? 'buy/house/no_image.png'"
      :setClass="{
        main: 'h-[80px] w-[80px] shrink-0 overflow-hidden rounded-full bg-[--gray-f2]',
      }"
    />
    <ul class="tracking-default grow">
      <li class="mb-[4px] flex items-center gap-x-[10px]">
        <p class="text-[20px]">{{ broker.name }}</p>
        <ul class="flex items-center gap-x-[10px]">
          <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
            <li class="flex items-center">
              <BuyMAnchor
                :text="item.label"
                :href="item.href"
                :config="{
                  icon: {
                    name: item.icon,
                    position: 'left',
                  },
                }"
                :setClass="{
                  main: item.class,
                  icon: 'h-[16px] w-[16px] p-[1px]',
                  text: 'text-[14px] font-normal underline',
                }"
                v-if="item.href || item.onClick"
              />
              <p class="inline-flex items-center" :class="item.class" v-else>
                <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px] p-[1px]" />
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
      <li class="mt-[4px]">
        <p class="text-[20px] font-bold text-[--orange-e646]">
          <a :href="`tel:${broker.phone}`">{{ broker.phone }}</a>
          <template v-if="broker.extension">
            <small class="text-[14px] font-normal text-[--gray-999]">&nbsp;分機</small>
            {{ broker.extension }}
          </template>
        </p>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
.account-info-community {
  background-image: linear-gradient(90deg, var(--green-8b0d), var(--green-4a7f));
}
</style>
