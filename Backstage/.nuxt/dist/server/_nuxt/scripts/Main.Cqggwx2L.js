import { ref, computed, resolveComponent, createVNode, resolveDynamicComponent, mergeProps, withCtx, openBlock, createBlock, Fragment, renderList, useSSRContext } from "vue";
import { ssrRenderVNode, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderAttrs, ssrInterpolate } from "vue/server-renderer";
import { d as deepMerge } from "./_prototype.Mf8Dpr9m.js";
const __default__ = {
  name: "MItemContainer"
};
const _sfc_main$1 = /* @__PURE__ */ Object.assign(__default__, {
  __ssrInlineRender: true,
  props: {
    data: {
      type: Object,
      default: () => {
      }
    },
    config: {
      type: Object,
      default: () => {
      }
    },
    setClass: {
      type: Object,
      default: () => {
      }
    }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const containerRef = ref(null);
    const labelFirst = computed(() => props.data[0] && props.data[0].label || "");
    const setClass = computed(() => {
      return {
        ...{
          container: "",
          item: ""
        },
        ...props.setClass
      };
    });
    const isChinese = computed(
      () => /[\u4e00-\u9fa5]/.test(props.data.label) || /[\u4e00-\u9fa5]/.test(labelFirst.value)
    );
    const isDefaultLabel = computed(() => /(decimal|disc|zh|alpha|roman)/.test(props.data.label));
    const stringLabel = computed(() => isDefaultLabel.value ? String(props.data.label) : null);
    const labelClass = computed(() => stringLabel.value ? `--${stringLabel.value}` : "");
    const labelData = computed(
      () => props.data.label && !isDefaultLabel.value ? props.data.label : null
    );
    const as = computed(() => {
      const { as: as2 } = props.config || {};
      return as2 ? as2 : /disc/.test(labelFirst.value) || /disc/.test(props.data.label) || isChinese ? "ul" : "ol";
    });
    __expose({
      container: containerRef
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_m_item_container = resolveComponent("m-item-container");
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(as.value), mergeProps({
        class: ["m-item-container", [labelClass.value, setClass.value.container]],
        key: "m-item_" + props.data.items.length,
        ref_key: "containerRef",
        ref: containerRef
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<!--[-->`);
            ssrRenderList(props.data.items, (item, index) => {
              _push2(`<li class="${ssrRenderClass([setClass.value.item, "m-item-container-list flex items-baseline"])}"${ssrRenderAttr("data-label", labelData.value)}${_scopeId}>`);
              if (!item.children) {
                _push2(`<p class="grow"${_scopeId}>${item.item ?? ""}</p>`);
              } else {
                _push2(`<div class="grow"${_scopeId}><p${_scopeId}>${item.item ?? ""}</p>`);
                _push2(ssrRenderComponent(_component_m_item_container, mergeProps({
                  data: item.children,
                  key: "m-item_" + index + "_" + item.children.length
                }, { ref_for: true }, __props.config.childrenUseRootClass ? { setClass: setClass.value } : ""), null, _parent2, _scopeId));
                _push2(`</div>`);
              }
              _push2(`</li>`);
            });
            _push2(`<!--]-->`);
          } else {
            return [
              (openBlock(true), createBlock(Fragment, null, renderList(props.data.items, (item, index) => {
                return openBlock(), createBlock("li", {
                  class: ["m-item-container-list flex items-baseline", setClass.value.item],
                  "data-label": labelData.value,
                  key: `m_item_${index}`
                }, [
                  !item.children ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "grow",
                    innerHTML: item.item
                  }, null, 8, ["innerHTML"])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "grow"
                  }, [
                    createVNode("p", {
                      innerHTML: item.item
                    }, null, 8, ["innerHTML"]),
                    (openBlock(), createBlock(_component_m_item_container, mergeProps({
                      data: item.children,
                      key: "m-item_" + index + "_" + item.children.length
                    }, { ref_for: true }, __props.config.childrenUseRootClass ? { setClass: setClass.value } : ""), null, 16, ["data"]))
                  ]))
                ], 10, ["data-label"]);
              }), 128))
            ];
          }
        }),
        _: 1
      }), _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mItem/Container.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "Main",
  __ssrInlineRender: true,
  props: {
    data: {
      type: Object,
      default: () => {
      }
    },
    config: {
      type: Object,
      default: () => {
      }
    },
    setClass: {
      type: Object,
      default: () => {
      }
    }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const mainRef = ref(null);
    const containerRef = ref(null);
    const containerRefElement = computed(() => containerRef.value?.container);
    const config = computed(() => {
      const defaultConfig = {
        as: null,
        header: {
          label: "",
          icon: null
        },
        childrenUseRootClass: false
      };
      return deepMerge(defaultConfig, props.config);
    });
    const setClass = computed(() => {
      return {
        main: "",
        header: "",
        label: "",
        ...props.setClass
      };
    });
    __expose({
      item: mainRef,
      container: containerRefElement
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-item", setClass.value.main],
        ref_key: "mainRef",
        ref: mainRef
      }, _attrs))}>`);
      if (config.value.header.label) {
        _push(`<div class="${ssrRenderClass(setClass.value.header)}"><p class="inline-flex m:text-[13px] pt:text-[14px]"><b class="${ssrRenderClass([setClass.value.label, "grow font-medium"])}">${ssrInterpolate(config.value.header.label)}</b></p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_sfc_main$1, {
        data: props.data,
        setClass: props.setClass,
        config: config.value,
        ref_key: "containerRef",
        ref: containerRef
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mItem/Main.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=Main.Cqggwx2L.js.map
