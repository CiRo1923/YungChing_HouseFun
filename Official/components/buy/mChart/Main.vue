<script setup>
import { onDeepMerge } from '@js/_prototype.js'
import useChartScale from './.composables/useChartScale.js'
import useChartPath from './.composables/useChartPath.js'
import useChartFill from './.composables/useChartFill.js'

/**
 * Highcharts 風格的折線圖元件（純 SVG、零依賴）。
 * 元件自帶預設，父系可逐項覆蓋；axis/tooltip 可放 config 內，也可用獨立 prop（prop 優先）。
 *
 * @prop {Object} config 圖表設定
 *   - type       {string}                 圖表類型，預設 'line'。直角類 line/spline（已實作）、
 *                                         column/bar（預留）；環形類 pie/donut（預留，無軸）
 *   - title      {string}                 標題（顯示在圖上方）
 *   - color      {string}                 主色（實線/實心點），預設 var(--green-8b0d)
 *   - mutedColor {string}                 補值色（虛線/空心點），預設 var(--gray-ccce)
 *   - fillGap    {boolean}                是否補缺月（補值點畫虛線），預設 false
 *   - fillValue  {'interpolate'|number}   補值方式：前後內插 或 固定數字，預設 'interpolate'
 *   - spacing    {{top,right,bottom,left}} 繪圖區內距；各邊預設 null＝依標籤自動算「最貼邊」
 *                                         可只設某邊（深合併），其餘維持自動
 *   - xAxis/yAxis/tooltip                 亦可內嵌於此（等同對應的 prop）
 *
 * @prop {Object} xAxis x 軸
 *   - categories {string[]}               類別標籤；不傳則用補值後自動算出的月份
 *   - padding     {boolean|number}        頭尾留白距離；false/0 關、true 用 20px、數字直接當間距
 *                                         （搭配 padLabel 時改留一整格給標籤，數字略過）
 *   - padLabel    {boolean}               是否顯示頭尾 +- 邊界標籤（padding:false 時忽略），預設 false
 *   - padFormatter {(label,dir)=>string}  邊界標籤文字策略；dir=-1 前界、+1 後界
 *                                         預設月份策略（非 N月 回空字串）；回空字串則不補
 *   - min/max     {number}                自訂 index 值域上下界（覆寫 padding）
 *   - gap         {number}                x 標籤額外間距 px（加在預設之上，預設 0）；會計入下方 spacing
 *
 * @prop {Object} yAxis y 軸
 *   - min/max    {number}                 自訂值域上下界（覆寫 fromZero / 自動）
 *   - fromZero   {boolean}                預設 true：刻度＝[0, 最高÷2, 最高(取整)] 共 3 條
 *                                         false：以 tickInterval（預設 20）框住資料區間（如 60/80）
 *   - tickInterval {number}               fromZero=false 的刻度間距，預設 20
 *   - tickAmount {number}                 fromZero=true 推算「最高取整」用的概略刻度數，預設 5
 *   - padding    {boolean|number}         上下留白；false/0 關、true 用 20px、數字當間距（資料不貼頂/底）
 *   - padLabel   {boolean}                是否額外標出資料實際 min/max（首尾值），預設 false
 *   - unit       {string}                 刻度單位，預設 null（無單位）
 *   - format     {(v:number)=>string}     自訂刻度文字
 *
 * @prop {Object} tooltip
 *   - enabled    {boolean}                是否啟用 hover 提示，預設 true
 *   - showDashed {boolean}                補值/推估（虛線）點是否顯示 tooltip，預設 false
 *   - interactive {boolean}               可滑入 tooltip 點擊內容（如 anchor），預設 false
 *   - formatter  {(ctx)=>string}          自訂提示 HTML；ctx={ index, category, points }
 *                                         points[]＝{ series, color, value, dashed, raw }；raw＝原始資料點
 *
 * @prop {Array} series 資料系列 [{ name, color, data }]
 *   - data 每點統一契約 { label, value }；其餘欄位原樣保留，tooltip 由 ctx.points[].raw 取用
 *     （仍容忍舊欄位 monthLabel/unitPrice 作後備；fillGap 補缺月需要 date 欄位）
 *
 * @prop {Object} setClass 各部位 class（附加在預設樣式後）
 *   - main      {string}  最外層容器 .m-chart（量寬來源）
 *   - container {string}  SVG .m-chart-container（量高來源；可設 h-full / 固定高）
 *   - title     {string}  標題 h3
 *   - xAxis     {string}  x 軸刻度文字（SVG text，改色用 fill-*）
 *   - yAxis     {string}  y 軸刻度文字（含首尾值；SVG text，改色用 fill-*）
 */
