import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$8 from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./Unit.DGsNrkJg.js";
import _sfc_main$2 from "./CaseBuildSq.CRE5GrP-.js";
import _sfc_main$3 from "./CaseParkingSq.BbLX9qd5.js";
import _sfc_main$4 from "./CaseMainSq.C0eZcl9g.js";
import _sfc_main$5 from "./CaseAffiliatedSq.BD3lh8Vp.js";
import _sfc_main$7 from "./CaseLandSq.D_6HxGUt.js";
import _sfc_main$6 from "./CaseAmenitieSq.B_BEoHg4.js";
import { u as useBuyBasicStore } from "./basic.BQ1dZmyM.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./Label.BJzWF104.js";
import "./RadiosOval.C_eW4Qov.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_validation.uUSMHlAI.js";
import "./_prototype.Mf8Dpr9m.js";
import "@vee-validate/rules";
import "./useStores.2GhJj387.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "./project.D4zrwblI.js";
import "./Input.DrK-MnGh.js";
import "./CheckBox.DTYspC36.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "CardFilterPing",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    const buyBasic = useBuyBasicStore();
    const { pingData } = storeToRefs(buyBasic);
    const props = __props;
    const items = shallowReadonly([
      {
        id: "unit",
        isRequired: false,
        label: "顯示單位",
        class: "p:h-[35px]",
        component: _sfc_main$1
      },
      {
        id: "caseBuildSq",
        isRequired: true,
        label: "登記坪數",
        class: "p:h-[40px]",
        component: _sfc_main$2
      },
      {
        id: "caseParkingSq",
        isRequired: false,
        label: "車位坪數",
        class: "p:h-[40px]",
        component: _sfc_main$3
      },
      {
        id: "caseMainSq",
        isRequired: false,
        label: "主建物",
        class: "p:h-[40px]",
        component: _sfc_main$4
      },
      {
        id: "caseAffiliatedSq",
        isRequired: false,
        label: "附屬建物",
        class: "p:h-[40px]",
        component: _sfc_main$5
      },
      {
        id: "caseAmenitieSq",
        isRequired: false,
        label: "公設",
        class: "p:h-[40px]",
        component: _sfc_main$6
      },
      {
        id: "caseLandSq",
        isRequired: false,
        label: "土地坪數",
        class: "p:h-[40px]",
        component: _sfc_main$7
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$8, mergeProps({
        title: props.title,
        items: unref(items)
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterPing.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterPing.DoDB4F92.js.map
