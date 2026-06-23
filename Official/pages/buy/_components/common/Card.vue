<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="detail-card px-[3px] py-[5px]">
    <div
      class="detail-card-container shadow-card relative flex flex-col-reverse overflow-hidden rounded-[5px]"
    >
      <BuyMAnchor
        :to="{
          name: 'buy-house-hfid',
          params: {
            hfid: props.item.hfid,
          },
        }"
        :setClass="{
          main: 'absolute inset-0 z-[1]',
        }"
      />
      <article class="my-[12px]">
        <header class="mx-[15px] mb-[5px]">
          <h3 class="line-clamp-1 text-[18px]">
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

<style lang="postcss"></style>
