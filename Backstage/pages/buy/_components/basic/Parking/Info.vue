<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import AddIdentical from '@components/buy/mAddIdentical.vue'
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { onDeepClone } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData, options } = storeToRefs(buyProject)
const radioOptions = readonly([
  {
    label: '無車位',
    value: false,
  },
  {
    label: '有車位',
    value: true,
  },
])
const items = shallowReadonly([
  {
    label: '車位類型',
    forms: {
      select: {
        id: 'caseParkingModeToken',
        options: options.value.parkingMode,
        config: {
          placeholder: '請選擇車位類型',
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        rules: {
          required: '請選擇車位類型',
        },
        class: 'grow',
      },
    },
  },
  {
    label: '車位數量',
    forms: {
      text: {
        id: 'caseParkingCount',
        rearAssist: '個',
        config: {
          isExistClose: false,
          maxlength: 3,
        },
        rules: {
          required: '請輸入車位數量',
        },
        class: 'grow',
      },
    },
  },
  {
    label: '停車方式',
    forms: {
      select: {
        id: 'caseParkingTypeToken',
        options: options.value.parkingType,
        config: {
          placeholder: '請選擇停車方式',
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        rules: {
          required: '請選擇停車方式',
        },
        class: 'grow',
      },
    },
  },
  {
    label: '產權登記',
    forms: {
      select: {
        id: 'caseParkingRegToken',
        options: options.value.parkingReg,
        config: {
          placeholder: '請選擇產權登記',
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        rules: {
          required: '請選擇產權登記',
        },
        class: 'grow',
      },
    },
  },
  {
    label: '車位管理費',
    class: 'pt:col-span-2',
    forms: {
      select: {
        id: 'caseParkingFeePayTypeToken',
        options: options.value.parkingPayPeriod,
        config: {
          placeholder: '請選擇繳費方式',
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        rules: {
          required: '請選擇繳費方式',
        },
        class: 'p:w-[165px] m:w-[147px]',
      },
      text: {
        id: 'caseParkingFee',
        rearAssist: '元',
        config: {
          inputMode: 'numeric',
          isExistClose: false,
          inputChinese: false,
          checkNotIsZero: true,
          integer: true,
        },
        rules: {
          required: '請輸入管理費',
        },
        class: 'w-[108px] shrink-0',
      },
      checkbox: {
        id: 'isCaseParkingFeeInclude',
        config: {
          mode: 'boolean',
          label: '含於管理費中',
        },
        class: 'grow pt:h-[40px] pt:flex pt:items-center p:ml-[16px]',
      },
    },
  },
])

const onIsCaseParkingChange = () => {
  const { isCaseParking } = apiData.value

  if (!isCaseParking) {
    apiData.value.parkingInfos = []
  } else {
    onAddInfo()
  }
}

const onAddInfo = () => {
  apiData.value.parkingInfos.push(onDeepClone(buyProject.parkingInfo))
}

const onInit = () => {
  const { isCaseParking, parkingInfos } = apiData.value

  if (isCaseParking && parkingInfos && parkingInfos.length === 0) {
    onAddInfo()
  }
}

onInit()
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="isCaseParking"
      v-model="apiData.isCaseParking"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseParkingChange"
    />
    <AddIdentical
      v-model="apiData.parkingInfos"
      :config="{
        defaultData: buyProject.parkingInfo,
        anchor: {
          text: '新增一組車位',
        },
      }"
      :setClass="{
        main: '--card --gray-f7 --rounded-15 p:--p-30 tm:--p-24',
      }"
      v-slot="{ data, index }"
      v-if="apiData.isCaseParking"
    >
      <ul class="m:space-y-[24px] pt:grid pt:grid-cols-2 p:gap-x-[24px] p:gap-y-[8px]">
        <li
          class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"
          :class="item.class"
          v-for="(item, idx) in items"
          :key="`${item.label}_${idx}_${index}`"
        >
          <span
            class="text-[16px] text-[--gray-666] pt:flex pt:h-[40px] pt:shrink-0 pt:items-center p:w-[85px]"
            v-if="item.label"
          >
            {{ item.label }}
          </span>
          <ul class="flex flex-wrap gap-x-[8px] overflow-hidden m:gap-y-[12px] pt:grow">
            <li
              :class="value.class"
              v-for="(value, key) in item.forms"
              :key="`${item.label}_${key}_${idx}_${index}`"
            >
              <FormSelect
                :name="`${value.id}[${index}]`"
                v-model="data[value.id]"
                :options="value.options"
                :config="value.config"
                :rules="value.rules"
                :setClass="{
                  main: '--h-40 --px-12 --py-8',
                }"
                v-if="key === 'select'"
              />
              <FormInput
                :name="`${value.id}[${index}]`"
                v-model="data[value.id]"
                :config="value.config"
                :rules="value.rules"
                :setClass="{
                  main: '--h-40 --px-12 --py-8',
                  element: 'grow',
                  rearAssist: 'text-[14px] text-[--gray-999]',
                }"
                v-if="key === 'text'"
              >
                <template #rearAssist v-if="value.rearAssist">{{ value.rearAssist }}</template>
              </FormInput>
              <FormCheckBox
                :name="`${value.id}[${index}]`"
                v-model="data[value.id]"
                :config="value.config"
                :rules="value.rules"
                :setClass="{
                  label: 'text-[16px]',
                }"
                v-if="key === 'checkbox'"
              />
            </li>
          </ul>
        </li>
      </ul>
    </AddIdentical>
  </RadiosOval>
</template>

<style></style>
