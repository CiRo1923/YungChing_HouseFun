<script setup>
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)

const series = computed(() => {
  // 統一成圖表契約 { label, value }；date 供補缺月、其餘欄位 tooltip 可由 raw 取用
  const data = (community.value?.priceTrend ?? []).map((d) => ({
    label: d.monthLabel,
    value: d.unitPrice,
    date: d.date,
    yearMonth: d.yearMonth,
  }))
  return [{ name: '成交均價', data }]
})
</script>

<template>
  <BuyMChartMain
    :series="series"
    :tooltip="{
      formatter: (ctx) => {
        const p = ctx.points[0]
        return `<b>${p.raw.yearMonth}</b><br>成交均價：${p.value} 萬 / 坪`
      },
    }"
    :config="{
      type: 'line',
      title: '半年成交均價趨勢 (萬 / 坪)',
      fillGap: true,
      yAxis: {
        unit: '萬',
      },
      xAxis: {
        padding: 15,
        gap: 10,
      },
    }"
    :setClass="{
      container: 'h-[210px]',
      title: 'mb-[10px] text-[14px] font-bold text-[--gray-666]',
      xAxis: 'text-[12px] text-[--gray-666]',
      yAxis: 'text-[12px] text-[--gray-666]',
    }"
  />
</template>

<style lang="postcss"></style>
