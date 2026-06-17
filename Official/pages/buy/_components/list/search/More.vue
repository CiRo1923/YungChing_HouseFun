<script setup>
const buyList = useBuyListStore()
const { more } = storeToRefs(buyList)

const componentsName = 'More'
const selectDropdownRef = ref(null)
const activeID = ref('type')

const onClick = (item) => {
  const { id } = item

  activeID.value = id
  selectDropdownRef.value?.onDropdownHeight()
}
</script>

<template>
  <BuyMFormSelectDropdown
    name="MoreDropdown"
    v-model="more.label"
    :config="{
      placeholder: '更多',
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
      dropdown: 'pt:--rounded m:w-full p:max-h-[435px]',
      dropdownContainer: 'p:w-[465px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="flex h-full items-start">
      <ul
        class="scrollbar --y h-full shrink-0 space-y-[5px] border-y-[20px] border-transparent bg-[--gray-f7] m:px-[5px] t:px-[10px] tm:min-w-[115px] p:min-w-[150px] p:px-[20px]"
      >
        <li v-for="(item, index) in more.options" :key="`${componentsName}_${item.id}_${index}`">
          <BuyMAnchor
            :text="item.label"
            :setClass="{
              main: [
                'p:--px-20 tm:--px-10 --h-35 --rounded w-full',
                { '--bg-green-8b0d --text-white': activeID === item.id },
              ],
              text: 'font-normal',
            }"
            @click="onClick(item)"
          />
        </li>
      </ul>
      <div
        class="h-full grow overflow-hidden border-y-[20px] border-transparent m:px-[2px] pt:px-[5px]"
      >
        <div class="scrollbar --y h-full tm:px-[10px] p:px-[15px]">
          <PageBuyListSearchMoreType v-if="activeID === 'type'" />
          <PageBuyListSearchMorePin v-if="activeID === 'pin'" />
          <PageBuyListSearchMoreParkingMode v-if="activeID === 'parking'" />
          <PageBuyListSearchMoreAge v-if="activeID === 'age'" />
          <PageBuyListSearchMoreFloor v-if="activeID === 'floor'" />
          <PageBuyListSearchMoreUnitPrice v-if="activeID === 'unitPrice'" />
          <PageBuyListSearchMoreFace v-if="activeID === 'face'" />
          <PageBuyListSearchMoreNearBy v-if="activeID === 'nearBy'" />
        </div>
      </div>
    </div>
  </BuyMFormSelectDropdown>
</template>

<style lang="postcss"></style>
