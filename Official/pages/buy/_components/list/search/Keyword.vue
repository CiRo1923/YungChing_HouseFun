<script setup>
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)
const { onApiBuySuggest } = useBuyListActions()

const onInput = async (value, setOptions) => {
  const { status, data } = await onApiBuySuggest()

  if (status === 200) {
    const { items } = data
    setOptions(items)
  }
}

const onChange = (data) => {
  console.log('change')
  console.log(data)
}
</script>

<template>
  <BuyMAutoComplete
    name="keyword"
    v-model="apiSearchData.kw"
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
      main: 'p:--h-45 --px-12 --py-8 tm:--h-40 grow',
    }"
    @input="onInput"
    @change="onChange"
  />
  <!-- <BuyMFormInput
    name="keyword"
    v-model="apiSearchData.kw"
    :config="{
      placeholder: '請輸入關鍵字或房屋編號',
    }"
    :setClass="{
      main: '--rounded p:--px-12 m:--h-40 tm:--px-10 pt:--h-45 --py-5 grow',
    }"
  /> -->
</template>

<style></style>
