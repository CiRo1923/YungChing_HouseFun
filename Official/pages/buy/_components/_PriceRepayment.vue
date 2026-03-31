<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
// import Anchor from '@components/buy/mAnchor.vue'

import { onToFixed } from '@js/_prototype.js'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { price, repayment } = storeToRefs(home)
const loanYears = readonly([
  {
    label: '20 年',
    value: 20,
  },
  {
    label: '30 年',
    value: 30,
  },
  {
    label: '40 年',
    value: 40,
  },
])
const totalPrice = ref(0)

const onHousePrice = () => {
  const { downPayment, monthlyPayment, loanYears, annualInterestRate } = repayment.value
  if (!downPayment || !monthlyPayment || !loanYears) return false

  // const loanRatio = 0.7 // 貸款成數
  const months = loanYears * 12
  const rate = annualInterestRate || 2.65
  const monthlyRate = rate / 100 / 12
  let loanAmount = 0

  // 利率為 0 時，避免除以 0
  if (monthlyRate === 0) {
    loanAmount = monthlyPayment * months
  } else {
    const factor = Math.pow(1 + monthlyRate, months)
    loanAmount = (monthlyPayment * (factor - 1)) / (monthlyRate * factor)
  }

  // 月付能力可買總價
  const priceByMonthly = Number(downPayment) + Number(loanAmount)

  // 成數限制可買總價
  // const priceByLoanRatio = Number(downPayment) / (1 - loanRatio)

  // console.log(priceByMonthly)
  // console.log(priceByLoanRatio)

  // 取較小值
  // const finalPrice = priceByMonthly
  totalPrice.value = Math.ceil(onToFixed(priceByMonthly, 0) / 10) * 10
  price.value.value = `-${totalPrice.value}`
}

onHousePrice()
</script>

<template>
  <ul class="tracking-default p:w-[230px] p:space-y-[15px]">
    <li class="p:space-y-[4px]">
      <span class="block leading-[1.56] p:text-[16px]">自備款</span>
      <FormInput
        name="downPayment"
        v-model="repayment.downPayment"
        :config="{
          placeholder: '請輸入',
        }"
        :setClass="{
          main: 'p:--h-35 p:--px-12 w-full',
          rearAssist: 'text-[--gray-999] p:text-[16px]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>萬</template>
      </FormInput>
    </li>
    <li class="p:space-y-[4px]">
      <span class="block leading-[1.56] p:text-[16px]">每月可負擔房貸</span>
      <FormInput
        name="monthlyPayment"
        v-model="repayment.monthlyPayment"
        :config="{
          placeholder: '請輸入',
        }"
        :setClass="{
          main: 'p:--h-35 p:--px-12 p:--py-5 w-full',
          rearAssist: 'text-[--gray-999] p:text-[16px]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>萬</template>
      </FormInput>
    </li>
    <li class="p:space-y-[4px]">
      <span class="block leading-[1.56] p:text-[16px]">貸款年限</span>
      <FormRadiosOval
        :options="loanYears"
        v-model="repayment.loanYears"
        :setClass="{
          main: '--border p:--px-5 p:--h-45',
          radios: 'w-full',
          container: 'flex-1',
        }"
        @change="onHousePrice"
      />
    </li>
    <li class="p:space-y-[4px]">
      <span class="block leading-[1.56] p:text-[16px]">貸款利率</span>
      <FormInput
        name="annualInterestRate"
        v-model="repayment.annualInterestRate"
        :config="{
          placeholder: '2.65',
        }"
        :setClass="{
          main: 'p:--h-35 p:--px-12 p:--py-5 w-full',
          rearAssist: 'text-[--gray-999] p:text-[16px]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>%</template>
      </FormInput>
    </li>
    <li>
      <span class="block p:text-[16px]">參考總價</span>
      <div class="p:space-y-[8px]">
        <p class="flex items-center border-b-[2px] border-b-[--gray-ccce]">
          <em class="grow text-center leading-[1.56] p:text-[18px]">{{ totalPrice }}</em>
          <small class="shrink-0 text-[--gray-999] p:text-[16px]">萬</small>
        </p>
        <p class="text-[--gray-999] p:text-[12px]">貸款以 7 成計算，搜尋參考總價浮動 10% 的物件</p>
      </div>
    </li>
  </ul>
  <!-- <ul class="p:mt-[15px]">
    <li>
      <Anchor
        text="確認"
        :setClass="{
          main: '--bg-orange-e646 --text-white --oval p:--h-35 p:--px-20 w-full',
        }"
      />
    </li>
  </ul> -->
</template>

<style></style>
