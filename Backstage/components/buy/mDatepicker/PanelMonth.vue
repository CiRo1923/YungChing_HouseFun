<script setup>
// 月份面板。headerMode: 'panel' 時點月份會展開這個。
const props = defineProps({
  months: {
    type: Array,
    default: () => [],
  },
  // 0-11,對齊 Date 的 getMonth()
  current: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['select'])
</script>

<template>
  <ul class="m-datepicker-panel --month">
    <li class="m-datepicker-panel-item" v-for="item in props.months" :key="item.key">
      <button
        type="button"
        class="m-datepicker-panel-ctrl"
        :class="{ '--curr': Number(item.key) === Number(props.current) }"
        @click="$emit('select', item.key)"
      >
        {{ item.value }}
      </button>
    </li>
  </ul>
</template>
