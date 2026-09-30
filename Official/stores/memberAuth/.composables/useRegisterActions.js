import {
  apiPostMemberAuthRegisterVerificationCode,
  apiPostMemberAuthRegister,
} from '@js/_api/memberAuth/register.js'
import { onDeepClone } from '@js/_prototype.js'

const useRegisterActions = () => {
  const memberRegister = useMemberAuthRegisterStore()
  const { type } = storeToRefs(memberRegister)
  const { onApiError } = usePopupActions()

  const onApiPostMemberAuthRegisterVerificationCode = async (channel) => {
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

  const onApiPostMemberAuthRegister = async (channel) => {
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
      type.value.apiData = onDeepClone(memberRegister.apiDefault.type)
    },
  }

  return {
    onApiPostMemberAuthRegisterVerificationCode,
    onApiPostMemberAuthRegister,
    reset,
  }
}

export default useRegisterActions
