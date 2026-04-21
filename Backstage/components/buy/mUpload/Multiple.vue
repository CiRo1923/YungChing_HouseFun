<script setup>
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import '@js/_validation.js'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { validate as validateValue, Field, ErrorMessage } from 'vee-validate'

const model = defineModel({
  type: Array,
  default: () => [],
})

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  rules: {
    type: [String, Object, Function],
    default: undefined,
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

const emit = defineEmits(['uploaded'])

const inputRef = ref(null)
const innerList = ref([])
const sortItemRefs = ref({})
const sortItemRects = ref({})
const lastEmittedModelValue = ref(null)
const hasMaxSizeError = ref(false)
const hasAcceptError = ref(false)
const hasMaxCountError = ref(false)
const fieldValidate = ref(() => Promise.resolve())

const isUploadDragging = ref(false)
const dragItemIndex = ref(null)
const sortTargetIndex = ref(null)
const isSortDropCommitted = ref(false)
const disableSortMotion = ref(false)
const activePointerId = ref(null)

const config = computed(() => ({
  placeholder: null,
  maxSizeMB: 5,
  maxCount: null,
  draggableSort: true,
  draggableUpload: true,
  accept: 'image/*',
  mode: 'multiple',
  ...props.config,
}))

const placeholder = computed(() => {
  const { placeholder } = config.value
  const isString = typeof placeholder === 'string'

  return {
    default: isString ? placeholder : placeholder?.default,
    hasImages: isString ? placeholder : placeholder?.hasImages,
  }
})

const hasImages = computed(() => innerList.value.length > 0)
const isSingleMode = computed(() => config.value.mode === 'single')

const setClass = computed(() => ({
  main: '',
  error: '',
  ...props.setClass,
}))

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
const fallbackName = 'upload-drag'
const name = computed(() => props.name || fallbackName)
const customRuleKeys = ['maxSize', 'accept', 'maxCount']
const replaceConfigParams = (message, source = config.value) => {
  if (typeof message !== 'string') return message

  return message.replace(/{\s*([^}]+)\s*}/g, (match, key) => {
    const value = source[key.trim()]

    return value == null ? match : String(value)
  })
}

const mapRuleMessages = (target) => {
  if (Array.isArray(target)) {
    return target.map(mapRuleMessages)
  }

  if (!target || typeof target !== 'object') return target

  return Object.entries(target).reduce((result, [key, value]) => {
    result[key] =
      key === 'errorMessage' || key === 'message'
        ? replaceConfigParams(value)
        : mapRuleMessages(value)

    return result
  }, {})
}

const normalizeRuleConfig = (rule, fallbackMessage) => {
  if (typeof rule === 'string') {
    return {
      errorMessage: replaceConfigParams(rule),
    }
  }

  if (Array.isArray(rule)) {
    return {
      errorMessage: replaceConfigParams(rule[0]),
      value: rule[1],
    }
  }

  if (rule && typeof rule === 'object') {
    return {
      ...rule,
      errorMessage: replaceConfigParams(rule.errorMessage || rule.message),
    }
  }

  return {
    errorMessage: fallbackMessage,
  }
}

const getNormalizedRules = () => {
  if (!props.rules || typeof props.rules !== 'object' || Array.isArray(props.rules)) {
    return null
  }

  return mapRuleMessages(props.rules)
}

const getCustomRuleMessage = (ruleName, fallbackMessage) => {
  const normalizedRules = getNormalizedRules()
  const rule = normalizedRules?.[ruleName]

  return normalizeRuleConfig(rule, fallbackMessage).errorMessage
}

