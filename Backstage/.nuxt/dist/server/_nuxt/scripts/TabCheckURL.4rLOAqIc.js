import { ref, readonly, unref, mergeProps, withCtx, isRef, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Label.BJzWF104.js";
import { _ as _sfc_main$2 } from "./Input.DrK-MnGh.js";
import { _ as _sfc_main$3 } from "./mAnchor.D_ir9u_b.js";
import _sfc_main$4 from "./TabItem.DazqB-gY.js";
import { F as Form } from "./mForm.css.yrdBraIC.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./Main.Cqggwx2L.js";
const _sfc_main = {
  __name: "TabCheckURL",
  __ssrInlineRender: true,
  setup(__props) {
    const url = ref(null);
    const items = readonly({
      label: "disc",
      items: [
        {
          item: "您可以輸入其他房仲網站的物件網址，系統將為您快速帶入資料，匯入後您仍可修改資料。"
        },
        {
          item: "支援匯入網站：591、Yes319、21 世紀不動產、ERA 易而安、大家房屋、大師房屋、中信房屋、太平洋房屋、台灣房屋、永春不動產、永義房屋、永慶房仲網、全國不動產、好房網、住商不動產、幸福家不動產、東森房屋、東龍不動產、信義房屋、南北房屋、惠雙房屋、群義房屋、樂屋網。"
        },
        {
          item: "各品牌物件資料更新需要作業時間，若匯入物件失敗時，請於 2-3 小時後再次匯入。"
        }
      ]
    });
    const onClick = async (validate) => {
      const { valid } = await validate();
      if (valid) {
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(Form), mergeProps({ as: "div" }, _attrs), {
        default: withCtx(({ validate }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p:flex p:gap-x-[16px]"${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$1, {
              label: "網址匯入",
              config: {
                isRequired: false
              },
              setClass: {
                main: "shrink-0 p:ml-[12px] p:flex p:h-[40px] p:items-center"
              }
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_sfc_main$2, {
              name: "URL",
              modelValue: unref(url),
              "onUpdate:modelValue": ($event) => isRef(url) ? url.value = $event : null,
              config: {
                placeholder: "請輸入"
              },
              rules: {
                custom: {
                  valid: /^http/.test(unref(url)),
                  errorMessage: "請輸入正確網址格式"
                }
              },
              setClass: {
                main: "--height-40 --px-12 --py-8 grow"
              }
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_sfc_main$3, {
              text: "匯入資料",
              config: {
                isDisabled: !unref(url)
              },
              setClass: {
                main: "--oval --height-40 --px-20 --py-5 --bg-green-6a2d --text-white shrink-0",
                text: "font-semibold"
              },
              onClick: ($event) => onClick(validate)
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
            _push2(ssrRenderComponent(_sfc_main$4, {
              data: unref(items),
              setClass: {
                main: "mt-[16px]"
              }
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "p:flex p:gap-x-[16px]" }, [
                createVNode(_sfc_main$1, {
                  label: "網址匯入",
                  config: {
                    isRequired: false
                  },
                  setClass: {
                    main: "shrink-0 p:ml-[12px] p:flex p:h-[40px] p:items-center"
                  }
                }),
                createVNode(_sfc_main$2, {
                  name: "URL",
                  modelValue: unref(url),
                  "onUpdate:modelValue": ($event) => isRef(url) ? url.value = $event : null,
                  config: {
                    placeholder: "請輸入"
                  },
                  rules: {
                    custom: {
                      valid: /^http/.test(unref(url)),
                      errorMessage: "請輸入正確網址格式"
                    }
                  },
                  setClass: {
                    main: "--height-40 --px-12 --py-8 grow"
                  }
                }, null, 8, ["modelValue", "onUpdate:modelValue", "rules"]),
                createVNode(_sfc_main$3, {
                  text: "匯入資料",
                  config: {
                    isDisabled: !unref(url)
                  },
                  setClass: {
                    main: "--oval --height-40 --px-20 --py-5 --bg-green-6a2d --text-white shrink-0",
                    text: "font-semibold"
                  },
                  onClick: ($event) => onClick(validate)
                }, null, 8, ["config", "onClick"])
              ]),
              createVNode(_sfc_main$4, {
                data: unref(items),
                setClass: {
                  main: "mt-[16px]"
                }
              }, null, 8, ["data"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/TabCheckURL.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=TabCheckURL.4rLOAqIc.js.map
