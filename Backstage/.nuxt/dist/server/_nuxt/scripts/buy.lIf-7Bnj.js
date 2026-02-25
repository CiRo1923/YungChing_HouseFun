import { ref, computed, watch, unref, createVNode, resolveDynamicComponent, mergeProps, withCtx, openBlock, createBlock, useSSRContext } from "vue";
import { ssrRenderVNode, ssrRenderAttr, ssrRenderClass, ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderSlot } from "vue/server-renderer";
import { _ as _sfc_main$3 } from "./SvgIcon.CBDcrtuZ.js";
import CryptoJS from "crypto-js";
import { u as useBuyProjectStore } from "./project.DqU6Ajm9.js";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/hookable/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "pinia";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
const __vite_glob_0_0 = "" + __buildAssetsURL("assets/imgs/logo_icon.DRw7fWpu.svg");
const __vite_glob_0_1 = "" + __buildAssetsURL("assets/imgs/logo_text.DmtCT80s.svg");
const blankUrl = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3csvg%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20x='0px'%20y='0px'%20viewBox='0%200%201%201'%20style='enable-background:new%200%200%201%201;'%20xml:space='preserve'%3e%3c/svg%3e";
const __vite_glob_0_3 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='_圖層_1'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%20viewBox='0%200%2016%2016'%3e%3c!--%20Generator:%20Adobe%20Illustrator%2029.4.0,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%202.1.0%20Build%20152)%20--%3e%3cdefs%3e%3cstyle%3e%20.st0%20{%20fill:%20%23e5e5e5;%20}%20%3c/style%3e%3c/defs%3e%3cpath%20class='st0'%20d='M4.59,2.83c-.16-.16-.25-.37-.25-.6s.09-.44.25-.6.37-.25.6-.25.44.09.6.25l5.62,5.63c.08.08.14.17.18.27s.06.21.06.32-.02.22-.06.32c-.04.1-.11.2-.18.27l-5.62,5.63c-.16.16-.37.25-.6.25s-.44-.09-.6-.25-.25-.37-.25-.6.09-.44.25-.6l5.03-5.03L4.59,2.83Z'/%3e%3c/svg%3e";
const KEY = CryptoJS.enc.Utf8.parse("HOUSEFUN_BUY_NEWHOUSE_RENT_PRICE");
const IV = CryptoJS.enc.Utf8.parse("housefun_to_nuxt");
const enString = (string) => {
  return `'${string}'`;
};
const enCrypto = (string) => {
  const content = typeof string !== "string" ? typeof string === "number" || typeof string === "boolean" ? string : JSON.stringify(string) : enString(string);
  const srcs = CryptoJS.enc.Utf8.parse(content);
  const encrypted = CryptoJS.AES.encrypt(srcs, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};
const hashHex = (string, length) => {
  return enCrypto(string).toLocaleLowerCase().split("").reverse().join("").slice(0, length);
};
const _sfc_main$2 = {
  __name: "ImgSrc",
  __ssrInlineRender: true,
  props: {
    src: {
      type: [String, Object],
      default: null,
      required: true
    },
    alt: {
      type: String,
      default: null
    },
    config: {
      type: Object,
      default: () => ({})
    },
    setClass: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const MAP = /* @__PURE__ */ Object.assign({ "/assets/imgs/buy/logo_icon.svg": __vite_glob_0_0, "/assets/imgs/buy/logo_text.svg": __vite_glob_0_1, "/assets/imgs/common/blank.svg": blankUrl, "/assets/imgs/components/buy/m-step/arrow.svg": __vite_glob_0_3 });
    const toKey = (p) => `/assets/imgs/${String(p).replace(/^\/+/, "")}`;
    const bust = (url) => `${url}?${hashHex(void 0, 8)}`;
    const resolveBundledImg = (raw) => {
      if (!raw) return null;
      if (/^(https?:|data:|blob:)/.test(raw)) {
        if (/^http/.test(raw)) {
          const imgName = /\/([^/?#]+)(?:\?|$)/.exec(raw)[0];
          const hasQuery = /\?/.test(raw);
          return `${encodeURI(raw)}${hasQuery ? "&" : "?"}${hashHex(imgName, 8)}`;
        }
        return encodeURI(raw);
      }
      const hit = MAP[toKey(raw)];
      if (hit) return bust(hit);
      return blankUrl;
    };
    const props = __props;
    const imageRef = ref(null);
    const status = ref(200);
    const config = computed(() => {
      return {
        lazy: true,
        ...props.config
      };
    });
    const as = computed(() => status.value === 200 ? "figure" : "div");
    const hasLazy = computed(() => config.value.lazy);
    const hasMobile = computed(
      () => props.src && typeof props.src === "object" ? true : !!/[?&#]m=[^?&#]*/.test(props.src)
    );
    const mobilePath = computed(() => {
      const src = props.src && typeof props.src === "object" && props.src.m ? props.src.m : props.src && hasMobile.value ? `${/.*(?=\?.*$)/.exec(props.src)[0].replace(/.(\w+$)/, "_m.$1")}` : null;
      return resolveBundledImg(src);
    });
    const path = computed(() => {
      const src = props.src && typeof props.src === "object" ? props.src.p : props.src && hasMobile.value ? /.*(?=\?.*$)/.exec(props.src)[0] : props.src;
      return resolveBundledImg(src);
    });
    const setClass = computed(() => ({ main: "", img: "", ...props.setClass }));
    watch(path, (newValue) => {
      if (imageRef.value) imageRef.value.setAttribute("src", newValue || blankUrl);
    });
    const onError = () => {
      status.value = 404;
    };
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(status) === 200) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(as)), mergeProps({
          class: ["m-figure", unref(setClass).main]
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (unref(mobilePath) && unref(hasMobile)) {
                _push2(`<picture${_scopeId}><source${ssrRenderAttr("srcset", unref(mobilePath))} media="(max-width: 428px)"${_scopeId}><img${ssrRenderAttr("src", unref(blankUrl))} width="100%" height="100%"${ssrRenderAttr("loading", unref(hasLazy) ? "lazy" : null)}${ssrRenderAttr("alt", props.alt)} class="${ssrRenderClass(unref(setClass).img)}"${_scopeId}></picture>`);
              } else {
                _push2(`<img${ssrRenderAttr("src", unref(blankUrl))} width="100%" height="100%"${ssrRenderAttr("loading", unref(hasLazy) ? "lazy" : null)}${ssrRenderAttr("alt", props.alt)} class="${ssrRenderClass(unref(setClass).img)}"${_scopeId}>`);
              }
            } else {
              return [
                unref(mobilePath) && unref(hasMobile) ? (openBlock(), createBlock("picture", { key: 0 }, [
                  createVNode("source", {
                    srcset: unref(mobilePath),
                    media: "(max-width: 428px)"
                  }, null, 8, ["srcset"]),
                  createVNode("img", {
                    src: unref(blankUrl),
                    width: "100%",
                    height: "100%",
                    loading: unref(hasLazy) ? "lazy" : null,
                    ref_key: "imageRef",
                    ref: imageRef,
                    alt: props.alt,
                    class: unref(setClass).img,
                    onError
                  }, null, 42, ["src", "loading", "alt"])
                ])) : (openBlock(), createBlock("img", {
                  key: 1,
                  src: unref(blankUrl),
                  width: "100%",
                  height: "100%",
                  loading: unref(hasLazy) ? "lazy" : null,
                  ref_key: "imageRef",
                  ref: imageRef,
                  alt: props.alt,
                  class: unref(setClass).img,
                  onError
                }, null, 42, ["src", "loading", "alt"]))
              ];
            }
          }),
          _: 1
        }), _parent);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["m-figure", unref(setClass).main]
        }, _attrs))}><div class="m-figure-error flex items-center justify-center">`);
        _push(ssrRenderComponent(_sfc_main$3, {
          class: "m:h-[36px] m:w-[36px] pt:h-[54px] pt:w-[54px]",
          icon: "image_404"
        }, null, _parent));
        _push(`</div></div>`);
      }
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/ImgSrc.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "mHeader",
  __ssrInlineRender: true,
  setup(__props) {
    const device = ref("p");
    const isDeviceP = computed(() => device.value === "p");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "m-header mx-auto flex items-center tm:h-[50px] tm:px-[15px] p:h-[60px] p:max-w-[1920px] p:px-[50px]" }, _attrs))}><div class="m-header-logo flex shrink-0 items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        src: "buy/logo_text.svg",
        setClass: {
          main: "tm:h-[20px] tm:w-[57px] p:h-[25px] p:w-[77px]"
        }
      }, null, _parent));
      if (unref(isDeviceP)) {
        _push(ssrRenderComponent(_sfc_main$2, {
          src: "buy/logo_icon.svg",
          setClass: {
            main: "tm:hidden p:ml-[4px] p:h-[25px] p:w-[87px]"
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(isDeviceP)) {
        _push(`<em class="text-[--white] tm:hidden p:ml-[10px] p:text-[24px]">管理後台</em>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mHeader.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "buy",
  __ssrInlineRender: true,
  setup(__props) {
    const project = useBuyProjectStore();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "l-wrap" }, _attrs))}><header class="l-header bg-[--gray-666]"><h1 class="sr-only">${ssrInterpolate(unref(project).NAME)}</h1>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</header><main class="l-body">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/buy.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=buy.lIf-7Bnj.js.map
