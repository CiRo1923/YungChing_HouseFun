<script setup>
import { onMaskPhone } from '@js/_projectPrototype.js'

const memberUpgrade = useMemberUpgradeStore()
const { phone } = storeToRefs(memberUpgrade)
const { onApiAuthEmailUpgradeMerge } = useMemberUpgradeActions()
const { onCustomClose } = usePopupActions()
const router = useRouter()

// 使用者這次輸入、被 mobile/check 判定為「已註冊」的那支號碼
const maskPhone = computed(() => onMaskPhone(phone.value.apiData.mobilePhone))

const btns = readonly([
  {
    label: '合併帳號 (推薦)',
    description: '驗證此手機後，將兩個帳號資料合併為一個',
    setClass: {
      main: '--border-green-9c33 hover:--bg-green-ffe9',
      text: 'text-[--green-6a2d]',
    },
    onClick: onAuthEmailUpgradeMerge,
  },
  {
    label: '改用其他手機號碼',
    description: '返回重新輸入',
    setClass: {
      main: '--border-gray-ccce hover:--bg-green-ffe9',
    },
    onClick: onCustomClose,
  },
])

// 整併成功即完成升級(登入狀態由 store action 寫好)→ 關掉 popup 進完成頁。
// loading 也在 store action 內開關。
//
// 必須宣告在 btns 之前:btns 是 readonly([...]),setup 當下就求值,
// 在那之後才宣告會踩到 TDZ(Cannot access before initialization)。
async function onAuthEmailUpgradeMerge() {
  const { status } = await onApiAuthEmailUpgradeMerge()

  if (status !== 200) return

  onCustomClose()

  router.push({
    name: 'member-upgrade-complete',
  })
}
</script>

<template>
  <CommonCustomPopup
    id="popupMemberPhoneMerge"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
      body: 'space-y-[25px] text-center',
    }"
  >
    <p class="text-[16px]">{{ maskPhone }} 已是好房網會員帳號，您可以：</p>
    <ul class="mx-auto w-[400px] space-y-[15px]">
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
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
