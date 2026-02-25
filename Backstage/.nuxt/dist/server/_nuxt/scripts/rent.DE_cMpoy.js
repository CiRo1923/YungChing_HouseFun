import { mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderSlot } from "vue/server-renderer";
import { _ as _export_sfc } from "../../server.mjs";
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
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "l-wrap" }, _attrs))}><main class="l-body"> RENT `);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</main></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/rent.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const rent = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  rent as default
};
//# sourceMappingURL=rent.DE_cMpoy.js.map