const props = defineProps({
  config: { type: Object, default: () => ({}) },
  xAxis: { type: Object, default: () => ({}) },
  yAxis: { type: Object, default: () => ({}) },
  tooltip: { type: Object, default: () => ({}) },
  series: { type: Array, default: () => [] },
  setClass: { type: Object, default: () => ({}) }, // { main, container, title, xAxis, yAxis }
})

const { linear, niceTicks } = useChartScale()
const { buildSegments } = useChartPath()
const { fillMonths, monthShift } = useChartFill()

/* ---------- options 合併預設（深合併，spacing 可只設某邊） ---------- */
const cfg = computed(() =>
  onDeepMerge(
    {
      type: 'line', // 'line' | 'spline'
      title: '',
      color: 'var(--green-8b0d)', // 主色（實線/實心點）
      mutedColor: 'var(--gray-ccce)', // 補值色（虛線/空心點）
      fillGap: false, // 是否補缺月（缺月以前後內插補、畫虛線）
      fillValue: 'interpolate', // 補值方式：'interpolate' 前後內插 | 數字 固定值
      // spacing 各邊預設 null：null 的邊自動算「最貼邊」距離；只設某邊則該邊固定、其餘自動
      spacing: { top: null, right: null, bottom: null, left: null },
    },
    props.config ?? {}
  )
)

/* ---------- 圖表類型分類（擴充新類型的接點） ----------
 * cartesian：有 x/y 軸與格線（line/spline/column/bar）
 * radial   ：無軸、用比例畫弧（pie/donut）
 * 新增類型時：1) 加進對應分類 2) 模板的「資料標記」區加一個 v-else-if 分支
 *            3) 直角類沿用現有 scale；環形類另寫 useChartArc 之類的幾何 */
const CARTESIAN_TYPES = ['line', 'spline', 'column', 'bar']
const RADIAL_TYPES = ['pie', 'donut']
const isCartesian = computed(() => CARTESIAN_TYPES.includes(cfg.value.type))
const isRadial = computed(() => RADIAL_TYPES.includes(cfg.value.type))
const isLineType = computed(() => cfg.value.type === 'line' || cfg.value.type === 'spline')

// axisX 來源：預設 ← config.xAxis ← xAxis prop（prop 優先）
const axisX = computed(() => ({
  categories: [],
  padding: false, // 頭尾各留一格的「距離」（折線不貼齊左右邊緣）；等同 min:-1 / max:count
  padLabel: false, // 是否顯示頭尾 +- 邊界標籤（需搭配 padding 才有空間）
  padFormatter: monthShift, // 邊界標籤文字策略 (label, dir) => string
  min: null, // 自訂 index 值域下界（覆寫 padding）
  max: null, // 自訂 index 值域上界（覆寫 padding）
  gap: null, // x 標籤額外間距 px（加在預設之上）；null/0＝預設
  ...(cfg.value.xAxis ?? {}),
  ...props.xAxis,
}))
const axisY = computed(() => ({
  min: null, // 自訂值域下界；不給則看 fromZero
  max: null, // 自訂值域上界；不給則依資料自動
  fromZero: true, // 是否從 0 起算；false 則貼齊資料區間（不浪費下方空白）
  tickAmount: 5,
  tickInterval: null,
  unit: null,
  format: null, // (value) => string
  ...(cfg.value.yAxis ?? {}),
  ...props.yAxis,
}))
const tip = computed(() => ({
  enabled: true,
  formatter: null,
  showDashed: false, // 補值/推估（虛線）點是否顯示 tooltip
  interactive: false, // 可滑入 tooltip 並點擊內容（如 anchor）；滑出 band 會延遲關閉
  ...(cfg.value.tooltip ?? {}),
  ...props.tooltip,
}))

// 各部位文字 class（標題 / x 軸 / y 軸）
const setClass = computed(() => ({
  main: '',
  container: '',
  title: '',
  xAxis: '',
  yAxis: '',
  ...props.setClass,
}))

