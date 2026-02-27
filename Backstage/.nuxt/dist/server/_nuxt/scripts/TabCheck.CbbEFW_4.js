import { ref, computed, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, openBlock, createBlock, createCommentVNode, renderSlot, toDisplayString, nextTick, useSSRContext, readonly } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrRenderList, ssrRenderVNode, ssrRenderComponent, ssrRenderSlot, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$2 } from "./SvgIcon.CBDcrtuZ.js";
import _sfc_main$5 from "./TabCheckURL.4rLOAqIc.js";
import _sfc_main$4 from "./TabCheckAddress.fv7AMu7n.js";
import _sfc_main$3 from "./TabCheckID.DgsgGwRh.js";
import "./Label.BJzWF104.js";
import "./Input.DrK-MnGh.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./mAnchor.D_ir9u_b.js";
import "./TabItem.DazqB-gY.js";
import "./Main.Cqggwx2L.js";
import "./mAddress.BkXpTInt.js";
import "./Select.BLaGw9UN.js";
import "./project.D4zrwblI.js";
import "pinia";
import "./useStores.2GhJj387.js";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "./basic.BQ1dZmyM.js";
const _sfc_main$1 = {
  __name: "Check",
  __ssrInlineRender: true,
  props: {
    options: {
      type: Array,
      default: () => []
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
    const props = __props;
    const activeIndex = ref(0);
    const rafId = ref(null);
    const prevIndex = ref(null);
    const direction = ref(null);
    const animating = ref(null);
    const isShowItem = ref(false);
    computed(() => {
      return {
        active: 0,
        ...props.config
      };
    });
    const setClass = computed(() => {
      return {
        main: "",
        header: "",
        headerItem: "",
        anchor: "",
        body: "",
        ...props.setClass
      };
    });
    const onHeaderAs = (item) => {
      const { to, href } = item;
      return href ? "a" : to ? "router-link" : "button";
    };
    const onHeaderBind = (item) => {
      const as = onHeaderAs(item);
      const { to, href, target } = item;
      return as === "router-link" ? {
        to,
        ...target ? {
          target,
          rel: "noopener"
        } : {}
      } : as === "a" ? {
        href,
        target: "_blank",
        rel: "noopener"
      } : {
        type: as
      };
    };
    const onStartAnimate = () => {
      onCancelAnimationFram();
      animating.value = null;
      rafId.value = requestAnimationFrame(() => {
        animating.value = "--animating";
        rafId.value = null;
        if (!direction.value) {
          onReset();
        }
      });
    };
    const onClick = async (item, index) => {
      const { href, to } = item;
      const isURL = !!(href || to);
      if (isURL) return;
      if (isShowItem.value) return;
      prevIndex.value = activeIndex.value;
      activeIndex.value = index;
      direction.value = activeIndex.value > prevIndex.value ? "--left" : activeIndex.value < prevIndex.value ? "--right" : null;
      isShowItem.value = direction.value ? true : false;
      await nextTick();
      onStartAnimate();
    };
    const onCancelAnimationFram = () => {
      if (rafId.value != null) cancelAnimationFrame(rafId.value);
    };
    const onReset = () => {
      animating.value = null;
      direction.value = null;
      isShowItem.value = false;
      prevIndex.value = null;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-tab --check", unref(setClass).main]
      }, _attrs))}><ul class="${ssrRenderClass([unref(setClass).header, "m-tab-header flex gap-x-[8px]"])}"><!--[-->`);
      ssrRenderList(props.options, (item, index) => {
        _push(`<li class="${ssrRenderClass([[{ "--active": index === unref(activeIndex) }, unref(setClass).headerItem], "m-tab-header-item flex items-center"])}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(onHeaderAs(item)), mergeProps({
          class: ["m-tab-anchor flex w-full items-center justify-center gap-x-[4px] rounded-t-[15px] px-[9px] py-[8px] text-[16px] transition-colors duration-300", unref(setClass).anchor]
        }, { ref_for: true }, onHeaderBind(item), {
          onClick: ($event) => onClick(item, index)
        }), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (index === unref(activeIndex)) {
                _push2(ssrRenderComponent(_sfc_main$2, {
                  icon: "icon_check_solid",
                  class: "h-[16px] w-[16px]"
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              ssrRenderSlot(_ctx.$slots, "header", {
                item,
                index
              }, () => {
                _push2(`<b class="font-semibold"${_scopeId}>${ssrInterpolate(item.label)}</b>`);
              }, _push2, _parent2, _scopeId);
            } else {
              return [
                index === unref(activeIndex) ? (openBlock(), createBlock(_sfc_main$2, {
                  key: 0,
                  icon: "icon_check_solid",
                  class: "h-[16px] w-[16px]"
                })) : createCommentVNode("", true),
                renderSlot(_ctx.$slots, "header", {
                  item,
                  index
                }, () => [
                  createVNode("b", { class: "font-semibold" }, toDisplayString(item.label), 1)
                ])
              ];
            }
          }),
          _: 2
        }), _parent);
        _push(`</li>`);
      });
      _push(`<!--]--></ul><div class="${ssrRenderClass([unref(setClass).body, "m-tab-body border-t-[4px] border-t-[--orange-e646]"])}"><div class="m-table-body-content overflow-hidden rounded-b-[15px] border-transparent bg-[--white]"><ul class="${ssrRenderClass([[unref(animating), unref(direction)], "m-tab-body-items flex w-[200%] will-change-transform"])}"><!--[-->`);
      ssrRenderList(props.options, (item, index) => {
        _push(`<!--[-->`);
        if (!item.href && (index === unref(activeIndex) || unref(isShowItem) && index === unref(prevIndex))) {
          _push(`<li class="m-tab-body-item w-1/2 shrink-0">`);
          ssrRenderSlot(_ctx.$slots, `content_${index}`, { index }, null, _push, _parent);
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></ul></div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mTab/Check.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "TabCheck",
  __ssrInlineRender: true,
  setup(__props) {
    const options = readonly([
      {
        label: "網址匯入"
      },
      {
        label: "地址匯入"
      },
      {
        label: "建號匯入"
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        options: unref(options),
        setClass: {
          main: "--anchor-height-40 --body-py-32 p:--body-px-40 p:--body-py-32 tm:--body-px-16",
          headerItem: "tm:flex-1 p:min-w-[160px]"
        }
      }, _attrs), {
        content_0: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$5, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$5)
            ];
          }
        }),
        content_1: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$4, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$4)
            ];
          }
        }),
        content_2: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$3, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$3)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/TabCheck.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=TabCheck.CbbEFW_4.js.map
