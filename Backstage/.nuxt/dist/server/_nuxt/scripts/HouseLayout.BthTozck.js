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
  __name: "HouseLayout",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    const onIsCaseAddtionChange = () => {
      if (!apiData.value.isCaseAddtion) {
        apiData.value.caseAddRoom = "";
        apiData.value.caseAddLivingRoom = "";
        apiData.value.caseAddBathroom = "";
        apiData.value.caseAddBalcony = "";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, _attrs))}><li><ul class="flex flex-wrap gap-x-[8px] gap-y-[12px]"><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseRoom",
        modelValue: unref(apiData).caseRoom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseRoom = $event,
        config: {
          isExistClose: false,
          maxlength: 2
        },
        rules: {
          required: "請輸入房數"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`房`);
          } else {
            return [
              createTextVNode("房")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseLivingRoom",
        modelValue: unref(apiData).caseLivingRoom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseLivingRoom = $event,
        config: {
          isExistClose: false,
          maxlength: 2
        },
        rules: {
          required: "請輸入廳數"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`廳`);
          } else {
            return [
              createTextVNode("廳")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseBathroom",
        modelValue: unref(apiData).caseBathroom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseBathroom = $event,
        config: {
          isExistClose: false,
          maxlength: 2
        },
        rules: {
          required: "請輸入衛浴數"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`衛`);
          } else {
            return [
              createTextVNode("衛")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseBalcony",
        modelValue: unref(apiData).caseBalcony,
        "onUpdate:modelValue": ($event) => unref(apiData).caseBalcony = $event,
        config: {
          isExistClose: false,
          maxlength: 2
        },
        rules: {
          required: "請輸入衛浴數"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[110px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        }
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`陽台`);
          } else {
            return [
              createTextVNode("陽台")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isCaseOpenConcept",
        modelValue: unref(apiData).isCaseOpenConcept,
        "onUpdate:modelValue": ($event) => unref(apiData).isCaseOpenConcept = $event,
        config: {
          label: "開放式格局",
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
        name: "isCaseAddtion",
        modelValue: unref(apiData).isCaseAddtion,
        "onUpdate:modelValue": ($event) => unref(apiData).isCaseAddtion = $event,
        config: {
          label: "有加蓋",
          value: {
            true: true,
            false: false
          }
        },
        setClass: {
          label: "text-[16px]"
        },
        onChange: onIsCaseAddtionChange
      }, null, _parent));
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/HouseLayout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=HouseLayout.BthTozck.js.map
