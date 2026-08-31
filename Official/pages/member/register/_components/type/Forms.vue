<script setup>
import { REGISTEREXPIRES } from '@js/_storage.js'

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const manage = useManageStore()
const { options } = storeToRefs(manage)
const memberRegister = useMemberRegisterStore()
const { type } = storeToRefs(memberRegister)

const emits = defineEmits(['verifySubmit', 'cityChange', 'workAreaChange', 'workBrandChange'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const hasName = computed(() => type.value.apiData.lastName && type.value.apiData.firstName)
const hasAddress = computed(
  () => type.value.apiData.cityId && type.value.apiData.districtId && type.value.apiData.address
)
const hasStore = computed(
  () =>
    type.value.apiData.workCityId &&
    type.value.apiData.workDistrictId &&
    type.value.apiData.brandId &&
    type.value.apiData.storeId
)

const onVerifySubmit = () => {
  console.log(1)
  emits('verifySubmit')
}

const onCityChange = () => {
  const { apiData } = type.value
  apiData.districtId = null

  emits('cityChange', apiData.cityId)
}

const onWorkCityChange = () => {
  const { apiData } = type.value
  apiData.workDistrictId = null
  apiData.brandId = null
  apiData.storeId = null

  emits('cityChange', apiData.workCityId)
}

const onWorkAreaChange = () => {
  const { apiData } = type.value
  apiData.brandId = null
  apiData.storeId = null

  emits('workAreaChange', {
    cityId: apiData.workCityId,
    areaId: apiData.workDistrictId,
  })
}

const onWorkBrandChange = () => {
  const { apiData } = type.value
  apiData.storeId = null

  emits('workBrandChange', {
    cityId: apiData.workCityId,
    areaId: apiData.workDistrictId,
    brandId: apiData.brandId,
  })
}
</script>

<template>
  <!-- <pre>
    {{ type.apiData }}
  </pre> -->
  <ul class="space-y-[15px]">
    <li class="space-y-[15px]" v-for="(item, index) in props.items" :key="`${item.label}_${index}`">
      <PageMemberRegisterTypeLableLine
        :label="item.label.text"
        :config="{
          icon: 'icon_store',
        }"
        :setClass="{
          main: '--green-8b0d text-[16px]',
          icon: 'h-[20px] w-[20px] p-[2px]',
        }"
        v-if="item.label?.type === 'line'"
      />

      <CommonMFormLabel
        :label="item.label.text"
        class="text-[16px]"
        :config="{
          isRequired: false,
        }"
        v-if="item.label?.type === 'string'"
      />
      <ul class="space-y-[15px]">
        <li v-for="(form, idx) in item.forms" :key="`${item.label}_${form.name}_${idx}`">
          <CommonMFormInput
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              placeholder: '手機號碼',
              inputMode: 'tel',
              length: 10,
              inputChinese: false,
              integer: true,
            }"
            :rules="{
              required: '請輸入手機號碼',
              phone: '手機號碼格式錯誤',
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
            }"
            v-if="form.name === 'mobilePhone'"
          />
          <CommonMFormInput
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              inputMode: 'email',
              placeholder: '請輸入 E-MAIL',
            }"
            :rules="{
              required: '請輸入 E-MAIL',
              email: 'E-MAIL 格式錯誤',
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
            }"
            v-if="form.name === 'email'"
          />
          <CommonMFormInput
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              placeholder: '請輸入經紀業名稱',
            }"
            :rules="{
              required: '請輸入經紀業名稱',
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
            }"
            v-if="form.name === 'companyName'"
          />
          <CommonMFormVerifyCountdown
            :name="form.name"
            v-model="type.apiData.verificationCode"
            :config="{
              length: 6,
              placeholder: '請輸入 6 位數驗證碼',
              serverTime: serverTime?.full,
              expires: type.countdownData.expires,
              storageName: REGISTEREXPIRES,
              message: {
                timeout: '{ timeout } 秒後重送',
                reSend: '發送驗證碼',
              },
              isDisabled: {
                button: !type.apiData.mobilePhone || !/^09\d{8}$/.test(type.apiData.mobilePhone),
              },
            }"
            :rules="{
              required: '請輸入驗證碼',
              minlength: '請輸入 { minlength } 位數驗證碼',
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
              button: '--h-35 --px-15',
            }"
            @submit="onVerifySubmit"
            v-if="form.name === 'verifyCode'"
          />
          <CommonMFormPassword
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              minlength: 6,
              maxlength: 12,
              placeholder: '6 ~ 12 位數字或英文，大小寫有別',
            }"
            :rules="{
              required: '請設定密碼',
              custom: {
                // 6~12 位數字或英文（大小寫有別）
                valid: /^[A-Za-z0-9]{6,12}$/.test(type.apiData[form.name]),
                errorMessage: '請輸入 { minlength } ~ { maxlength } 位數字或英文，大小寫有別',
              },
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
            }"
            v-if="form.name === 'password'"
          />
          <CommonMFormPassword
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              placeholder: '再次輸入密碼',
            }"
            :rules="{
              required: '再次輸入密碼',
              custom: {
                valid: type.apiData.password === type.apiData[form.name],
                errorMessage: '密碼與再次輸入密碼不同',
              },
            }"
            :setClass="{
              main: '--rounded --h-55 --px-12',
            }"
            v-if="form.name === 'confirmPassword'"
          />
          <CommonMFormHidden
            :name="form.name"
            v-model="hasName"
            :rules="{
              required: '請輸入姓名',
            }"
            :setClass="{
              container: 'grid grid-cols-2 gap-x-[15px]',
            }"
            v-slot="{ isError }"
            v-if="form.name === 'name'"
          >
            <CommonMFormInput
              name="lastName"
              v-model="type.apiData.lastName"
              :config="{
                placeholder: '姓',
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
              }"
            />
            <CommonMFormInput
              name="firstName"
              v-model="type.apiData.firstName"
              :config="{
                placeholder: '名',
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
              }"
            />
          </CommonMFormHidden>
          <CommonMFormHidden
            :name="form.name"
            v-model="hasAddress"
            :rules="{
              required: '請輸入完整地址',
            }"
            :setClass="{
              container: 'grid grid-cols-2 gap-[15px]',
            }"
            v-slot="{ isError }"
            v-if="form.name === 'address'"
          >
            <CommonMFormSelect
              name="cityId"
              v-model="type.apiData.cityId"
              :options="options.city"
              :config="{
                placeholder: '縣市',
                schema: {
                  label: 'text',
                  value: 'value',
                },
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
                dropdownLabel: 'text-[14px]',
              }"
              @change="onCityChange"
            />
            <CommonMFormSelect
              name="districtId"
              v-model="type.apiData.districtId"
              :options="options.area"
              :config="{
                placeholder: '區域',
                schema: {
                  label: 'text',
                  value: 'value',
                },
                isDisabled: !type.apiData.cityId,
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
                dropdownLabel: 'text-[14px]',
              }"
            />
            <CommonMFormInput
              name="address"
              v-model="type.apiData.address"
              :config="{
                placeholder: '請輸入地址',
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12 col-span-2',
              }"
            />
          </CommonMFormHidden>
          <CommonMFormHidden
            :name="form.name"
            v-model="hasStore"
            :rules="{
              required: '請輸入完整服務店資料',
            }"
            :setClass="{
              container: 'grid grid-cols-2 gap-[15px]',
            }"
            v-slot="{ isError }"
            v-if="form.name === 'store'"
          >
            <CommonMFormSelect
              name="workCityId"
              v-model="type.apiData.workCityId"
              :options="options.city"
              :config="{
                placeholder: '縣市',
                schema: {
                  label: 'text',
                  value: 'value',
                },
                isError: !type.apiData.workCityId && isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
                dropdownLabel: 'text-[14px]',
              }"
              @change="onWorkCityChange"
            />
            <CommonMFormSelect
              name="workDistrictId"
              v-model="type.apiData.workDistrictId"
              :options="options.area"
              :config="{
                placeholder: '區域',
                schema: {
                  label: 'text',
                  value: 'value',
                },
                isDisabled: !type.apiData.workCityId,
                isError: !type.apiData.workDistrictId && isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12',
                dropdownLabel: 'text-[14px]',
              }"
              @change="onWorkAreaChange"
            />
            <CommonMFormSelect
              name="brandId"
              v-model="type.apiData.brandId"
              :options="options.branch"
              :config="{
                placeholder: '請選擇所屬品牌',
                schema: {
                  label: 'text',
                  value: 'value',
                },
                isDisabled: !type.apiData.workDistrictId,
                isError: !type.apiData.brandId && isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12 col-span-2',
                dropdownLabel: 'text-[14px]',
              }"
              @change="onWorkBrandChange"
            />
            <CommonMFormAutoComplete
              name="storeId"
              v-model="type.apiData.storeId"
              :options="options.branchStore"
              :config="{
                placeholder: '請選擇分店',
                noMatchClearLabel: true,
                input: {
                  wait: 500,
                  minChars: 0,
                },
                schema: {
                  label: 'storeName',
                  value: 'valueStore',
                  model: 'valueStore',
                },
                isDisabled: !type.apiData.brandId,
                isError,
              }"
              :setClass="{
                main: '--rounded --h-55 --px-12 col-span-2',
                dropdownLabel: 'text-[14px]',
              }"
            />
          </CommonMFormHidden>
          <CommonMFormCheckBox
            :name="form.name"
            v-model="type.apiData[form.name]"
            :config="{
              mode: 'boolean',
            }"
            :rules="{
              required: '請勾選同意條款',
            }"
            :setClass="{
              main: '--icon-size-16 --checkbox-green-8d0d',
              element: 'text-[14px] text-[--gray-666]',
            }"
            v-if="form.name === 'agreeTerms'"
          >
            <p>
              本人已充分了解<CommonMAnchor
                text="好房網會員及網友同意條款"
                :setClass="{
                  main: 'underline',
                }"
              />，並同意提供資料作為貴網站資訊提供及服務行銷之用。
            </p>
          </CommonMFormCheckBox>
        </li>
      </ul>
    </li>
  </ul>
</template>