/* ---------- 量測：寬取自 root、高取自 .m-chart-container（RWD，resize 自動重算） ---------- */
const chartRef = ref(null) // root：量寬
const containerRef = ref(null) // .m-chart-container：量高
const width = ref(600)
const height = ref(260) // 量到高度前的後備值
let ro = null

onMounted(() => {
  ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === chartRef.value) width.value = entry.contentRect.width
      else if (entry.target === containerRef.value) height.value = entry.contentRect.height
    }
  })
  if (chartRef.value) {
    ro.observe(chartRef.value)
    width.value = chartRef.value.getBoundingClientRect().width || width.value
  }
  if (containerRef.value) {
    ro.observe(containerRef.value)
    height.value = containerRef.value.getBoundingClientRect().height || height.value
  }
})
onUnmounted(() => ro?.disconnect())

/* ---------- 資料 / 刻度 ---------- */
// series 正規化：父系丟原始資料（{ date, monthLabel, unitPrice }）即可，
// 補缺月 / 算類別軸都在元件內處理（由 config.fillGap 控制）。
const normalizedSeries = computed(() =>
  props.series.map((s) => {
    const { categories, data } = fillMonths(s.data ?? [], {
      fillGap: cfg.value.fillGap,
      value: cfg.value.fillValue,
    })
    return { name: s.name ?? '', color: s.color ?? cfg.value.color, categories, data }
  })
)

// 類別軸：優先用 xAxis.categories，否則取第一條 series 補完後的類別
const categories = computed(() =>
  axisX.value.categories.length
    ? axisX.value.categories
    : (normalizedSeries.value[0]?.categories ?? [])
)

const count = computed(() =>
  Math.max(categories.value.length, ...normalizedSeries.value.map((s) => s.data.length), 0)
)

// 資料的實際值域（給刻度與首尾標籤共用）
const yDataRange = computed(() => {
  const allY = normalizedSeries.value.flatMap((s) => s.data.map((d) => d.y))
  return {
    min: allY.length ? Math.min(...allY) : 0,
    max: allY.length ? Math.max(...allY) : 0,
  }
})

// y 軸刻度與 domain
const yTicks = computed(() => {
  const { min: dataMin, max: dataMax } = yDataRange.value

  // fromZero=true：0 ~ 最高(向上取整)，分上下兩半 → [0, max/2, max]
  if (axisY.value.fromZero) {
    const bottom = axisY.value.min ?? 0
    const top = axisY.value.max ?? niceTicks({ min: 0, max: dataMax, count: 5 }).max
    const mid = (bottom + top) / 2
    return { ticks: [bottom, mid, top], min: bottom, max: top }
  }

  // fromZero=false：以 interval（預設 20）向上 / 向下取整框住資料區間 → 如 [60, 80]
  const step = axisY.value.tickInterval ?? 20
  const lo = axisY.value.min ?? Math.floor(dataMin / step) * step
  const hi = axisY.value.max ?? Math.ceil(dataMax / step) * step
  const ticks = []
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Number(v.toFixed(6)))
  return { ticks, min: lo, max: hi }
})

// y 軸刻度文字
const formatY = (v) => {
  if (axisY.value.format) return axisY.value.format(v)
  return v === 0 ? '0' : `${v}${axisY.value.unit ?? ''}`
}

/* ---------- 自動內距：spacing 某邊為 null 時，依標籤文字估算「最貼邊」距離 ---------- */
const AXIS_FONT = 12 // 軸文字字級
const X_LABEL_EDGE = 12 // x 標籤基線距圖底邊（對應 template 的 height - 12）
// 估算 SVG 文字寬度：半形 ~0.6em、全形（中文 / 萬）~1em
const estTextWidth = (str) =>
  [...String(str)].reduce((w, ch) => w + (ch.charCodeAt(0) < 256 ? AXIS_FONT * 0.6 : AXIS_FONT), 0)

// y 軸標籤文字（刻度 + padLabel 首尾值）
const yLabelTexts = computed(() => {
  const texts = yTicks.value.ticks.map(formatY)
  if (axisY.value.padLabel) {
    const { min, max } = yDataRange.value
    texts.push(formatY(min), formatY(max))
  }
  return texts
})

// x 軸標籤文字（類別 + padLabel 邊界）
const xLabelTexts = computed(() => {
  const cats = categories.value
  const texts = [...cats]
  const f = axisX.value.padFormatter
  if (axisX.value.padding && axisX.value.padLabel && cats.length && typeof f === 'function') {
    texts.push(f(cats[0], -1), f(cats[cats.length - 1], 1))
  }
  return texts.filter(Boolean)
})

