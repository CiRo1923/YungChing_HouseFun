<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
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

const config = computed(() => {
  return {
    target: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="detail-card group" :class="setClass.main">
    <div
      class="detail-card-container relative flex flex-col-reverse overflow-hidden bg-[--white] shadow-[0_0_5px_0_var(--black-26)]"
      :class="setClass.container"
    >
      <CommonMAnchor
        :to="{
          name: 'buy-house-hfid',
          params: {
            hfid: props.item.hfid,
          },
        }"
        :config="{
          target: config.target,
        }"
        :setClass="{
          main: 'absolute inset-0 z-[1]',
        }"
      />
      <article class="my-[12px]">
        <header class="mx-[15px] mb-[5px]">
          <h3
            class="line-clamp-1 text-[18px] transition-colors duration-300 group-[:hover:not(:has(.card-community-anchor:hover))]:text-[--green-6a2d]"
          >
            <strong>{{ props.item.title }}</strong>
          </h3>
        </header>
        <div class="mx-[15px] space-y-[5px]">
          <PageBuyCommonCardAddressInfo :item="props.item" />
          <PageBuyCommonCardBasicInfo :item="props.item" />
        </div>
        <footer class="mx-[15px]">
          <PageBuyCommonCardPriceInfo :item="props.item" />
        </footer>
        <!-- <pre>
          {{ props.item.badges }}
        </pre> -->
      </article>
      <PageBuyCommonCardMedia :item="props.item" />
    </div>
  </div>
</template>
