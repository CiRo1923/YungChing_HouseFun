<script setup></script>

<template>
  <p class="flex items-center justify-center gap-x-[10px]">
    還不是會員?
    <CommonMAnchor
      text="快速註冊"
      :to="{
        name: 'member-register',
      }"
      :setClass="{
        main: 'underline',
      }"
    />
  </p>
</template>

<style lang="postcss"></style>