// 依標籤估算「最貼四邊」的內距（不依賴座標，避免循環）
const autoSpacing = computed(() => {
  const yw = Math.max(0, ...yLabelTexts.value.map(estTextWidth))
  const xw = Math.max(0, ...xLabelTexts.value.map(estTextWidth))
  return {
    top: Math.ceil(AXIS_FONT / 2) + 2, // 頂端刻度標籤半字高
    right: Math.ceil(xw / 2) + 4, // 最後 x 標籤半寬，避免裁切
    bottom: AXIS_FONT + X_LABEL_EDGE + (axisX.value.gap ?? 0), // 標籤基本高 + 額外 gap
    left: Math.ceil(yw) + 12, // 最寬 y 標籤 + 與軸間距
  }
})

/* ---------- 幾何 ---------- */
// spacing 某邊為 null → 用 autoSpacing 該邊（最貼邊）；有設定才用設定值
const pad = computed(() => {
  const sp = cfg.value.spacing ?? {}
  const auto = autoSpacing.value
  return {
    top: sp.top ?? auto.top,
    right: sp.right ?? auto.right,
    bottom: sp.bottom ?? auto.bottom,
    left: sp.left ?? auto.left,
  }
})
const innerLeft = computed(() => pad.value.left)
const innerRight = computed(() => width.value - pad.value.right)
const innerTop = computed(() => pad.value.top)
const innerBottom = computed(() => height.value - pad.value.bottom)

// padding 可為 boolean 或數字：false/0 關閉；true 用預設 20px；數字直接當間距
const padOn = computed(() => Boolean(axisX.value.padding))
const padPx = computed(() => (typeof axisX.value.padding === 'number' ? axisX.value.padding : 20))

// 有 padLabel 才需要整格空間放標籤；否則用固定像素內縮
const isBandPad = computed(() => padOn.value && axisX.value.padLabel)

// x 軸繪製範圍（像素）：只有 padding 沒 padLabel 時頭尾各內縮 padPx
const xRange = computed(() =>
  padOn.value && !axisX.value.padLabel
    ? [innerLeft.value + padPx.value, innerRight.value - padPx.value]
    : [innerLeft.value, innerRight.value]
)

// x 軸 index 值域：有 padLabel 時頭尾各 +-1 格留給標籤；min/max 可手動覆寫
const xDomain = computed(() => {
  const last = Math.max(count.value - 1, 0)
  const lo = axisX.value.min ?? (isBandPad.value ? -1 : 0)
  const hi = axisX.value.max ?? (isBandPad.value ? last + 1 : last)
  return [lo, hi]
})
const xPos = computed(() => {
  const [lo, hi] = xDomain.value
  if (lo === hi) return () => (xRange.value[0] + xRange.value[1]) / 2
  return linear(xDomain.value, xRange.value)
})
// y 軸像素範圍：padding 時上下各內縮，資料不貼齊頂 / 底
const yPadOn = computed(() => Boolean(axisY.value.padding))
const yPadPx = computed(() => (typeof axisY.value.padding === 'number' ? axisY.value.padding : 20))
const yRange = computed(() =>
  yPadOn.value
    ? [innerBottom.value - yPadPx.value, innerTop.value + yPadPx.value]
    : [innerBottom.value, innerTop.value]
)
const yPos = computed(() => linear([yTicks.value.min, yTicks.value.max], yRange.value))

// padLabel：額外標出資料實際 min / max（首尾值）
const yBoundaryLabels = computed(() => {
  if (!axisY.value.padLabel) return []
  const { min, max } = yDataRange.value
  if (min === max) return [{ y: yPos.value(max), label: formatY(max) }]
  return [
    { y: yPos.value(max), label: formatY(max) },
    { y: yPos.value(min), label: formatY(min) },
  ]
})

// 每條 series → { color, segments, points }
const seriesView = computed(() =>
  normalizedSeries.value.map((s) => {
    const pts = s.data.map((d, i) => ({
      x: xPos.value(i),
      y: yPos.value(d.y),
      dashed: d.dashed,
      value: d.y,
      raw: d.raw, // 原始資料點，供 tooltip 取用其他欄位
    }))
    return { ...s, points: pts, segments: buildSegments(cfg.value.type, pts) }
  })
)

