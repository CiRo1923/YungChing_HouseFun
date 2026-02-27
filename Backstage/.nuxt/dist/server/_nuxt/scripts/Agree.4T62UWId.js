import { ref, mergeProps, unref, isRef, withCtx, createTextVNode, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./CheckBox.DTYspC36.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
const _sfc_main = {
  __name: "Agree",
  __ssrInlineRender: true,
  setup(__props) {
    const isAgree = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        name: "isAgree",
        modelValue: unref(isAgree),
        "onUpdate:modelValue": ($event) => isRef(isAgree) ? isAgree.value = $event : null,
        config: {
          value: {
            true: true,
            false: false
          }
        },
        rules: {
          required: {
            valid: unref(isAgree) === false,
            errorMessage: "請勾選並同意好房會員服務使用條款"
          }
        },
        setClass: {
          label: "text-[16px]"
        }
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` 我已詳閱並同意 <a href="javascript:;" class="text-[--green-6a2d] underline"${_scopeId}>好房會員服務使用條款</a>`);
          } else {
            return [
              createTextVNode(" 我已詳閱並同意 "),
              createVNode("a", {
                href: "javascript:;",
                class: "text-[--green-6a2d] underline"
              }, "好房會員服務使用條款")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Terms/Agree.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Agree.4T62UWId.js.map
