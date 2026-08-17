<script setup>
import { EMAILVERIFYTOKEN, PHONE } from '@js/_storage.js'
import { onMaskPhone } from '@js/_projectPrototype.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { phone } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onApiAuthEmailUpgradeMobileCheck,
  onApiAuthEmailUpgradeMobileVerificationCode,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(EMAILVERIFYTOKEN).value
      const phoneRaw = useCookie(PHONE).value

      // 沒有 upgradeToken 就打不了 mobile API,沒有號碼則無從確認狀態 →
      // 兩者缺一都退回上一頁重新輸入
      if (!raw || !deCryptoJSON(raw) || !phoneRaw || !deCryptoJSON(phoneRaw)) {
        return navigateTo(
          {
            name: 'member-upgrade-phone',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

// 只用於顯示;要打 API 時請用未遮蔽的 apiData.mobilePhone
const maskPhone = computed(() => onMaskPhone(phone.value.apiData.mobilePhone))

// 這裡不呼叫 reset.onPhone():那會連上一頁剛拿到的 checkResult 一起清掉,
// 導致每次進本頁都得重打一次 check。缺的值改由 cookie 補齊即可。
//
// upgradeToken 與號碼都由 cookie 還原:本頁 URL 不帶這兩個值。
// 走到這裡代表 middleware 已放行 → 兩者都有效。
const onInit = () => {
  phone.value.token = onGetCookie(EMAILVERIFYTOKEN)
  phone.value.apiData.mobilePhone = onGetCookie(PHONE)
}

onInit()

// 只有「已是手機會員且需要整併」才留在本頁,其餘一律退回上一頁重走。
const isMergeRequired = (result) => result?.availability === 2 && result?.requiresMerge === true

// 從上一頁導過來時 store 已有剛拿到的結果 → 直接用,不必重打。
// 重整後 store 是空的才重新確認:號碼在使用者停留期間可能被綁走或解綁,
// 以最新狀態為準。
const onAuthEmailUpgradeMobileCheck = async () => {
  if (isMergeRequired(phone.value.checkResult)) return

  const { status, data } = await onApiAuthEmailUpgradeMobileCheck()

  if (status === 200 && isMergeRequired(data)) return

  await navigateTo(
    {
      name: 'member-upgrade-phone',
    },
    {
      replace: true,
    }
  )
}

await onWithLoadingAll([onAuthEmailUpgradeMobileCheck()])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 合併同樣要先驗證手機:merge 的 req 需要 mobileVerificationToken,
// 而那個值只能從 mobile/verification-code/verify 取得。
// 所以這裡只負責發驗證碼並進驗證頁,驗證通過後由那頁依 availability 決定打 merge。
const onAuthEmailUpgradeMobileVerificationCode = async () => {
  onApiPromise('open')

  const { status } = await onApiAuthEmailUpgradeMobileVerificationCode()

  onApiPromise('close')

  if (status !== 200) return

  router.push({
    name: 'member-upgrade-phone-verify',
  })
}

// 改用其他號碼 → 回上一頁重新輸入
const onBack = () => {
  router.push({
    name: 'member-upgrade-phone',
  })
}

const btns = readonly([
  {
    label: '合併帳號 (推薦)',
    description: '驗證此手機後，將兩個帳號資料合併為一個',
    setClass: {
      main: '--border-green-9c33 hover:--bg-green-ffe9',
      text: 'text-[--green-6a2d]',
    },
    onClick: onAuthEmailUpgradeMobileVerificationCode,
  },
  {
    label: '改用其他手機號碼',
    description: '返回重新輸入',
    setClass: {
      main: '--border-gray-ccce hover:--bg-green-ffe9',
    },
    onClick: onBack,
  },
])
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberUpgradeHeader
      title="此手機已註冊會員"
      :setClass="{
        main: 'text-center',
      }"
    />
    <p class="text-center text-[16px]">{{ maskPhone }} 已是好房網會員帳號，您可以：</p>
    <ul class="space-y-[15px]">
      <li v-for="(item, index) in btns" :key="`${item.label}_${index}`">
        <CommonMAnchor
          :setClass="{
            main: ['--py-15 --px-20 --rounded-10 w-full text-[14px]', item.setClass?.main],
          }"
          @click="item.onClick()"
        >
          <div class="space-y-[5px] text-left text-[--gray-666]">
            <p class="text-[16px]" :class="item.setClass?.text">{{ item.label }}</p>
            <p v-html="item.description" />
          </div>
        </CommonMAnchor>
      </li>
    </ul>
  </CommonMContainer>
</template>

<style lang="postcss"></style>
