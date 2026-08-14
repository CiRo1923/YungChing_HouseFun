<script setup></script>

<template>
  <ul class="mt-[20px] text-center text-[14px]">
    <li>
      還不是會員嗎?
      <CommonMAnchor
        text="立即註冊"
        :setClass="{
          main: 'underline',
        }"
      />
    </li>
    <li>
      <CommonMAnchor
        text="MAIL 會員升級"
        :to="{
          name: 'member-upgrade-email',
        }"
        :setClass="{
          main: 'underline',
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
