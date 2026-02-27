import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$3 from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./Terms.D5sV9wlY.js";
import _sfc_main$2 from "./Agree.4T62UWId.js";
import "./Label.BJzWF104.js";
import "./Main.Cqggwx2L.js";
import "./_prototype.Mf8Dpr9m.js";
import "./CheckBox.DTYspC36.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
const _sfc_main = {
  __name: "CardFilterTerms",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const items = shallowReadonly([
      {
        id: "terms",
        component: _sfc_main$1
      },
      {
        id: "agree",
        component: _sfc_main$2
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$3, mergeProps({
        title: props.title,
        items: unref(items)
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterTerms.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterTerms.BItxEcBH.js.map