const rules = computed(() => {
  const baseRules =
    props.rules && typeof props.rules === 'object' && !Array.isArray(props.rules)
      ? Object.entries(mapRuleMessages(props.rules)).reduce((result, [key, value]) => {
          if (!customRuleKeys.includes(key)) {
            result[key] = value
          }

          return result
        }, {})
      : props.rules

  return async (value, ctx) => {
    if (hasAcceptRule.value && hasAcceptError.value) {
      return getCustomRuleMessage('accept', '檔案格式不符合限制')
    }

    if (hasMaxSizeRule.value && hasMaxSizeError.value) {
      return getCustomRuleMessage('maxSize', '檔案大小超過限制')
    }

    if (hasMaxCountRule.value && hasMaxCountError.value) {
      return getCustomRuleMessage('maxCount', '上傳數量超過限制')
    }

    if (
      !baseRules ||
      (typeof baseRules === 'object' && !Array.isArray(baseRules) && !Object.keys(baseRules).length)
    ) {
      return true
    }

    const result = await validateValue(value, baseRules, {
      name: ctx.name,
      values: ctx.form,
    })

    return result.valid ? true : result.errors
  }
})
const hasAcceptRule = computed(() => {
  return Boolean(config.value.accept)
})

const hasMaxSizeRule = computed(() => {
  return config.value.maxSizeMB != null && config.value.maxSizeMB !== ''
})

const hasMaxCountRule = computed(() => {
  return config.value.maxCount != null && config.value.maxCount !== ''
})

const bindFieldContext = (validate) => {
  fieldValidate.value = validate

  return ''
}

const isObjectUrl = (url) => typeof url === 'string' && url.startsWith('blob:')

const getPreviewUrl = (item) => {
  if (!item) return null
  if (typeof item === 'string') return item
  if (item instanceof File) return URL.createObjectURL(item)

  return (
    item.url ||
    item.imageUrl ||
    item.imgUrl ||
    item.pictureUrl ||
    item.photoUrl ||
    item.src ||
    item.path ||
    null
  )
}

const openFileDialog = () => {
  inputRef.value?.click()
}

