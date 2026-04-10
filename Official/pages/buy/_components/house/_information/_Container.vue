<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
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

const onAnchorBind = (item) => {
  const { to, href, onClick } = item

  if (to) return { to, onClick }
  if (href) return { href, onClick }

  return { onClick }
}
</script>

<template>
  <div class="tracking-default m:space-y-[5px] pt:flex p:gap-x-[25px] p:text-[18px]">
    <ul
      class="m:space-y-[6px] t:space-y-[9px] pt:flex-1 p:space-y-[12px]"
      v-for="(data, index) in props.items"
      :key="`ˋ${props.name}_${index}`"
    >
      <li v-for="(item, idx) in data" :key="`ˋ${props.name}_${item.id}_${idx}_${index}`">
        <div class="flex tm:gap-x-[10px] p:gap-x-[15px]">
          <span
            class="block text-[--gray-999] tm:w-[92px] tm:text-[14px] pt:shrink-0 p:w-[135px] p:text-[18px]"
          >
            {{ item.label }}
          </span>
          <ul
            class="m:space-y-[6px] t:space-y-[9px] pt:grow p:space-y-[12px]"
            v-if="item.values && item.values.length !== 0"
          >
            <li
              :class="[
                value.isFlex ? 'flex m:gap-x-[5px] t:gap-x-[10px] p:gap-x-[15px]' : 'space-y-[5px]',
              ]"
              v-for="(value, i) in item.values"
              :key="`${props.name}_values_${item.id}_${i}`"
            >
              <div
                class="flex items-center m:gap-x-[5px] t:gap-x-[10px] tm:text-[14px] p:gap-x-[15px] p:text-[18px]"
                v-if="value.content || value.tools"
              >
                <p v-html="value.content" v-if="value.content" />
                <p class="flex items-center" :class="value.tools.class?.main" v-if="value.tools">
                  <SvgIcon
                    :icon="value.tools.icon"
                    :class="value.tools.class?.icon"
                    v-if="value.tools.icon"
                  />
                  <span v-html="value.tools.content" />
                </p>
              </div>
              <Anchor
                :text="value.anchor.text"
                v-bind="onAnchorBind(value.anchor)"
                :setClass="{
                  main: ['tm:text-[14px] p:text-[18px]', value.anchor.class?.main],
                  text: ['font-normal underline', value.anchor.class?.text],
                }"
                v-if="value.anchor"
              />
              <Anchor
                :text="value.popupAnchor.text"
                v-bind="onAnchorBind(value.popupAnchor)"
                :config="{
                  icon: {
                    name: value.popupAnchor.icon,
                    position: 'left',
                  },
                }"
                :setClass="{
                  main: value.popupAnchor.class?.main,
                  text: ['font-normal underline', value.popupAnchor.class?.text],
                  icon: [
                    'tm:h-[16px] tm:w-[16px] p:h-[18px] p:w-[18px]',
                    value.popupAnchor.class?.icon,
                  ],
                }"
                v-if="value.popupAnchor"
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
                <span
                  class="block text-[--gray-999] tm:text-[14px] pt:shrink-0 p:w-[120px] p:text-[18px]"
                >
                  {{ children.label }}
                </span>
                <ul class="pt:grow" v-if="children.values && children.values.length !== 0">
                  <li
                    v-for="(childrenValue, childrenIndex) in children.values"
                    :key="`${props.name}_children_values_${item.id}_${childrenIndex}`"
                  >
                    <p class="tm:text-[14px] p:text-[18px]">{{ childrenValue.content }}</p>
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
