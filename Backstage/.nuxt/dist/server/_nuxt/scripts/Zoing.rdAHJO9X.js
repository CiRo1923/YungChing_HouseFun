import { ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./RadiosOval.TpLHyNVG.js";
import { _ as _sfc_main$2 } from "./Select.BLbzLLvT.js";
import { _ as _sfc_main$3 } from "./Input.DngVdA-a.js";
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
  __name: "Zoing",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    const isCaseZoingOtherShow = ref(false);
    const onCaseZoingChange = () => {
      apiData.value.caseZoingTypeToken = "";
    };
    const onCaseZoingTypeChange = (props) => {
      const { text } = props;
      isCaseZoingOtherShow.value = text === "其他";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grow m:space-y-[12px] pt:space-y-[8px]" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseZoingToken",
        modelValue: unref(apiData).caseZoingToken,
        "onUpdate:modelValue": ($event) => unref(apiData).caseZoingToken = $event,
        options: unref(options).caseZoing,
        config: {
          schema: {
            label: "text",
            value: "code"
          }
        },
        setClass: {
          radios: "m:w-full",
          container: "m:flex-1"
        },
        onChange: onCaseZoingChange
      }, null, _parent));
      _push(`<div class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">`);
      if (unref(apiData).caseZoingToken === "1") {
        _push(ssrRenderComponent(_sfc_main$2, {
          name: "caseZoingCity",
          modelValue: unref(apiData).caseZoingTypeToken,
          "onUpdate:modelValue": ($event) => unref(apiData).caseZoingTypeToken = $event,
          options: unref(options).zoingCity,
          config: {
            placeholder: "請選擇都市土地",
            schema: {
              label: "text",
              value: "value"
            }
          },
          rules: {
            required: "請選擇都市土地"
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 pt:flex-1"
          },
          onChange: onCaseZoingTypeChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(apiData).caseZoingToken === "2") {
        _push(ssrRenderComponent(_sfc_main$2, {
          name: "caseZoingLand",
          modelValue: unref(apiData).caseZoingTypeToken,
          "onUpdate:modelValue": ($event) => unref(apiData).caseZoingTypeToken = $event,
          options: unref(options).zoingLand,
          config: {
            placeholder: "請選擇非都市土地",
            schema: {
              label: "text",
              value: "value"
            }
          },
          rules: {
            required: "請選擇非都市土地"
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 pt:flex-1"
          },
          onChange: onCaseZoingTypeChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(isCaseZoingOtherShow)) {
        _push(ssrRenderComponent(_sfc_main$3, {
          name: "caseZoingTypeOther",
          modelValue: unref(apiData).caseZoingTypeOther,
          "onUpdate:modelValue": ($event) => unref(apiData).caseZoingTypeOther = $event,
          config: {
            placeholder: "請填寫"
          },
          rules: {
            required: "請填寫"
          },
          setClass: {
            main: "--height-40 --px-12 --py-8 pt:flex-1"
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Zoing.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Zoing.rdAHJO9X.js.map
