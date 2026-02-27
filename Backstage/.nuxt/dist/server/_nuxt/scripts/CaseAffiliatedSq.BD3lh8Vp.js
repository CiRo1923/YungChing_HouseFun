import { shallowReadonly, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$2 } from "./CheckBox.DTYspC36.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import { u as useBuyBasicStore } from "./basic.BQ1dZmyM.js";
import { u as useStores } from "./useStores.2GhJj387.js";
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
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "CaseAffiliatedSq",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const buyBasic = useBuyBasicStore();
    const { basic } = useStores();
    const { apiData } = storeToRefs(buyProject);
    const { pingData, pingUnitLabel } = storeToRefs(buyBasic);
    const items = shallowReadonly([
      {
        id: "caseBalconySq",
        label: "陽台"
      },
      {
        id: "casePlatformSq",
        label: "平台"
      },
      {
        id: "caseTerraceSq",
        label: "露臺"
      },
      {
        id: "caseStairwellSq",
        label: "電 / 樓梯間"
      },
      {
        id: "caseMezzanineSq",
        label: "夾層"
      },
      {
        id: "caseBasementSq",
        label: "地下室"
      },
      {
        id: "caseOtherSq",
        label: "其他"
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "m:space-y-[16px] pt:space-y-[8px]" }, _attrs))}><ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]"><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseAffiliatedSqPin",
        modelValue: unref(pingData).caseAffiliatedSq,
        "onUpdate:modelValue": ($event) => unref(pingData).caseAffiliatedSq = $event,
        config: {
          inputMode: "numeric",
          inputChinese: false,
          checkNotIsZero: true
        },
        rules: {
          required: "請輸入登記坪數"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[228px] pt:w-[270px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        },
        onBlur: ($event) => unref(basic).onPinSqMetersConvert("caseAffiliatedSq")
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(pingUnitLabel))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(pingUnitLabel)), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isCaseBuildSqIncludeParking",
        modelValue: unref(apiData).isCaseAttachedSqAutoCalculate,
        "onUpdate:modelValue": ($event) => unref(apiData).isCaseAttachedSqAutoCalculate = $event,
        config: {
          label: "自動加總",
          value: {
            true: true,
            false: false
          }
        },
        setClass: {
          label: "text-[16px]"
        }
      }, null, _parent));
      _push(`</li></ul><ul class="grid rounded-[15px] bg-[--gray-f7] m:grid-cols-2 tm:gap-x-[16px] tm:gap-y-[24px] tm:p-[24px] pt:grid-cols-4 p:gap-x-[24px] p:gap-y-[8px] p:p-[30px]"><!--[-->`);
      ssrRenderList(unref(items), (item, index) => {
        _push(`<li class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"><span class="text-[16px] leading-[1.2] text-[--gray-666] pt:flex pt:h-[40px] pt:min-w-[48px] pt:shrink-0 pt:items-center">${item.label ?? ""}</span>`);
        _push(ssrRenderComponent(_sfc_main$1, {
          name: item.id,
          modelValue: unref(pingData)[item.id],
          "onUpdate:modelValue": ($event) => unref(pingData)[item.id] = $event,
          config: {
            inputMode: "numeric",
            inputChinese: false,
            checkNotIsZero: true,
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 pt:grow",
            element: "grow",
            rearAssist: "text-[14px] text-[--gray-999]"
          },
          onBlur: ($event) => unref(basic).onPinSqMetersConvert(item.id)
        }, {
          rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(pingUnitLabel))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(pingUnitLabel)), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Ping/CaseAffiliatedSq.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CaseAffiliatedSq.BD3lh8Vp.js.map
