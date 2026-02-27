import { shallowReadonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$i from "./CardFilter.DVAJog-e.js";
import _sfc_main$1 from "./CasePurpose.BQzOFLrZ.js";
import _sfc_main$2 from "./CaseTitle.BsxxYezF.js";
import _sfc_main$3 from "./Address.BjySqDv0.js";
import _sfc_main$4 from "./CaseType.q3o81DDG.js";
import _sfc_main$5 from "./CaseUsage.VrE8IW01.js";
import _sfc_main$6 from "./Zoing.Dt0omGwz.js";
import _sfc_main$7 from "./CaseLandNo.CYAFur-V.js";
import _sfc_main$8 from "./Floor.D0wdvBsO.js";
import _sfc_main$9 from "./TotalFloor.nLAVd_ZJ.js";
import _sfc_main$a from "./BuildingAge.ChTqM3gT.js";
import _sfc_main$b from "./Community.CTUtfrBJ.js";
import _sfc_main$c from "./HouseLayout.BthTozck.js";
import _sfc_main$d from "./HouseAddLayout.MsK_EeUz.js";
import _sfc_main$e from "./Elevator.Dk2mLNJR.js";
import _sfc_main$f from "./Face.tGYHUew8.js";
import _sfc_main$g from "./Structure.BZJKtkNp.js";
import _sfc_main$h from "./BarrierFree.Dtf2HTff.js";
import "./Label.BJzWF104.js";
import "./RadiosOval.C_eW4Qov.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_validation.uUSMHlAI.js";
import "./_prototype.Mf8Dpr9m.js";
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
import "./mAddress.BkXpTInt.js";
import "./Select.BLaGw9UN.js";
import "./useStores.2GhJj387.js";
import "./basic.BQ1dZmyM.js";
import "./RadiosOval.NzLPxeP9.js";
import "./CheckBox.DTYspC36.js";
const _sfc_main = {
  __name: "CardFilterInfo",
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
        id: "casePurpose",
        isRequired: true,
        label: "現況",
        class: "p:h-[35px]",
        component: _sfc_main$1
      },
      {
        id: "caseTitle",
        isRequired: true,
        label: "物件標題",
        class: "p:h-[40px]",
        component: _sfc_main$2
      },
      {
        id: "address",
        isRequired: true,
        label: "地址",
        class: "p:h-[40px]",
        component: _sfc_main$3
      },
      {
        id: "caseType",
        isRequired: true,
        label: "型態",
        class: "p:h-[40px]",
        component: _sfc_main$4
      },
      {
        id: "caseUsage",
        isRequired: true,
        label: "法定用途",
        class: "p:h-[40px]",
        component: _sfc_main$5
      },
      {
        id: "zoing",
        isRequired: true,
        label: "土地分區",
        class: "p:h-[35px]",
        component: _sfc_main$6
      },
      {
        id: "caseLandNo",
        isRequired: true,
        label: "地號",
        class: "p:h-[40px]",
        component: _sfc_main$7
      },
      {
        id: "floor",
        isRequired: true,
        label: "出售樓層",
        class: "p:h-[35px]",
        component: _sfc_main$8
      },
      {
        id: "totalFloor",
        isRequired: true,
        label: "總樓高",
        class: "p:h-[40px]",
        component: _sfc_main$9
      },
      {
        id: "buildingAge",
        isRequired: true,
        label: "屋齡",
        class: "p:h-[35px]",
        component: _sfc_main$a
      },
      {
        id: "community",
        isRequired: true,
        label: "社區",
        class: "p:h-[35px]",
        component: _sfc_main$b
      },
      {
        id: "houseLayout",
        isRequired: true,
        label: "格局",
        class: "p:h-[40px]",
        component: _sfc_main$c
      },
      {
        id: "houseAddLayout",
        isRequired: false,
        label: "加蓋格局",
        class: "p:h-[40px]",
        component: _sfc_main$d
      },
      {
        id: "elevator",
        isRequired: false,
        label: "電梯",
        class: "p:h-[35px]",
        component: _sfc_main$e
      },
      {
        id: "face",
        isRequired: false,
        label: "朝向",
        class: "p:h-[40px]",
        component: _sfc_main$f
      },
      {
        id: "structure",
        isRequired: false,
        label: "建物結構",
        class: "p:h-[40px]",
        component: _sfc_main$g
      },
      {
        id: "barrierFree",
        isRequired: false,
        label: "無障礙設施",
        class: "p:h-[25px]",
        component: _sfc_main$h
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$i, mergeProps({
        title: props.title,
        items: unref(items)
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterInfo.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterInfo.DlQAbcW0.js.map
