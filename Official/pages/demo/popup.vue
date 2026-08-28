<script setup>
// ⚠ 暫時的 popup 動畫 / 死鎖驗證頁,驗完請整個 pages/demo 目錄移除。
// 路由:/demo/popup
const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { onCustom, onCustomClose } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

const logs = ref([])
const isRunning = ref(false)

// 測試用:等進場動畫真的跑完。nextTick 不夠 —— watch 內部自己還有一個 nextTick,
// 在它完成前就關閉的話,isShowPopup 從未被設為 true,等於沒開過、測不到死鎖窗口。
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const log = (message) => {
  logs.value.unshift(`${logs.value.length + 1}. ${message}`)
}

const btnsA = [
  {
    id: 'cancel',
    label: '取消',
    class: '--border-gray-e5 --text-gray-666',
    type: 'cancel',
    isClose: true,
  },
  {
    id: 'sure',
    label: '下一步',
    class: '--bg-orange-f74c --text-white',
    type: 'sure',
    isClose: true,
  },
]

const btnsB = [
  {
    id: 'back',
    label: '上一步',
    class: '--border-gray-e5 --text-gray-666',
    type: 'cancel',
    isClose: true,
  },
  {
    id: 'cancel',
    label: '取消',
    class: '--border-gray-e5 --text-gray-666',
    type: 'cancel',
    isClose: true,
  },
  {
    id: 'sure',
    label: '完成',
    class: '--bg-orange-f74c --text-white',
    type: 'sure',
    isClose: true,
  },
]

// 測試 1:A → B → 上一步 → A(手動點按鈕)
// 重點:B 的「上一步」resolve 後立刻重開 A,中間沒有任何 API 延遲,
// 正中舊版「退場動畫未完成就重開」的死鎖窗口。
const onFlowTest = async () => {
  isRunning.value = true
  log('=== 測試 1 開始:請點 A 的「下一步」,再點 B 的「上一步」 ===')

  let round = 0

  while (true) {
    round += 1
    log(`開啟 A(第 ${round} 次)`)

    const a = await onCustom({
      id: 'demoPopupA',
      title: `步驟 A(第 ${round} 次)`,
      btns: btnsA,
    })

    log(`A 結算:isSure=${a.isSure} / item=${a.item?.id ?? '無'}`)

    if (!a.isSure) {
      log('A 取消 → 結束')
      break
    }

    log('開啟 B')

    const b = await onCustom({
      id: 'demoPopupB',
      title: '步驟 B',
      btns: btnsB,
    })

    log(`B 結算:isSure=${b.isSure} / item=${b.item?.id ?? '無'}`)

    if (b.item?.id === 'back') {
      log('B 上一步 → 立刻重開 A(無延遲)')
      continue
    }

    if (!b.isSure) {
      log('B 取消 → 結束')
      break
    }

    log('流程完成 ✓')
    break
  }

  isRunning.value = false
}

// 測試 2:完整開啟 → 關閉 → 退場動畫還在跑時立刻重開(全自動製造死鎖窗口)
// 舊版預期:第 2 次只剩遮罩、內容不出現,且之後再也開不起來。
const onQuickReopenTest = async () => {
  isRunning.value = true
  log('=== 測試 2 開始 ===')

  const first = onCustom({ id: 'demoPopupA', title: 'A 第 1 次(等它完整出現)', btns: btnsA })

  await sleep(400)
  log('第 1 次已完整顯示 → 關閉')
  onCustomClose()

  const r1 = await first

  log(`第 1 次結算:isSure=${r1.isSure}`)
  // 這裡刻意不等待:退場動畫(0.1 ~ 0.15s)還在跑,立刻重開 → 正中死鎖窗口
  log('退場動畫進行中 → 立刻重開第 2 次')

  const r2 = await onCustom({
    id: 'demoPopupA',
    title: 'A 第 2 次(內容應正常顯示)',
    btns: btnsA,
  })

  log(`第 2 次結算:isSure=${r2.isSure}`)
  isRunning.value = false
}

// 測試 3:連續 3 輪「完整開啟 → 關閉 → 退場中立刻重開」,最後留一個在畫面上
const onRapidTest = async () => {
  isRunning.value = true
  log('=== 測試 3 開始:連續 3 輪,每輪都在退場動畫中重開 ===')

  for (let i = 1; i <= 3; i += 1) {
    const pending = onCustom({ id: 'demoPopupA', title: `A 第 ${i} 輪`, btns: btnsA })

    await sleep(300)
    onCustomClose()
    await pending

    log(`第 ${i} 輪:退場動畫進行中 → 立刻進入下一輪`)
  }

  log('最後再開一次 → 內容應正常顯示')

  const last = await onCustom({
    id: 'demoPopupA',
    title: 'A 最終(內容應正常顯示)',
    btns: btnsA,
  })

  log(`最終結算:isSure=${last.isSure}`)
  isRunning.value = false
}

