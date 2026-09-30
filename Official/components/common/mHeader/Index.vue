<script setup>
import './.css/variables.css'
import './.css/common.css'
</script>

<template>
  <div class="m-header">
    <div class="m-header-container">
      <div class="m-header-logo">
        <CommonMFigure
          src="buy/logo_text.svg"
          alt="好房網HouseFun"
          :setClass="{
            main: 'm-header-logo-text',
          }"
        />
        <CommonMFigure
          src="buy/logo_icon.svg"
          alt=""
          :setClass="{
            main: 'm-header-logo-icon',
          }"
        />
      </div>
      <CommonMNav>
        <slot name="nav" />
      </CommonMNav>
    </div>
  </div>
</template>
