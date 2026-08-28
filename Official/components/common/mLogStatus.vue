<script setup>
import '@css/_modules/common/mLogStatus/variables.css'
import '@css/_modules/common/mLogStatus/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const memberProject = useMemberProjectStore()
const { userData } = storeToRefs(memberProject)

const emits = defineEmits(['login', 'logout'])
const logout = readonly([
  {
    id: 'login',
    icon: 'icon_account',
    value: '登入',
    onClick: onLogin,
  },
  {
    id: 'register',
    value: '註冊',
  },
])

const login = computed(() => {
  const { firstName, lastName } = userData.value

  return [
    {
      id: 'account',
      icon: 'icon_account',
      value: `${firstName}${lastName}`,
      onClick: onLogout,
    },
    {
      id: 'logout',
      value: '登出',
    },
  ]
})

const isDeviceM = computed(() => device.value === 'm')
const items = computed(() => (userData.value ? login.value : logout))

function onLogin() {
  emits('login')
}

function onLogout() {
  emits('logout')
}

const onBind = (item) => {
  const { onClick } = item

  return onClick
    ? {
        onClick,
      }
    : {}
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <ul class="m-log-status">
    <li
      class="m-log-status-item"
      v-for="(item, index) in items"
      :key="`${item.id}_${index}`"
    >
      <CommonMAnchor
        :text="item.value"
        :config="
          item.icon && !isDeviceM
            ? {
                icon: {
                  name: item.icon,
                  position: 'left',
                },
              }
            : {}
        "
        :setClass="{
          main: 'm:--px-20 m:--py-15 m:w-full pt:gap-x-[3px]',
          text: 'leading-[1.64] m:text-[18px] pt:text-[14px]',
          icon: 'h-[18px] w-[18px] p-[1px]',
        }"
        v-bind="onBind(item)"
      />
    </li>
  </ul>
</template>
