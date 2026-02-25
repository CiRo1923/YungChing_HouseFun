import { readonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.TpLHyNVG.js";
import { _ as _sfc_main$2 } from "./Select.BLbzLLvT.js";
import { u as useBuyProjectStore } from "./project.DqU6Ajm9.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.Kz_kpQ5n.js";
import "./_prototype.DwbhdnQa.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "Floor",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    const floorOPtion = readonly([
      {
        label: "單層",
        value: true
      },
      {
        label: "多層",
        value: false
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grow m:space-y-[12px] pt:space-y-[8px]" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "isSingleFloor",
        modelValue: unref(apiData).isSingleFloor,
        "onUpdate:modelValue": ($event) => unref(apiData).isSingleFloor = $event,
        options: unref(floorOPtion),
        setClass: {
          radios: "m:w-full",
          container: "m:flex-1"
        }
      }, null, _parent));
      _push(`<ul class="pt:flex"><li>`);
      _push(ssrRenderComponent(_sfc_main$2, {
        name: "floorFromToken",
        modelValue: unref(apiData).floorFromToken,
        "onUpdate:modelValue": ($event) => unref(apiData).floorFromToken = $event,
        options: unref(options).floor,
        config: {
          placeholder: "請選擇",
          schema: {
            label: "text",
            value: "value"
          }
        },
        rules: {
          required: "請選擇法定用途"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 grow"
        }
      }, null, _parent));
      _push(`</li></ul></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Floor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Floor.7dC-4C7t.js.map
