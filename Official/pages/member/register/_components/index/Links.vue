<script setup>
const memberRegister = useMemberRegisterStore()
</script>

<template>
  <ul class="tm:mt-[30px] tm:space-y-[15px] p:mt-[50px] p:space-y-[30px]">
    <li v-for="(item, index) in memberRegister.links" :key="`${item.id}_${index}`">
      <CommonMAnchor
        :to="{
          name: 'member-register-type',
          params: {
            type: item.id,
          },
        }"
        :setClass="{
          main: 'group w-full',
        }"
      >
        <div
          class="flex w-full flex-row-reverse items-center rounded-[15px] border-[1px] border-[--gray-ccce] py-[20px] transition-colors duration-300 group-hover:border-[--green-8b0d] group-hover:bg-[--gray-f7] group-hover:text-[--green-6a2d] tm:px-[15px] p:gap-x-[50px] p:px-[45px]"
        >
          <header class="grow text-left">
            <h3 class="tm:text-[24px] p:text-[30px]">
              <strong>
                {{ item.title }}
              </strong>
            </h3>
            <p class="tm:text-[16px] p:text-[18px]">{{ item.description }}</p>
          </header>
          <CommonImgSrc
            :src="item.image"
            alt=""
            :setClass="{
              main: 'h-[68px] w-[90px] shrink-0',
            }"
          />
        </div>
      </CommonMAnchor>
    </li>
  </ul>
</template>
