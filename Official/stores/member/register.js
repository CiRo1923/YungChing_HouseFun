import { defineStore } from 'pinia'

export const useMemberRegisterStore = defineStore('memberRegister', () => {
  const apiTypeDefault = readonly({
    memberType: null,
    mobilePhone: null,
    password: null,
    confirmPassword: null,
    verificationToken: null,
    verificationCode: null,
    agreeTerms: false,
    lastName: null,
    firstName: null,
    email: null,
    identityNumber: null,
    cityId: null,
    districtId: null,
    roadId: null,
    address: null,
    fullAddress: null,
    workCityId: null,
    workDistrictId: null,
    brandId: null,
    storeId: null,
    companyName: null,
  })
  const type = ref({
    countdownData: {
      expires: null,
    },
    apiData: { ...{}, ...apiTypeDefault },
  })
  const links = readonly([
    {
      id: 'general',
      title: '一般會員',
      description: '買家 / 房客',
      image: 'member/register/common/icon_general.svg',
    },
    {
      id: 'landlord',
      title: '屋主 & 房東',
      description: '屋主 / 房東 / 代理人 / 包租代管',
      image: 'member/register/common/icon_landlord.svg',
    },
    {
      id: 'agent',
      title: '房仲從業人員',
      description: '營業員 / 經紀人員 / 房仲',
      image: 'member/register/common/icon_agent.svg',
    },
  ])

  return {
    apiTypeDefault,
    type,
    links,
  }
})
