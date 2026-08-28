<script setup>
import '@css/_modules/common/mPopup/variables.css'
import '@css/_modules/common/mPopup/promiseVariables.css'
import '@css/_modules/common/mPopup/common.css'
import '@css/_modules/common/mPopup/promise.css'

const popup = usePopupStore()
const { promise } = storeToRefs(popup)
</script>

<template>
  <Transition name="popup-promise-overlay">
    <div
      class="m-popup-promise"
      v-if="promise.status === 'open'"
    >
      <Transition name="popup-promise">
        <p
          class="m-popup-promise-message"
          v-html="promise.message"
          v-if="promise.status === 'open'"
        />
      </Transition>
    </div>
  </Transition>
</template>
