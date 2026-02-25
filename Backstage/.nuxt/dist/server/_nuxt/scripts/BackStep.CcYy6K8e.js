import { readonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$1 from "./BackStep.Bl315U_a.js";
import "./mAnchor.CraGu5-t.js";
import "./SvgIcon.CBDcrtuZ.js";
const _sfc_main = {
  __name: "BackStep",
  __ssrInlineRender: true,
  props: {
    active: {
      type: Number,
      default: 0
    }
  },
  setup(__props) {
    const props = __props;
    const stepOptions = readonly([
      {
        label: "編輯資料"
      },
      {
        label: "選擇額度"
      },
      {
        label: "完成刊登"
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        stepOptions: unref(stepOptions),
        config: {
          active: props.active
        }
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/BackStep.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=BackStep.CcYy6K8e.js.map
