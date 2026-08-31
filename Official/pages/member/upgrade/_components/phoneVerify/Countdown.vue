<script setup>
import { countdown } from '@js/_prototype.js'

const emits = defineEmits(['click', 'done'])

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const memberUpgrade = useMemberUpgradeStore()
const { phoneVerify } = storeToRefs(memberUpgrade)
const nuxtApp = useNuxtApp()

// API 的 resendAvailableAt(可重新發送的時間),供重送倒數用
const expires = computed(() => phoneVerify.value.countdownData.expires)

// 距離可重送還剩幾秒。無值 / 值無效 / 已過期一律回 0(視為可重送)
const onRemainingSec = (expireTime) => {
  if (!expireTime) return 0

  const expireMs = new Date(expireTime).getTime()

  if (Number.isNaN(expireMs)) return 0

  return Math.max(0, Math.ceil((expireMs - Date.now()) / 1000))
}

// 首屏就要是正確的倒數狀態:初始值若固定為 0,SSR 會先吐出一顆「可點」的重新發送
// (不只是視覺,那一瞬間真的點得下去 → 白白吃掉一次發送額度),等 client 掛載後才修正。
// 這裡在 SSR 先算好秒數寫進 payload,hydration 沿用同一個數字 → 不閃、也不會 mismatch。
// client 端換頁(非 hydration)時 payload 是上一次 SSR 的舊值,改以當下重算。
// key 與 email 那支分開:同一份 payload 若共用,兩頁的倒數會互相蓋掉。
const ssrTimeout = useState('memberUpgradePhoneResendTimeout', () => onRemainingSec(expires.value))
const timeout = ref(
  import.meta.server || nuxtApp.isHydrating ? ssrTimeout.value : onRemainingSec(expires.value)
)
const isTimeout = computed(() => timeout.value === 0)

// 以到期時間起算倒數。onStart 內部會先停掉舊的,等於覆蓋重來。
// expireTime 傳絕對時間即可(onStart 會自己與 startTime 相減換成秒數)。
const onTimeout = (expireTime) => {
  if (!expireTime) return

  countdown.onStart({
    // 以後端時間起算,不信任 client 系統時鐘;無值時 onStart 會 fallback 成 Date.now()
    startTime: serverTime.value?.full,
    expireTime,
    format: 'sss',
    // 不存 localStorage:續算所需的絕對到期時間由 API 回傳並寫進 store,
    // 再存一份 localStorage 只會多出一個會不同步的狀態來源
    onTick: ({ remainingSec }) => {
      timeout.value = remainingSec
    },
    onDone: () => {
      timeout.value = 0

      // 倒數結束表示 verificationToken 也失效了(重送會換一組新的,舊的自然作廢);
      // store 一併清空,讓依賴它的判斷(如 isExpired)跟著翻轉
      phoneVerify.value.apiData.verificationToken = null

      emits('done')
    },
  })
}

const onClick = () => {
  emits('click')
}

// 重送成功後 API 會回新的 expiresAt → 用新的覆蓋重算
watch(expires, (value) => onTimeout(value))

// ticker 靠 requestAnimationFrame,只能在 client 起算;初始秒數已由 setup 算好,
// 所以這裡是「接著把它跑下去」而不是「從頭補算」。已過期就不啟動,免得白跑一次 onDone。
onMounted(() => {
  if (isTimeout.value) return

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
  <CommonMAnchor
    :text="isTimeout ? '重新發送' : `重新發送 (${timeout}s)`"
    :config="{
      isDisabled: !isTimeout,
    }"
    :setClass="{
      main: [
        { '--bg-green-8b0d-66': !isTimeout },
        { '--bg-green-8b0d': isTimeout },
        '--oval --text-white --h-35 --px-15',
      ],
      text: 'text-[14px]',
    }"
    @click="isTimeout ? onClick() : null"
  />
</template>
