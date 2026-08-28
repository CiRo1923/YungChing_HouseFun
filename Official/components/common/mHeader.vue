<script setup>
import '@css/_modules/common/mHeader/variables.css'
import '@css/_modules/common/mHeader/common.css'
</script>

<template>
  <div class="m-header">
    <div class="m-header-container">
      <div class="m-header-logo">
        <CommonImgSrc
          src="buy/logo_text.svg"
          alt="好房網HouseFun"
          :setClass="{
            main: 'm-header-logo-text',
          }"
        />
        <CommonImgSrc
          src="buy/logo_icon.svg"
          alt=""
          :setClass="{
            main: 'm-header-logo-icon',
          }"
        />
      </div>
      <CommonMNavMain>
        <slot name="nav" />
      </CommonMNavMain>
    </div>
  </div>
</template>
