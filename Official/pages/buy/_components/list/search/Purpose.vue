<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const { onValueGetText, onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, purpose } = storeToRefs(buyList)

const componentsName = 'Purpose'

const selectDropdownRef = ref(null)
const defaultLabel = computed(() => onResolveByDevice(purpose.value.defaultLabel, device.value))

const onChange = (data) => {
  const { value, label } = data

  purpose.value.label = value ? label : defaultLabel.value
  // selectDropdownRef.value.onClose()
}

const onInit = () => {
  purpose.value.label = apiSearchData.value.purpose
    ? onValueGetText('casePurpose', apiSearchData.value.purpose)
    : defaultLabel.value
}

onResize()
onInit()

onMounted(() => {
  window.addEventListener('resize', () => {
    onResize()
    onInit()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    onResize()
    onInit()
  })
})
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${componentsName}Dropdown`"
    v-model="purpose.label"
    :config="{
      placeholder: '全區域',
      target: {
        m: '.search-mode',
      },
      isDropdwonFull: {
        m: true,
      },
    }"
    :setClass="{
      main: '--rounded p:--py-10 p:--px-12 m:--h-40 pt:--h-45 tm:--py-8 tm:--px-8 w-full',
      type: 'tm:text-[14px] p:text-[16px]',
      dropdown: '--py-20 pt:--rounded pt:--px-20 m:--px-30 m:w-full',
      dropdownContainer: 'p:w-[170px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="m:grid m:grid-cols-3 m:gap-[15px] pt:space-y-[15px]">
      <li
        v-for="(item, index) in options.casePurpose"
        :key="`${componentsName}_${item.code}_${index}`"
      >
        <BuyMFormRadio
          :name="componentsName"
          v-model="apiSearchData.purpose"
          :config="{
            label: item.text,
            value: item.code,
          }"
          @change="onChange"
        />
      </li>
    </ul>
  </BuyMFormSelectDropdown>
</template>

<style></style>
