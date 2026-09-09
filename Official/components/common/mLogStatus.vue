<script setup>
import '@css/_modules/common/mLogStatus/variables.css'
import '@css/_modules/common/mLogStatus/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const memberProject = useMemberAuthProjectStore()
const { userData } = storeToRefs(memberProject)

const emits = defineEmits(['login', 'logout'])
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

// 各狀態要出現哪幾項。'all' 是全部,也可以指定 id(單一字串或陣列)。
//   config.login  登入後可用的 id:account / logout
//   config.logout 未登入可用的 id:login / register
const config = computed(() => {
  return {
    login: 'all',
    logout: 'all',
    ...props.config,
  }
})

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

// 依 config 篩掉不要的項目。設定值不是 'all' 時當成 id 清單比對,
// 傳單一字串也吃(不必為了指定一項而寫成陣列)。
const onFilterItems = (items, setting) => {
  if (setting === 'all') return items

  const ids = Array.isArray(setting) ? setting : [setting]

  return items.filter((item) => ids.includes(item.id))
}

const items = computed(() =>
  userData.value
    ? onFilterItems(login.value, config.value.login)
    : onFilterItems(logout, config.value.logout)
)

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
    <li class="m-log-status-item" v-for="(item, index) in items" :key="`${item.id}_${index}`">
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
          main: 'm-log-status-anchor m:--px-20 m:--py-15',
          text: 'm-log-status-text',
          icon: 'm-log-status-icon',
        }"
        v-bind="onBind(item)"
      />
    </li>
  </ul>
</template>
