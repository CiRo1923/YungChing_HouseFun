import { computed, mergeProps, unref, isRef, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Select.BLbzLLvT.js";
import { _ as _sfc_main$2 } from "./Input.DngVdA-a.js";
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
        options: {
          city: null,
          area: null
        },
        schema: {
          label: "label",
          value: "value"
        },
        ...props.config
      };
    });
    const schema = computed(() => {
      const { schema: schema2 } = config.value;
      const hasCity = !!schema2.city;
      const hasArea = !!schema2.area;
      return {
        city: hasCity ? schema2.city : schema2,
        area: hasArea ? schema2.area : schema2
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
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-address flex flex-wrap gap-x-[8px] m:gap-y-[12px] pt:gap-y-[8px]", unref(setClass).main]
      }, _attrs))}>`);
      if (props.city !== null) {
        _push(ssrRenderComponent(_sfc_main$1, {
          name: `${props.name}_address_city`,
          modelValue: unref(modelCity),
          "onUpdate:modelValue": ($event) => isRef(modelCity) ? modelCity.value = $event : null,
          options: unref(config).options.city,
          config: {
            placeholder: "選擇縣市",
            schema: unref(schema).city
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 m:w-full",
            container: unref(setClass).city
          },
          onChange: ($event) => onCityChange()
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.area !== null) {
        _push(ssrRenderComponent(_sfc_main$1, {
          name: `${props.name}_address_area`,
          modelValue: unref(modelArea),
          "onUpdate:modelValue": ($event) => isRef(modelArea) ? modelArea.value = $event : null,
          options: unref(config).options.area,
          config: {
            placeholder: "選擇區域",
            schema: unref(schema).area,
            isDisabled: !unref(modelCity)
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 m:w-full",
            container: unref(setClass).area
          },
          onChange: ($event) => _ctx.onAreaChange()
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.road !== null) {
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_road`,
          modelValue: unref(modelRoad),
          "onUpdate:modelValue": ($event) => isRef(modelRoad) ? modelRoad.value = $event : null,
          config: {
            placeholder: "請選擇路段"
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 m:w-full",
            container: unref(setClass).road
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.lane !== null) {
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_lane`,
          modelValue: unref(modelLane),
          "onUpdate:modelValue": ($event) => isRef(modelLane) ? modelLane.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).lane,
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
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_alley`,
          modelValue: unref(modelAlley),
          "onUpdate:modelValue": ($event) => isRef(modelAlley) ? modelAlley.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).alley,
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
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_number`,
          modelValue: unref(modelNumber),
          "onUpdate:modelValue": ($event) => isRef(modelNumber) ? modelNumber.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).number,
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
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_of_number`,
          modelValue: unref(modelOfNumber),
          "onUpdate:modelValue": ($event) => isRef(modelOfNumber) ? modelOfNumber.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).ofNumber,
            rearAssist: "text-[14px] text-[--gray-999]"
          }
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      if (props.floor !== null) {
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_floor`,
          modelValue: unref(modelFloor),
          "onUpdate:modelValue": ($event) => isRef(modelFloor) ? modelFloor.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).floor,
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
        _push(ssrRenderComponent(_sfc_main$2, {
          name: `${props.name}_address_of_floor`,
          modelValue: unref(modelOfFloor),
          "onUpdate:modelValue": ($event) => isRef(modelOfFloor) ? modelOfFloor.value = $event : null,
          config: {
            isExistClose: false
          },
          setClass: {
            main: "--height-40 --px-12 --py-8",
            container: unref(setClass).ofFloor,
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
//# sourceMappingURL=mAddress.C-x2H1ny.js.map