const getAcceptList = () => {
  const accept = config.value.accept

  if (!accept) return []

  return accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const fileMatchesAccept = (file) => {
  const acceptList = getAcceptList()

  if (!acceptList.length) return true

  const fileName = file.name.toLowerCase()
  const fileType = (file.type || '').toLowerCase()

  return acceptList.some((rule) => {
    if (rule.startsWith('.')) {
      return fileName.endsWith(rule)
    }

    if (rule.endsWith('/*')) {
      const baseType = rule.slice(0, -1)
      return fileType.startsWith(baseType)
    }

    return fileType === rule
  })
}

const validateFileSize = (file) => {
  const maxBytes = config.value.maxSizeMB * 1024 * 1024
  return file.size <= maxBytes
}

const isWithinMaxCount = (count) => {
  const { maxCount } = config.value

  if (maxCount == null || maxCount === '') return true

  return count <= Number(maxCount)
}

const hasFilesInDrag = (event) => {
  const dataTransfer = event.dataTransfer
  const types = Array.from(dataTransfer?.types || [])

  return Boolean(
    dataTransfer?.files?.length ||
    types.includes('Files') ||
    types.includes('application/x-moz-file')
  )
}

const normalizeFiles = (files) => {
  let oversized = false
  let invalidAccept = false

  const imageFiles = files.filter((file) => {
    const isImage = file.type.startsWith('image/')
    const isAccepted = hasAcceptRule.value ? fileMatchesAccept(file) : true
    const isValidSize = hasMaxSizeRule.value ? validateFileSize(file) : true
    const isValid = isImage && isAccepted && isValidSize

    if (hasAcceptRule.value && !isAccepted) {
      invalidAccept = true
    }

    if (hasMaxSizeRule.value && isImage && isAccepted && !isValidSize) {
      oversized = true
    }

    return isValid
  })

  return {
    hasAcceptError: invalidAccept,
    hasOversizedFile: oversized,
    items: imageFiles.map((file) => ({
      id: createId(),
      file,
      url: URL.createObjectURL(file),
      checked: false,
      responseData: null,
      isObjectUrl: true,
    })),
  }
}

const revokeItems = (items) => {
  items.forEach((item) => {
    if (item?.url && item.isObjectUrl) {
      URL.revokeObjectURL(item.url)
    }
  })
}

const getInnerItemValue = (item) => item.responseData ?? item.file ?? null

const isSameValueItem = (innerItem, modelItem) => getInnerItemValue(innerItem) === modelItem

const createInnerItemFromModel = (item, checked = true) => {
  const url = getPreviewUrl(item)

  return {
    id: createId(),
    file: item instanceof File ? item : null,
    url,
    checked,
    responseData: item instanceof File ? null : item,
    isObjectUrl: isObjectUrl(url),
  }
}

const syncInnerListCheckedFromModel = (items) => {
  const sourceItems = Array.isArray(items) ? items : []
  const nextInnerList = innerList.value.map((item) => ({
    ...item,
    checked: sourceItems.some((sourceItem) => isSameValueItem(item, sourceItem)),
  }))

  const missingItems = sourceItems
    .filter((sourceItem) => !nextInnerList.some((item) => isSameValueItem(item, sourceItem)))
    .map((sourceItem) => createInnerItemFromModel(sourceItem, true))
    .filter((item) => Boolean(item.url || item.file || item.responseData))

  const mergedInnerList = [...nextInnerList, ...missingItems]
  const hasChanged =
    mergedInnerList.length !== innerList.value.length ||
    mergedInnerList.some((item, index) => {
      const currentItem = innerList.value[index]

      if (!currentItem) return true

      return item.checked !== currentItem.checked || getInnerItemValue(item) !== getInnerItemValue(currentItem)
    })

  if (!hasChanged) return

  innerList.value = mergedInnerList
}

const updateModelValue = async (handleChange, validateField = fieldValidate.value) => {
  const checkedList = innerList.value
    .filter((item) => item.checked)
    .map((item) => item.responseData ?? item.file)

  lastEmittedModelValue.value = checkedList
  model.value = checkedList
  handleChange(checkedList)

  await nextTick()
  await validateField?.()
}

const onUploaded = (items, handleChange, validateField) => {
  let handled = false

  const done = async (responseList) => {
    handled = true

    if (!Array.isArray(responseList)) return

    items.forEach((item, index) => {
      item.responseData = responseList[index] ?? null
    })

    innerList.value = [...innerList.value]
    await updateModelValue(handleChange, validateField)
  }

  emit('uploaded', items, done)

  Promise.resolve().then(async () => {
    if (!handled) {
      await updateModelValue(handleChange, validateField)
    }
  })
}

const onAppendFiles = async (files, handleChange, validate) => {
  const {
    hasAcceptError: nextAcceptError,
    hasOversizedFile,
    items: normalizedFiles,
  } = normalizeFiles(files)

  hasAcceptError.value = hasAcceptRule.value ? nextAcceptError : false
  hasMaxSizeError.value = hasMaxSizeRule.value ? hasOversizedFile : false

  const newItems = isSingleMode.value ? normalizedFiles.slice(-1) : normalizedFiles
  const nextCount = isSingleMode.value ? newItems.length : innerList.value.length + newItems.length

  hasMaxCountError.value = hasMaxCountRule.value ? !isWithinMaxCount(nextCount) : false

  if (!newItems.length) {
    await nextTick()
    await validate()
    return
  }

  if (hasMaxCountError.value) {
    await nextTick()
    await validate()
    return
  }

  if (isSingleMode.value) {
    revokeItems(innerList.value)
    innerList.value = newItems
  } else {
    innerList.value = [...innerList.value, ...newItems]
  }

  onUploaded(newItems, handleChange, validate)
}

const onFileChange = async (event, handleChange, validate) => {
  const files = Array.from(event.target.files || [])
  await onAppendFiles(files, handleChange, validate)
  event.target.value = ''
}

const onUploadDragEnter = (event) => {
  if (!config.value.draggableUpload) return
  if (dragItemIndex.value !== null) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  isUploadDragging.value = true
}

const onUploadDragOver = (event) => {
  if (!config.value.draggableUpload) return
  if (dragItemIndex.value !== null) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isUploadDragging.value = true
}

const onUploadDragLeave = (event) => {
  if (!config.value.draggableUpload) return
  if (dragItemIndex.value !== null) return
  if (!hasFilesInDrag(event)) return

  const currentTarget = event.currentTarget
  const relatedTarget = event.relatedTarget

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) return

  isUploadDragging.value = false
}

