import { shallowReadonly, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Main.Cqggwx2L.js";
import "./_prototype.Mf8Dpr9m.js";
const _sfc_main = {
  __name: "Terms",
  __ssrInlineRender: true,
  setup(__props) {
    const data = shallowReadonly({
      label: "decimal",
      items: [
        {
          item: "依不動產經紀業管理條例",
          children: {
            label: "disc",
            items: [
              {
                item: "若未與委託人簽訂契約書，無法刊登廣告及銷售且銷售內容需與事實相符，違者依不動產經紀業管理條例第 29 條第 1 項第 3 款規定，應處新台幣 6 萬元以上 30 萬元以下罰鍰。"
              },
              {
                item: "未經主管機關許可者，不得從事仲介業務，違者依不動產經紀業管理條例第32條規定，應處新台幣 10 萬元以上 30 萬元以下罰鍰。"
              }
            ]
          }
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        data: unref(data),
        setClass: {
          container: "text-[14px] text-[--gray-666]",
          item: "tracking-[0.043em]"
        }
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Terms/Terms.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Terms.D5sV9wlY.js.map
