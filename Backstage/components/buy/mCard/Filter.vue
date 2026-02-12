<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div
    class="m-card --filter --bg-white --rounded-15 tm:px-[16px] tm:py-[32px] p:flex p:gap-x-[40px] p:p-[40px]"
  >
    <header class="m-card-header tm:pb-[16px] p:shrink-0 p:pr-[44px]">
      <h3 class="text-[--gray-333] tm:text-center tm:text-[20px] p:text-[24px]">
        <strong class="font-medium">{{ props.title }}</strong>
      </h3>
    </header>
    <div class="m-card-body tm:pt-[32px] p:grow">
      <slot />
    </div>
  </div>
</template>

<style src="@css/_modules/buy/mCard.css"></style>
<style lang="postcss">
@screen p {
  .m-card-header {
    @apply border-r-[2px] border-r-[--orange-e646];
  }
}

@screen tm {
  .m-card-header {
    @apply border-b-[1px] border-b-[--orange-e646];
  }
}
</style>
