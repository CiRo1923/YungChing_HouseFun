import { ref, readonly, unref, mergeProps, withCtx, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./mAddress.BkXpTInt.js";
import { _ as _sfc_main$2 } from "./mAnchor.D_ir9u_b.js";
import _sfc_main$3 from "./TabItem.DazqB-gY.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import { u as useStores } from "./useStores.2GhJj387.js";
import { F as Form } from "./mForm.css.yrdBraIC.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./Select.BLaGw9UN.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./Input.DrK-MnGh.js";
import "./Main.Cqggwx2L.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "./basic.BQ1dZmyM.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "TabCheckAddress",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { project } = useStores();
    const { options } = storeToRefs(buyProject);
    const apiData = ref({
      cityID: "",
      districtID: "",
      road: "",
      lane: "",
      alley: "",
      number: "",
      ofNumber: "",
      floor: ""
    });
    const areas = ref([]);
    const roads = ref([]);
    const items = readonly({
      label: "disc",
      items: [
        {
          item: "刊登頁一律顯示到路段名；門牌資訊，僅用於地圖定位；如為預售屋，請輸入附近門牌供地圖定位。"
        },
        {
          item: "若無法匯入資訊，您可繼續手動填寫地址及其他資訊，完成刊登。"
        }
      ]
    });
    const onCityChange = async () => {
      const { status, data } = await project.onApiGETDistrictSelectOptions(apiData.value.cityID);
      areas.value = [];
      roads.value = [];
      if (status === 200) {
        areas.value = data;
      }
    };
    const onAreaChange = async () => {
      const { cityID, districtID } = apiData.value;
      roads.value = [];
      const { status, data } = await project.onApiGETRoad(cityID, districtID);
      if (status === 200) {
        roads.value = data;
      }
    };
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
              name: "info",
              city: unref(apiData).cityID,
              "onUpdate:city": ($event) => unref(apiData).cityID = $event,
              area: unref(apiData).districtID,
              "onUpdate:area": ($event) => unref(apiData).districtID = $event,
              road: unref(apiData).road,
              "onUpdate:road": ($event) => unref(apiData).road = $event,
              lane: unref(apiData).lane,
              "onUpdate:lane": ($event) => unref(apiData).lane = $event,
              alley: unref(apiData).alley,
              "onUpdate:alley": ($event) => unref(apiData).alley = $event,
              number: unref(apiData).number,
              "onUpdate:number": ($event) => unref(apiData).number = $event,
              ofNumber: unref(apiData).ofNumber,
              "onUpdate:ofNumber": ($event) => unref(apiData).ofNumber = $event,
              floor: unref(apiData).floor,
              "onUpdate:floor": ($event) => unref(apiData).floor = $event,
              config: {
                city: {
                  options: unref(options).city,
                  schema: {
                    label: "text",
                    value: "value"
                  }
                },
                area: {
                  options: unref(areas),
                  schema: {
                    label: "text",
                    value: "value"
                  }
                },
                road: {
                  options: unref(roads),
                  schema: {
                    label: "roadName",
                    value: "roadID"
                  }
                }
              },
              setClass: {
                main: "grow",
                city: "pt:w-[182px]",
                area: "pt:w-[182px]",
                road: "pt:w-[182px]",
                lane: "m:w-[98px] pt:w-[80px]",
                alley: "m:w-[98px] pt:w-[80px]",
                number: "m:w-[98px] pt:w-[80px]",
                ofNumber: "m:w-[74px] pt:w-[50px]",
                floor: "m:w-[98px] pt:w-[80px]"
              },
              "onChange:city": onCityChange,
              "onChange:area": onAreaChange
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_sfc_main$2, {
              text: "匯入資料",
              setClass: {
                main: "--oval --height-40 --px-20 --py-5 --bg-green-6a2d --text-white shrink-0",
                text: "font-semibold"
              },
              onClick: ($event) => onClick(validate)
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
            _push2(ssrRenderComponent(_sfc_main$3, {
              data: unref(items),
              setClass: {
                main: "mt-[16px]"
              }
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "p:flex p:gap-x-[16px]" }, [
                createVNode(_sfc_main$1, {
                  name: "info",
                  city: unref(apiData).cityID,
                  "onUpdate:city": ($event) => unref(apiData).cityID = $event,
                  area: unref(apiData).districtID,
                  "onUpdate:area": ($event) => unref(apiData).districtID = $event,
                  road: unref(apiData).road,
                  "onUpdate:road": ($event) => unref(apiData).road = $event,
                  lane: unref(apiData).lane,
                  "onUpdate:lane": ($event) => unref(apiData).lane = $event,
                  alley: unref(apiData).alley,
                  "onUpdate:alley": ($event) => unref(apiData).alley = $event,
                  number: unref(apiData).number,
                  "onUpdate:number": ($event) => unref(apiData).number = $event,
                  ofNumber: unref(apiData).ofNumber,
                  "onUpdate:ofNumber": ($event) => unref(apiData).ofNumber = $event,
                  floor: unref(apiData).floor,
                  "onUpdate:floor": ($event) => unref(apiData).floor = $event,
                  config: {
                    city: {
                      options: unref(options).city,
                      schema: {
                        label: "text",
                        value: "value"
                      }
                    },
                    area: {
                      options: unref(areas),
                      schema: {
                        label: "text",
                        value: "value"
                      }
                    },
                    road: {
                      options: unref(roads),
                      schema: {
                        label: "roadName",
                        value: "roadID"
                      }
                    }
                  },
                  setClass: {
                    main: "grow",
                    city: "pt:w-[182px]",
                    area: "pt:w-[182px]",
                    road: "pt:w-[182px]",
                    lane: "m:w-[98px] pt:w-[80px]",
                    alley: "m:w-[98px] pt:w-[80px]",
                    number: "m:w-[98px] pt:w-[80px]",
                    ofNumber: "m:w-[74px] pt:w-[50px]",
                    floor: "m:w-[98px] pt:w-[80px]"
                  },
                  "onChange:city": onCityChange,
                  "onChange:area": onAreaChange
                }, null, 8, ["city", "onUpdate:city", "area", "onUpdate:area", "road", "onUpdate:road", "lane", "onUpdate:lane", "alley", "onUpdate:alley", "number", "onUpdate:number", "ofNumber", "onUpdate:ofNumber", "floor", "onUpdate:floor", "config"]),
                createVNode(_sfc_main$2, {
                  text: "匯入資料",
                  setClass: {
                    main: "--oval --height-40 --px-20 --py-5 --bg-green-6a2d --text-white shrink-0",
                    text: "font-semibold"
                  },
                  onClick: ($event) => onClick(validate)
                }, null, 8, ["onClick"])
              ]),
              createVNode(_sfc_main$3, {
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/TabCheckAddress.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=TabCheckAddress.fv7AMu7n.js.map
