import { ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./mAddress.BkXpTInt.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import { u as useStores } from "./useStores.2GhJj387.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./Select.BLaGw9UN.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./Input.DrK-MnGh.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "./basic.BQ1dZmyM.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "Address",
  __ssrInlineRender: true,
  setup(__props) {
    const buyProject = useBuyProjectStore();
    const { project } = useStores();
    const { options, apiData } = storeToRefs(buyProject);
    const areas = ref([]);
    const roads = ref([]);
    const onCityChange = async () => {
      const { cityID } = apiData.value;
      apiData.value.districtID = "";
      apiData.value.road = "";
      areas.value = [];
      roads.value = [];
      const { status, data } = await project.onApiGETDistrictSelectOptions(cityID);
      if (status === 200) {
        areas.value = data;
      }
    };
    const onAreaChange = async () => {
      const { cityID, districtID } = apiData.value;
      apiData.value.road = "";
      roads.value = [];
      const { status, data } = await project.onApiGETRoad(cityID, districtID);
      if (status === 200) {
        roads.value = data;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
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
        number: unref(apiData).addrNum,
        "onUpdate:number": ($event) => unref(apiData).addrNum = $event,
        ofNumber: unref(apiData).addrNumOf,
        "onUpdate:ofNumber": ($event) => unref(apiData).addrNumOf = $event,
        floor: unref(apiData).floor,
        "onUpdate:floor": ($event) => unref(apiData).floor = $event,
        ofFloor: unref(apiData).addrNumOfFloor,
        "onUpdate:ofFloor": ($event) => unref(apiData).addrNumOfFloor = $event,
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
          city: "pt:w-[260px]",
          area: "pt:w-[260px]",
          road: "pt:w-[262px]",
          lane: "m:w-[98px] pt:w-[86px]",
          alley: "m:w-[98px] pt:w-[86px]",
          number: "m:w-[98px] pt:w-[86px]",
          ofNumber: "m:w-[74px] pt:w-[45px]",
          floor: "m:w-[98px] pt:w-[86px]",
          ofFloor: "m:w-[74px] pt:w-[45px]"
        },
        "onChange:city": onCityChange,
        "onChange:area": onAreaChange
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Info/Address.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=Address.BjySqDv0.js.map
