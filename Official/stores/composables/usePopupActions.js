export const usePopupActions = () => {
  const onMergeBtns = (buttons, dataBtns) => {
    let btns = buttons

    if (dataBtns) {
      btns = []

      for (let i = 0; i < dataBtns.length; i += 1) {
        const { type } = dataBtns[i]
        const matchBtn = buttons.find((item) => item.type === type)

        btns.push({
          ...matchBtn,
          ...dataBtns[i],
        })
      }

      if (btns.length < 2) {
        for (let i = 0; i < buttons.length; i += 1) {
          const { type } = buttons[i]
          const noMatchBtn = btns.find((item) => item.type !== type)

          if (noMatchBtn) {
            btns.push(buttons[i])
          }
        }
      }
    }

    return btns
  }

  return {
    onMergeBtns,
  }
}

export default usePopupActions
