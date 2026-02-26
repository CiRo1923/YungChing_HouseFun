<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'
import AutoComplete from '@components/buy/mAutoComplete.vue'

const emits = defineEmits([
  'update:city',
  'update:area',
  'update:road',
  'update:lane',
  'update:alley',
  'update:number',
  'update:ofNumber',
  'update:floor',
  'update:ofFloor',
  'change:city',
  'change:area',
])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  city: {
    type: [String, Number],
    default: null,
  },
  area: {
    type: [String, Number],
    default: null,
  },
  road: {
    type: [String, Number],
    default: null,
  },
  lane: {
    type: [String, Number],
    default: null,
  },
  alley: {
    type: [String, Number],
    default: null,
  },
  number: {
    type: [String, Number],
    default: null,
  },
  ofNumber: {
    type: [String, Number],
    default: null,
  },
  floor: {
    type: [String, Number],
    default: null,
  },
  ofFloor: {
    type: [String, Number],
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
const modelCity = computed({
  get() {
    return props.city
  },
  set(value) {
    emits('update:city', value)
  },
})
const modelArea = computed({
  get() {
    return props.area
  },
  set(value) {
    emits('update:area', value)
  },
})
const modelRoad = computed({
  get() {
    return props.road
  },
  set(value) {
    emits('update:road', value)
  },
})
const modelLane = computed({
  get() {
    return props.lane
  },
  set(value) {
    emits('update:lane', value)
  },
})
const modelAlley = computed({
  get() {
    return props.alley
  },
  set(value) {
    emits('update:alley', value)
  },
})
const modelNumber = computed({
  get() {
    return props.number
  },
  set(value) {
    emits('update:number', value)
  },
})
const modelOfNumber = computed({
  get() {
    return props.ofNumber
  },
  set(value) {
    emits('update:ofNumber', value)
  },
})
const modelFloor = computed({
  get() {
    return props.floor
  },
  set(value) {
    emits('update:floor', value)
  },
})
const modelOfFloor = computed({
  get() {
    return props.ofFloor
  },
  set(value) {
    emits('update:ofFloor', value)
  },
})

const config = computed(() => {
  return {
    city: {
      options: null,
      schema: {
        label: 'label',
        value: 'value',
      },
    },
    area: {
      options: null,
      schema: {
        label: 'label',
        value: 'value',
      },
    },
    road: {
      options: null,
      schema: {
        label: 'label',
        value: 'value',
      },
    },
    ...props.config,
  }
})

const schema = computed(() => {
  const { schema } = config.value
  const hasCity = !!schema.city
  const hasArea = !!schema.area

  return {
    city: hasCity ? schema.city : schema,
    area: hasArea ? schema.area : schema,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    city: '',
    area: '',
    ...props.setClass,
  }
})

const onCityChange = () => {
  emits('change:city')
}

const onAreaChange = () => {
  emits('change:area')
}
</script>

<template>
  <div
    class="m-address flex flex-wrap gap-x-[8px] m:gap-y-[12px] pt:gap-y-[8px]"
    :class="setClass.main"
  >
    <FormSelect
      :name="`${props.name}_address_city`"
      v-model="modelCity"
      :options="config.city.options"
      :config="{
        placeholder: '選擇縣市',
        schema: config.city.schema,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8 m:w-full', setClass.city],
      }"
      @change="onCityChange()"
      v-if="props.city !== null"
    />
    <FormSelect
      :name="`${props.name}_address_area`"
      v-model="modelArea"
      :options="config.area.options"
      :config="{
        placeholder: '選擇區域',
        schema: config.area.schema,
        isDisabled: !modelCity,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8 m:w-full', setClass.area],
      }"
      @change="onAreaChange()"
      v-if="props.area !== null"
    />
    <AutoComplete
      :name="`${props.name}_address_road`"
      v-model="modelRoad"
      :options="config.road.options"
      :config="{
        placeholder: '請選擇路段',
        schema: config.road.schema,
        noMatchClearLabel: false,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8 m:w-full', setClass.road],
      }"
      v-if="props.road !== null"
    />
    <FormInput
      :name="`${props.name}_address_lane`"
      v-model="modelLane"
      :config="{
        isExistClose: false,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8', setClass.lane],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.lane !== null"
    >
      <template #rearAssist>巷</template>
    </FormInput>
    <FormInput
      :name="`${props.name}_address_alley`"
      v-model="modelAlley"
      :config="{
        isExistClose: false,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8', setClass.alley],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.alley !== null"
    >
      <template #rearAssist>弄</template>
    </FormInput>
    <FormInput
      :name="`${props.name}_address_number`"
      v-model="modelNumber"
      :config="{
        isExistClose: false,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8', setClass.number],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.number !== null"
    >
      <template #rearAssist>號</template>
    </FormInput>
    <template v-if="props.ofNumber !== null">
      <span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>
      <FormInput
        :name="`${props.name}_address_of_number`"
        v-model="modelOfNumber"
        :config="{
          isExistClose: false,
        }"
        :setClass="{
          main: ['--height-40 --px-12 --py-8', setClass.ofNumber],
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      />
    </template>
    <FormInput
      :name="`${props.name}_address_floor`"
      v-model="modelFloor"
      :config="{
        isExistClose: false,
      }"
      :setClass="{
        main: ['--height-40 --px-12 --py-8', setClass.floor],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.floor !== null"
    >
      <template #rearAssist>樓</template>
    </FormInput>
    <template v-if="props.ofFloor !== null">
      <span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>
      <FormInput
        :name="`${props.name}_address_of_floor`"
        v-model="modelOfFloor"
        :config="{
          isExistClose: false,
        }"
        :setClass="{
          main: ['--height-40 --px-12 --py-8', setClass.ofFloor],
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      />
    </template>
  </div>
</template>

<style></style>
