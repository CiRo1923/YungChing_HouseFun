import { readonly, withCtx, unref, createTextVNode, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.C_eW4Qov.js";
import { _ as _sfc_main$2 } from "./Input.DrK-MnGh.js";
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
  __name: "Elevator",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    const radioOptions = readonly([
      {
        label: "無電梯",
        value: false
      },
      {
        label: "有電梯",
        value: true
      }
    ]);
    const onIsCaseHasElevatorChnage = () => {
      if (!apiData.value.isCaseHasElevator) {
        apiData.value.caseElevatorCount = "";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(RadiosOval, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$1, {
              name: "isCaseHasElevator",
              modelValue: unref(apiData).isCaseHasElevator,
              "onUpdate:modelValue": ($event) => unref(apiData).isCaseHasElevator = $event,
              options: unref(radioOptions),
              setClass: {
                radios: "m:w-full",
                container: "m:flex-1"
              },
              onChange: onIsCaseHasElevatorChnage
            }, null, _parent2, _scopeId));
            _push2(`<ul${_scopeId}><li${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$2, {
              name: "caseElevatorCount",
              modelValue: unref(apiData).caseElevatorCount,
              "onUpdate:modelValue": ($event) => unref(apiData).caseElevatorCount = $event,
              config: {
                isExistClose: false,
                maxlength: 3,
                isDisabled: !unref(apiData).isCaseHasElevator
              },
              rules: {
                required: {
                  valid: unref(apiData).isCaseHasElevator,
                  errorMessage: "請輸入電梯數量"
                }
              },
              setClass: {
                main: "--height-40 --px-12 --py-8 p:w-[100px]",
                element: "grow",
                rearAssist: "text-[14px] text-[--gray-999]"
              }
            }, {
              rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`部`);
                } else {
                  return [
                    createTextVNode("部")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</li></ul>`);
          } else {
            return [
              createVNode(_sfc_main$1, {
                name: "isCaseHasElevator",
                modelValue: unref(apiData).isCaseHasElevator,
                "onUpdate:modelValue": ($event) => unref(apiData).isCaseHasElevator = $event,
                options: unref(radioOptions),
                setClass: {
                  radios: "m:w-full",
                  container: "m:flex-1"
                },
                onChange: onIsCaseHasElevatorChnage
              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
              createVNode("ul", null, [
                createVNode("li", null, [
                  createVNode(_sfc_main$2, {
                    name: "caseElevatorCount",
                    modelValue: unref(apiData).caseElevatorCount,
                    "onUpdate:modelValue": ($event) => unref(apiData).caseElevatorCount = $event,
                    config: {
                      isExistClose: false,
                      maxlength: 3,
                      isDisabled: !unref(apiData).isCaseHasElevator
                    },
                    rules: {
                      required: {
                        valid: unref(apiData).isCaseHasElevator,
                        errorMessage: "請輸入電梯數量"
                      }
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8 p:w-[100px]",
                      element: "grow",
                      rearAssist: "text-[14px] text-[--gray-999]"
                    }
                  }, {
                    rearAssist: withCtx(() => [
                      createTextVNode("部")
                    ]),
                    _: 1
                  }, 8, ["modelValue", "onUpdate:modelValue", "config", "rules"])
                ])
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Elevator.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Elevator.Dk2mLNJR.js.map
