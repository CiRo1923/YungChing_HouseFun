import { apiPostMemberAuthRegisterVerificationCode, apiPostMemberAuthRegister } from '@js/_api/memberAuth/register.js'

export default () => {
  const memberRegister = useMemberAuthRegisterStore()
  const { type } = storeToRefs(memberRegister)
  const { onApiError } = usePopupActions()

  const onApiAuthRegisterVerificationCode = async (channel) => {
    const { countdownData, apiData } = type.value
    const { config, status, data } = await apiPostMemberAuthRegisterVerificationCode({
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
    const { config, status, data } = await apiPostMemberAuthRegister({
      channel,
      ...type.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const reset = {
    onType() {
      type.value.apiData = { ...memberRegister.apiDefault.type }
    },
  }

  return {
    onApiAuthRegisterVerificationCode,
    onApiAuthRegister,
    reset,
  }
}
