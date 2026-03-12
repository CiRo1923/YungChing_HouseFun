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
    default: undefined,
  },
  cityModifiers: {
    type: Object,
    default: () => ({}),
  },
  area: {
    type: [String, Number],
    default: undefined,
  },
  areaModifiers: {
    type: Object,
    default: () => ({}),
  },
  road: {
    type: [String, Number],
    default: undefined,
  },
  roadModifiers: {
    type: Object,
    default: () => ({}),
  },
  lane: {
    type: [String, Number],
    default: undefined,
  },
  laneModifiers: {
    type: Object,
    default: () => ({}),
  },
  alley: {
    type: [String, Number],
    default: undefined,
  },
  alleyModifiers: {
    type: Object,
    default: () => ({}),
  },
  number: {
    type: [String, Number],
    default: undefined,
  },
  numberModifiers: {
    type: Object,
    default: () => ({}),
  },
  ofNumber: {
    type: [String, Number],
    default: undefined,
  },
  ofNumberModifiers: {
    type: Object,
    default: () => ({}),
  },
  floor: {
    type: [String, Number],
    default: undefined,
  },
  floorModifiers: {
    type: Object,
    default: () => ({}),
  },
  ofFloor: {
    type: [String, Number],
    default: undefined,
  },
  ofFloorModifiers: {
    type: Object,
    default: () => ({}),
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
  get: () => props.city,
  set: (value) => {
    let result = value

    if (props.cityModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:city', result)
  },
})
const modelArea = computed({
  get: () => props.area,
  set: (value) => {
    let result = value

    if (props.areaModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:area', result)
  },
})
const modelRoad = computed({
  get: () => props.road,
  set: (value) => {
    let result = value

    if (props.roadModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:road', result)
  },
})
const modelLane = computed({
  get: () => props.lane,
  set(value) {
    let result = value

    if (props.laneModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:lane', result)
  },
})
const modelAlley = computed({
  get: () => props.alley,
  set: (value) => {
    let result = value

    if (props.alleyModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:alley', result)
  },
})
const modelNumber = computed({
  get: () => props.number,
  set: (value) => {
    let result = value

    if (props.numberModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:number', result)
  },
})
const modelOfNumber = computed({
  get: () => props.ofNumber,
  set: (value) => {
    let result = value

    if (props.ofNumberModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:ofNumber', result)
  },
})
const modelFloor = computed({
  get: () => props.floor,
  set: (value) => {
    let result = value

    if (props.floorModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:floor', result)
  },
})
const modelOfFloor = computed({
  get: () => props.ofFloor,
  set(value) {
    let result = value

    if (props.ofFloorModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:ofFloor', result)
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
        main: ['--h-40 --px-12 --py-8 m:w-full', setClass.city],
      }"
      @change="onCityChange()"
      v-if="props.city !== undefined"
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
        main: ['--h-40 --px-12 --py-8 m:w-full', setClass.area],
      }"
      @change="onAreaChange()"
      v-if="props.area !== undefined"
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
        main: ['--h-40 --px-12 --py-8 m:w-full', setClass.road],
      }"
      v-if="props.road !== undefined"
    />
    <FormInput
      :name="`${props.name}_address_lane`"
      v-model="modelLane"
      :config="{
        inputMode: 'numeric',
        inputChinese: false,
        checkNotIsZero: true,
        integer: true,
        isExistClose: false,
      }"
      :setClass="{
        main: ['--h-40 --px-12 --py-8', setClass.lane],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.lane !== undefined"
    >
      <template #rearAssist>巷</template>
    </FormInput>
    <FormInput
      :name="`${props.name}_address_alley`"
      v-model="modelAlley"
      :config="{
        inputMode: 'numeric',
        inputChinese: false,
        checkNotIsZero: true,
        integer: true,
        isExistClose: false,
      }"
      :setClass="{
        main: ['--h-40 --px-12 --py-8', setClass.alley],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.alley !== undefined"
    >
      <template #rearAssist>弄</template>
    </FormInput>
    <FormInput
      :name="`${props.name}_address_number`"
      v-model="modelNumber"
      :config="{
        inputMode: 'numeric',
        inputChinese: false,
        checkNotIsZero: true,
        integer: true,
        isExistClose: false,
      }"
      :setClass="{
        main: ['--h-40 --px-12 --py-8', setClass.number],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.number !== undefined"
    >
      <template #rearAssist>號</template>
    </FormInput>
    <template v-if="props.ofNumber !== undefined">
      <span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>
      <FormInput
        :name="`${props.name}_address_of_number`"
        v-model="modelOfNumber"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          integer: true,
          isExistClose: false,
        }"
        :setClass="{
          main: ['--h-40 --px-12 --py-8', setClass.ofNumber],
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      />
    </template>
    <FormInput
      :name="`${props.name}_address_floor`"
      v-model="modelFloor"
      :config="{
        inputMode: 'numeric',
        inputChinese: false,
        checkNotIsZero: true,
        integer: true,
        isExistClose: false,
      }"
      :setClass="{
        main: ['--h-40 --px-12 --py-8', setClass.floor],
        rearAssist: 'text-[14px] text-[--gray-999]',
      }"
      v-if="props.floor !== undefined"
    >
      <template #rearAssist>樓</template>
    </FormInput>
    <template v-if="props.ofFloor !== undefined">
      <span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>
      <FormInput
        :name="`${props.name}_address_of_floor`"
        v-model="modelOfFloor"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          integer: true,
          isExistClose: false,
        }"
        :setClass="{
          main: ['--h-40 --px-12 --py-8', setClass.ofFloor],
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      />
    </template>
  </div>
</template>

<style></style>