const onUploadDrop = async (event, handleChange, validate) => {
  if (!config.value.draggableUpload) return
  if (dragItemIndex.value !== null) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  isUploadDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  await onAppendFiles(files, handleChange, validate)
}

const onRemoveItem = async (index, handleChange) => {
  const target = innerList.value[index]

  if (target?.url && target.isObjectUrl) {
    URL.revokeObjectURL(target.url)
  }

  innerList.value.splice(index, 1)
  innerList.value = [...innerList.value]
  await updateModelValue(handleChange)
}

const onCheckItemChange = async (event, item, handleChange) => {
  item.checked = event.target.checked
  await updateModelValue(handleChange)
}

const resetSortState = () => {
  dragItemIndex.value = null
  sortTargetIndex.value = null
  isSortDropCommitted.value = false
  sortItemRects.value = {}
  activePointerId.value = null
}

const previewOrder = computed(() => {
  const indices = innerList.value.map((_, index) => index)

  if (dragItemIndex.value === null || sortTargetIndex.value === null) return indices
  if (dragItemIndex.value === sortTargetIndex.value) return indices

  const next = [...indices]
  const [draggedIndex] = next.splice(dragItemIndex.value, 1)
  next.splice(sortTargetIndex.value, 0, draggedIndex)

  return next
})

const previewIndexMap = computed(() => {
  return previewOrder.value.reduce((result, originalIndex, previewIndex) => {
    result[originalIndex] = previewIndex

    return result
  }, {})
})

const draggedPreviewItem = computed(() => {
  if (dragItemIndex.value === null || sortTargetIndex.value === null) return null
  if (dragItemIndex.value === sortTargetIndex.value) return null

  return innerList.value[dragItemIndex.value] ?? null
})

const shouldShowDraggedPreviewAt = (index) => {
  if (disableSortMotion.value) return false
  if (dragItemIndex.value === null || sortTargetIndex.value === null) return false
  if (dragItemIndex.value === sortTargetIndex.value) return false

  return sortTargetIndex.value === index
}

const setSortItemRef = (itemId, element) => {
  if (!element) {
    const nextRefs = { ...sortItemRefs.value }
    Reflect.deleteProperty(nextRefs, itemId)
    sortItemRefs.value = nextRefs
    return
  }

  sortItemRefs.value[itemId] = element
}

const captureSortItemRects = () => {
  sortItemRects.value = innerList.value.reduce((result, item) => {
    const element = sortItemRefs.value[item.id]

    if (element) {
      result[item.id] = element.getBoundingClientRect()
    }

    return result
  }, {})
}

const getSortIndexFromPointer = (event) => {
  const { clientX, clientY } = event

  const matchedIndex = innerList.value.findIndex((item) => {
    const rect = sortItemRects.value[item.id]

    if (!rect) return false

    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    )
  })

  if (matchedIndex !== -1) return matchedIndex

  return innerList.value.reduce(
    (closestIndex, item, index) => {
      const rect = sortItemRects.value[item.id]

      if (!rect) return closestIndex

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.hypot(clientX - centerX, clientY - centerY)

      if (distance < closestIndex.distance) {
        return {
          distance,
          index,
        }
      }

      return closestIndex
    },
    {
      distance: Number.POSITIVE_INFINITY,
      index: dragItemIndex.value ?? 0,
    }
  ).index
}

const getSortPreviewStyle = (index) => {
  if (disableSortMotion.value) return null
  if (dragItemIndex.value === null || sortTargetIndex.value === null) return null

  const itemId = innerList.value[index]?.id
  const currentRect = sortItemRects.value[itemId]
  const previewSlotIndex = previewIndexMap.value[index]
  const previewSlotItemId = innerList.value[previewSlotIndex]?.id
  const previewRect = sortItemRects.value[previewSlotItemId]

  if (!currentRect || !previewRect) return null

  const style = {
    transform: `translate(${previewRect.left - currentRect.left}px, ${previewRect.top - currentRect.top}px)`,
    transition: 'transform 0.22s ease, opacity 0.22s ease',
  }

  if (index === dragItemIndex.value) {
    return {
      opacity: 0.3,
      zIndex: 2,
    }
  }

  return {
    ...style,
    zIndex: 1,
  }
}

