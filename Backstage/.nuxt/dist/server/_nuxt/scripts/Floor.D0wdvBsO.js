import { readonly, withCtx, unref, createTextVNode, createVNode, openBlock, createBlock, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.C_eW4Qov.js";
import { _ as _sfc_main$2 } from "./Select.BLaGw9UN.js";
import { _ as _sfc_main$3 } from "./Input.DrK-MnGh.js";
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
  __name: "Floor",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    const radioOptions = readonly([
      {
        label: "單層",
        value: true
      },
      {
        label: "多層",
        value: false
      }
    ]);
    const onIsSingleFloorChange = () => {
      apiData.value.floorToToken = "1";
      apiData.value.caseFloorTo = "";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(RadiosOval, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$1, {
              name: "isSingleFloor",
              modelValue: unref(apiData).isSingleFloor,
              "onUpdate:modelValue": ($event) => unref(apiData).isSingleFloor = $event,
              options: unref(radioOptions),
              setClass: {
                radios: "m:w-full",
                container: "m:flex-1"
              },
              onChange: onIsSingleFloorChange
            }, null, _parent2, _scopeId));
            _push2(`<ul class="pt:flex pt:gap-x-[8px]"${_scopeId}><li class="pt:flex pt:shrink-0 pt:gap-x-[8px]"${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$2, {
              name: "floorFromToken",
              modelValue: unref(apiData).floorFromToken,
              "onUpdate:modelValue": ($event) => unref(apiData).floorFromToken = $event,
              options: unref(options).floor,
              config: {
                placeholder: "請選擇",
                schema: {
                  label: "text",
                  value: "value"
                }
              },
              rules: {
                required: "請選擇出售樓層"
              },
              setClass: {
                main: "--height-40 --px-12 --py-8"
              }
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_sfc_main$3, {
              name: "caseFloorFrom",
              modelValue: unref(apiData).caseFloorFrom,
              "onUpdate:modelValue": ($event) => unref(apiData).caseFloorFrom = $event,
              config: {
                isExistClose: false
              },
              rules: {
                required: "請輸入樓層"
              },
              setClass: {
                main: "--height-40 --px-12 --py-8 p:w-[299px]",
                element: "grow",
                rearAssist: "text-[14px] text-[--gray-999]"
              }
            }, {
              rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`樓`);
                } else {
                  return [
                    createTextVNode("樓")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</li>`);
            if (!unref(apiData).isSingleFloor) {
              _push2(`<li class="pt:grow"${_scopeId}><span class="text-[--gray-666] pt:flex pt:items-center p:h-[40px] p:text-[16px]"${_scopeId}>~</span></li>`);
            } else {
              _push2(`<!---->`);
            }
            if (!unref(apiData).isSingleFloor) {
              _push2(`<li class="pt:flex pt:shrink-0 pt:gap-x-[8px]"${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                name: "floorToToken",
                modelValue: unref(apiData).floorToToken,
                "onUpdate:modelValue": ($event) => unref(apiData).floorToToken = $event,
                options: unref(options).floor,
                config: {
                  placeholder: "請選擇",
                  schema: {
                    label: "text",
                    value: "value"
                  }
                },
                rules: {
                  required: "請選擇出售樓層"
                },
                setClass: {
                  main: "--height-40 --px-12 --py-8"
                }
              }, null, _parent2, _scopeId));
              _push2(ssrRenderComponent(_sfc_main$3, {
                name: "caseFloorTo",
                modelValue: unref(apiData).caseFloorTo,
                "onUpdate:modelValue": ($event) => unref(apiData).caseFloorTo = $event,
                config: {
                  isExistClose: false
                },
                rules: {
                  required: "請輸入樓層"
                },
                setClass: {
                  main: "--height-40 --px-12 --py-8 p:w-[299px]",
                  element: "grow",
                  rearAssist: "text-[14px] text-[--gray-999]"
                }
              }, {
                rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`樓`);
                  } else {
                    return [
                      createTextVNode("樓")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</li>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</ul>`);
          } else {
            return [
              createVNode(_sfc_main$1, {
                name: "isSingleFloor",
                modelValue: unref(apiData).isSingleFloor,
                "onUpdate:modelValue": ($event) => unref(apiData).isSingleFloor = $event,
                options: unref(radioOptions),
                setClass: {
                  radios: "m:w-full",
                  container: "m:flex-1"
                },
                onChange: onIsSingleFloorChange
              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
              createVNode("ul", { class: "pt:flex pt:gap-x-[8px]" }, [
                createVNode("li", { class: "pt:flex pt:shrink-0 pt:gap-x-[8px]" }, [
                  createVNode(_sfc_main$2, {
                    name: "floorFromToken",
                    modelValue: unref(apiData).floorFromToken,
                    "onUpdate:modelValue": ($event) => unref(apiData).floorFromToken = $event,
                    options: unref(options).floor,
                    config: {
                      placeholder: "請選擇",
                      schema: {
                        label: "text",
                        value: "value"
                      }
                    },
                    rules: {
                      required: "請選擇出售樓層"
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8"
                    }
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_sfc_main$3, {
                    name: "caseFloorFrom",
                    modelValue: unref(apiData).caseFloorFrom,
                    "onUpdate:modelValue": ($event) => unref(apiData).caseFloorFrom = $event,
                    config: {
                      isExistClose: false
                    },
                    rules: {
                      required: "請輸入樓層"
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8 p:w-[299px]",
                      element: "grow",
                      rearAssist: "text-[14px] text-[--gray-999]"
                    }
                  }, {
                    rearAssist: withCtx(() => [
                      createTextVNode("樓")
                    ]),
                    _: 1
                  }, 8, ["modelValue", "onUpdate:modelValue"])
                ]),
                !unref(apiData).isSingleFloor ? (openBlock(), createBlock("li", {
                  key: 0,
                  class: "pt:grow"
                }, [
                  createVNode("span", { class: "text-[--gray-666] pt:flex pt:items-center p:h-[40px] p:text-[16px]" }, "~")
                ])) : createCommentVNode("", true),
                !unref(apiData).isSingleFloor ? (openBlock(), createBlock("li", {
                  key: 1,
                  class: "pt:flex pt:shrink-0 pt:gap-x-[8px]"
                }, [
                  createVNode(_sfc_main$2, {
                    name: "floorToToken",
                    modelValue: unref(apiData).floorToToken,
                    "onUpdate:modelValue": ($event) => unref(apiData).floorToToken = $event,
                    options: unref(options).floor,
                    config: {
                      placeholder: "請選擇",
                      schema: {
                        label: "text",
                        value: "value"
                      }
                    },
                    rules: {
                      required: "請選擇出售樓層"
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8"
                    }
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_sfc_main$3, {
                    name: "caseFloorTo",
                    modelValue: unref(apiData).caseFloorTo,
                    "onUpdate:modelValue": ($event) => unref(apiData).caseFloorTo = $event,
                    config: {
                      isExistClose: false
                    },
                    rules: {
                      required: "請輸入樓層"
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8 p:w-[299px]",
                      element: "grow",
                      rearAssist: "text-[14px] text-[--gray-999]"
                    }
                  }, {
                    rearAssist: withCtx(() => [
                      createTextVNode("樓")
                    ]),
                    _: 1
                  }, 8, ["modelValue", "onUpdate:modelValue"])
                ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Floor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Floor.D0wdvBsO.js.map
