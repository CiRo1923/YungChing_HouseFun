<script setup>
const buyList = useBuyListStore()
const { apiData, options } = storeToRefs(buyList)

const model = ref('不限')
const cityOptions = computed(() =>
  options.value.address.map(({ value, text }) => ({
    value,
    text,
  }))
)
</script>

<template>
  <BuyMFormDropdown
    name="addr"
    v-model="model"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[160px]',
      dropdown: 't:w-[250px] p:w-[300px]',
    }"
  >
    <template #dropdownHeader>
      <p>請選擇縣市</p>
    </template>
    <template #dropdown>
      <div class="scrollbar --y max-h-[278px]">
        <ul class="m-form-dropdown-options">
          <li
            class="m-form-dropdown-item"
            v-for="(city, index) in cityOptions"
            :key="`${city.text}_${index}`"
          >
            <button type="button" class="m-form-dropdown-button">
              <em class="m-form-dropdown-label">
                {{ city.text }}
              </em>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </BuyMFormDropdown>
</template>

<style lang="postcss"></style>
