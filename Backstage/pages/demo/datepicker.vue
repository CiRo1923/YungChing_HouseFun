<script setup>
// ⚠ 暫時的 mDatepicker 驗證頁,驗完請整個 pages/demo 目錄移除。
// 路由:/demo/datepicker
definePageMeta({
  // 驗證頁不要 layout 的頁首頁尾 —— 只看元件本身
  layout: false,
})

// min / max 給一個以今天為中心的範圍,方便看區間與 disabled 的界線
const today = new Date()
const onOffsetDate = (days) => {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
  const pad = (n) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/* 每一條 format 對應「選到哪一層」——
  規則與時間端一致:寫成 token 的段落可選,寫成數字字面(00)的只輸出不可選。 */
const singles = ref([
  {
    format: 'YYYY',
    label: '只選年',
    note: '主面板直接是年清單,點一下就寫值收合。沒有標頭 —— 清單本身就是全部年份。浮層寬度與日曆一致(七格總寬,三欄在裡面分配)。',
    value: null,
  },
  {
    format: 'YYYY-MM',
    label: '年 / 月',
    note: '主面板是月清單,標頭顯示年;點標頭的年才切到年清單。左右箭頭換的是年。',
    value: null,
  },
  {
    format: 'YYYY-MM-DD',
    label: '年 / 月 / 日',
    note: '原本就支援的那一種。左右箭頭換月,點年月標頭可以往上鑽。',
    value: null,
  },
  {
    format: 'YYYY-MM-DD hh',
    label: '＋小時',
    note: '時間是獨立的一個欄位並排在日期旁邊(Time.vue),不是塞進日曆浮層。欄位有哪些由 format 決定,這裡只有「時」。',
    value: null,
  },
  {
    format: 'YYYY-MM-DD hh:mm',
    label: '＋時 / 分',
    note: '時間欄位有時、分兩欄。placeholder 沒給時會用 format 本身當提示。',
    value: null,
  },
  {
    format: 'YYYY-MM-DD hh:mm:00',
    label: '＋時 / 分,秒補 00',
    note: '秒寫成數字字面 → 不出現在畫面上,但輸出時補上 :00。要三欄都能選就寫 hh:mm:ss。',
    value: null,
  },
])

const ranges = ref([
  {
    format: 'YYYY-MM-DD',
    label: '區間(年月日)',
    note: '起訖各一個欄位、共用一個日曆。點「起」選完自動跳到「訖」;選到比起始日更早的日期會自動交換。',
    value: [],
  },
  {
    format: 'YYYY-MM',
    label: '區間(年月)',
    note: '同一條狀態機,只是日期由月清單給。',
    value: [],
  },
  {
    format: 'YYYY-MM',
    label: '區間(年月)—— 最大鎖今天',
    note: 'maxDate 固定是今天(直接餵 Date 物件,元件會自己截掉時分秒),不受上面的 min / max 開關影響。12 個月照樣列出來,本月之後的是 disabled 點不到(整月都超出上限才停用,所以本月自己仍可選)。起訖共用同一個上限。',
    value: [],
    maxDate: today,
  },
  {
    format: 'YYYY-MM-DD hh:mm',
    label: '區間 ＋ 時分(四個框)',
    note: '起訖各自再多一個時間欄位 —— [起日期][起時間] ~ [訖日期][訖時間]。日期由共用的日曆選,時間各自獨立。',
    value: [],
  },
])

/* --range 的圓角是變數控制的。這裡直接覆寫那組變數示範「方角」的樣子 ——
  正式使用時是改 module 的 variables.css,不是在頁面上覆寫。 */
const isSquareRange = ref(false)

/* 日期欄位的 placeholder 只放日期那半 —— 整串 format 塞進去會被日曆圖示擠掉、
  文字截斷成「YYYY-MM-D」。時間那半的提示由時間欄位自己顯示(它的 placeholder
  預設就是自己的 format)。 */
const onDateFormatOf = (format) => String(format).trim().split(/\s+/)[0]

/* 有時間段時畫面上會多一個框(區間是多兩個),固定寬度會擠爆。
  isRange 為 true 時是起訖兩組,寬度再加倍。 */
const onWidthOf = (format, isRange = false) => {
  const hasTime = /\s/.test(format)

  if (isRange) return hasTime ? '--h-40 w-[680px]' : '--h-40 w-[420px]'

  return hasTime ? 'w-[380px]' : 'w-[240px]'
}

const minDate = onOffsetDate(-20)
const maxDate = onOffsetDate(20)
const hasLimit = ref(false)
</script>

<template>
  <div class="mx-auto max-w-[900px] space-y-[32px] px-[24px]">
    <header class="space-y-[8px]">
      <h1 class="text-[24px] font-medium">mDatepicker 驗證頁</h1>
      <p class="text-[14px] text-[--gray-666]">
        format 同時決定「選到哪一層」與「有沒有時間」。Range 是獨立變體,Single 維持單選。
      </p>
      <ul class="flex flex-wrap gap-x-[20px] gap-y-[8px] text-[14px]">
        <li>
          <label class="flex cursor-pointer items-center gap-x-[6px]">
            <input type="checkbox" v-model="hasLimit" />
            <span>套用 minDate / maxDate({{ minDate }} ~ {{ maxDate }})</span>
          </label>
        </li>
        <li>
          <label class="flex cursor-pointer items-center gap-x-[6px]">
            <input type="checkbox" v-model="isSquareRange" />
            <span>區間兩端改成方角(示範圓角變數)</span>
          </label>
        </li>
      </ul>
    </header>

    <section class="space-y-[16px]">
      <h2 class="text-[18px] font-medium">單選 —— 六種 format</h2>
      <ul class="space-y-[20px]">
        <li
          class="space-y-[6px] rounded-[10px] border-[1px] border-[--gray-e5] p-[16px]"
          v-for="item in singles"
          :key="item.format"
        >
          <div class="flex flex-wrap items-baseline gap-x-[10px]">
            <strong class="text-[16px] font-medium">{{ item.label }}</strong>
            <code class="text-[14px] text-[--gray-666]">{{ item.format }}</code>
          </div>
          <p class="text-[14px] text-[--gray-666]">{{ item.note }}</p>
          <div class="flex flex-wrap items-center gap-x-[16px] gap-y-[8px]">
            <BuyMDatepickerSingle
              :name="`single_${item.format.replace(/\W/g, '_')}`"
              v-model="item.value"
              :config="{
                format: item.format,
                defaultIsToday: false,
                headerMode: 'panel',
                placeholder: onDateFormatOf(item.format),
                minDate: hasLimit ? minDate : '',
                maxDate: hasLimit ? maxDate : '',
              }"
              :setClass="{
                main: `--h-40 ${onWidthOf(item.format)}`,
                time: '--h-40',
              }"
            />
            <output class="text-[14px]">
              v-model:
              <b class="font-medium">{{ JSON.stringify(item.value) }}</b>
            </output>
          </div>
        </li>
      </ul>
    </section>

    <section class="space-y-[16px]" :class="{ 'demo-square-range': isSquareRange }">
      <h2 class="text-[18px] font-medium">區間 —— 起訖兩個欄位</h2>
      <ul class="space-y-[20px]">
        <li
          class="space-y-[6px] rounded-[10px] border-[1px] border-[--gray-e5] p-[16px]"
          v-for="(item, index) in ranges"
          :key="item.label"
        >
          <div class="flex flex-wrap items-baseline gap-x-[10px]">
            <strong class="text-[16px] font-medium">{{ item.label }}</strong>
            <code class="text-[14px] text-[--gray-666]">{{ item.format }}</code>
          </div>
          <p class="text-[14px] text-[--gray-666]">{{ item.note }}</p>
          <div class="flex flex-wrap items-center gap-x-[16px] gap-y-[8px]">
            <BuyMDatepickerRange
              :name="`range_${index}_${item.format.replace(/\W/g, '_')}`"
              v-model="item.value"
              :config="{
                format: item.format,
                defaultIsToday: false,
                headerMode: 'panel',
                placeholder: onDateFormatOf(item.format),
                minDate: hasLimit ? minDate : '',
                maxDate: item.maxDate || (hasLimit ? maxDate : ''),
              }"
              :setClass="{
                main: onWidthOf(item.format, true),
                startTime: '--h-40',
                endTime: '--h-40',
              }"
            />
            <output class="text-[14px]">
              v-model:
              <b class="font-medium">{{ JSON.stringify(item.value) }}</b>
            </output>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="postcss">
/* 示範「圓角由變數控制」—— 正式使用是改 module 的 variables.css,
  這裡為了在同一頁對照才就地覆寫。 */
.demo-square-range {
  --datepicker-calendar-range-start-pc-rounded: 0;
  --datepicker-calendar-range-start-tablet-rounded: 0;
  --datepicker-calendar-range-start-mobile-rounded: 0;
  --datepicker-calendar-range-end-pc-rounded: 0;
  --datepicker-calendar-range-end-tablet-rounded: 0;
  --datepicker-calendar-range-end-mobile-rounded: 0;
}
</style>
