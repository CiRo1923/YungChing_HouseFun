<script setup>
const buyList = useBuyListStore()
const { content, keyword } = storeToRefs(buyList)

const emits = defineEmits(['input'])

const tag = readonly({
  community: {
    name: '社區',
    color: '--bg-green-efef --text-green-4847',
  },
  mrt: {
    name: '捷運',
    color: '--bg-blue-efff --text-blue-26e1',
  },
  road: {
    name: '路段',
    color: '--bg-orange-feea --text-orange-e646',
  },
  keyword: {
    name: '案名',
    color: '--bg-yellow-ffbc --text-gray-666',
  },
})

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

const onInput = (_value, setOptions) => {
  emits('input', setOptions)
}

const onChange = (data) => {
  console.log('change')
  console.log(data)
}
</script>

<template>
  <CommonMFormAutoComplete
    name="keyword"
    v-model="apiData.kw"
    :options="keyword.options"
    :config="{
      placeholder: '請輸入關鍵字或房屋編號',
      noMatchClearLabel: true,
      input: {
        wait: 500,
        minChars: 1,
      },
      schema: {
        label: 'text',
        value: 'value',
        model: 'text',
      },
    }"
    :setClass="{
      main: '--rounded p:--h-45 --px-12 --py-8 tm:--h-40 grow',
    }"
    @input="onInput"
    @change="onChange"
  >
    <template #option="{ item }">
      <div class="space-y-[2px] text-[14px]">
        <div class="flex items-center gap-x-[5px]">
          <BuyMTagDefault
            :label="tag[item.type]?.name"
            :setClass="{
              main: ['--oval --px-8 --h-20 shrinl-0', tag[item.type]?.color],
              label: 'text-[12px]',
            }"
          />
          <em class="grow" v-html="item.text.replace(apiData.kw, `<b>${apiData.kw}</b>`)" />
          <span class="shrink-0 text-[--gray-999]">
            <b class="text-[--orange-e646]">{{ item.count }}</b> 筆房屋
          </span>
        </div>
        <p class="text-[12px] text-[--gray-999]" v-if="item.location">
          {{ item.location.countyName }}{{ item.location.districtName }}
        </p>
      </div> </template
    >0
  </CommonMFormAutoComplete>
</template>

<style></style>
