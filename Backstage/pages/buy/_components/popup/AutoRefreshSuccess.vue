<script setup></script>

<template>
  <BuyCommonCustomPopup
    id="popupAutoRefreshSuccess"
    :setClass="{
      main: 'p:--w-800 t:--w-600',
      body: 'flex flex-col',
    }"
  >
    <div class="text-center tm:space-y-[8px] p:space-y-[16px]">
      <PageBuyPublishLabelText
        label="自動刷新設定完成"
        icon="icon_check_solid"
        :setClass="{
          icon: 'text-[--orange-e646]',
        }"
      />
      <p class="text-[--gray-666] tm:text-[14px] p:text-[16px]">設定將於隔日生效</p>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