const onSortDragStart = (event, index) => {
  if (!config.value.draggableSort) return

  dragItemIndex.value = index
  sortTargetIndex.value = index
  isSortDropCommitted.value = false
  isUploadDragging.value = false
  captureSortItemRects()

  event.dataTransfer?.setData('text/plain', innerList.value[index]?.id ?? String(index))
  event.dataTransfer.effectAllowed = 'move'

  const img = new Image()
  img.src =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>')
  event.dataTransfer?.setDragImage(img, 0, 0)
}

const onSortPointerDown = (event, index) => {
  if (!config.value.draggableSort) return
  if (event.pointerType === 'mouse') return

  activePointerId.value = event.pointerId
  dragItemIndex.value = index
  sortTargetIndex.value = index
  isSortDropCommitted.value = false
  isUploadDragging.value = false
  captureSortItemRects()

  event.currentTarget?.setPointerCapture?.(event.pointerId)
  event.preventDefault()
}

const onSortDragOverItem = (event) => {
  if (!config.value.draggableSort) return
  if (dragItemIndex.value === null) return
  if (hasFilesInDrag(event)) return

  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'move'

  const nextTargetIndex = getSortIndexFromPointer(event)

  if (nextTargetIndex === sortTargetIndex.value) return

  sortTargetIndex.value = nextTargetIndex
}

const onSortPointerMove = (event) => {
  if (!config.value.draggableSort) return
  if (activePointerId.value !== event.pointerId) return
  if (dragItemIndex.value === null) return

  event.preventDefault()

  const nextTargetIndex = getSortIndexFromPointer(event)

  if (nextTargetIndex === sortTargetIndex.value) return

  sortTargetIndex.value = nextTargetIndex
}

const commitSortOrder = async (handleChange) => {
  if (dragItemIndex.value === null || sortTargetIndex.value === null) {
    resetSortState()
    return
  }

  if (dragItemIndex.value === sortTargetIndex.value) {
    resetSortState()
    return
  }

  const draggedIndex = dragItemIndex.value
  const targetIndex = sortTargetIndex.value
  const next = [...innerList.value]
  const [draggedItem] = next.splice(draggedIndex, 1)

  disableSortMotion.value = true
  resetSortState()
  await nextTick()
  next.splice(targetIndex, 0, draggedItem)
  innerList.value = next
  await updateModelValue(handleChange)
  await nextTick()
  disableSortMotion.value = false
}

const onSortPointerUp = async (event, handleChange) => {
  if (activePointerId.value !== event.pointerId) return
  if (dragItemIndex.value === null) {
    resetSortState()
    return
  }

  event.currentTarget?.releasePointerCapture?.(event.pointerId)
  isSortDropCommitted.value = true
  await commitSortOrder(handleChange)
}

const onSortPointerCancel = (event) => {
  if (activePointerId.value !== event.pointerId) return

  event.currentTarget?.releasePointerCapture?.(event.pointerId)
  resetSortState()
}

const onSortDropItem = async (event, index, handleChange) => {
  if (!config.value.draggableSort) return
  if (dragItemIndex.value === null) return
  if (hasFilesInDrag(event)) return

  event.preventDefault()
  event.stopPropagation()
  sortTargetIndex.value = index
  isSortDropCommitted.value = true
  await commitSortOrder(handleChange)
}

const onSortDragOverAppend = (event) => {
  if (!config.value.draggableSort) return
  if (dragItemIndex.value === null) return
  if (hasFilesInDrag(event)) return

  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'move'

  const lastIndex = innerList.value.length - 1
  if (dragItemIndex.value !== lastIndex) {
    sortTargetIndex.value = lastIndex
  }
}

