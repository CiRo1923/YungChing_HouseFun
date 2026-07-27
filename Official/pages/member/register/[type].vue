<script setup>
import { Form } from 'vee-validate'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGetCommonServerTime } = useProjectActions()
const {
  onApiGETCitySelectOptions,
  onApiGETDistrictSelectOptions,
  onApiGETBranchSelectOptions,
  onApiGETBranchStoreSelectOptions,
} = useManageActions()
const { onApiAuthRegisterVerificationCode, onApiAuthRegister, onTypeReset } =
  useMemberRegisterActions()
const memberRegister = useMemberRegisterStore()
const { type } = storeToRefs(memberRegister)
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

const memberType = computed(() => route.params.type)
const information = computed(() =>
  memberRegister.links.find((item) => item.id === memberType.value)
)

onUseMeta({
  title: `${information.value.title} - 會員中心 | 好房 HouseFun`,
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

const onVerifySubmit = async () => {
  await onApiGetCommonServerTime()
  await onApiAuthRegisterVerificationCode('member')
}

const onCityChange = async (cityId) => {
  await onApiGETDistrictSelectOptions(cityId)
}

const onWorkAreaChange = async ({ cityId, areaId }) => {
  await onApiGETBranchSelectOptions({
    cityCode: cityId,
    districtCode: areaId,
  })
}

const onBrandChange = async ({ cityId, areaId, brandId }) => {
  await onApiGETBranchStoreSelectOptions({
    cityCode: cityId,
    districtCode: areaId,
    branchID: brandId,
  })
}

const onSumit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  const { status } = await onApiAuthRegister('member')

  if (status === 200) {
    router.push({
      name: 'member-register-complete',
    })
  }
}

const onInit = () => {
  onTypeReset()
  type.value.apiData.memberType = memberType
}

await onWithLoadingAll([onApiGETCitySelectOptions()])

onInit()
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberRegisterHeader
      :title="information.title"
      :config="{
        description: information.description,
        image: information.image,
      }"
      :setClass="{
        main: 'justify-center',
        container: 'text-left',
      }"
    >
      <CommonMAnchor
        text="選擇其他身份註冊"
        :to="{
          name: 'member-register',
        }"
        :setClass="{
          main: 'underline',
          text: 'text-[14px]',
        }"
      />
    </PageMemberRegisterHeader>
    <Form as="div" class="mt-[30px] space-y-[15px]" v-slot="{ validate }">
      <PageMemberRegisterTypeGeneralForm
        @verifySubmit="onVerifySubmit"
        v-if="information.id === 'general'"
      />
      <PageMemberRegisterTypeLandlordForm
        @verifySubmit="onVerifySubmit"
        @cityChange="onCityChange"
        v-if="information.id === 'landlord'"
      />
      <PageMemberRegisterTypeAgentForm
        @verifySubmit="onVerifySubmit"
        @cityChange="onCityChange"
        @workAreaChange="onWorkAreaChange"
        @workBrandChange="onBrandChange"
        v-if="information.id === 'agent'"
      />
      <CommonMAnchor
        text="註冊"
        :setClass="{
          main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 w-full',
          text: 'text-[16px]',
        }"
        @click="onSumit(validate)"
      />
    </Form>
  </CommonMContainer>
</template>

<style lang="postcss"></style>
