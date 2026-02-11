import CONFIG from './config.js'

const regex = /^NUXT_APP_(.*)$/
const env = {}

process.env.VITE_APP_CSS = CONFIG.css
process.env.VITE_APP_IMGS = CONFIG.imgs
process.env.VITE_APP_JS = CONFIG.js

Object.keys(process.env).forEach((key) => {
  if (regex.test(key)) {
    const label = regex.exec(key)[1].replace(/_/g, '')
    env[label] = process.env[key]
  }
})

export default env
