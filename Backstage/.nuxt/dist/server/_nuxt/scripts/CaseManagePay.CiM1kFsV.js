import { mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Select.BLaGw9UN.js";
import { _ as _sfc_main$2 } from "./Input.DrK-MnGh.js";
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
  __name: "CaseManagePay",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "pt:flex pt:gap-x-[8px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseManageFeePeriodToken",
        modelValue: unref(apiData).caseManageFeePeriodToken,
        "onUpdate:modelValue": ($event) => unref(apiData).caseManageFeePeriodToken = $event,
        options: unref(options).managePay,
        config: {
          placeholder: {
            value: "請選擇繳費方式",
            isToOption: true
          },
          schema: {
            label: "text",
            value: "value"
          }
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 p:w-[270px]"
        }
      }, null, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "caseManageFee",
        modelValue: unref(apiData).caseManageFee,
        "onUpdate:modelValue": ($event) => unref(apiData).caseManageFee = $event,
        config: {
          isDisabled: !unref(apiData).caseManageFeePeriodToken
        },
        rules: {
          required: {
            valid: unref(apiData).caseManageFeePeriodToken,
            errorMessage: "請輸入管理費"
          }
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 p:w-[270px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`元`);
          } else {
            return [
              createTextVNode("元")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Manage/CaseManagePay.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CaseManagePay.CiM1kFsV.js.map
