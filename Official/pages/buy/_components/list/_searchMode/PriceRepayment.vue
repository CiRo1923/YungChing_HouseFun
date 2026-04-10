<script setup>
import { onToFixed } from '@js/_prototype.js'

import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { price, repayment } = storeToRefs(buyList)
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
  price.value.params = `-${totalPrice.value}`
}

onHousePrice()
</script>

<template>
  <ul class="grow space-y-[15px] tracking-default m:overflow-y-auto">
    <li class="space-y-[4px]">
      <span class="block text-[16px] leading-[1.56]">自備款</span>
      <BuyMFormInput
        name="downPayment"
        v-model="repayment.downPayment"
        :config="{
          placeholder: '請輸入',
        }"
        :setClass="{
          main: '--h-35 --px-12 --border --rounded w-full',
          rearAssist: 'text-[16px] text-[--gray-999]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>萬</template>
      </BuyMFormInput>
    </li>
    <li class="space-y-[4px]">
      <span class="block text-[16px] leading-[1.56]">每月可負擔房貸</span>
      <BuyMFormInput
        name="monthlyPayment"
        v-model="repayment.monthlyPayment"
        :config="{
          placeholder: '請輸入',
        }"
        :setClass="{
          main: '--h-35 --px-12 p:--py-5 --border --rounded w-full',
          rearAssist: 'text-[16px] text-[--gray-999]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>萬</template>
      </BuyMFormInput>
    </li>
    <li class="space-y-[4px]">
      <span class="block text-[16px] leading-[1.56]">貸款年限</span>
      <BuyMFormRadiosOval
        :options="loanYears"
        v-model="repayment.loanYears"
        :setClass="{
          main: '--border --px-5 --h-45',
          radios: 'w-full',
          container: 'flex-1',
        }"
        @change="onHousePrice"
      />
    </li>
    <li class="space-y-[4px]">
      <span class="block text-[16px] leading-[1.56]">貸款利率</span>
      <BuyMFormInput
        name="annualInterestRate"
        v-model="repayment.annualInterestRate"
        :config="{
          placeholder: '2.65',
        }"
        :setClass="{
          main: '--h-35 --px-12 p:--py-5 --border --rounded w-full',
          rearAssist: 'text-[16px] text-[--gray-999]',
        }"
        @blur="onHousePrice"
      >
        <template #rearAssist>%</template>
      </BuyMFormInput>
    </li>
    <li>
      <span class="block text-[16px]">參考總價</span>
      <div class="p:space-y-[8px]">
        <p class="flex items-center border-b-[2px] border-b-[--gray-ccce]">
          <em class="grow text-center text-[18px] leading-[1.56]">{{ totalPrice }}</em>
          <small class="shrink-0 text-[16px] text-[--gray-999]">萬</small>
        </p>
        <p class="text-[12px] text-[--gray-999]">貸款以 7 成計算，搜尋參考總價浮動 10% 的物件</p>
      </div>
    </li>
  </ul>
  <!-- <ul class="p:mt-[15px]">
    <li>
      <BuyMAnchor
        text="確認"
        :setClass="{
          main: '--bg-orange-e646 --text-white --oval p:--h-35 p:--px-20 w-full',
        }"
      />
    </li>
  </ul> -->
</template>

<style></style>
