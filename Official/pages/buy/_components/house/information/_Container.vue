<script setup>
import Anchor from '@components/buy/mAnchor.vue'

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="tracking-default pt:flex p:gap-x-[25px] p:text-[18px]">
    <ul
      class="pt:flex-1 p:space-y-[12px]"
      v-for="(data, index) in props.items"
      :key="`ˋ${props.name}_${index}`"
    >
      <li v-for="(item, idx) in data" :key="`ˋ${props.name}_${item.id}_${idx}_${index}`">
        <div class="flex p:gap-x-[15px]">
          <span class="block text-[--gray-999] pt:shrink-0 p:w-[135px]">{{ item.label }}</span>
          <ul class="pt:grow" v-if="item.values && item.values.length !== 0">
            <li
              class="flex p:gap-x-[15px]"
              v-for="(value, i) in item.values"
              :key="`${props.name}_values_${item.id}_${i}`"
            >
              <p>{{ value.content }}</p>
              <Anchor
                :text="value.button.text"
                :config="{
                  icon: {
                    name: value.button.icon,
                    position: 'left',
                  },
                }"
                :setClass="{
                  main: '--text-orange-e646 p:text-[14px]',
                  text: 'font-normal underline',
                  icon: 'h-[18px] w-[18px]',
                }"
                v-if="value.button"
              />
            </li>
          </ul>
        </div>

        <ul class="p:ml-[15px] p:mt-[12px] p:space-y-[12px]" v-if="item.children">
          <template
            v-for="(children, i) in item.children"
            :key="`${props.name}_children_${item.id}_${i}`"
          >
            <li v-if="children.isHidden !== true">
              <div class="flex p:gap-x-[15px]">
                <span class="block text-[--gray-999] pt:shrink-0 p:w-[120px]">
                  {{ children.label }}
                </span>
                <ul class="pt:grow" v-if="children.values && children.values.length !== 0">
                  <li
                    v-for="(childrenValue, childrenIndex) in children.values"
                    :key="`${props.name}_children_values_${item.id}_${childrenIndex}`"
                  >
                    <p>{{ childrenValue.content }}</p>
                  </li>
                </ul>
              </div>
            </li>
          </template>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style></style>
