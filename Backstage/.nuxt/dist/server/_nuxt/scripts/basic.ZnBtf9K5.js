import { _ as __nuxt_component_0 } from "./nuxt-link.DoAhKSgC.js";
import { computed, toValue, getCurrentInstance, onServerPrefetch, ref, shallowRef, nextTick, unref, toRef, withAsyncContext, mergeProps, withCtx, createVNode, toDisplayString, createTextVNode, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./mContainer.BDcOBvqM.js";
import _sfc_main$4 from "./BackStep.CcYy6K8e.js";
import _sfc_main$2 from "./TabCheck.CKPdibNQ.js";
import _sfc_main$3 from "./CardFilterInfo.CMebJ21f.js";
import { a as awaitAllPromise } from "./_prototype.DwbhdnQa.js";
import { u as useBuyProjectStore } from "./project.DqU6Ajm9.js";
import { F as Form } from "./mForm.css.Kz_kpQ5n.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/hookable/dist/index.mjs";
import { debounce } from "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/perfect-debounce/dist/index.mjs";
import { u as useNuxtApp, a as asyncDataDefaults, c as createError } from "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
import "./BackStep.Bl315U_a.js";
import "./mAnchor.CraGu5-t.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./TabCheckURL.CsGUdywC.js";
import "./Label.BJzWF104.js";
import "./Input.DngVdA-a.js";
import "./TabItem.BMi_ZI6Y.js";
import "./TabCheckAddress.DhzN6F89.js";
import "./mAddress.C-x2H1ny.js";
import "./Select.BLbzLLvT.js";
import "./TabCheckID.BihL8OUW.js";
import "./CasePurpose.BA7miFL8.js";
import "./RadiosOval.TpLHyNVG.js";
import "./CaseTitle.DOqkCzLQ.js";
import "./Address.CxkCwD9L.js";
import "./CaseType.BipWqy_V.js";
import "./CaseUsage.Cj1r67ev.js";
import "./Zoing.rdAHJO9X.js";
import "./CaseLandNo.j6gGwBdP.js";
import "./Floor.7dC-4C7t.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
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
const _sfc_main = {
  __name: "basic",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const buyProject = useBuyProjectStore();
    const { options, apiData } = storeToRefs(buyProject);
    [__temp, __restore] = withAsyncContext(() => awaitAllPromise([
      useAsyncData("purpose-options", () => buyProject.onApiGETRealEstatePurposeCheckOptions()),
      useAsyncData("city-options", () => buyProject.onApiGETCitySelectOptions()),
      useAsyncData("type-options", () => buyProject.onApiGETRealEstateTypeSelectOptions()),
      useAsyncData("usage-options", () => buyProject.onApiGETRealEstateLegalUsageSelectOptions()),
      useAsyncData("zoing-options", () => buyProject.onApiGETRealEstateZoingCheckOptions()),
      useAsyncData("zoingCity-options", () => buyProject.onApiGETRealEstateZoingCitySelectOptions()),
      useAsyncData("zoingLand-options", () => buyProject.onApiGETRealEstateZoingLandSelectOptions()),
      useAsyncData("floor-options", () => buyProject.onApiGETRealEstateFloorSelectOptions())
    ])), await __temp, __restore();
    const onSubmit = async (validate) => {
      const { valid } = await validate();
      if (valid) {
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ setClass: {
        main: "--px-16"
      } }, _attrs), {
        tools: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$4, { active: 0 }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$4, { active: 0 })
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$2, null, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(Form), {
              as: "div",
              class: "tm:mt-[24px] p:mt-[32px]"
            }, {
              default: withCtx(({ validate }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<pre${_scopeId2}>${ssrInterpolate(unref(apiData))}</pre><ul class="tm:space-y-[24px] p:space-y-[32px]"${_scopeId2}><li${_scopeId2}>`);
                  _push3(ssrRenderComponent(_sfc_main$3, null, null, _parent3, _scopeId2));
                  _push3(`</li></ul><div class="tm:mt-[24px] p:mt-[32px]"${_scopeId2}><button type="button"${_scopeId2}>next</button></div>`);
                } else {
                  return [
                    createVNode("pre", null, toDisplayString(unref(apiData)), 1),
                    createVNode("ul", { class: "tm:space-y-[24px] p:space-y-[32px]" }, [
                      createVNode("li", null, [
                        createVNode(_sfc_main$3)
                      ])
                    ]),
                    createVNode("div", { class: "tm:mt-[24px] p:mt-[32px]" }, [
                      createVNode("button", {
                        type: "button",
                        onClick: ($event) => onSubmit(validate)
                      }, "next", 8, ["onClick"])
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_NuxtLink, { to: {
              name: "buy-parking"
            } }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` parking `);
                } else {
                  return [
                    createTextVNode(" parking ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$2),
              createVNode(unref(Form), {
                as: "div",
                class: "tm:mt-[24px] p:mt-[32px]"
              }, {
                default: withCtx(({ validate }) => [
                  createVNode("pre", null, toDisplayString(unref(apiData)), 1),
                  createVNode("ul", { class: "tm:space-y-[24px] p:space-y-[32px]" }, [
                    createVNode("li", null, [
                      createVNode(_sfc_main$3)
                    ])
                  ]),
                  createVNode("div", { class: "tm:mt-[24px] p:mt-[32px]" }, [
                    createVNode("button", {
                      type: "button",
                      onClick: ($event) => onSubmit(validate)
                    }, "next", 8, ["onClick"])
                  ])
                ]),
                _: 1
              }),
              createVNode(_component_NuxtLink, { to: {
                name: "buy-parking"
              } }, {
                default: withCtx(() => [
                  createTextVNode(" parking ")
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
//# sourceMappingURL=basic.ZnBtf9K5.js.map
