import { readonly, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import _sfc_main$1 from "./TabItem.BMi_ZI6Y.js";
import "./_prototype.DwbhdnQa.js";
const _sfc_main = {
  __name: "TabCheckID",
  __ssrInlineRender: true,
  setup(__props) {
    const items = readonly({
      label: "disc",
      items: [
        {
          item: "若無法匯入資訊，您可繼續手動填寫地址及其他資訊，完成刊登。"
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ data: unref(items) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/TabCheckID.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=TabCheckID.BihL8OUW.js.map
