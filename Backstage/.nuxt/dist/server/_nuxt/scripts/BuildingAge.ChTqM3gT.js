import { ref, computed, readonly, withCtx, unref, isRef, createTextVNode, createVNode, openBlock, createBlock, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.C_eW4Qov.js";
import { _ as _sfc_main$2 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$3 } from "./CheckBox.DTYspC36.js";
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
  __name: "BuildingAge",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    const optionsModel = ref("age");
    const isOptionsModelAge = computed(() => optionsModel.value === "age");
    const radioOptions = readonly([
      {
        label: "屋齡",
        value: "age"
      },
      {
        label: "完工日期",
        value: "date"
      }
    ]);
    const onBuildingAgeChange = () => {
      if (isOptionsModelAge.value) {
        apiData.value.caseCompletedYear = "";
        apiData.value.caseCompletedMonth = "";
      } else {
        apiData.value.caseAge = "";
      }
    };
    const onClearCheckbox = () => {
      apiData.value.isCaseUnknownAge = false;
      apiData.value.isCasePreSale = false;
    };
    const onReset = () => {
      apiData.value.caseAge = "";
      apiData.value.caseCompletedYear = "";
      apiData.value.caseCompletedMonth = "";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(RadiosOval, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$1, {
              name: "buildingAge",
              modelValue: unref(optionsModel),
              "onUpdate:modelValue": ($event) => isRef(optionsModel) ? optionsModel.value = $event : null,
              options: unref(radioOptions),
              setClass: {
                radios: "m:w-full",
                container: "m:flex-1"
              },
              onChange: onBuildingAgeChange
            }, null, _parent2, _scopeId));
            _push2(`<ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]"${_scopeId}>`);
            if (unref(isOptionsModelAge)) {
              _push2(`<li${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                name: "caseAge",
                modelValue: unref(apiData).caseAge,
                "onUpdate:modelValue": ($event) => unref(apiData).caseAge = $event,
                config: {
                  isExistClose: false,
                  maxlength: 3
                },
                rules: {
                  required: {
                    valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                    errorMessage: "請輸入屋齡"
                  }
                },
                setClass: {
                  main: "--height-40 --px-12 --py-8 tm:w-[130px] p:w-[100px]",
                  element: "grow",
                  rearAssist: "text-[14px] text-[--gray-999]"
                },
                onInput: onClearCheckbox
              }, {
                rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`年`);
                  } else {
                    return [
                      createTextVNode("年")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</li>`);
            } else {
              _push2(`<li${_scopeId}><ul class="flex gap-x-[8px]"${_scopeId}><li${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                name: "caseCompletedYear",
                modelValue: unref(apiData).caseCompletedYear,
                "onUpdate:modelValue": ($event) => unref(apiData).caseCompletedYear = $event,
                config: {
                  isExistClose: false,
                  maxlength: 3
                },
                rules: {
                  required: {
                    valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                    errorMessage: "請輸入完工年份"
                  }
                },
                setClass: {
                  main: "--height-40 --px-12 --py-8 tm:w-[152px] p:w-[120px]",
                  element: "grow",
                  frontAssist: "text-[14px] text-[--gray-999]",
                  rearAssist: "text-[14px] text-[--gray-999]"
                },
                onInput: onClearCheckbox
              }, {
                frontAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`民國`);
                  } else {
                    return [
                      createTextVNode("民國")
                    ];
                  }
                }),
                rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`年`);
                  } else {
                    return [
                      createTextVNode("年")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</li><li${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                name: "caseCompletedMonth",
                modelValue: unref(apiData).caseCompletedMonth,
                "onUpdate:modelValue": ($event) => unref(apiData).caseCompletedMonth = $event,
                config: {
                  isExistClose: false,
                  maxlength: 2
                },
                rules: {
                  required: {
                    valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                    errorMessage: "請輸入完工月份"
                  }
                },
                setClass: {
                  main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]",
                  element: "grow",
                  rearAssist: "text-[14px] text-[--gray-999]"
                },
                onInput: onClearCheckbox
              }, {
                rearAssist: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`月`);
                  } else {
                    return [
                      createTextVNode("月")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</li></ul></li>`);
            }
            _push2(`<li class="flex h-[40px] items-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$3, {
              name: "isCaseUnknownAge",
              modelValue: unref(apiData).isCaseUnknownAge,
              "onUpdate:modelValue": ($event) => unref(apiData).isCaseUnknownAge = $event,
              config: {
                label: "屋齡不詳",
                value: {
                  true: true,
                  false: false
                }
              },
              setClass: {
                label: "text-[16px]"
              },
              onChange: onReset
            }, null, _parent2, _scopeId));
            _push2(`</li><li class="flex h-[40px] items-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$3, {
              name: "isCasePreSale",
              modelValue: unref(apiData).isCasePreSale,
              "onUpdate:modelValue": ($event) => unref(apiData).isCasePreSale = $event,
              config: {
                label: "預售屋",
                value: {
                  true: true,
                  false: false
                }
              },
              setClass: {
                label: "text-[16px]"
              },
              onChange: onReset
            }, null, _parent2, _scopeId));
            _push2(`</li></ul>`);
          } else {
            return [
              createVNode(_sfc_main$1, {
                name: "buildingAge",
                modelValue: unref(optionsModel),
                "onUpdate:modelValue": ($event) => isRef(optionsModel) ? optionsModel.value = $event : null,
                options: unref(radioOptions),
                setClass: {
                  radios: "m:w-full",
                  container: "m:flex-1"
                },
                onChange: onBuildingAgeChange
              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
              createVNode("ul", { class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, [
                unref(isOptionsModelAge) ? (openBlock(), createBlock("li", { key: 0 }, [
                  createVNode(_sfc_main$2, {
                    name: "caseAge",
                    modelValue: unref(apiData).caseAge,
                    "onUpdate:modelValue": ($event) => unref(apiData).caseAge = $event,
                    config: {
                      isExistClose: false,
                      maxlength: 3
                    },
                    rules: {
                      required: {
                        valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                        errorMessage: "請輸入屋齡"
                      }
                    },
                    setClass: {
                      main: "--height-40 --px-12 --py-8 tm:w-[130px] p:w-[100px]",
                      element: "grow",
                      rearAssist: "text-[14px] text-[--gray-999]"
                    },
                    onInput: onClearCheckbox
                  }, {
                    rearAssist: withCtx(() => [
                      createTextVNode("年")
                    ]),
                    _: 1
                  }, 8, ["modelValue", "onUpdate:modelValue", "rules"])
                ])) : (openBlock(), createBlock("li", { key: 1 }, [
                  createVNode("ul", { class: "flex gap-x-[8px]" }, [
                    createVNode("li", null, [
                      createVNode(_sfc_main$2, {
                        name: "caseCompletedYear",
                        modelValue: unref(apiData).caseCompletedYear,
                        "onUpdate:modelValue": ($event) => unref(apiData).caseCompletedYear = $event,
                        config: {
                          isExistClose: false,
                          maxlength: 3
                        },
                        rules: {
                          required: {
                            valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                            errorMessage: "請輸入完工年份"
                          }
                        },
                        setClass: {
                          main: "--height-40 --px-12 --py-8 tm:w-[152px] p:w-[120px]",
                          element: "grow",
                          frontAssist: "text-[14px] text-[--gray-999]",
                          rearAssist: "text-[14px] text-[--gray-999]"
                        },
                        onInput: onClearCheckbox
                      }, {
                        frontAssist: withCtx(() => [
                          createTextVNode("民國")
                        ]),
                        rearAssist: withCtx(() => [
                          createTextVNode("年")
                        ]),
                        _: 1
                      }, 8, ["modelValue", "onUpdate:modelValue", "rules"])
                    ]),
                    createVNode("li", null, [
                      createVNode(_sfc_main$2, {
                        name: "caseCompletedMonth",
                        modelValue: unref(apiData).caseCompletedMonth,
                        "onUpdate:modelValue": ($event) => unref(apiData).caseCompletedMonth = $event,
                        config: {
                          isExistClose: false,
                          maxlength: 2
                        },
                        rules: {
                          required: {
                            valid: !unref(apiData).isCaseUnknownAge && !unref(apiData).isCasePreSale,
                            errorMessage: "請輸入完工月份"
                          }
                        },
                        setClass: {
                          main: "--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]",
                          element: "grow",
                          rearAssist: "text-[14px] text-[--gray-999]"
                        },
                        onInput: onClearCheckbox
                      }, {
                        rearAssist: withCtx(() => [
                          createTextVNode("月")
                        ]),
                        _: 1
                      }, 8, ["modelValue", "onUpdate:modelValue", "rules"])
                    ])
                  ])
                ])),
                createVNode("li", { class: "flex h-[40px] items-center" }, [
                  createVNode(_sfc_main$3, {
                    name: "isCaseUnknownAge",
                    modelValue: unref(apiData).isCaseUnknownAge,
                    "onUpdate:modelValue": ($event) => unref(apiData).isCaseUnknownAge = $event,
                    config: {
                      label: "屋齡不詳",
                      value: {
                        true: true,
                        false: false
                      }
                    },
                    setClass: {
                      label: "text-[16px]"
                    },
                    onChange: onReset
                  }, null, 8, ["modelValue", "onUpdate:modelValue"])
                ]),
                createVNode("li", { class: "flex h-[40px] items-center" }, [
                  createVNode(_sfc_main$3, {
                    name: "isCasePreSale",
                    modelValue: unref(apiData).isCasePreSale,
                    "onUpdate:modelValue": ($event) => unref(apiData).isCasePreSale = $event,
                    config: {
                      label: "預售屋",
                      value: {
                        true: true,
                        false: false
                      }
                    },
                    setClass: {
                      label: "text-[16px]"
                    },
                    onChange: onReset
                  }, null, 8, ["modelValue", "onUpdate:modelValue"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/BuildingAge.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=BuildingAge.ChTqM3gT.js.map
