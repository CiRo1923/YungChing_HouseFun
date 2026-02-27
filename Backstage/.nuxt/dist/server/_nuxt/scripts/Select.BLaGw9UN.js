import { ref, computed, watch, unref, withCtx, mergeProps, createVNode, withKeys, openBlock, createBlock, Fragment, createTextVNode, toDisplayString, createCommentVNode, renderSlot, nextTick, useSSRContext } from "vue";
import { ssrRenderClass, ssrRenderComponent, ssrRenderAttrs, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderSlot, ssrRenderTeleport, ssrRenderList } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./SvgIcon.CBDcrtuZ.js";
import { a as Field, E as ErrorMessage, _ as _sfc_main$2 } from "./mForm.css.yrdBraIC.js";
import { d as deepMerge, b as deepClone, e as emptyData } from "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
const borderWidth = 0;
const _sfc_main = {
  __name: "Select",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: null
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null
    },
    options: {
      type: [Array, Object],
      default: null
    },
    config: {
      type: Object,
      default: () => {
      }
    },
    rules: {
      type: Object,
      default: null
    },
    setClass: {
      type: Object,
      default: () => {
      }
    }
  },
  emits: ["update:modelValue", "change"],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const elenemtRef = ref(null);
    const selectRef = ref(null);
    const dropdownRef = ref(null);
    const dropdownContainerRef = ref(null);
    const dropdownItemRef = ref(null);
    ref(null);
    const isFocus = ref(false);
    const isActive = ref(false);
    const selectedIndex = ref(-1);
    const label = ref(null);
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
        arrowType: "caret",
        startOption: null,
        placeholder: null,
        isDisabled: false,
        isError: false,
        position: "auto",
        // dropdownWidth: 'auto',
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
          suffix: "",
          error: "",
          dropdown: "",
          dropdownContainer: ""
        },
        ...props.setClass
      };
    });
    const placeholder = computed(() => {
      const { placeholder: placeholder2 } = config.value;
      const isObject = placeholder2 && typeof placeholder2 !== "string";
      return isObject ? placeholder2 : {
        value: placeholder2,
        isToOption: false
      };
    });
    const options = computed(() => {
      const { schema } = config.value;
      const { value, isToOption } = placeholder.value;
      const options2 = props.options ? deepClone(props.options) : [];
      const placeholderItem = emptyData(deepClone(options2[0]));
      if (isToOption) {
        placeholderItem[schema.label] = value;
        placeholderItem[schema.value] = "";
        options2.unshift(placeholderItem);
      }
      return options2;
    });
    const onSetSelectedIndex = () => {
      const { startOption } = config.value;
      let index = -1;
      if (options.value) {
        if (startOption) {
          index = options.value.findIndex((item) => item.value === startOption);
        } else {
          index = options.value.findIndex((item) => item[config.value.schema.value] === model.value);
        }
        label.value = index !== -1 ? options.value[index][config.value.schema.label] : null;
      }
      selectedIndex.value = index;
    };
    const onSwitchActive = (value) => {
      isFocus.value = value !== void 0 ? value : !isFocus.value;
      isActive.value = value !== void 0 ? value : !isActive.value;
    };
    const onElementClick = async () => {
      onSwitchActive();
      await nextTick();
      onDropdownOpen();
    };
    const onDropdownOpen = () => {
      const { maxItems } = config.value;
      const $elenemt = elenemtRef.value;
      const $dropdown = dropdownRef.value;
      const $dropdownContainer = dropdownContainerRef.value;
      const element = {
        rect: elenemtRef.value.getBoundingClientRect()
      };
      if ($elenemt && $dropdown && $dropdownContainer) {
        const hasItemsThanMax = maxItems <= dropdownItemRef.value.length - 1;
        if (hasItemsThanMax) {
          $dropdownContainer.style.overflowY = "auto";
        }
        const index = !hasItemsThanMax ? dropdownItemRef.value.length - 1 : maxItems;
        const $item = dropdownItemRef.value ? dropdownItemRef.value[index] : null;
        const dropdown = {
          rect: dropdownRef.value.getBoundingClientRect()
        };
        const itemHeight = $item ? hasItemsThanMax ? $item.offsetTop : $item.offsetTop + $item.offsetHeight : 0;
        const offsetTop = element.rect.height + element.rect.top + (void 0).scrollY;
        const offsetLeftMin = dropdown.rect.width + element.rect.left;
        const dropdownWidth = dropdown.rect.width < element.rect.width ? element.rect.width : dropdown.rect.width;
        const offsetLeftMax = element.rect.width + element.rect.left - dropdownWidth;
        const bodyWidth = (void 0).body.scrollWidth;
        const left = (offsetLeftMin > bodyWidth && offsetLeftMax < 0 || offsetLeftMin < bodyWidth) && config.value.position !== "right" ? element.rect.left : offsetLeftMax;
        const maxHeight = itemHeight + borderWidth;
        $dropdown.style.height = `${maxHeight}px`;
        $dropdown.style.top = `${offsetTop - borderWidth * 2}px`;
        $dropdown.style.left = `${left - borderWidth}px`;
        if (dropdown.rect.width < element.rect.width) {
          $dropdown.style.minWidth = `${element.rect.width}px`;
        }
        if (model.value !== null && model.value !== "") {
          selectedIndex.value = options.value.findIndex(
            (item) => item[config.value.schema.value] === model.value
          );
          const $selectedItem = dropdownItemRef.value[selectedIndex.value];
          const selectedItem = {
            rect: $selectedItem.getBoundingClientRect()
          };
          $dropdownContainer.scrollTop = $selectedItem.offsetTop + selectedItem.rect.height / 2 - maxHeight / 2;
        }
      }
    };
    const onDropdownArrow = (e) => {
      const { code } = e;
      e.preventDefault();
      if (config.value.keyboard && options.value.length > 0) {
        selectedIndex.value = code === "ArrowDown" ? ++selectedIndex.value : --selectedIndex.value;
        if (selectedIndex.value >= options.value.length) {
          selectedIndex.value = selectedIndex.value % options.value.length;
        } else if (selectedIndex.value < 0) {
          selectedIndex.value = options.value.length - 1;
        }
        const $dropdown = dropdownRef.value;
        const $dropdownItemRef = dropdownItemRef.value[selectedIndex.value];
        const dropdown = {
          rect: dropdownRef.value.getBoundingClientRect()
        };
        const dropdownItem = {
          rect: $dropdownItemRef.getBoundingClientRect()
        };
        if (selectedIndex.value !== 0 && selectedIndex.value !== options.value.length - 1) {
          if (code === "ArrowDown") {
            if ($dropdown.scrollTop + dropdown.rect.height <= $dropdownItemRef.offsetTop) {
              $dropdown.scrollTop = $dropdown.scrollTop + dropdownItem.rect.height;
            }
          } else {
            if ($dropdown.scrollTop > $dropdownItemRef.offsetTop) {
              $dropdown.scrollTop = $dropdown.scrollTop - dropdownItem.rect.height;
            }
          }
        } else {
          if (selectedIndex.value === 0) {
            $dropdown.scrollTop = 0;
          } else {
            $dropdown.scrollTop = (options.value.length - config.value.maxItems) * dropdownItem.rect.height;
          }
        }
        const result = options.value[selectedIndex.value];
        model.value = result[config.value.schema.value];
        label.value = result[config.value.schema.label];
      }
    };
    const onDropdownEnter = () => {
      const $selectRef = selectRef.value;
      onSwitchActive(false);
      $selectRef.blur();
    };
    watch(
      () => model.value,
      () => {
        onSetSelectedIndex();
      }
    );
    watch(
      () => options.value,
      () => {
        onSetSelectedIndex();
      },
      {
        deep: true
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><div class="${ssrRenderClass([setClass.value.main, "m-form"])}">`);
      _push(ssrRenderComponent(unref(Field), {
        name: props.name,
        modelValue: model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        rules: config.value.isDisabled ? "" : props.rules
      }, {
        default: withCtx(({ field, errorMessage }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<input${ssrRenderAttrs(mergeProps({
              type: "hidden",
              id: props.name
            }, field))}${_scopeId}><div class="${ssrRenderClass([setClass.value.container, "m-form-container flex"])}"${_scopeId}><button type="button" class="${ssrRenderClass([[
              setClass.value.element,
              { "--focus": isFocus.value },
              { "--error": errorMessage || config.value.isError }
            ], "m-form-element --select grow text-left"])}"${ssrIncludeBooleanAttr(config.value.isDisabled) ? " disabled" : ""}${_scopeId}><div class="${ssrRenderClass([[
              setClass.value.type,
              {
                "--placeholder": !label.value || !model.value
              }
            ], "m-form-type w-full cursor-pointer truncate"])}"${_scopeId}>`);
            if (label.value) {
              _push2(`<!--[-->${ssrInterpolate(options.value[selectedIndex.value][config.value.schema.label])}<!--]-->`);
            } else if (!label.value && placeholder.value.value) {
              _push2(`<!--[-->${ssrInterpolate(placeholder.value.value)}<!--]-->`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (config.value.arrowType === "caret") {
              _push2(ssrRenderComponent(_sfc_main$1, {
                icon: "caret_large_down",
                class: ["m-form-icon h-[14px] w-[14px] shrink-0 p-[2px] transition-transform duration-300", setClass.value.icon]
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (config.value.arrowType === "arrow") {
              _push2(`<i class="m-form-icon-arrow h-[16px] w-[16px] shrink-0"${_scopeId}></i>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</button>`);
            if (_ctx.$slots.suffix) {
              _push2(`<small class="${ssrRenderClass([setClass.value.suffix, "m-form-suffix"])}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "suffix", {}, null, _push2, _parent2, _scopeId);
              _push2(`</small>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("input", mergeProps({
                type: "hidden",
                id: props.name
              }, field), null, 16, ["id"]),
              createVNode("div", {
                class: ["m-form-container flex", setClass.value.container]
              }, [
                createVNode("button", {
                  type: "button",
                  class: ["m-form-element --select grow text-left", [
                    setClass.value.element,
                    { "--focus": isFocus.value },
                    { "--error": errorMessage || config.value.isError }
                  ]],
                  disabled: config.value.isDisabled,
                  ref_key: "elenemtRef",
                  ref: elenemtRef,
                  onClick: ($event) => onElementClick(),
                  onKeydown: [
                    withKeys(($event) => onDropdownArrow($event), ["up"]),
                    withKeys(($event) => onDropdownArrow($event), ["down"])
                  ],
                  onKeypress: withKeys(onDropdownEnter, ["enter"])
                }, [
                  createVNode("div", {
                    class: ["m-form-type w-full cursor-pointer truncate", [
                      setClass.value.type,
                      {
                        "--placeholder": !label.value || !model.value
                      }
                    ]],
                    ref_key: "selectRef",
                    ref: selectRef
                  }, [
                    label.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createTextVNode(toDisplayString(options.value[selectedIndex.value][config.value.schema.label]), 1)
                    ], 64)) : !label.value && placeholder.value.value ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                      createTextVNode(toDisplayString(placeholder.value.value), 1)
                    ], 64)) : createCommentVNode("", true)
                  ], 2),
                  config.value.arrowType === "caret" ? (openBlock(), createBlock(_sfc_main$1, {
                    key: 0,
                    icon: "caret_large_down",
                    class: ["m-form-icon h-[14px] w-[14px] shrink-0 p-[2px] transition-transform duration-300", setClass.value.icon]
                  }, null, 8, ["class"])) : createCommentVNode("", true),
                  config.value.arrowType === "arrow" ? (openBlock(), createBlock("i", {
                    key: 1,
                    class: "m-form-icon-arrow h-[16px] w-[16px] shrink-0"
                  })) : createCommentVNode("", true)
                ], 42, ["disabled", "onClick", "onKeydown"]),
                _ctx.$slots.suffix ? (openBlock(), createBlock("small", {
                  key: 0,
                  class: ["m-form-suffix", setClass.value.suffix]
                }, [
                  renderSlot(_ctx.$slots, "suffix")
                ], 2)) : createCommentVNode("", true)
              ], 2)
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(ssrRenderComponent(unref(ErrorMessage), {
        as: "span",
        name: props.name,
        class: ["m-form-error", setClass.value.error]
      }, {
        default: withCtx(({ message }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$2, { message }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$2, { message }, null, 8, ["message"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        _push2(`<template>`);
        if (isActive.value && options.value && options.value.length !== 0 && !config.value.isDisabled) {
          _push2(`<div class="${ssrRenderClass([setClass.value.dropdown, "m-select-dropdown absolute z-[5] mt-[3px] overflow-hidden"])}"><ul class="${ssrRenderClass([setClass.value.dropdownContainer, "m-select-dropdown-container max-h-full bg-[--white]"])}"><!--[-->`);
          ssrRenderList(options.value, (item, index) => {
            _push2(`<li class="m-select-dropdown-item"><button type="button" class="${ssrRenderClass([{
              "--active": index === selectedIndex.value
            }, "m-select-dropdown-button block w-full px-[8px] text-left transition-colors duration-300"])}"${ssrIncludeBooleanAttr(item[config.value.schema.isDisabled] === true) ? " disabled" : ""}><em class="m-select-dropdown-label relative block grow py-[8px] text-[14px]">`);
            ssrRenderSlot(_ctx.$slots, "option", { item }, () => {
              _push2(`${ssrInterpolate(item[config.value.schema.label])}`);
            }, _push2, _parent);
            _push2(`</em></button></li>`);
          });
          _push2(`<!--]--></ul></div>`);
        } else {
          _push2(`<!---->`);
        }
        _push2(`</template>`);
      }, "body", false, _parent);
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mForm/Select.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=Select.BLaGw9UN.js.map
