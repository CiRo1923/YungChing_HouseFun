<script setup>
const manage = useManageStore()
const { options } = storeToRefs(manage)
const buyList = useBuyListStore()
const { content } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

const features = computed(() => options.value.features ?? [])
// const popup = usePopupStore()
// const { customCheck } = storeToRefs(popup)
// const { onCustomClose } = useBuyPopupActions()
</script>

<template>
  <CommonCustomPopup
    id="popupFeatures"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-740 t:--w-600',
    }"
  >
    <ul class="grid tm:grid-cols-2 tm:gap-[10px] p:grid-cols-3 p:gap-[15px]">
      <li v-for="(item, index) in features" :key="`${item.text}_${item.code}_${index}`">
        <CommonMFormCheckBox
          name="tag"
          v-model="apiData.tag"
          :config="{
            label: item.text,
            value: item.code,
          }"
          :setClass="{
            main: '--icon-size-16 --checkbox-green-8d0d',
          }"
        />
      </li>
    </ul>
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