const onAppendButtonDragOver = (event) => {
  if (hasFilesInDrag(event)) {
    event.stopPropagation()
    onUploadDragOver(event)
    return
  }

  onSortDragOverAppend(event)
}

const onSortDropAppend = async (event, handleChange) => {
  if (!config.value.draggableSort) return
  if (dragItemIndex.value === null) return
  if (hasFilesInDrag(event)) return

  event.preventDefault()
  event.stopPropagation()
  sortTargetIndex.value = innerList.value.length - 1
  isSortDropCommitted.value = true
  await commitSortOrder(handleChange)
}

const onAppendButtonDrop = async (event, handleChange, validate) => {
  if (hasFilesInDrag(event)) {
    event.stopPropagation()
    await onUploadDrop(event, handleChange, validate)
    return
  }

  await onSortDropAppend(event, handleChange)
}

const onSortDragEnd = async () => {
  if (dragItemIndex.value === null) {
    resetSortState()
    return
  }

  if (isSortDropCommitted.value) {
    resetSortState()
    return
  }

  resetSortState()
}

onBeforeUnmount(() => {
  innerList.value.forEach((item) => {
    if (item.url && item.isObjectUrl) URL.revokeObjectURL(item.url)
  })
})

watch(
  model,
  (items) => {
    if (items === lastEmittedModelValue.value) {
      lastEmittedModelValue.value = null
      return
    }

    syncInnerListCheckedFromModel(items)
  },
  {
    immediate: true,
  }
)

watch(
  () => innerList.value.length,
  (length) => {
    hasMaxCountError.value = hasMaxCountRule.value ? !isWithinMaxCount(length) : false
  },
  {
    immediate: true,
  }
)

watch(
  () => [config.value.maxSizeMB, config.value.accept, config.value.maxCount],
  () => {
    fieldValidate.value?.()
  }
)
</script>

