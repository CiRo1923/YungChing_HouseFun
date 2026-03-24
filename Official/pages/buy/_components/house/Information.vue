<script setup>
import Content from '@components/common/mContent.vue'
import AccordionContent from '@components/buy/mAccordion/Content.vue'

import Title from '@pages/buy/_components/house/Title.vue'
import Basic from '@pages/buy/_components/house/information/Basic.vue'
</script>

<template>
  <Content class="pt:--rounded-20 p:--px-40 p:--py-30">
    <Title title="基本資料" icon="icon_house_info" />
    <AccordionContent>
      <div>
        <Basic />
      </div>
    </AccordionContent>
  </Content>
</template>

<style></style>