// 格線
const gridLines = computed(() =>
  yTicks.value.ticks.map((t) => ({ y: yPos.value(t), label: formatY(t) }))
)

// x 軸文字：padLabel 開啟時頭尾各補一個邊界標籤（不畫線、純標籤）
// 補什麼字由 xAxis.padFormatter(boundaryLabel, direction) 決定，預設為月份策略，
// 回空字串則不補 —— 任何類別的 xAxis 都能用自己的策略。
const xLabels = computed(() => {
  const cats = categories.value
  const labels = cats.map((c, i) => ({ x: xPos.value(i), label: c }))
  const padFormatter = axisX.value.padFormatter

  if (padOn.value && axisX.value.padLabel && cats.length && typeof padFormatter === 'function') {
    const head = padFormatter(cats[0], -1)
    const tail = padFormatter(cats[cats.length - 1], 1)
    if (head) labels.unshift({ x: xPos.value(-1), label: head })
    if (tail) labels.push({ x: xPos.value(cats.length), label: tail })
  }
  return labels
})

/* ---------- tooltip / hover ---------- */
const activeIndex = ref(null)

// interactive 模式：滑出 band 後延遲關閉，讓游標能移進 tooltip 點擊內容
const HIDE_DELAY = 200
let hideTimer = null
const cancelHide = () => {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
}
const showTip = (i) => {
  cancelHide()
  activeIndex.value = i
}
const hideTip = () => {
  if (!tip.value.interactive) {
    activeIndex.value = null
    return
  }
  cancelHide()
  hideTimer = setTimeout(() => {
    activeIndex.value = null
    hideTimer = null
  }, HIDE_DELAY)
}
onUnmounted(cancelHide)

const bandWidth = computed(() => {
  const inner = xRange.value[1] - xRange.value[0]
  const [lo, hi] = xDomain.value
  const span = hi - lo
  return span > 0 ? inner / span : inner
})

// hover 命中區：以點為中心展開，但夾在繪圖區內，不溢出到 y 軸 / 右邊緣
const bands = computed(() =>
  Array.from({ length: count.value }, (_, i) => {
    const c = xPos.value(i)
    const left = Math.max(c - bandWidth.value / 2, innerLeft.value)
    const right = Math.min(c + bandWidth.value / 2, innerRight.value)
    return { index: i, x: left, width: Math.max(right - left, 0) }
  })
)

const tipContent = computed(() => {
  if (activeIndex.value === null) return ''
  const i = activeIndex.value
  const ctx = {
    index: i,
    category: categories.value[i] ?? '',
    points: seriesView.value.map((s) => ({
      series: s.name,
      color: s.color,
      value: s.data[i]?.y,
      dashed: s.data[i]?.dashed,
      raw: s.data[i]?.raw, // 原始資料點（date / yearMonth … 等其他欄位）
    })),
  }
  if (tip.value.formatter) return tip.value.formatter(ctx)
  const unit = axisY.value.unit ?? ''
  const head = `<b>${ctx.category}</b>`
  const rows = ctx.points
    .filter((p) => p.value != null)
    .map(
      (p) =>
        `${p.series ? `${p.series}：` : ''}${p.value} ${unit}${p.dashed ? '（推估）' : ''}`
    )
    .join('<br>')
  return `${head}<br>${rows}`
})

// 當前 hover 的點若全為虛線（補值/推估），不顯示 tooltip
const activeDashed = computed(() => {
  if (activeIndex.value === null) return false
  const ds = seriesView.value.map((s) => s.data[activeIndex.value]).filter((d) => d?.y != null)
  return ds.length > 0 && ds.every((d) => d.dashed)
})

// tooltip 位置：對齊 active 點 x，貼到該欄最高的點上方
const tipPos = computed(() => {
  if (activeIndex.value === null) return { x: 0, y: 0 }
  const i = activeIndex.value
  const ys = seriesView.value.map((s) => s.points[i]?.y).filter((v) => v != null)
  return { x: xPos.value(i), y: ys.length ? Math.min(...ys) : innerTop.value }
})
</script>

