import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$5 from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./InfoImport.CDfi5Idj.js";
import _sfc_main$2 from "./AgentName.SvLasZhq.js";
import _sfc_main$3 from "./AgentPhone.CDsBC7E1.js";
import _sfc_main$4 from "./AgentLine.CY3xArAq.js";
import "./Label.BJzWF104.js";
import "./RadiosOval.C_eW4Qov.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_validation.uUSMHlAI.js";
import "./_prototype.Mf8Dpr9m.js";
import "@vee-validate/rules";
import "./basic.BQ1dZmyM.js";
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
import "./CheckBox.DTYspC36.js";
import "./project.D4zrwblI.js";
const _sfc_main = {
  __name: "CardFilterPosterInfo",
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
        id: "infoImport",
        isRequired: false,
        label: "匯入資訊",
        class: "p:h-[35px]",
        component: _sfc_main$1
      },
      {
        id: "agentName",
        isRequired: true,
        label: "姓名",
        class: "p:h-[40px]",
        component: _sfc_main$2
      },
      {
        id: "agentPhone",
        isRequired: true,
        label: "行動電話",
        class: "p:h-[40px]",
        component: _sfc_main$3
      },
      {
        id: "agentLine",
        isRequired: false,
        label: "LINE 聯絡",
        class: "p:h-[40px]",
        component: _sfc_main$4
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$5, mergeProps({
        title: props.title,
        items: unref(items)
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterPosterInfo.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterPosterInfo.C3jDV46p.js.map
