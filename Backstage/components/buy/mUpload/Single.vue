<script setup>
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import '@js/_validation.js'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { validate as validateValue, Field, ErrorMessage } from 'vee-validate'

const emit = defineEmits(['uploaded'])
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
const model = defineModel({
  type: [Object, String, File],
  default: null,
})

const FALLBACK_NAME = 'upload-single'
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const inputRef = ref(null)
const innerItem = ref(null)
const lastEmittedModelValue = ref(null)
const hasMaxSizeError = ref(false)
const hasAcceptError = ref(false)
const fieldValidate = ref(() => Promise.resolve())
const isUploadDragging = ref(false)

const config = computed(() => ({
  placeholder: '請上傳圖片',
  maxSizeMB: 5,
  draggableUpload: true,
  accept: 'image/*',
  isDisabled: false,
  ...props.config,
}))

const setClass = computed(() => ({
  main: '',
  error: '',
  ...props.setClass,
}))

const hasImage = computed(() => Boolean(innerItem.value?.previewUrl))
const name = computed(() => props.name || FALLBACK_NAME)
const customRuleKeys = ['maxSize', 'accept']

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

const hasAcceptRule = computed(() => {
  return Boolean(config.value.accept)
})

const hasMaxSizeRule = computed(() => {
  return config.value.maxSizeMB != null && config.value.maxSizeMB !== ''
})

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

