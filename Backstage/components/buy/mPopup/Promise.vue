<script setup>
const popup = usePopupStore()
const { promise } = storeToRefs(popup)
</script>

<template>
  <Transition name="popup-promise-overlay">
    <div
      class="m-popup-promise absolute inset-0 flex items-center justify-center"
      v-if="promise.status === 'open'"
    >
      <Transition name="popup-promise">
        <p
          class="m-popup-promise-message relative z-[1] rounded-[15px] bg-[--white] py-[30px] text-center text-[14px] text-[--gray-999] tm:p-[32px] p:px-[72px]"
          v-html="promise.message"
          v-if="promise.status === 'open'"
        />
      </Transition>
    </div>
  </Transition>
</template>
<style lang="postcss">
.m-popup-promise {
  &::before {
    @apply absolute inset-0 z-0 content-default bg-hexa-[--black,0.25];
  }
}
</style>