// 測試 4:與測試 1 完全相同的 A → B → 上一步 → A,但改用遞迴表達流程。
// 差異只在流程控制:「回到上一步」= 直接呼叫上一步的函式,不需要 continue。
// 代價是每往返一次呼叫堆疊就 +1 層(depth 就是在觀察這件事)。
const onStepB = async (depth) => {
  log(`[遞迴] 開啟 B(堆疊深度 ${depth})`)

  const b = await onCustom({
    id: 'demoPopupB',
    title: '步驟 B(遞迴版)',
    btns: btnsB,
  })

  log(`[遞迴] B 結算:isSure=${b.isSure} / item=${b.item?.id ?? '無'}`)

  if (b.item?.id === 'back') {
    log('[遞迴] B 上一步 → 直接遞迴呼叫 A(無延遲)')

    // 這裡回傳 onStepA 的 Promise,讓最外層的 await 能一路等到整條流程結束
    return onStepA(depth + 1)
  }

  if (!b.isSure) {
    log('[遞迴] B 取消 → 結束')
    return
  }

  log('[遞迴] 流程完成 ✓')
}

const onStepA = async (depth = 1) => {
  log(`[遞迴] 開啟 A(第 ${depth} 次,堆疊深度 ${depth})`)

  const a = await onCustom({
    id: 'demoPopupA',
    title: `步驟 A(遞迴版 第 ${depth} 次)`,
    btns: btnsA,
  })

  log(`[遞迴] A 結算:isSure=${a.isSure} / item=${a.item?.id ?? '無'}`)

  if (!a.isSure) {
    log('[遞迴] A 取消 → 結束')
    return
  }

  return onStepB(depth)
}

const onRecursiveTest = async () => {
  isRunning.value = true
  log('=== 測試 4 開始(遞迴版):請點 A 的「下一步」,再點 B 的「上一步」 ===')

  await onStepA()

  isRunning.value = false
}

const onClearLog = () => {
  logs.value = []
}
</script>

<template>
  <CommonMContainer
    class="p:--max-w-740 tm:pt-[20px] p:pt-[40px]"
    :config="{
      as: 'section',
    }"
  >
    <h1 class="mb-[20px] text-[24px] font-medium">Popup 死鎖 / 動畫驗證</h1>

    <div class="mb-[20px] space-y-[10px] rounded-[10px] bg-[--white] p-[20px]">
      <p class="text-[14px] text-[--gray-666]">
        測試 1(while + continue)與測試 4(遞迴)是同一個 A → B → 上一步 → A 流程的兩種寫法,
        都需要手動點按鈕(A 的「下一步」→ B 的「上一步」),行為應完全一致。 測試 2、3 全自動,會先讓
        popup 完整出現、關閉,再趁退場動畫還在跑時立刻重開。 每次都要確認 popup
        的內容真的出現,而不是只有半透明遮罩。
      </p>
      <ul class="flex flex-wrap gap-[10px]">
        <li>
          <CommonMAnchor
            text="測試 1:A → B → 上一步 → A"
            :setClass="{
              main: '--oval --bg-orange-f74c --h-45 --text-white --px-20 --text-center',
            }"
            @click="onFlowTest"
          />
        </li>
        <li>
          <CommonMAnchor
            text="測試 4:同上,改用遞迴"
            :setClass="{
              main: '--oval --bg-green-8b0d --h-45 --text-white --px-20 --text-center',
            }"
            @click="onRecursiveTest"
          />
        </li>
        <li>
          <CommonMAnchor
            text="測試 2:關閉後立刻重開"
            :setClass="{
              main: '--oval --bg-orange-f74c --h-45 --text-white --px-20 --text-center',
            }"
            @click="onQuickReopenTest"
          />
        </li>
        <li>
          <CommonMAnchor
            text="測試 3:連續 3 次開關"
            :setClass="{
              main: '--oval --bg-orange-f74c --h-45 --text-white --px-20 --text-center',
            }"
            @click="onRapidTest"
          />
        </li>
        <li>
          <CommonMAnchor
            text="清空紀錄"
            :setClass="{
              main: '--oval --border-gray-e5 --h-45 --text-gray-666 --px-20 --text-center',
            }"
            @click="onClearLog"
          />
        </li>
      </ul>
    </div>

    <div class="mb-[20px] rounded-[10px] bg-[--white] p-[20px] text-[14px]">
      <p class="mb-[10px] font-medium">store 即時狀態</p>
      <ul class="space-y-[5px] text-[--gray-666]">
        <li>customData.id:{{ customData.id ?? 'null' }}</li>
        <li>customCheck:{{ customCheck ? '有 resolver(await 中)' : 'null(已結算)' }}</li>
        <li>測試執行中:{{ isRunning ? '是' : '否' }}</li>
      </ul>
    </div>

    <div class="rounded-[10px] bg-[--white] p-[20px] text-[14px]">
      <p class="mb-[10px] font-medium">執行紀錄(新的在上)</p>
      <ul class="space-y-[5px] text-[--gray-666]">
        <li v-for="(item, index) in logs" :key="`${item}_${index}`">{{ item }}</li>
        <li v-if="logs.length === 0">(尚無紀錄)</li>
      </ul>
    </div>
  </CommonMContainer>

  <CommonCustomPopup
    id="demoPopupA"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <p class="text-center leading-[1.7]">
      這是 <b>步驟 A</b> 的內容。<br />
      看得到這段文字表示 container 正常顯示。
    </p>
  </CommonCustomPopup>

  <CommonCustomPopup
    id="demoPopupB"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <p class="text-center leading-[1.7]">
      這是 <b>步驟 B</b> 的內容。<br />
      點「上一步」會立刻重開 A,用來測死鎖。
    </p>
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
