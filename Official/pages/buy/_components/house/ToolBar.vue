<script setup>
const items = computed(() => {
  return [
    {
      icon: 'icon_share',
      onClick: onShare,
    },
    {
      icon: 'icon_print',
      onClick: onPrint,
    },
    {
      icon: 'icon_triangle_exclamation',
      onClick: onReport,
    },
  ]
})

function onShare() {
  console.log('onShare')
}

function onPrint() {
  console.log('onPrint')
}

function onReport() {
  console.log('onReport')
}

function onSubscription() {
  console.log('onSubscription')
}
</script>

<template>
  <div class="flex items-center tm:gap-x-[10px] p:gap-x-[20px]">
    <ul class="flex shrink-0 items-center gap-x-[5px] leading-[0]">
      <li v-for="(item, index) in items" :key="`${item.icon}_${index}`">
        <CommonMAnchor
          :config="{
            icon: item.icon,
          }"
          :setClass="{
            icon: 'text-[--gray-999] tm:h-[20px] tm:w-[20px] tm:p-[1px] p:h-[24px] p:w-[24px] p:p-[3px]',
          }"
          @click="item.onClick"
        />
      </li>
    </ul>
    <CommonMAnchor
      text="訂閱降價"
      :config="{
        icon: {
          name: 'icon_bell',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--bg-gray-f2 --oval --h-35 --px-10 --text-gray-666 gap-x-[5px]',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[1px]',
      }"
      @click="onSubscription"
    />
  </div>
</template>