<template>
  <div ref="chartRef" class="m-chart relative" :class="setClass.main">
    <p v-if="cfg.title" class="text-center" :class="setClass.title">
      {{ cfg.title }}
    </p>

    <svg
      ref="containerRef"
      class="m-chart-container block w-full"
      :class="setClass.container"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      @mouseleave="hideTip"
    >
      <!-- 直角座標：格線 + y 軸文字（line/spline/column/bar） -->
      <g v-if="isCartesian" class="m-chart-grid">
        <line
          v-for="(g, i) in gridLines"
          :key="`grid_${i}`"
          :x1="innerLeft"
          :x2="innerRight"
          :y1="g.y"
          :y2="g.y"
          stroke="var(--gray-e5)"
          stroke-dasharray="4 4"
        />
        <text
          v-for="(g, i) in gridLines"
          :key="`ylabel_${i}`"
          :x="innerLeft - 10"
          :y="g.y"
          text-anchor="end"
          dominant-baseline="central"
          class="fill-current"
          :class="setClass.yAxis"
        >
          {{ g.label }}
        </text>
        <!-- padLabel：資料首尾值標籤 -->
        <text
          v-for="(b, i) in yBoundaryLabels"
          :key="`ybound_${i}`"
          :x="innerLeft - 10"
          :y="b.y"
          text-anchor="end"
          dominant-baseline="central"
          class="fill-current"
          :class="setClass.yAxis"
        >
          {{ b.label }}
        </text>
      </g>

      <!-- x 軸文字 -->
      <g v-if="isCartesian" class="m-chart-xaxis" :class="setClass.xAxis">
        <text
          v-for="(x, i) in xLabels"
          :key="`xlabel_${i}`"
          :x="x.x"
          :y="height - X_LABEL_EDGE"
          text-anchor="middle"
          class="fill-current"
        >
          {{ x.label }}
        </text>
      </g>

      <!-- ===== 資料標記：依 config.type 切換（擴充新類型在此加分支） ===== -->
      <!-- line / spline：逐段折線 + 端點 -->
      <g v-if="isLineType">
        <g v-for="(s, si) in seriesView" :key="`series_${si}`">
          <path
            v-for="(seg, gi) in s.segments"
            :key="`seg_${si}_${gi}`"
            :d="seg.d"
            fill="none"
            :stroke="seg.dashed ? cfg.mutedColor : s.color"
            stroke-width="2.5"
            stroke-linecap="round"
            :stroke-dasharray="seg.dashed ? '5 5' : undefined"
          />
          <circle
            v-for="(p, pi) in s.points"
            :key="`pt_${si}_${pi}`"
            :cx="p.x"
            :cy="p.y"
            :r="activeIndex === pi ? 6 : 4"
            :fill="p.dashed ? cfg.mutedColor : s.color"
            stroke="var(--white)"
            :stroke-width="activeIndex === pi ? 2 : 1"
          />
        </g>
      </g>

      <!-- column / bar：直角，沿用 xPos/yPos；柱寬取自 bandWidth（待實作） -->
      <!-- <g v-else-if="cfg.type === 'column' || cfg.type === 'bar'"> ... </g> -->

      <!-- pie / donut：環形，另寫弧線幾何（useChartArc），不畫軸/格線（待實作） -->
      <g v-else-if="isRadial" class="m-chart-radial">
        <!-- TODO: 依 series 值比例畫 <path> 弧；hover 改為逐 slice -->
      </g>

      <!-- hover 偵測：每個類別一個透明 band（夾在繪圖區內；直角座標類） -->
      <template v-if="tip.enabled && isCartesian">
        <rect
          v-for="b in bands"
          :key="`band_${b.index}`"
          :x="b.x"
          :y="innerTop"
          :width="b.width"
          :height="innerBottom - innerTop"
          fill="transparent"
          @mouseenter="showTip(b.index)"
          @mouseleave="hideTip"
        />
      </template>
    </svg>

    <!-- tooltip（HTML 疊層，定位到 active 點上方） -->
    <div
      v-if="tip.enabled && activeIndex !== null && tipContent && (tip.showDashed || !activeDashed)"
      class="m-chart-tip absolute z-[1] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[6px] bg-[--gray-333] px-[10px] py-[6px] text-[12px] leading-[1.5] text-[--white]"
      :class="tip.interactive ? 'pointer-events-auto' : 'pointer-events-none'"
      :style="{ left: `${tipPos.x}px`, top: `${tipPos.y - 12 + (cfg.title ? 31 : 0)}px` }"
      v-html="tipContent"
      @mouseenter="cancelHide"
      @mouseleave="hideTip"
    />
  </div>
</template>

<style lang="postcss">
.m-chart {
  svg text {
    @apply select-none;
  }
}
</style>
