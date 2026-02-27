import { mergeProps, unref, withCtx, createVNode, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
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
  __name: "CaseTitle",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { apiData } = storeToRefs(buyProject);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        name: "caseTitle",
        modelValue: unref(apiData).caseTitle,
        "onUpdate:modelValue": ($event) => unref(apiData).caseTitle = $event,
        config: {
          placeholder: "請輸入物件標題",
          maxlength: 25,
          formatLength: "{length} / {maxlength}"
        },
        rules: {
          required: "請輸入物件標題"
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 grow",
          element: "grow",
          length: "text-[14px] text-[--gray-999]",
          suffix: "block text-[14px] text-[--gray-999] tm:mt-[8px] p:mt-[4px]"
        }
      }, _attrs), {
        suffix: withCtx(({ maxlength, length }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<p class="before:content-[attr(data-label)]" data-label="•"${_scopeId}> 還差 <span class="text-[--orange-e646]"${_scopeId}>${ssrInterpolate(maxlength - length)}</span> 個字符合優質排序 </p>`);
          } else {
            return [
              createVNode("p", {
                class: "before:content-[attr(data-label)]",
                "data-label": "•"
              }, [
                createTextVNode(" 還差 "),
                createVNode("span", { class: "text-[--orange-e646]" }, toDisplayString(maxlength - length), 1),
                createTextVNode(" 個字符合優質排序 ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/CaseTitle.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CaseTitle.BsxxYezF.js.map
