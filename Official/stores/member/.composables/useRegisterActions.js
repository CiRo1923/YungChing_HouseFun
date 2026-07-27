import { apiAuthRegisterVerificationCode, apiAuthRegister } from '@js/_api/member/register.js'

export default () => {
  const memberRegister = useMemberRegisterStore()
  const { type } = storeToRefs(memberRegister)
  const { onApiError } = usePopupActions()

  const onApiAuthRegisterVerificationCode = async (channel) => {
    const { countdownData, apiData } = type.value
    const { config, status, data } = await apiAuthRegisterVerificationCode({
      mobilePhone: apiData.mobilePhone,
      channel,
    })

    if (status === 200) {
      const { expiresAt, verificationToken, developmentVerificationCode } = data
      countdownData.expires = expiresAt
      apiData.verificationToken = verificationToken
      apiData.verificationCode = developmentVerificationCode
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiAuthRegister = async (channel) => {
    const { config, status, data } = await apiAuthRegister({
      channel,
      ...type.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onTypeReset = () => {
    type.value.apiData = { ...{}, ...memberRegister.apiTypeDefault }
  }

  return {
    onApiAuthRegisterVerificationCode,
    onApiAuthRegister,
    onTypeReset,
  }
}
