<script setup>
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

// 無資料欄位整列隱藏(含 label),讓後方欄位自動遞補。
// 判定「有內容」:任一 value 具有非空 content、或有文字的 anchor、或 tools。
const isEmpty = (value) => value == null || value === ''
const hasContent = (item) =>
  Array.isArray(item.values) &&
  item.values.some((value) => !isEmpty(value.content) || value.anchor?.text || value.tools)

// 整欄(ul)/整個容器(div)無任何有內容欄位時不渲染,避免留下空殼 div/ul。
const hasColumnContent = (data) => Array.isArray(data) && data.some((item) => hasContent(item))
const hasAnyContent = computed(() => props.items.some((data) => hasColumnContent(data)))
</script>

<template>
  <div
    class="tracking-wider m:space-y-[10px] t:gap-x-[25px] pt:flex p:gap-x-[50px] p:text-[18px]"
    v-if="hasAnyContent"
  >
    <template v-for="(data, index) in props.items" :key="`ˋ${props.name}_${index}`">
      <ul class="space-y-[10px] pt:flex-1" v-if="hasColumnContent(data)">
        <template v-for="(item, idx) in data" :key="`ˋ${props.name}_${item.id}_${idx}_${index}`">
        <li v-if="!item.isHidden && hasContent(item)">
          <div class="flex tm:gap-x-[10px] p:gap-x-[25px]">
            <PageBuyHouseLabel :text="item.label" />
            <ul
              class="m:space-y-[6px] t:space-y-[9px] pt:grow p:space-y-[12px]"
              v-if="item.values && item.values.length !== 0"
            >
              <li
                :class="[
                  value.isFlex
                    ? 'flex m:gap-x-[5px] t:gap-x-[10px] p:gap-x-[15px]'
                    : 'space-y-[5px]',
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
                    <CommonSvgIcon
                      :icon="value.tools.icon"
                      :class="value.tools.class?.icon"
                      v-if="value.tools.icon"
                    />
                    <span v-html="value.tools.content" />
                  </p>
                </div>
                <CommonMAnchor
                  :text="value.anchor.text"
                  v-bind="onAnchorBind(value.anchor)"
                  :setClass="{
                    main: ['tm:text-[14px] p:text-[18px]', value.anchor.class?.main],
                    text: ['font-normal underline', value.anchor.class?.text],
                  }"
                  v-if="value.anchor"
                />
                <CommonMAnchor
                  :text="value.popupAnchor.text"
                  v-bind="onAnchorBind(value.popupAnchor)"
                  :config="{
                    icon: {
                      name: value.popupAnchor.icon,
                      position: 'left',
                    },
                  }"
                  :setClass="{
                    main: ['gap-x-[3px]', value.popupAnchor.class?.main],
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

          <!-- <ul class="p:ml-[15px] p:mt-[12px] p:space-y-[12px]" v-if="item.children">
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
        </ul> -->
        </li>
      </template>
      </ul>
    </template>
  </div>
</template>

<style></style>
