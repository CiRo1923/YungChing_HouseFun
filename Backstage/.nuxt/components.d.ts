
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const BuyMAddress: typeof import("../components/buy/mAddress.vue")['default']
export const BuyMAnchor: typeof import("../components/buy/mAnchor.vue")['default']
export const BuyMAnchorTool: typeof import("../components/buy/mAnchorTool.vue")['default']
export const BuyMCardFilter: typeof import("../components/buy/mCard/Filter.vue")['default']
export const BuyMContainer: typeof import("../components/buy/mContainer.vue")['default']
export const BuyMErrorMessageElem: typeof import("../components/buy/mErrorMessageElem.vue")['default']
export const BuyMFormInput: typeof import("../components/buy/mForm/Input.vue")['default']
export const BuyMFormLabel: typeof import("../components/buy/mForm/Label.vue")['default']
export const BuyMFormRadiosOval: typeof import("../components/buy/mForm/RadiosOval.vue")['default']
export const BuyMFormSelect: typeof import("../components/buy/mForm/Select.vue")['default']
export const BuyMHeader: typeof import("../components/buy/mHeader.vue")['default']
export const BuyMItemContainer: typeof import("../components/buy/mItem/Container.vue")['default']
export const BuyMItemMain: typeof import("../components/buy/mItem/Main.vue")['default']
export const BuyMItemSwitchtem: typeof import("../components/buy/mItem/Switchtem.vue")['default']
export const BuyMStepArrow: typeof import("../components/buy/mStep/Arrow.vue")['default']
export const BuyMTabCheck: typeof import("../components/buy/mTab/Check.vue")['default']
export const CommonImgSrc: typeof import("../components/common/ImgSrc.vue")['default']
export const CommonSvgIcon: typeof import("../components/common/SvgIcon.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyBuyMAddress: LazyComponent<typeof import("../components/buy/mAddress.vue")['default']>
export const LazyBuyMAnchor: LazyComponent<typeof import("../components/buy/mAnchor.vue")['default']>
export const LazyBuyMAnchorTool: LazyComponent<typeof import("../components/buy/mAnchorTool.vue")['default']>
export const LazyBuyMCardFilter: LazyComponent<typeof import("../components/buy/mCard/Filter.vue")['default']>
export const LazyBuyMContainer: LazyComponent<typeof import("../components/buy/mContainer.vue")['default']>
export const LazyBuyMErrorMessageElem: LazyComponent<typeof import("../components/buy/mErrorMessageElem.vue")['default']>
export const LazyBuyMFormInput: LazyComponent<typeof import("../components/buy/mForm/Input.vue")['default']>
export const LazyBuyMFormLabel: LazyComponent<typeof import("../components/buy/mForm/Label.vue")['default']>
export const LazyBuyMFormRadiosOval: LazyComponent<typeof import("../components/buy/mForm/RadiosOval.vue")['default']>
export const LazyBuyMFormSelect: LazyComponent<typeof import("../components/buy/mForm/Select.vue")['default']>
export const LazyBuyMHeader: LazyComponent<typeof import("../components/buy/mHeader.vue")['default']>
export const LazyBuyMItemContainer: LazyComponent<typeof import("../components/buy/mItem/Container.vue")['default']>
export const LazyBuyMItemMain: LazyComponent<typeof import("../components/buy/mItem/Main.vue")['default']>
export const LazyBuyMItemSwitchtem: LazyComponent<typeof import("../components/buy/mItem/Switchtem.vue")['default']>
export const LazyBuyMStepArrow: LazyComponent<typeof import("../components/buy/mStep/Arrow.vue")['default']>
export const LazyBuyMTabCheck: LazyComponent<typeof import("../components/buy/mTab/Check.vue")['default']>
export const LazyCommonImgSrc: LazyComponent<typeof import("../components/common/ImgSrc.vue")['default']>
export const LazyCommonSvgIcon: LazyComponent<typeof import("../components/common/SvgIcon.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
