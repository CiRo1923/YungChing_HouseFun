<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)

const info = computed(() => autoRefresh.value.info || {})
const selectedIndex = computed(() => autoRefresh.value.templateSave.selectedIndex)
const template = computed(() => autoRefresh.value.templateSave.list || [])
const refreshCount = computed(() => template.value[selectedIndex.value]?.refreshCount ?? 0)
const count = computed(() => refreshCount.value - info.value.currentCount)
const timeSpan = computed(() => template.value[selectedIndex.value]?.listTimeSpan || [])
</script>

<template>
  <BuyCommonCustomPopup
    id="popupAutoRefreshTemplateCheck"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <div class="space-y-[16px]">
      <div
        class="flex items-center text-[--gray-666] m:flex-col pt:justify-center p:gap-x-[16px] p:text-[16px]"
      >
        <span class="font-semibold text-[--gray-333]">
          {{ template[selectedIndex]?.templateName }} 刷新變更確認
        </span>
        <span class="font-semibold">
          {{ info.currentCount }} → <em class="text-[--orange-e646]">{{ refreshCount }}</em> 次
        </span>
        <span v-if="count > 0">
          需使用 <em class="text-[--orange-e646]">{{ count }}</em> 個自動刷新額度
        </span>
      </div>
      <div
        class="mx-auto rounded-[15px] bg-[--gray-f7] tm:px-[16px] tm:py-[32px] p:w-[800px] p:p-[40px]"
      >
        <ul
          class="flex flex-wrap items-center m:gap-x-[9px] t:gap-x-[12px] tm:gap-y-[12px] p:gap-x-[20px] p:gap-y-[16px]"
        >
          <li v-for="(time, index) in timeSpan" :key="`${time}_${index}`">
            <BuyMTimeMain
              :text="time"
              :setClass="{
                main: '--h-30 p:--w-85 tm:--w-76',
                text: 'text-[14px]',
              }"
            />
          </li>
        </ul>
      </div>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
