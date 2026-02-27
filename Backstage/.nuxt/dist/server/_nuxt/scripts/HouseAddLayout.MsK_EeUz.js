import { mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
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
  __name: "HouseAddLayout",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap gap-x-[8px] gap-y-[12px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseAddRoom",
        modelValue: unref(apiData).caseAddRoom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseAddRoom = $event,
        config: {
          isExistClose: false,
          maxlength: 2,
          isDisabled: !unref(apiData).isCaseAddtion
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
        name: "caseAddLivingRoom",
        modelValue: unref(apiData).caseAddLivingRoom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseAddLivingRoom = $event,
        config: {
          isExistClose: false,
          maxlength: 2,
          isDisabled: !unref(apiData).isCaseAddtion
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
        name: "caseAddBathroom",
        modelValue: unref(apiData).caseAddBathroom,
        "onUpdate:modelValue": ($event) => unref(apiData).caseAddBathroom = $event,
        config: {
          isExistClose: false,
          maxlength: 2,
          isDisabled: !unref(apiData).isCaseAddtion
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
        name: "caseAddBalcony",
        modelValue: unref(apiData).caseAddBalcony,
        "onUpdate:modelValue": ($event) => unref(apiData).caseAddBalcony = $event,
        config: {
          isExistClose: false,
          maxlength: 2,
          isDisabled: !unref(apiData).isCaseAddtion
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
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/HouseAddLayout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=HouseAddLayout.MsK_EeUz.js.map
