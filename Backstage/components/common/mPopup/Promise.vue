<script setup>
/* component-deps —— 複製這支元件時要一起帶走:
   stores/popup.js */
import './.css/variables.css'
import './.css/promiseVariables.css'
import './.css/common.css'
import './.css/promise.css'

const popup = usePopupStore()
const { promise } = storeToRefs(popup)
</script>

<template>
  <Transition name="anim-fade-out-late">
    <div class="m-popup-promise" v-if="promise.status === 'open'">
      <Transition name="anim-fade-in-late">
        <p
          class="m-popup-promise-message"
          v-html="promise.message"
          v-if="promise.status === 'open'"
        />
      </Transition>
    </div>
  </Transition>
</template>
