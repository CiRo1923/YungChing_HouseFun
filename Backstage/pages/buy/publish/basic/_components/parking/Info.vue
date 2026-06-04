<script setup>
import { onDeepClone } from '@js/_prototype.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
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
        id: 'caseParkingMode',
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
          hasClearButton: false,
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
        id: 'caseParkingType',
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
        id: 'caseParkingReg',
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
        id: 'caseParkingFeePayType',
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
        class: 'p:w-[160px] m:w-[147px]',
      },
      text: {
        id: 'caseParkingFee',
        rearAssist: '元',
        config: {
          inputMode: 'numeric',
          isExistClose: false,
          inputChinese: false,
          checkNotIsZero: true,
          hasClearButton: false,
          integer: true,
        },
        rules: {
          required: '請輸入管理費',
        },
        class: 'p:w-[113px] m:w-[108px] shrink-0',
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

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)

const onIsCaseParkingChange = () => {
  const { isCaseParking } = apiData.value.caseInfo

  if (!isCaseParking) {
    apiData.value.caseInfo.parkingInfos = []
  } else {
    onAddInfo()
  }
}

const onAddInfo = () => {
  apiData.value.caseInfo.parkingInfos.push(onDeepClone(buyProject.parkingInfo))
}

const onInit = () => {
  const { isCaseParking, parkingInfos } = apiData.value.caseInfo

  if (isCaseParking && parkingInfos && parkingInfos.length === 0) {
    onAddInfo()
  }
}

onInit()
</script>

<template>
  <!-- 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他 -->
  <PageBuyPublishBasicRadiosOval>
    <!-- {{ apiData.caseInfo.parkingInfos }} -->
    <BuyMFormRadiosOval
      name="isCaseParking"
      v-model="apiData.caseInfo.isCaseParking"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseParkingChange"
      v-if="casePurposeToken !== '7'"
    />
    <BuyMAddIdentical
      v-model="apiData.caseInfo.parkingInfos"
      :config="{
        keepDelItems: 1,
        defaultData: buyProject.parkingInfo,
        anchor: {
          text: '新增一組車位',
        },
      }"
      :setClass="{
        main: '--card --gray-f7 --rounded-15 p:--p-30 tm:--p-24',
      }"
      v-slot="{ data, index }"
      v-if="apiData.caseInfo.isCaseParking"
    >
      <ul
        class="m:space-y-[24px] t:gap-x-[16px] pt:grid pt:grid-cols-2 pt:gap-y-[8px] p:gap-x-[24px]"
      >
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
              class="overflow-hidden"
              :class="value.class"
              v-for="(value, key) in item.forms"
              :key="`${item.label}_${key}_${idx}_${index}`"
            >
              <PageBuyPublishBasicSelectInputOther
                :selectName="`parkingInfos[${index}].${value.id}Token`"
                v-model:select="data[`${value.id}Token`]"
                :otherName="`parkingInfos[${index}].${value.id}Other`"
                v-model:other="data[`${value.id}Other`]"
                :config="{
                  select: {
                    options: value.options,
                    ...value.config,
                  },
                  other: {
                    placeholder: '請輸入其他原因',
                  },
                }"
                :selectRules="value.rules"
                :otherRules="{
                  required: '請輸入其他原因',
                }"
                :setClass="{
                  main: 'm:space-y-[12px] pt:space-y-[8px]',
                  select: {
                    main: '--h-40 --px-12 --py-8',
                  },
                  other: {
                    main: '--h-40 --px-12 --py-8',
                  },
                }"
                v-if="key === 'select'"
              />

              <BuyMFormInput
                :name="`parkingInfos[${index}].${value.id}`"
                v-model.number="data[value.id]"
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
              </BuyMFormInput>
              <BuyMFormCheckBox
                :name="`parkingInfos[${index}].${value.id}`"
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
    </BuyMAddIdentical>
  </PageBuyPublishBasicRadiosOval>
</template>

<style></style>
