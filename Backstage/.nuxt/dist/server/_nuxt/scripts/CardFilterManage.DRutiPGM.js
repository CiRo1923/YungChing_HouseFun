import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$4 from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./CaseManageType.Qc3RmhUu.js";
import _sfc_main$2 from "./CaseManageDuty.8pbPdxxm.js";
import _sfc_main$3 from "./CaseManagePay.CiM1kFsV.js";
import "./Label.BJzWF104.js";
import "./Select.BLaGw9UN.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
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
import "./Input.DrK-MnGh.js";
const _sfc_main = {
  __name: "CardFilterManage",
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
        id: "caseManageType",
        isRequired: false,
        label: "管理方式",
        class: "p:h-[40px]",
        component: _sfc_main$1
      },
      {
        id: "caseManageDuty",
        isRequired: false,
        label: "管理時段",
        class: "p:h-[40px]",
        component: _sfc_main$2
      },
      {
        id: "caseManagePay",
        isRequired: false,
        label: "管理費",
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterManage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterManage.DRutiPGM.js.map
