import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Select.BLbzLLvT.js";
import { u as useBuyProjectStore } from "./project.DqU6Ajm9.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.Kz_kpQ5n.js";
import "./_prototype.DwbhdnQa.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "CaseType",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        name: "caseTypeToken",
        modelValue: unref(apiData).caseTypeToken,
        "onUpdate:modelValue": ($event) => unref(apiData).caseTypeToken = $event,
        options: unref(options).caseType,
        config: {
          placeholder: "請選擇型態",
          schema: {
            label: "text",
            value: "value"
          }
        },
        rules: {
          required: "請選擇型態"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 grow"
        }
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/CaseType.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CaseType.BipWqy_V.js.map
