// https://nuxt.com/docs/api/configuration/nuxt-config

import CONFIG from './config.js'
import POSTCSSFUNCTIONS from './postcss.function.js'

import SvgSpritemapDevPlugin, {
  SvgSpritemapBuildPlugin,
  spritemapRoute as devSpritemapRoute,
} from './.vite/svg-spritemap.mjs'
import { getPageComponentDirs } from './.tools/page-component-dirs'
import { getStoreComposableImports, getStoreImports } from './.tools/store-composable-imports'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const POSTCSS_FUNCTIONS_PLUGIN = new URL('./.tools/postcss/functions.js', import.meta.url).href
const POSTCSS_PXTOREM_PLUGIN = new URL('./.tools/postcss/pxtorem.js', import.meta.url).href

const imageAssetDir = CONFIG.imgs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\/g, '/')
const imageAssetInclude = new RegExp(`${imageAssetDir}/(?!svg/spritemap\\.svg$)`)

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
      appHash:
        process.env.NUXT_PUBLIC_APP_HASH ||
        execSync('git rev-parse --short HEAD').toString().trim(),
      spritePath:
        process.env.NODE_ENV === 'development'
          ? devSpritemapRoute
          : `${CONFIG.imgs}/svg/spritemap.svg`,
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  imports: {
    autoImport: true,
  },
  hooks: {
    'imports:extend'(imports) {
      const storesDir = fileURLToPath(new URL('./stores', import.meta.url))

      imports.push(...getStoreImports(storesDir), ...getStoreComposableImports(storesDir))
    },
    'components:dirs'(dirs) {
      dirs.push({
        path: '~/containers',
        pathPrefix: true,
      })
      dirs.push(...getPageComponentDirs(fileURLToPath(new URL('./pages', import.meta.url))))
    },
  },
  css: [
    `@/${CONFIG.css}/tailwind.css`,
    `@/${CONFIG.css}/_common/framework.css`,
    `@/${CONFIG.css}/_common/color.css`,
    `@/${CONFIG.css}/_common/basic.css`,
    `@/${CONFIG.css}/_common/vueTransition.css`,
  ],
  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      tailwindcss: {},
      // 自寫外掛，取代停更於 2022 的 postcss-functions(見 .tools/postcss/functions.js)。
      // ⚠️ 用絕對 file URL 當 key:Nuxt 是拿 key 去 import,而 `~` / `@` 指向 srcDir 而非 rootDir。
      [POSTCSS_FUNCTIONS_PLUGIN]: {
        functions: POSTCSSFUNCTIONS,
      },
      'postcss-calc': {},
      // 自寫外掛，取代已停更的 postcss-pxtorem(見 .tools/postcss/pxtorem.js)
      [POSTCSS_PXTOREM_PLUGIN]: {
        propList: ['*', '!box-shadow', '!z-index', '!border-width'],
        minPixelValue: 2,
      },
      autoprefixer: {},
    },
  },
  alias: {
    '@stores': fileURLToPath(new URL('./stores', import.meta.url)),
    '@components': fileURLToPath(new URL('./components', import.meta.url)),
    '@containers': fileURLToPath(new URL('./containers', import.meta.url)),
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
      ],
    },
    build: {
      rolldownOptions: {
        output: {
          // Nuxt 4.5 起打包改用 oxc,vite.esbuild.drop 會被整組忽略(build 時會警告)。
          // 移除 console 改由 oxc 的 minifier 負責。
          minify:
            process.env.NUXT_PUBLIC_APP_MODE === 'build'
              ? { compress: { dropConsole: true } }
              : undefined,
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
      SvgSpritemapBuildPlugin(CONFIG.svg, `${CONFIG.imgs}/svg/spritemap.svg`) as never,
      SvgSpritemapDevPlugin(CONFIG.svg) as never,
      ViteImageOptimizer({
        include: imageAssetInclude,
        includePublic: false,
        logStats: true,
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
  build: {
    transpile: ['@googlemaps/js-api-loader'],
  },
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