const revokeItem = (item) => {
  if (item?.previewUrl && item.isObjectUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
}

const createInnerItemFromFile = (file) => ({
  id: createId(),
  file,
  previewUrl: URL.createObjectURL(file),
  responseData: null,
  isObjectUrl: true,
  preservePreview: true,
})

const createInnerItemFromModel = (item) => {
  const previewUrl = getPreviewUrl(item)

  return {
    id: createId(),
    file: item instanceof File ? item : null,
    previewUrl,
    responseData: item instanceof File ? null : item,
    isObjectUrl: isObjectUrl(previewUrl),
    preservePreview: false,
  }
}

const getModelValue = (item) => item?.responseData ?? item?.file ?? null

const syncInnerItemFromModel = (value) => {
  if (!value) {
    revokeItem(innerItem.value)
    innerItem.value = null
    return
  }

  if (getModelValue(innerItem.value) === value) return

  const preservedPreviewUrl = innerItem.value?.preservePreview ? innerItem.value.previewUrl : null
  const nextItem = createInnerItemFromModel(value)

  revokeItem(innerItem.value)

  if (preservedPreviewUrl) {
    nextItem.previewUrl = preservedPreviewUrl
    nextItem.isObjectUrl = true
    nextItem.preservePreview = true
  }

  innerItem.value = nextItem
}

const openFileDialog = () => {
  if (config.value.isDisabled) return

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

const hasFilesInDrag = (event) => {
  const dataTransfer = event.dataTransfer
  const types = Array.from(dataTransfer?.types || [])

  return Boolean(
    dataTransfer?.files?.length ||
    types.includes('Files') ||
    types.includes('application/x-moz-file')
  )
}

const normalizeFile = (file) => {
  const isImage = file.type.startsWith('image/')
  const isAccepted = hasAcceptRule.value ? fileMatchesAccept(file) : true
  const isValidSize = hasMaxSizeRule.value ? validateFileSize(file) : true
  const isValid = isImage && isAccepted && isValidSize

  return {
    hasAcceptError: !isAccepted,
    hasMaxSizeError: isImage && isAccepted && !isValidSize,
    item: isValid ? createInnerItemFromFile(file) : null,
  }
}

const updateModelValue = async (handleChange, validateField = fieldValidate.value) => {
  const nextValue = getModelValue(innerItem.value)

  lastEmittedModelValue.value = nextValue
  model.value = nextValue
  handleChange(nextValue)

  await nextTick()
  await validateField?.()
}

const onUploaded = (items, handleChange, validateField) => {
  let handled = false

  const done = async (responseList) => {
    handled = true

    const normalizedResponseList = Array.isArray(responseList) ? responseList : [responseList]

    items.forEach((item, index) => {
      item.responseData = normalizedResponseList[index] ?? null
    })

    innerItem.value = { ...items[0] }
    await updateModelValue(handleChange, validateField)
  }

  emit('uploaded', items, done)

  Promise.resolve().then(async () => {
    if (!handled) {
      await updateModelValue(handleChange, validateField)
    }
  })
}

const onAppendFile = async (file, handleChange, validate) => {
  if (!file || config.value.isDisabled) return

  const {
    hasAcceptError: nextAcceptError,
    hasMaxSizeError: nextMaxSizeError,
    item,
  } = normalizeFile(file)

  hasAcceptError.value = hasAcceptRule.value ? nextAcceptError : false
  hasMaxSizeError.value = hasMaxSizeRule.value ? nextMaxSizeError : false

  if (!item) {
    await nextTick()
    await validate()
    return
  }

  revokeItem(innerItem.value)
  innerItem.value = item

  onUploaded([item], handleChange, validate)
}

const onFileChange = async (event, handleChange, validate) => {
  const file = event.target.files?.[0]

  if (file) {
    await onAppendFile(file, handleChange, validate)
  } else {
    await nextTick()
    await validate()
  }

  event.target.value = ''
}

const onUploadDragEnter = (event) => {
  if (!config.value.draggableUpload || config.value.isDisabled) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  isUploadDragging.value = true
}

const onUploadDragOver = (event) => {
  if (!config.value.draggableUpload || config.value.isDisabled) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isUploadDragging.value = true
}

const onUploadDragLeave = (event) => {
  if (!config.value.draggableUpload || config.value.isDisabled) return
  if (!hasFilesInDrag(event)) return

  const currentTarget = event.currentTarget
  const relatedTarget = event.relatedTarget

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) return

  isUploadDragging.value = false
}

const onUploadDrop = async (event, handleChange, validate) => {
  if (!config.value.draggableUpload || config.value.isDisabled) return
  if (!hasFilesInDrag(event)) return

  event.preventDefault()
  isUploadDragging.value = false

  const file = event.dataTransfer?.files?.[0]

  if (file) {
    await onAppendFile(file, handleChange, validate)
    return
  }

  await nextTick()
  await validate()
}

const onRemoveImage = async (handleChange, validate) => {
  revokeItem(innerItem.value)
  innerItem.value = null
  hasAcceptError.value = false
  hasMaxSizeError.value = false
  await updateModelValue(handleChange, validate)
}

onBeforeUnmount(() => {
  revokeItem(innerItem.value)
})

watch(
  model,
  (value) => {
    if (value === lastEmittedModelValue.value) {
      lastEmittedModelValue.value = null
      return
    }

    syncInnerItemFromModel(value)
  },
  {
    immediate: true,
  }
)

watch(
  () => [config.value.maxSizeMB, config.value.accept],
  () => {
    fieldValidate.value?.()
  }
)
</script>

<template>
  <Field
    :name="name"
    :rules="config.isDisabled ? '' : rules"
    v-model="model"
    v-slot="{ field, handleChange, validate }"
  >
    <div class="m-upload-single w-full" :class="setClass.main">
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
        :disabled="config.isDisabled"
        @change="(event) => onFileChange(event, handleChange, validate)"
      />

      <button
        type="button"
        class="relative flex flex-col"
        :class="{
          'w-full p:min-h-[130px]': !hasImage,
          'border-blue-400 bg-blue-50': isUploadDragging,
        }"
        :disabled="config.isDisabled"
        @click="openFileDialog"
        @dragenter="onUploadDragEnter"
        @dragover="onUploadDragOver"
        @dragleave="onUploadDragLeave"
        @drop="(event) => onUploadDrop(event, handleChange, validate)"
      >
        <template v-if="hasImage">
          <div
            class="relative flex items-center justify-center overflow-hidden rounded-[10px] bg-[--gray-f7]"
            :class="{
              'h-full w-full': !hasImage,
              'p:h-[152px] p:w-[200px]': hasImage,
            }"
          >
            <img
              :src="innerItem.previewUrl"
              alt=""
              class="absolute inset-0 h-full w-full object-cover"
              draggable="false"
            />
            <div
              class="relative z-[1] flex flex-col items-center justify-center gap-y-[10px] text-[16px] text-white"
            >
              <CommonSvgIcon icon="icon_upload" class="h-[24px] w-[24px] shrink-0" />
              <span>點擊或拖曳重新上傳</span>
            </div>
          </div>

          <button
            type="button"
            class="absolute right-0 top-0 z-[1] flex h-[24px] w-[24px] items-center justify-center rounded-[5px] bg-[--gray-f2]"
            @click.stop="onRemoveImage(handleChange, validate)"
          >
            <CommonSvgIcon icon="icon_xmark" class="h-[12px] w-[12px] text-[--gray-666]" />
          </button>
        </template>

        <template v-else>
          <div
            class="flex w-full grow flex-col items-center justify-center gap-y-[10px] rounded-[10px] border-[1px] border-[--gray-e5] bg-[--gray-f7] text-[16px] text-[--green-6a2d]"
          >
            <CommonSvgIcon
              icon="icon_upload"
              class="h-[24px] w-[24px] shrink-0 text-[--gray-666]"
            />
            <span>{{ config.placeholder }}</span>
          </div>
        </template>
      </button>
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

<style lang="postcss"></style>
