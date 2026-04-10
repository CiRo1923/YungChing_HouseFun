// https://nuxt.com/docs/api/configuration/nuxt-config

import CONFIG from './config.js'
import POSTCSSFUNCTIONS from './postcss.function.js'

import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { fileURLToPath } from 'node:url'

const imageAssetInclude = new RegExp(
  CONFIG.imgs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\/g, '/')
)

export default defineNuxtConfig({
  experimental: {
    appManifest: false,
  },
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    public: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([k]) => k.startsWith('NUXT_PUBLIC_'))
      ),
      appHash: process.env.VITE_APP_HASH || '',
      spritePath: `${CONFIG.imgs}/svg/spritemap.svg`,
    },
  },
  imports: {
    autoImport: true,
  },
  css: [
    `@/${CONFIG.css}/tailwind.css`,
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
    '@composable': fileURLToPath(new URL('./composable', import.meta.url)),
    '@pages': fileURLToPath(new URL('./pages', import.meta.url)),
    '@imgs': fileURLToPath(new URL(`./${CONFIG.imgs}`, import.meta.url)),
    '@css': fileURLToPath(new URL(`./${CONFIG.css}`, import.meta.url)),
    '@js': fileURLToPath(new URL(`./${CONFIG.js}`, import.meta.url)),
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@mayasabha/ckeditor4-vue3',
        'crypto-js',
      ],
    },
    esbuild: {
      drop: process.env['NODE_ENV'] === 'production' ? ['console'] : [],
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
      VitePluginSvgSpritemap(`${CONFIG.svg}/*.svg`, {
        prefix: false,
        route: `_nuxt/${CONFIG.imgs}/svg/spritemap.svg`,
        output: {
          filename: `${CONFIG.imgs}/svg/spritemap.svg`,
          name: 'spritemap',
          view: false,
          use: true,
        },
      }) as never,
      ViteImageOptimizer({
        include: imageAssetInclude,
        includePublic: false,
        logStats: true,
        cache: true,
        cacheLocation: '.cache/image-optimizer',
        svg: {
          multipass: true,
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  cleanupNumericValues: false,
                  cleanupIds: {
                    minify: false,
                    remove: false,
                  },
                  convertPathData: false,
                },
              },
            },
            'sortAttrs',
            {
              name: 'addAttributesToSVGElement',
              params: {
                attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
              },
            },
          ],
        },
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
          // href: `${process.env.NUXT_PUBLIC_PATH}/favicon.ico`,
          href: '//s1.hfcdn.com/s1-news/system/i/icon/favicon_16x16.ico',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@200;300;400;500;600;700;900&display=swap',
        },
      ],
    },
  },
  modules: ['@pinia/nuxt', '@vee-validate/nuxt', '@nuxtjs/tailwindcss'],
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
