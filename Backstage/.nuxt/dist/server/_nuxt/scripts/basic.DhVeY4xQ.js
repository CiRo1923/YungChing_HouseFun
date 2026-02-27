import { computed, toValue, getCurrentInstance, onServerPrefetch, ref, shallowRef, nextTick, unref, toRef, mergeProps, useSSRContext, shallowReadonly, withAsyncContext, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, Fragment, renderList } from "vue";
import { ssrRenderAttrs, ssrRenderSlot, ssrRenderComponent, ssrRenderList, ssrRenderVNode } from "vue/server-renderer";
import { _ as _sfc_main$8 } from "./mContainer.Dx9miLg4.js";
import "./CardFilter.DVAJog-e.js";
import { _ as _sfc_main$a } from "./mAnchor.D_ir9u_b.js";
import _sfc_main$b from "./BackStep.BeND9Tno.js";
import _sfc_main$9 from "./TabCheck.CbbEFW_4.js";
import _sfc_main$2 from "./CardFilterInfo.DlQAbcW0.js";
import _sfc_main$3 from "./CardFilterPrice.Bt7wS9I4.js";
import _sfc_main$4 from "./CardFilterPing.DoDB4F92.js";
import _sfc_main$5 from "./CardFilterManage.DRutiPGM.js";
import _sfc_main$6 from "./CardFilterPosterInfo.C3jDV46p.js";
import _sfc_main$7 from "./CardFilterTerms.BItxEcBH.js";
import { a as awaitAllPromise } from "./_prototype.Mf8Dpr9m.js";
import { u as useBuyProjectStore } from "./project.D4zrwblI.js";
import { u as useStores } from "./useStores.2GhJj387.js";
import { F as Form } from "./mForm.css.yrdBraIC.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import { debounce } from "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/perfect-debounce/dist/index.mjs";
import { u as useNuxtApp, a as asyncDataDefaults, c as createError } from "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./Label.BJzWF104.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./BackStep.v3H_dQo9.js";
import "./TabCheckURL.4rLOAqIc.js";
import "./Input.DrK-MnGh.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "./TabItem.DazqB-gY.js";
import "./Main.Cqggwx2L.js";
import "./TabCheckAddress.fv7AMu7n.js";
import "./mAddress.BkXpTInt.js";
import "./Select.BLaGw9UN.js";
import "./TabCheckID.DgsgGwRh.js";
import "./CasePurpose.BQzOFLrZ.js";
import "./RadiosOval.C_eW4Qov.js";
import "./CaseTitle.BsxxYezF.js";
import "./Address.BjySqDv0.js";
import "./CaseType.q3o81DDG.js";
import "./CaseUsage.VrE8IW01.js";
import "./Zoing.Dt0omGwz.js";
import "./RadiosOval.NzLPxeP9.js";
import "./CaseLandNo.CYAFur-V.js";
import "./Floor.D0wdvBsO.js";
import "./TotalFloor.nLAVd_ZJ.js";
import "./BuildingAge.ChTqM3gT.js";
import "./CheckBox.DTYspC36.js";
import "./Community.CTUtfrBJ.js";
import "./HouseLayout.BthTozck.js";
import "./HouseAddLayout.MsK_EeUz.js";
import "./Elevator.Dk2mLNJR.js";
import "./Face.tGYHUew8.js";
import "./Structure.BZJKtkNp.js";
import "./BarrierFree.Dtf2HTff.js";
import "./CasePrice.CMUBxqhd.js";
import "./CaseParkingPrice.D0pIg4It.js";
import "./CasePriceUnit.DFguvDxw.js";
import "./Unit.DGsNrkJg.js";
import "./basic.BQ1dZmyM.js";
import "./CaseBuildSq.CRE5GrP-.js";
import "./CaseParkingSq.BbLX9qd5.js";
import "./CaseMainSq.C0eZcl9g.js";
import "./CaseAffiliatedSq.BD3lh8Vp.js";
import "./CaseLandSq.D_6HxGUt.js";
import "./CaseAmenitieSq.B_BEoHg4.js";
import "./CaseManageType.Qc3RmhUu.js";
import "./CaseManageDuty.8pbPdxxm.js";
import "./CaseManagePay.CiM1kFsV.js";
import "./InfoImport.CDfi5Idj.js";
import "./AgentName.SvLasZhq.js";
import "./AgentPhone.CDsBC7E1.js";
import "./AgentLine.CY3xArAq.js";
import "./Terms.D5sV9wlY.js";
import "./Agree.4T62UWId.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry?._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = !import.meta.prerender || !nuxtApp.ssrContext?.["~sharedPrerenderCache"] ? _handler : (nuxtApp2, options2) => {
    const value = nuxtApp2.ssrContext["~sharedPrerenderCache"].get(key);
    if (value) {
      return value;
    }
    const promise = Promise.resolve().then(() => nuxtApp2.runWithContext(() => _handler(nuxtApp2, options2)));
    nuxtApp2.ssrContext["~sharedPrerenderCache"].set(key, promise);
    return promise;
  };
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer(opts.dedupe ?? options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (asyncData._abortController?.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
const _sfc_main$1 = {
  __name: "Default",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "m-card --default --bg-white --rounded-15 tm:px-[16px] tm:py-[32px] p:p-[40px]" }, _attrs))}>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mCard/Default.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "basic",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const buyProject = useBuyProjectStore();
    const { project } = useStores();
    const { options, apiData } = storeToRefs(buyProject);
    const datas = shallowReadonly([
      {
        id: "cardFilterInfo",
        label: "基本資料",
        component: _sfc_main$2
      },
      {
        id: "cardFilterPrice",
        label: "價格資訊",
        component: _sfc_main$3
      },
      {
        id: "cardFilterPing",
        label: "坪數資訊",
        component: _sfc_main$4
      },
      {
        id: "cardFilterManage",
        label: "管理資訊",
        component: _sfc_main$5
      },
      {
        id: "cardFilterPosterInfo",
        label: "聯絡資訊",
        component: _sfc_main$6
      },
      {
        id: "cardFilterTerms",
        label: "使用條款",
        component: _sfc_main$7
      }
    ]);
    const onSubmit = async (validate) => {
      const { valid } = await validate();
      if (valid) {
      }
    };
    [__temp, __restore] = withAsyncContext(() => awaitAllPromise([
      useAsyncData("purpose-options", () => project.onApiGETRealEstatePurposeCheckOptions()),
      useAsyncData("city-options", () => project.onApiGETCitySelectOptions()),
      useAsyncData("type-options", () => project.onApiGETRealEstateTypeSelectOptions()),
      useAsyncData("usage-options", () => project.onApiGETRealEstateLegalUsageSelectOptions()),
      useAsyncData("zoing-options", () => project.onApiGETRealEstateZoingCheckOptions()),
      useAsyncData("zoingCity-options", () => project.onApiGETRealEstateZoingCitySelectOptions()),
      useAsyncData("zoingLand-options", () => project.onApiGETRealEstateZoingLandSelectOptions()),
      useAsyncData("floor-options", () => project.onApiGETRealEstateFloorSelectOptions()),
      useAsyncData("face-options", () => project.onApiGETRealEstateFaceSelectOptions()),
      useAsyncData("structure-options", () => project.onApiGETRealEstateStructionSelectOptions()),
      useAsyncData("barrierFree-options", () => project.onApiGETRealEstateBarrierFreeCheckOptions()),
      useAsyncData("manageType-options", () => project.onApiGETRealEstateManageTypeSelectOpstions()),
      useAsyncData("manageDuty-options", () => project.onApiGETRealEstateManageDutySelectOpstions()),
      useAsyncData(
        "managePay-options",
        () => project.onApiGETRealEstateManagePayPeriodSelectOpstions()
      )
    ])), await __temp, __restore();
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$8, mergeProps({ setClass: {
        main: "--px-16"
      } }, _attrs), {
        tools: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$b, { active: 0 }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$b, { active: 0 })
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$9, null, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(Form), {
              as: "div",
              class: "tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
            }, {
              default: withCtx(({ validate }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<ul class="tm:space-y-[24px] p:space-y-[32px]"${_scopeId2}><!--[-->`);
                  ssrRenderList(unref(datas), (item, index) => {
                    _push3(`<li${_scopeId2}>`);
                    ssrRenderVNode(_push3, createVNode(resolveDynamicComponent(item.component), {
                      title: item.label
                    }, null), _parent3, _scopeId2);
                    _push3(`</li>`);
                  });
                  _push3(`<!--]--></ul>`);
                  _push3(ssrRenderComponent(_sfc_main$1, { class: "text-center" }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]"${_scopeId3}><li${_scopeId3}>`);
                        _push4(ssrRenderComponent(_sfc_main$a, {
                          text: "取消",
                          setClass: {
                            main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                            text: "font-semibold"
                          }
                        }, null, _parent4, _scopeId3));
                        _push4(`</li><li${_scopeId3}>`);
                        _push4(ssrRenderComponent(_sfc_main$a, {
                          text: "存成草稿",
                          setClass: {
                            main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                            text: "font-semibold"
                          }
                        }, null, _parent4, _scopeId3));
                        _push4(`</li><li${_scopeId3}>`);
                        _push4(ssrRenderComponent(_sfc_main$a, {
                          text: "儲存，選擇刊登額度",
                          setClass: {
                            main: "  --bg-green-6a2d --oval --height-45 --px-30 --py-8 --text-white shrink-0",
                            text: "font-semibold"
                          },
                          onClick: ($event) => onSubmit(validate)
                        }, null, _parent4, _scopeId3));
                        _push4(`</li></ul>`);
                      } else {
                        return [
                          createVNode("ul", { class: "inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]" }, [
                            createVNode("li", null, [
                              createVNode(_sfc_main$a, {
                                text: "取消",
                                setClass: {
                                  main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                                  text: "font-semibold"
                                }
                              })
                            ]),
                            createVNode("li", null, [
                              createVNode(_sfc_main$a, {
                                text: "存成草稿",
                                setClass: {
                                  main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                                  text: "font-semibold"
                                }
                              })
                            ]),
                            createVNode("li", null, [
                              createVNode(_sfc_main$a, {
                                text: "儲存，選擇刊登額度",
                                setClass: {
                                  main: "  --bg-green-6a2d --oval --height-45 --px-30 --py-8 --text-white shrink-0",
                                  text: "font-semibold"
                                },
                                onClick: ($event) => onSubmit(validate)
                              }, null, 8, ["onClick"])
                            ])
                          ])
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode("ul", { class: "tm:space-y-[24px] p:space-y-[32px]" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(datas), (item, index) => {
                        return openBlock(), createBlock("li", {
                          key: `${item.id}_${index}`
                        }, [
                          (openBlock(), createBlock(resolveDynamicComponent(item.component), {
                            title: item.label
                          }, null, 8, ["title"]))
                        ]);
                      }), 128))
                    ]),
                    createVNode(_sfc_main$1, { class: "text-center" }, {
                      default: withCtx(() => [
                        createVNode("ul", { class: "inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]" }, [
                          createVNode("li", null, [
                            createVNode(_sfc_main$a, {
                              text: "取消",
                              setClass: {
                                main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                                text: "font-semibold"
                              }
                            })
                          ]),
                          createVNode("li", null, [
                            createVNode(_sfc_main$a, {
                              text: "存成草稿",
                              setClass: {
                                main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                                text: "font-semibold"
                              }
                            })
                          ]),
                          createVNode("li", null, [
                            createVNode(_sfc_main$a, {
                              text: "儲存，選擇刊登額度",
                              setClass: {
                                main: "  --bg-green-6a2d --oval --height-45 --px-30 --py-8 --text-white shrink-0",
                                text: "font-semibold"
                              },
                              onClick: ($event) => onSubmit(validate)
                            }, null, 8, ["onClick"])
                          ])
                        ])
                      ]),
                      _: 2
                    }, 1024)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$9),
              createVNode(unref(Form), {
                as: "div",
                class: "tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
              }, {
                default: withCtx(({ validate }) => [
                  createVNode("ul", { class: "tm:space-y-[24px] p:space-y-[32px]" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(datas), (item, index) => {
                      return openBlock(), createBlock("li", {
                        key: `${item.id}_${index}`
                      }, [
                        (openBlock(), createBlock(resolveDynamicComponent(item.component), {
                          title: item.label
                        }, null, 8, ["title"]))
                      ]);
                    }), 128))
                  ]),
                  createVNode(_sfc_main$1, { class: "text-center" }, {
                    default: withCtx(() => [
                      createVNode("ul", { class: "inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]" }, [
                        createVNode("li", null, [
                          createVNode(_sfc_main$a, {
                            text: "取消",
                            setClass: {
                              main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                              text: "font-semibold"
                            }
                          })
                        ]),
                        createVNode("li", null, [
                          createVNode(_sfc_main$a, {
                            text: "存成草稿",
                            setClass: {
                              main: " --border-gray-e5 --bg-white --oval --height-45 --px-30 --py-8 --text-gray-666 shrink-0",
                              text: "font-semibold"
                            }
                          })
                        ]),
                        createVNode("li", null, [
                          createVNode(_sfc_main$a, {
                            text: "儲存，選擇刊登額度",
                            setClass: {
                              main: "  --bg-green-6a2d --oval --height-45 --px-30 --py-8 --text-white shrink-0",
                              text: "font-semibold"
                            },
                            onClick: ($event) => onSubmit(validate)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 1
              })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/basic.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=basic.DhVeY4xQ.js.map
