import { ref, computed, watch, unref, withCtx, mergeProps, createVNode, withDirectives, vModelText, openBlock, createBlock, createCommentVNode, nextTick, useSSRContext, isRef, createTextVNode } from "vue";
import { ssrRenderClass, ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderTeleport, ssrInterpolate, ssrRenderList, ssrRenderSlot } from "vue/server-renderer";
import { _ as _sfc_main$4 } from "./Select.BLaGw9UN.js";
import { _ as _sfc_main$5 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$2 } from "./SvgIcon.CBDcrtuZ.js";
import { a as Field, E as ErrorMessage, _ as _sfc_main$3 } from "./mForm.css.yrdBraIC.js";
import { d as deepMerge } from "./_prototype.Mf8Dpr9m.js";
const _sfc_main$1 = {
  __name: "mAutoComplete",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: ""
    },
    modelValue: {
      type: [String, Number, Boolean],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => {
      }
    },
    rules: {
      type: [String, Object],
      default: null
    },
    setClass: {
      type: Object,
      default: () => {
      }
    }
  },
  emits: ["change", "search", "update:modelValue"],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const elenemtRef = ref(null);
    const dropdownRef = ref(null);
    const dropdownNoDataRef = ref(null);
    const dropdownContainerRef = ref(null);
    const dropdownItemRef = ref(null);
    const isActive = ref(false);
    const isFocus = ref(false);
    const isComposing = ref(false);
    const inputLabel = ref(null);
    const selected = ref({
      index: null
    });
    const dropdownItems = ref(null);
    const model = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emits("update:modelValue", value);
      }
    });
    const config = computed(() => {
      const defaultConfig = {
        placeholder: "",
        noMatchClearLabel: true,
        noResult: "無任何選項。",
        isDisabled: false,
        isExistClose: true,
        isError: false,
        position: "auto",
        schema: {
          label: "label",
          value: "value"
        },
        keyboard: false,
        maxItems: 5
      };
      return deepMerge(defaultConfig, props.config);
    });
    const setClass = computed(() => {
      return {
        ...{
          main: "",
          container: "",
          element: "",
          type: "",
          error: "",
          dropdown: "",
          dropdownContainer: ""
        },
        ...props.setClass
      };
    });
    const onFilter = () => {
      const { schema } = config.value;
      const { label } = schema;
      const escapeRegExp = () => inputLabel.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = inputLabel.value ? new RegExp(escapeRegExp()) : null;
      const matches = regex ? props.options.filter((item) => regex.test(item[label])) : props.options;
      dropdownItems.value = matches;
    };
    const onSwitchActive = (value) => {
      isFocus.value = value;
      isActive.value = value;
    };
    const onGetInputLabel = () => {
      const hasModel = model.value !== null && model.value !== "";
      const matchData = hasModel ? props.options.find((item) => item[config.value.schema.value] === model.value) : null;
      inputLabel.value = matchData ? matchData[config.value.schema.label] : "";
    };
    const onResetDropdownItems = () => {
      dropdownItems.value = props.options.length !== 0 ? props.options : null;
    };
    const onIsComposingChange = (boolean) => {
      isComposing.value = boolean;
    };
    const onFocus = async () => {
      onResetDropdownItems();
      onSwitchActive(true);
      await nextTick();
      onDropdownOpen();
    };
    const onInput = async () => {
      if (isComposing.value) return;
      onFilter();
      await nextTick();
      onDropdownOpen();
    };
    const onCompositionEnd = async () => {
      onIsComposingChange(false);
      onFilter();
      await nextTick();
      onDropdownOpen();
    };
    const onBlur = () => {
      const { noMatchClearLabel } = config.value;
      const hasMatch = inputLabel.value ? !!props.options.find((item) => item[config.value.schema.label] === inputLabel.value) : false;
      const matchData = props.options.find((item) => item[config.value.schema.value] === model.value);
      const label = model.value && matchData ? matchData[config.value.schema.label] : "";
      if (noMatchClearLabel && !hasMatch) {
        inputLabel.value = label;
      }
    };
    const onDropdownOpen = () => {
      const { maxItems, isDisabled } = config.value;
      const $elenemt = elenemtRef.value;
      const $dropdown = dropdownRef.value;
      const $dropdownContainer = dropdownContainerRef.value;
      const element = {
        rect: elenemtRef.value.getBoundingClientRect()
      };
      const offsetTop = element.rect.height + element.rect.top + (void 0).scrollY;
      if ($elenemt && $dropdown) {
        if ($dropdownContainer) {
          const hasItemsThanMax = dropdownItemRef.value.length > maxItems;
          if (hasItemsThanMax) {
            $dropdownContainer.style.overflowY = "auto";
          }
          const index = hasItemsThanMax ? maxItems - 1 : dropdownItemRef.value.length - 1;
          const $item = dropdownItemRef.value[index];
          const dropdown = {
            rect: dropdownRef.value.getBoundingClientRect()
          };
          const itemHeight = $item ? hasItemsThanMax ? $item.offsetTop : $item.offsetTop + $item.offsetHeight : 0;
          const offsetLeftMin = dropdown.rect.width + element.rect.left;
          const dropdownWidth = dropdown.rect.width < element.rect.width ? element.rect.width : dropdown.rect.width;
          const offsetLeftMax = element.rect.width + element.rect.left - dropdownWidth;
          const bodyWidth = (void 0).body.scrollWidth;
          const left = (offsetLeftMin > bodyWidth && offsetLeftMax < 0 || offsetLeftMin < bodyWidth) && config.value.position !== "right" ? element.rect.left : offsetLeftMax;
          const maxHeight = itemHeight;
          $dropdown.style.height = `${maxHeight}px`;
          $dropdown.style.top = `${offsetTop}px`;
          $dropdown.style.left = `${left}px`;
          if (dropdown.rect.width < element.rect.width) {
            $dropdown.style.minWidth = `${element.rect.width}px`;
          }
          if (model.value !== null && model.value !== "") {
            selected.value.index = props.options.findIndex(
              (item) => item[config.value.schema.value] === model.value
            );
            const $selectedItem = dropdownItemRef.value[selected.value.index];
            if ($selectedItem) {
              const selectedItem = {
                rect: $selectedItem.getBoundingClientRect()
              };
              $dropdownContainer.scrollTop = $selectedItem.offsetTop + selectedItem.rect.height / 2 - maxHeight / 2;
            }
          }
        } else if (!isDisabled) {
          $dropdown.style.height = `${dropdownNoDataRef.value.offsetHeight}px`;
          $dropdown.style.top = `${offsetTop}px`;
          $dropdown.style.left = `${element.rect.left}px`;
          $dropdown.style.minWidth = `${element.rect.width}px`;
        }
      }
    };
    const onClear = () => {
      model.value = "";
      inputLabel.value = null;
      selected.value.index = null;
    };
    watch(
      () => props.modelValue,
      (value) => {
        onGetInputLabel();
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><div class="${ssrRenderClass([setClass.value.main, "m-autocomplete"])}"><div class="${ssrRenderClass([setClass.value.container, "m-autocomplete-container overflow-hidden"])}">`);
      _push(ssrRenderComponent(unref(Field), {
        name: props.name,
        rules: props.rules,
        modelValue: model.value,
        "onUpdate:modelValue": ($event) => model.value = $event
      }, {
        default: withCtx(({ field, errorMessage }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<input${ssrRenderAttrs(mergeProps({ type: "hidden" }, field))}${_scopeId}><div class="${ssrRenderClass([[
              setClass.value.element,
              { "--focus": isFocus.value },
              { "--disabled": config.value.isDisabled },
              { "--error": errorMessage || config.value.isError }
            ], "m-autocomplete-element jFormValid relative flex items-center gap-x-[8px] rounded-[5px] border-[1px] border-[--autocomplete-border-color] bg-[--autocomplete-bg-color] px-[10px] transition-colors duration-300"])}"${_scopeId}><input${ssrRenderAttr("name", `${props.name}_type`)} type="text"${ssrRenderAttr("value", inputLabel.value)} class="m-autocomplete-type min-w-0 grow" autocomplete="off"${ssrRenderAttr("placeholder", config.value.placeholder)}${ssrIncludeBooleanAttr(config.value.isDisabled) ? " disabled" : ""}${_scopeId}>`);
            if (config.value.isExistClose && !config.value.isDisabled) {
              _push2(`<button type="button" class="${ssrRenderClass([{
                "--show": inputLabel.value
              }, "m-autocomplete-clear-button flex h-[18px] w-[18px] shrink-0 items-center p-[4px] text-[--gray-999] transition-opacitys duration-300"])}"${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                icon: "icon_xmark",
                class: "m-autocomplete-clear-icon"
              }, null, _parent2, _scopeId));
              _push2(`</button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_sfc_main$2, {
              icon: "icon_search",
              class: "pointer-events-none h-[18px] w-[18px] shrink-0 text-[--autocomplete-icon-color] transition-colors duration-300"
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("input", mergeProps({ type: "hidden" }, field), null, 16),
              createVNode("div", {
                class: ["m-autocomplete-element jFormValid relative flex items-center gap-x-[8px] rounded-[5px] border-[1px] border-[--autocomplete-border-color] bg-[--autocomplete-bg-color] px-[10px] transition-colors duration-300", [
                  setClass.value.element,
                  { "--focus": isFocus.value },
                  { "--disabled": config.value.isDisabled },
                  { "--error": errorMessage || config.value.isError }
                ]],
                ref_key: "elenemtRef",
                ref: elenemtRef
              }, [
                withDirectives(createVNode("input", {
                  name: `${props.name}_type`,
                  type: "text",
                  "onUpdate:modelValue": ($event) => inputLabel.value = $event,
                  class: "m-autocomplete-type min-w-0 grow",
                  autocomplete: "off",
                  placeholder: config.value.placeholder,
                  disabled: config.value.isDisabled,
                  onFocus,
                  onInput,
                  onBlur,
                  onCompositionstart: ($event) => onIsComposingChange(true),
                  onCompositionend: onCompositionEnd
                }, null, 40, ["name", "onUpdate:modelValue", "placeholder", "disabled", "onCompositionstart"]), [
                  [vModelText, inputLabel.value]
                ]),
                config.value.isExistClose && !config.value.isDisabled ? (openBlock(), createBlock("button", {
                  key: 0,
                  type: "button",
                  class: ["m-autocomplete-clear-button flex h-[18px] w-[18px] shrink-0 items-center p-[4px] text-[--gray-999] transition-opacitys duration-300", {
                    "--show": inputLabel.value
                  }],
                  onClick: onClear
                }, [
                  createVNode(_sfc_main$2, {
                    icon: "icon_xmark",
                    class: "m-autocomplete-clear-icon"
                  })
                ], 2)) : createCommentVNode("", true),
                createVNode(_sfc_main$2, {
                  icon: "icon_search",
                  class: "pointer-events-none h-[18px] w-[18px] shrink-0 text-[--autocomplete-icon-color] transition-colors duration-300"
                })
              ], 2)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(unref(ErrorMessage), {
        as: "span",
        class: ["m-autocomplete-error", setClass.value.error],
        name: props.name
      }, {
        default: withCtx(({ message }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$3, { message }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$3, { message }, null, 8, ["message"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        _push2(`<template>`);
        if (isActive.value && dropdownItems.value && !config.value.isDisabled) {
          _push2(`<div class="${ssrRenderClass([setClass.value.dropdown, "m-autocomplete-dropdown absolute z-[5] mt-[3px] overflow-hidden"])}">`);
          if (dropdownItems.value.length === 0) {
            _push2(`<div class="m-autocomplete-dropdown-no-data bg-[--white] p-[8px] text-[14px] text-[--gray-333]"><p>${ssrInterpolate(config.value.noResult)}</p></div>`);
          } else {
            _push2(`<ul class="${ssrRenderClass([setClass.value.dropdownContainer, "m-autocomplete-dropdown-container max-h-full bg-[--white]"])}"><!--[-->`);
            ssrRenderList(dropdownItems.value, (item, index) => {
              _push2(`<li class="m-autocomplete-dropdown-item"><button type="button" class="${ssrRenderClass([{
                "--active": index === selected.value.index
              }, "m-autocomplete-dropdown-button block w-full px-[8px] text-left transition-colors duration-300"])}"><em class="m-autocomplete-dropdown-label relative block grow py-[8px] text-[14px]">`);
              ssrRenderSlot(_ctx.$slots, "option", { item }, () => {
                _push2(`${ssrInterpolate(item[config.value.schema.label])}`);
              }, _push2, _parent);
              _push2(`</em></button></li>`);
            });
            _push2(`<!--]--></ul>`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
        _push2(`</template>`);
      }, "body", false, _parent);
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mAutoComplete.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "mAddress",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: ""
    },
    city: {
      type: [String, Number],
      default: null
    },
    area: {
      type: [String, Number],
      default: null
    },
    road: {
      type: [String, Number],
      default: null
    },
    lane: {
      type: [String, Number],
      default: null
    },
    alley: {
      type: [String, Number],
      default: null
    },
    number: {
      type: [String, Number],
      default: null
    },
    ofNumber: {
      type: [String, Number],
      default: null
    },
    floor: {
      type: [String, Number],
      default: null
    },
    ofFloor: {
      type: [String, Number],
      default: null
    },
    config: {
      type: Object,
      default: () => ({})
    },
    setClass: {
      type: Object,
      default: () => ({})
    }
  },
  emits: [
    "update:city",
    "update:area",
    "update:road",
    "update:lane",
    "update:alley",
    "update:number",
    "update:ofNumber",
    "update:floor",
    "update:ofFloor",
    "change:city",
    "change:area"
  ],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const modelCity = computed({
      get() {
        return props.city;
      },
      set(value) {
        emits("update:city", value);
      }
    });
    const modelArea = computed({
      get() {
        return props.area;
      },
      set(value) {
        emits("update:area", value);
      }
    });
    const modelRoad = computed({
      get() {
        return props.road;
      },
      set(value) {
        emits("update:road", value);
      }
    });
    const modelLane = computed({
      get() {
        return props.lane;
      },
      set(value) {
        emits("update:lane", value);
      }
    });
    const modelAlley = computed({
      get() {
        return props.alley;
      },
      set(value) {
        emits("update:alley", value);
      }
    });
    const modelNumber = computed({
      get() {
        return props.number;
      },
      set(value) {
        emits("update:number", value);
      }
    });
    const modelOfNumber = computed({
      get() {
        return props.ofNumber;
      },
      set(value) {
        emits("update:ofNumber", value);
      }
    });
    const modelFloor = computed({
      get() {
        return props.floor;
      },
      set(value) {
        emits("update:floor", value);
      }
    });
    const modelOfFloor = computed({
      get() {
        return props.ofFloor;
      },
      set(value) {
        emits("update:ofFloor", value);
      }
    });
    const config = computed(() => {
      return {
        city: {
          options: null,
          schema: {
            label: "label",
            value: "value"
          }
        },
        area: {
          options: null,
          schema: {
            label: "label",
            value: "value"
          }
        },
        road: {
          options: null,
          schema: {
            label: "label",
            value: "value"
          }
        },
        ...props.config
      };
    });
    computed(() => {
      const { schema } = config.value;
      const hasCity = !!schema.city;
      const hasArea = !!schema.area;
      return {
        city: hasCity ? schema.city : schema,
        area: hasArea ? schema.area : schema
      };
    });
    const setClass = computed(() => {
      return {
        main: "",
        city: "",
        area: "",
        ...props.setClass
      };
    });
    const onCityChange = () => {
      emits("change:city");
    };
    const onAreaChange = () => {
      emits("change:area");
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-address flex flex-wrap gap-x-[8px] m:gap-y-[12px] pt:gap-y-[8px]", unref(setClass).main]
      }, _attrs))}>`);
      if (props.city !== null) {
        _push(ssrRenderComponent(_sfc_main$4, {
          name: `${props.name}_address_city`,
          modelValue: unref(modelCity),
          "onUpdate:modelValue": ($event) => isRef(modelCity) ? modelCity.value = $event : null,
          options: unref(config).city.options,
          config: {
            placeholder: "選擇縣市",
            schema: unref(config).city.schema
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8 m:w-full", unref(setClass).city]
          },
          onChange: ($event) => onCityChange()
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.area !== null) {
        _push(ssrRenderComponent(_sfc_main$4, {
          name: `${props.name}_address_area`,
          modelValue: unref(modelArea),
          "onUpdate:modelValue": ($event) => isRef(modelArea) ? modelArea.value = $event : null,
          options: unref(config).area.options,
          config: {
            placeholder: "選擇區域",
            schema: unref(config).area.schema,
            isDisabled: !unref(modelCity)
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8 m:w-full", unref(setClass).area]
          },
          onChange: ($event) => onAreaChange()
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.road !== null) {
        _push(ssrRenderComponent(_sfc_main$1, {
          name: `${props.name}_address_road`,
          modelValue: unref(modelRoad),
          "onUpdate:modelValue": ($event) => isRef(modelRoad) ? modelRoad.value = $event : null,
          options: unref(config).road.options,
          config: {
            placeholder: "請選擇路段",
            schema: unref(config).road.schema,
            noMatchClearLabel: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8 m:w-full", unref(setClass).road]
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.lane !== null) {
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_lane`,
          modelValue: unref(modelLane),
          "onUpdate:modelValue": ($event) => isRef(modelLane) ? modelLane.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).lane],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, {
          rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`巷`);
            } else {
              return [
                createTextVNode("巷")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.alley !== null) {
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_alley`,
          modelValue: unref(modelAlley),
          "onUpdate:modelValue": ($event) => isRef(modelAlley) ? modelAlley.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).alley],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, {
          rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`弄`);
            } else {
              return [
                createTextVNode("弄")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.number !== null) {
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_number`,
          modelValue: unref(modelNumber),
          "onUpdate:modelValue": ($event) => isRef(modelNumber) ? modelNumber.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).number],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, {
          rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`號`);
            } else {
              return [
                createTextVNode("號")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.ofNumber !== null) {
        _push(`<!--[--><span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>`);
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_of_number`,
          modelValue: unref(modelOfNumber),
          "onUpdate:modelValue": ($event) => isRef(modelOfNumber) ? modelOfNumber.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).ofNumber],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      if (props.floor !== null) {
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_floor`,
          modelValue: unref(modelFloor),
          "onUpdate:modelValue": ($event) => isRef(modelFloor) ? modelFloor.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).floor],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, {
          rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`樓`);
            } else {
              return [
                createTextVNode("樓")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.ofFloor !== null) {
        _push(`<!--[--><span class="h-40px flex items-center text-[16px] text-[--gray-666]">之</span>`);
        _push(ssrRenderComponent(_sfc_main$5, {
          name: `${props.name}_address_of_floor`,
          modelValue: unref(modelOfFloor),
          "onUpdate:modelValue": ($event) => isRef(modelOfFloor) ? modelOfFloor.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: ["--height-40 --px-12 --py-8", unref(setClass).ofFloor],
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mAddress.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=mAddress.BkXpTInt.js.map
