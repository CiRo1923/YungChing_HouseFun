<script setup>
const memberProjct = useMemberProjectStore()
const { userData } = storeToRefs(memberProjct)
const { onPopupLogin } = useBuyProjectActions()
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    button: {
      default: '',
      collect: '',
    },
    ...props.setClass,
  }
})

const onClick = async () => {
  console.log(userData)

  if (!userData.value) {
    const { status } = (await onPopupLogin()) ?? {}

    // onApiAuthMe 回傳 200 才往下
    if (status !== 200) return

    console.log(100)
  }

  // await 打另一支 api
}
</script>

<template>
  <div :class="setClass.main">
    <button
      type="button"
      class="inline-block transition-colors duration-300"
      :class="setClass.button.default"
      @click="onClick"
    >
      <CommonSvgIcon icon="icon_love_o" class="h-[30px] w-[30px] p-[3px]" />
    </button>
  </div>
</template>
