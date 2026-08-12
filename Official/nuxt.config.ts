// https://nuxt.com/docs/api/configuration/nuxt-config

import CONFIG from './config.js'
import POSTCSSFUNCTIONS from './postcss.function.js'

import SvgSpritemapDevPlugin, {
  spritemapRoute as devSpritemapRoute,
} from './scripts/vite/svg-spritemap-dev.mjs'
import { getPageComponentDirs } from './scripts/nuxt/page-component-dirs'
import { getStoreComposableImports, getStoreImports } from './scripts/nuxt/store-composable-imports'
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const APP_HASH =
  process.env.NUXT_PUBLIC_APP_HASH || execSync('git rev-parse --short HEAD').toString().trim()

const imageAssetDir = CONFIG.imgs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\/g, '/')
const imageAssetInclude = new RegExp(`${imageAssetDir}/(?!svg/spritemap\\.svg$)`)

export default defineNuxtConfig({
  // 開發除錯面板放在 plugins/dev/(子資料夾 → Nuxt 不自動註冊),於此明示載入 client / server 進入點。
  // 好處:core.js 不必被 ignore,Vite 會照常監看它 → 改 core 只要 F5/HMR 即生效,不必重啟 dev。
  plugins: [
    { src: '~/plugins/dev/dev-debug-panel.client.js', mode: 'client' },
    { src: '~/plugins/dev/dev-debug-panel.server.js', mode: 'server' },
  ],
  experimental: {
    appManifest: false,
    // 用 AsyncLocalStorage 保留 nuxtApp / pinia context,讓深層 async(fetch 攔截器等
    // 非 setup/plugin 檔案)在 SSR 跨 await 後仍能安全呼叫 useRuntimeConfig / useXxxStore。
    asyncContext: true,
  },
  devtools: {
    enabled: true,
  },
  // postinstall 會跑 nuxt prepare,若未表態 telemetry 會跳互動詢問卡住安裝流程 → 直接關閉
  telemetry: false,
  runtimeConfig: {
    public: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([k]) => k.startsWith('NUXT_PUBLIC_'))
      ),
      appHash: APP_HASH,
      spriteVersion: APP_HASH,
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
    // 頻道色票(color{Channel}.css)以 ?url 引用,會被記進 chunk 的 assets,
    // 導致 Nuxt 為「所有頻道」都吐 preload,但單一頁面只會用到一個 → 其餘皆為無效 preload。
    // 這裡把色票從 manifest assets 移除,載入交回各 layout 的 useHead stylesheet(URL 已編進 JS,不受影響)。
    'build:manifest'(manifest) {
      const isChannelColor = (file: string) => /(^|\/)color[A-Za-z]*\.[^/]+\.css$/.test(file)

      for (const entry of Object.values(manifest)) {
        if (entry.assets?.length) {
          entry.assets = entry.assets.filter((file) => !isChannelColor(file))
        }
      }
    },
    // pages/**/_components 只是「元件就近放在頁面旁」的慣例,由 components:dirs 註冊成元件;
    // 但 Nuxt 的頁面掃描不認得這個約定,仍會把每個檔案掃成頁面 → 產生上百條可被直接訪問的
    // 內部路由(如 /buy/_components/common/popup/Message)。這裡整批移除。
    'pages:extend'(pages) {
      const removeComponentRoutes = (routes: typeof pages) => {
        for (let i = routes.length - 1; i >= 0; i -= 1) {
          const route = routes[i]

          if (!route) {
            continue
          }

          if (route.path.includes('_components')) {
            routes.splice(i, 1)
            continue
          }

          if (route.children?.length) removeComponentRoutes(route.children)
        }
      }

      removeComponentRoutes(pages)
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
    `@/${CONFIG.css}/_common/layout.css`,
    `@/${CONFIG.css}/_common/color.css`,
    `@/${CONFIG.css}/_common/basic.css`,
    `@/${CONFIG.css}/_common/vueTransition.css`,
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
        'crypto-js',
      ],
    },
    esbuild: {
      drop: process.env.NUXT_PUBLIC_APP_MODE === 'build' ? ['console'] : [],
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
    host: '::',
  },
  nitro: {
    preset: 'node-server',
  },
})
