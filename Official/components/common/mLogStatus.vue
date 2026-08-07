<script setup>
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

const items = computed(() => (userData.value ? login : logout))

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
</script>

<template>
  <ul class="m-log-status pt:flex pt:items-center pt:gap-x-[24px]">
    <li
      class="m-log-status-item relative leading-[0]"
      v-for="(item, index) in items"
      :key="`${item.id}_${index}`"
    >
      <CommonMAnchor
        :text="item.value"
        :config="
          item.icon
            ? {
                icon: {
                  name: item.icon,
                  position: 'left',
                },
              }
            : {}
        "
        :setClass="{
          main: 'gap-x-[3px]',
          text: 'text-[14px] leading-[1.64]',
          icon: 'h-[18px] w-[18px] p-[1px]',
        }"
        v-bind="onBind(item)"
      />
    </li>
  </ul>
</template>

<style lang="postcss">
@screen pt {
  .m-log-status-item {
    &:not(:last-child) {
      &:after {
        @apply pointer-events-none absolute right-[-12px] top-1/2 h-[55%] w-[1px] -translate-y-1/2 bg-[--gray-999] content-default;
      }
    }
  }
}
</style>
