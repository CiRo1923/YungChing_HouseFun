<script setup>
import '@css/_modules/common/mTab/variables.css'
import '@css/_modules/common/mTab/ovalResponsivVariables.css'
import '@css/_modules/common/mTab/common.css'
import '@css/_modules/common/mTab/ovalResponsiv.css'

import { onMergeTabConfig, useTabCore } from './.composables/useTabCore.js'

const emits = defineEmits(['click', 'changed'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return onMergeTabConfig(props.config, {
    active: null,
    containerMode: 'multiple', // multiple / single / false
    schema: {
      id: 'id',
      label: 'label',
    },
  })
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerItems: '',
    headerItem: '',
    anchor: '',
    body: '',
    ...props.setClass,
  }
})

const {
  activeIndex,
  prevIndex,
  direction,
  animating,
  isShowItem,
  onHeaderAs,
  onHeaderBind,
  onClick,
  onTrackTransitionEnd,
} = useTabCore({ config })

const onAnchorClick = (item, index) => {
  onClick(item, index)
  emits('click', { item, index })
}

const onTransitionEnd = async (e) => {
  const changed = await onTrackTransitionEnd(e)
  if (!changed) return

  emits('changed', {
    item: props.items[activeIndex.value],
    index: activeIndex.value,
  })
}
</script>

<template>
  <div class="m-tab --oval-responsiv" :class="setClass.main">
    <div class="m-tab-header" :class="setClass.header">
      <ul class="m-tab-header-items" :class="setClass.headerItems">
        <li
          class="m-tab-header-item"
          :class="setClass.headerItem"
          v-for="(item, index) in props.items"
          :key="`tab_header_${item[config.schema.id]}_${index}`"
        >
          <component
            :is="onHeaderAs(item)"
            class="m-tab-anchor"
            :class="[
              {
                '--active': index === activeIndex,
              },
              setClass.anchor,
            ]"
            v-bind="onHeaderBind(item)"
            @click="onAnchorClick(item, index)"
          >
            <CommonSvgIcon :icon="item.icon" class="m-tab-icon" />
            <slot name="anchor" :item="item" :index="index">
              <em class="m-tab-anchor-label">{{ item[config.schema.label] }}</em>
            </slot>
          </component>
        </li>
      </ul>
      <slot name="headerTools" />
    </div>
    <div class="m-tab-body" :class="setClass.body">
      <div class="m-table-body-content">
        <!-- 單一區塊 -->
        <ul class="m-tab-body-items" v-if="config.containerMode === 'single'">
          <li class="m-tab-body-item">
            <slot />
          </li>
        </ul>
        <!-- 多個區塊 -->
        <ul
          class="m-tab-body-items"
          :class="[animating, direction]"
          @transitionend="onTransitionEnd"
          v-if="config.containerMode === 'multiple'"
        >
          <template v-for="(item, index) in props.items" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item"
              v-if="!item.href && (index === activeIndex || (isShowItem && index === prevIndex))"
            >
              <slot :name="`content_${index}`" :index="index" />
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="postcss"></style>
