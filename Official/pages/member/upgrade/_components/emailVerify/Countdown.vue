<script setup>
import { countdown } from '@js/_prototype.js'
import { COUNTDOWN } from '@js/_storage.js'

const emits = defineEmits(['click'])

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const memberUpgrade = useMemberUpgradeStore()
const { upgrade } = storeToRefs(memberUpgrade)

const timeout = ref(0)
const isTimeout = computed(() => timeout.value === 0)
// API 的 resendAvailableAt(可重新發送的時間)
const expires = computed(() => upgrade.value.emailVerify.countdownData.expires)

// 以到期時間起算倒數。onStart 內部會先停掉舊的,等於覆蓋重來。
// expireTime 傳絕對時間即可(onStart 會自己與 startTime 相減換成秒數)。
const onTimeout = (expireTime) => {
  if (!expireTime) return

  countdown.onStart({
    // 以後端時間起算,不信任 client 系統時鐘;無值時 onStart 會 fallback 成 Date.now()
    startTime: serverTime.value?.full,
    expireTime,
    format: 'sss',
    // 存絕對到期時間到 localStorage,重整 / 返回本頁時可續算,秒數不歸零
    storageName: COUNTDOWN,
    onTick: ({ remainingSec }) => {
      timeout.value = remainingSec
    },
    onDone: () => {
      timeout.value = 0
    },
  })
}

const onClick = () => {
  emits('click')
}

// 重送成功後 API 會回新的 resendAvailableAt → 用新的覆蓋重算
watch(expires, (value) => onTimeout(value))

onMounted(() => {
  // 起算優先序:先看上次的倒數是否還沒結束(重整 / 返回),否則才用 store 的 expires
  const saved = countdown.onGet(COUNTDOWN)

  if (saved.ok && !saved.isExpired) {
    onTimeout(saved.data.expireMs)
    return
  }

  onTimeout(expires.value)
})

// 離開本頁就停掉 ticker(countdown 是單例,不停會影響下一個使用者)
onUnmounted(() => {
  countdown.onStop({
    invokeDone: false,
  })
})
</script>

<template>
  <div class="text-center">
    <CommonMAnchor
      :text="isTimeout ? '重新發送' : `重新發送 (${timeout}s)`"
      :config="{
        isDisabled: !isTimeout,
      }"
      :setClass="{
        main: [
          { '--bg-green-8b0d66': !isTimeout },
          { '--bg-green-8b0d': isTimeout },
          '--oval --text-white --h-35 --px-15',
        ],
        text: 'text-[14px]',
      }"
      @click="isTimeout ? onClick() : null"
    />
  </div>
</template>

<style lang="postcss"></style>
