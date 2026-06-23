<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)

const features = computed(() => options.value.features ?? [])
// const popup = usePopupStore()
// const { customCheck } = storeToRefs(popup)
// const { onCustomClose } = useBuyPopupActions()
</script>

<template>
  <BuyCustomPopup
    id="popupFeatures"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-740',
    }"
  >
    <ul class="grid m:grid-cols-2 tm:gap-[10px] p:grid-cols-3 p:gap-[15px]">
      <li v-for="(item, index) in features" :key="`${item.text}_${item.code}_${index}`">
        <BuyMFormCheckBox
          name="tag"
          v-model="apiSearchData.tag"
          :config="{
            label: item.text,
            value: item.code,
          }"
          :setClass="{
            main: '--icon-size-16',
          }"
        />
      </li>
    </ul>
  </BuyCustomPopup>
</template>

<style lang="postcss"></style>
