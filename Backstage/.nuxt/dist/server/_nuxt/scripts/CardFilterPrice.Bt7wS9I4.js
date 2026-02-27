import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$4 from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./CasePrice.CMUBxqhd.js";
import _sfc_main$2 from "./CaseParkingPrice.D0pIg4It.js";
import _sfc_main$3 from "./CasePriceUnit.DFguvDxw.js";
import "./Label.BJzWF104.js";
import "./Input.DrK-MnGh.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./CheckBox.DTYspC36.js";
import "./project.D4zrwblI.js";
import "pinia";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
const _sfc_main = {
  __name: "CardFilterPrice",
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
        id: "casePrice",
        isRequired: true,
        label: "總價",
        class: "p:h-[40px]",
        component: _sfc_main$1
      },
      {
        id: "caseParkingPrice",
        isRequired: false,
        label: "車位價",
        class: "p:h-[40px]",
        component: _sfc_main$2
      },
      {
        id: "casePriceUnit",
        isRequired: false,
        label: "單價",
        class: "p:h-[40px]",
        component: _sfc_main$3
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$4, mergeProps({
        title: props.title,
        items: unref(items)
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterPrice.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterPrice.Bt7wS9I4.js.map
