import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$2 } from "./CheckBox.DTYspC36.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import { u as useBuyBasicStore } from "./basic.BQ1dZmyM.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "AgentName",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const buyBasic = useBuyBasicStore();
    const { apiData } = storeToRefs(buyProject);
    const { posterInfoImport } = storeToRefs(buyBasic);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "agentName",
        modelValue: unref(apiData).posterInfo.agentName,
        "onUpdate:modelValue": ($event) => unref(apiData).posterInfo.agentName = $event,
        config: {
          isDisabled: unref(posterInfoImport) === "same"
        },
        rules: {
          required: "請輸入姓名"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]",
          element: "grow"
        }
      }, null, _parent));
      _push(`</li><li class="flex h-[40px] items-center">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "isShowNickname",
        modelValue: unref(apiData).posterInfo.isShowNickname,
        "onUpdate:modelValue": ($event) => unref(apiData).posterInfo.isShowNickname = $event,
        config: {
          label: "同時顯示暱稱",
          value: {
            true: true,
            false: false
          }
        },
        setClass: {
          label: "text-[16px]"
        }
      }, null, _parent));
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/PosterInfo/AgentName.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=AgentName.SvLasZhq.js.map
