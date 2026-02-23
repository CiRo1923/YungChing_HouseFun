// https://nuxt.com/docs/api/configuration/nuxt-config

import CONFIG from './config.js'
import POSTCSSFUNCTIONS from './postcss.function.js'

import { resolve } from 'path'

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    public: Object.fromEntries(
      Object.entries(process.env).filter(([k]) => k.startsWith('NUXT_PUBLIC_'))
    ),
  },
  imports: {
    autoImport: true,
  },
  css: [
    `@/${CONFIG.css}/_tailwind.css`,
    `@/${CONFIG.css}/_common/framework.css`,
    `@/${CONFIG.css}/_common/color.css`,
  ],
  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      tailwindcss: {},
      'postcss-functions': {
        functions: POSTCSSFUNCTIONS,
      },
      'postcss-calc': {},
      'postcss-pxtorem': {
        propList: ['*', '!box-shadow', '!z-index', '!border-width'],
        minPixelValue: 2,
      },
      autoprefixer: {},
    },
  },
  alias: {
    '@stores': fileURLToPath(new URL('./stores', import.meta.url)),
    '@components': fileURLToPath(new URL('./components', import.meta.url)),
    '@container': fileURLToPath(new URL('./container', import.meta.url)),
    '@pages': fileURLToPath(new URL('./pages', import.meta.url)),
    '@imgs': fileURLToPath(new URL(`./${CONFIG.imgs}`, import.meta.url)),
    '@css': fileURLToPath(new URL(`./${CONFIG.css}`, import.meta.url)),
    '@js': fileURLToPath(new URL(`./${CONFIG.js}`, import.meta.url)),
  },
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console'] : [],
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: `_nuxt/${CONFIG.js}/[name].[hash].js`,
          entryFileNames: `_nuxt/${CONFIG.js}/[name].[hash].js`,
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? ''
            let path = '[name][extname]'

            if (name.endsWith('.css')) {
              path = `_nuxt/${CONFIG.css}/[name].[hash][extname]`
            } else if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) {
              path = `_nuxt/${CONFIG.imgs}/[name].[hash][extname]`
            } else if (/\.(woff|woff2|eot|ttf|otf)$/i.test(name)) {
              path = `_nuxt/${CONFIG.fonts}/[name].[hash][extname]`
            }

            return path
          },
        },
      },
    },
    plugins: [
      createSvgIconsPlugin({
        iconDirs: [resolve(process.cwd(), `${CONFIG.svg}`)],
        symbolId: '[name]',
      }) as never,
    ],
    server: {
      proxy: CONFIG.proxy,
    },
  },
  app: {
    head: {
      charset: 'utf-8',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'SKYPE_TOOLBAR', content: 'SKYPE_TOOLBAR_PARSER_COMPATIBLE' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
      ],
      link: [
        {
          rel: 'shortcut icon',
          type: 'image/x-icon',
          href: `${process.env.NUXT_PUBLIC_PATH}/favicon.ico`,
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@200;300;400;500;600;700;900&display=swap',
        },
      ],
    },
  },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  // plugins: ['@/app/router.beforeEach.js'],
  // veeValidate: {
  //   autoImports: true,
  //   componentNames: {
  //     Form: 'VeeForm',
  //     Field: 'VeeField',
  //     FieldArray: 'VeeFieldArray',
  //     ErrorMessage: 'VeeErrorMessage'
  //   }
  // },
  router: {
    options: {
      linkActiveClass: 'active',
      linkExactActiveClass: 'exact-active',
    },
  },
  devServer: {
    https: CONFIG.https,
    port: CONFIG.port,
    host: '0.0.0.0',
  },
  nitro: {
    preset: 'node-server',
  },
})
