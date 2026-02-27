import { ref, watch, mergeProps, unref, withCtx, createTextVNode, isRef, useSSRContext } from "vue";
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
  __name: "CasePriceUnit",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    const isAutoCalc = ref(true);
    const onIsAutoCalc = () => {
      const {
        casePrice,
        // 寵價
        caseParkingPrice,
        // 車位價
        caseBuildSqPin,
        // 登記坪數
        caseParkingSqPin,
        // 車位坪數
        isCasePriceIncludeParking,
        // 總價含車位
        isCasePricePerPinDeductParking,
        // 扣除車位價
        isCaseBuildSqIncludeParking
        // 登記坪數含車位
      } = apiData.value;
      if (isAutoCalc.value && casePrice && caseBuildSqPin) {
        const price = isCasePriceIncludeParking && isCasePricePerPinDeductParking && caseParkingPrice ? Number(casePrice) - Number(caseParkingPrice) : Number(casePrice);
        const buildSq = isCaseBuildSqIncludeParking && caseParkingSqPin ? Number(caseBuildSqPin) - Number(caseParkingSqPin) : Number(caseBuildSqPin);
        apiData.value.casePriceUnit = price / buildSq;
      }
    };
    watch(
      () => [
        apiData.value.casePrice,
        apiData.value.caseBuildSqPin,
        apiData.value.caseParkingSqPin,
        apiData.value.isCasePriceIncludeParking,
        apiData.value.isCasePricePerPinDeductParking,
        apiData.value.isCaseBuildSqIncludeParking
      ],
      () => {
        onIsAutoCalc();
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "casePriceUnit",
        modelValue: unref(apiData).casePriceUnit,
        "onUpdate:modelValue": ($event) => unref(apiData).casePriceUnit = $event,
        config: {
          inputMode: "numeric",
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
          isDisabled: unref(isAutoCalc)
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]",
          suffix: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`萬 / 坪`);
          } else {
            return [
              createTextVNode("萬 / 坪")
            ];
          }
        }),
        suffix: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`單價 = 總價 / 建物登記坪數`);
          } else {
            return [
              createTextVNode("單價 = 總價 / 建物登記坪數")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isAutoCalc",
        modelValue: unref(isAutoCalc),
        "onUpdate:modelValue": ($event) => isRef(isAutoCalc) ? isAutoCalc.value = $event : null,
        config: {
          label: "自動計算",
          value: {
            true: true,
            false: false
          }
        },
        setClass: {
          label: "text-[16px]"
        }
      }, null, _parent));
      _push(`</li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isCasePricePerPinDeductParking",
        modelValue: unref(apiData).isCasePricePerPinDeductParking,
        "onUpdate:modelValue": ($event) => unref(apiData).isCasePricePerPinDeductParking = $event,
        config: {
          label: "扣除車位價",
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Price/CasePriceUnit.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CasePriceUnit.DFguvDxw.js.map
