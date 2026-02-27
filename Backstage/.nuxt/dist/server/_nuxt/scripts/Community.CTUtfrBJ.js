import { readonly, withCtx, unref, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.C_eW4Qov.js";
import RadiosOval from "./RadiosOval.NzLPxeP9.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_validation.uUSMHlAI.js";
import "./_prototype.Mf8Dpr9m.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "Community",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    const radioOptions = readonly([
      {
        label: "非社區 / 建案",
        value: false
      },
      {
        label: "所屬社區 / 建案",
        value: true
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(RadiosOval, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$1, {
              name: "isCaseCommunity",
              modelValue: unref(apiData).isCaseCommunity,
              "onUpdate:modelValue": ($event) => unref(apiData).isCaseCommunity = $event,
              options: unref(radioOptions),
              setClass: {
                radios: "m:w-full",
                container: "m:flex-1"
              }
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$1, {
                name: "isCaseCommunity",
                modelValue: unref(apiData).isCaseCommunity,
                "onUpdate:modelValue": ($event) => unref(apiData).isCaseCommunity = $event,
                options: unref(radioOptions),
                setClass: {
                  radios: "m:w-full",
                  container: "m:flex-1"
                }
              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Community.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Community.CTUtfrBJ.js.map
