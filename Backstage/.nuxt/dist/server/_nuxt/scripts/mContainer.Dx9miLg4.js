import { computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderSlot } from "vue/server-renderer";
import { g as useRoute } from "../../server.mjs";
const _sfc_main = {
  __name: "mContainer",
  __ssrInlineRender: true,
  props: {
    setClass: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const route = useRoute();
    const props = __props;
    const setClass = computed(() => {
      return {
        main: "",
        ...props.setClass
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-container mx-auto tm:pt-[32px] p:max-w-[1232px] p:pt-[40px]", unref(setClass).main]
      }, _attrs))}><header class="m-container-header p:flex p:items-center"><h2 class="text-[--gray-333] tm:text-center tm:text-[24px] p:grow p:text-[30px]"><strong class="font-semibold">${ssrInterpolate(unref(route).meta.title)}</strong></h2>`);
      if (_ctx.$slots.header_tools) {
        _push(`<div class="m-container-header-tools p:shrink-0">`);
        ssrRenderSlot(_ctx.$slots, "header_tools", {}, null, _push, _parent);
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header><div class="m-container-body mt-[32px]">`);
      if (_ctx.$slots.tools) {
        _push(`<div class="m-container-tools mb-[32px]">`);
        ssrRenderSlot(_ctx.$slots, "tools", {}, null, _push, _parent);
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="m-container-content">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mContainer.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=mContainer.Dx9miLg4.js.map
