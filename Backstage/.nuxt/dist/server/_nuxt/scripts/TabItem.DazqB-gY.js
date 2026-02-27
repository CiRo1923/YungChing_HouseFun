import { computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Main.Cqggwx2L.js";
import "./_prototype.Mf8Dpr9m.js";
const _sfc_main = {
  __name: "TabItem",
  __ssrInlineRender: true,
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    setClass: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const props = __props;
    const setClass = computed(() => {
      return {
        main: "",
        ...props.setClass
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        data: props.data,
        setClass: {
          main: unref(setClass).main,
          container: "text-[14px] text-[--gray-666]",
          item: "tracking-[0.043em]"
        }
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/TabItem.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=TabItem.DazqB-gY.js.map
