import { mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$2 } from "./CheckBox.DTYspC36.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "CasePrice",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "casePrice",
        modelValue: unref(apiData).casePrice,
        "onUpdate:modelValue": ($event) => unref(apiData).casePrice = $event,
        config: {
          inputMode: "numeric",
          inputChinese: false,
          checkNotIsZero: true,
          comma: true
        },
        rules: {
          required: "請輸入總價"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`萬`);
          } else {
            return [
              createTextVNode("萬")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isCasePriceIncludeParking",
        modelValue: unref(apiData).isCasePriceIncludeParking,
        "onUpdate:modelValue": ($event) => unref(apiData).isCasePriceIncludeParking = $event,
        config: {
          label: "含車位",
          value: {
            true: true,
            false: false
          }
        },
        setClass: {
          label: "text-[16px]"
        }
      }, null, _parent));
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Price/CasePrice.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CasePrice.CMUBxqhd.js.map