<template>
  <Field :name="name" :rules="rules" v-model="model" v-slot="{ field, handleChange, validate }">
    <div
      class="m-upload --drag w-full"
      :class="setClass.main"
      @dragenter="onUploadDragEnter"
      @dragover="onUploadDragOver"
      @dragleave="onUploadDragLeave"
      @drop="(event) => onUploadDrop(event, handleChange, validate)"
    >
      <input
        v-bind="field"
        :value="undefined"
        type="hidden"
        :data-field-bind="bindFieldContext(validate)"
      />

      <input
        ref="inputRef"
        :name="name"
        type="file"
        class="hidden"
        :accept="config.accept"
        :multiple="!isSingleMode"
        @change="(event) => onFileChange(event, handleChange, validate)"
      />

      <div class="grid gap-x-[10px] gap-y-[16px] m:grid-cols-2 t:grid-cols-3 p:grid-cols-4">
        <div
          v-for="(item, index) in innerList"
          :key="item.id"
          class="cursor-move touch-none"
          :ref="(element) => setSortItemRef(item.id, element)"
          :draggable="config.draggableSort"
          @dragstart="onSortDragStart($event, index)"
          @dragover="onSortDragOverItem($event)"
          @drop="(event) => onSortDropItem(event, index, handleChange)"
          @dragend="() => onSortDragEnd(handleChange)"
          @pointerdown="onSortPointerDown($event, index)"
          @pointermove="onSortPointerMove($event)"
          @pointerup="(event) => onSortPointerUp(event, handleChange)"
          @pointercancel="onSortPointerCancel($event)"
        >
          <div class="relative m:w-[150px] p:w-[200px]">
            <div
              v-if="draggedPreviewItem && shouldShowDraggedPreviewAt(index)"
              class="pointer-events-none absolute inset-x-0 top-0 z-[2]"
            >
              <div class="relative opacity-30">
                <div class="relative overflow-hidden rounded-[5px] m:h-[114px] p:h-[152px]">
                  <img
                    :src="draggedPreviewItem.url"
                    alt=""
                    class="h-full w-full object-cover"
                    draggable="false"
                  />

                  <button
                    type="button"
                    class="absolute right-0 top-0 z-[1] flex h-[24px] w-[24px] items-center justify-center rounded-[5px] bg-[--gray-f2]"
                    tabindex="-1"
                  >
                    <CommonSvgIcon icon="icon_xmark" class="h-[10px] w-[10px] text-[--gray-666]" />
                  </button>
                </div>

                <label class="flex items-center justify-center p:mt-[6px]">
                  <input
                    type="checkbox"
                    class="m-upload-checkbox sr-only"
                    :checked="draggedPreviewItem.checked"
                    tabindex="-1"
                  />
                  <CommonSvgIcon
                    icon="icon_check_solid"
                    class="m-upload-checkbox-icon relative mt-[2px] h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] p-[1px] text-[--orange-e646] transition-colors duration-300"
                    :class="setClass.icon"
                  />
                </label>
              </div>
            </div>

            <div class="relative" :style="getSortPreviewStyle(index)">
              <div
                class="relative overflow-hidden rounded-[5px] m:h-[114px] p:h-[152px]"
                :class="{
                  'pointer-events-none': dragItemIndex !== null,
                }"
              >
                <img :src="item.url" alt="" class="h-full w-full object-cover" draggable="false" />

                <button
                  type="button"
                  class="absolute right-0 top-0 z-[1] flex h-[24px] w-[24px] items-center justify-center rounded-[5px] bg-[--gray-f2]"
                  @click.stop="onRemoveItem(index, handleChange)"
                >
                  <CommonSvgIcon icon="icon_xmark" class="h-[10px] w-[10px] text-[--gray-666]" />
                </button>
              </div>

              <label class="flex items-center justify-center p:mt-[6px]">
                <input
                  type="checkbox"
                  class="m-upload-checkbox sr-only"
                  :checked="item.checked"
                  @change="(event) => onCheckItemChange(event, item, handleChange)"
                />
                <CommonSvgIcon
                  icon="icon_check_solid"
                  class="m-upload-checkbox-icon relative mt-[2px] h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] p-[1px] text-[--orange-e646] transition-colors duration-300"
                  :class="setClass.icon"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          key="append-button"
          type="button"
          class="flex items-center justify-center rounded-[10px] border-[1px] border-[--gray-e5] bg-[--gray-f7]"
          :class="{
            'w-full m:col-span-2 t:col-span-3 p:col-span-4 p:min-h-[130px]': !hasImages,
            'text-sm p:h-[152px] p:w-[200px]': hasImages,
            'border-blue-400 bg-blue-50': isUploadDragging,
          }"
          @click="openFileDialog"
          @dragover="onAppendButtonDragOver"
          @drop="(event) => onAppendButtonDrop(event, handleChange, validate)"
        >
          <div
            class="flex h-full flex-col items-center justify-center text-[--green-6a2d] p:gap-y-[10px] p:text-[16px]"
          >
            <CommonSvgIcon
              class="h-[24px] w-[24px] shrink-0 text-[--gray-666]"
              :icon="hasImages ? 'icon_plus_circle' : 'icon_upload'"
            />
            <span>{{ hasImages ? placeholder.hasImages : placeholder.default }}</span>
          </div>
        </button>
      </div>
    </div>
  </Field>
  <ErrorMessage
    :name="name"
    as="span"
    class="m-upload-error"
    :class="setClass.error"
    v-slot="{ message }"
  >
    <ErrorMessageElem :message="message" />
  </ErrorMessage>
</template>

<style lang="postcss">
.m-upload-checkbox {
  &:not(:checked) {
    & + .m-upload-checkbox-icon {
      @apply border-[--gray-ccce];
    }
  }

  &:checked {
    & + .m-upload-checkbox-icon {
      @apply border-transparent;

      > use {
        @apply opacity-100;
      }
    }
  }
}
.m-upload-checkbox-icon {
  > use {
    @apply opacity-0 transition-opacity duration-300;
  }
}

.m-upload-drag-preview {
  transition: transform 0.22s ease;
}
</style>
