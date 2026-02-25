import { u as useNuxtApp, f as useRuntimeConfig } from "../../server.mjs";
import { getRequestHeaders } from "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import { ref } from "vue";
import { defineStore } from "pinia";
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useRequestHeaders(include) {
  const event = useRequestEvent();
  const _headers = event ? getRequestHeaders(event) : {};
  if (!include || !event) {
    return _headers;
  }
  const headers = /* @__PURE__ */ Object.create(null);
  for (const _key of include) {
    const key = _key.toLowerCase();
    const header = _headers[key];
    if (header) {
      headers[key] = header;
    }
  }
  return headers;
}
const { public: env } = useRuntimeConfig();
const isDevMode = env.NUXT_PUBLIC_APP_MODE === "dev";
const METHOD_WITH_BODY = /* @__PURE__ */ new Set(["post", "put", "patch"]);
const onReplacePathParams = (path, data) => {
  const keys = Array.from(path.matchAll(/\{\s?(\w+)\s?\}/g)).map((m) => m[1]);
  let url = path;
  for (const key of keys) {
    const val = data?.[key];
    if (val == null || val === "") {
      throw new Error(`[useFetchApi] missing path param: ${key}`);
    }
    url = url.replaceAll(`{${key}}`, encodeURIComponent(String(val)));
  }
  return { url, usedKeys: new Set(keys) };
};
const toPOJOHeaders = (headers) => headers ? Object.fromEntries(headers.entries()) : {};
const isPlainObject = (v) => v != null && Object.prototype.toString.call(v) === "[object Object]";
const fetchApi = async (method, path, data) => {
  const m = method.toLowerCase();
  const { url: urlPath, usedKeys } = onReplacePathParams(path, data);
  const rest = {};
  for (const [k, v] of Object.entries(data ?? {})) {
    if (!usedKeys.has(k) && v !== void 0) rest[k] = v;
  }
  const opts = { method: m };
  if (Object.keys(rest).length) {
    if (METHOD_WITH_BODY.has(m)) opts.body = rest;
    else opts.query = rest;
  }
  const reqPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  const baseURL = !isDevMode ? env.NUXT_PUBLIC_API_PATH : env.NUXT_PUBLIC_API_PATH;
  const headers = useRequestHeaders(["cookie"]);
  try {
    const res = await $fetch.raw(reqPath, { ...opts, baseURL, headers });
    const safeConfig = {
      method: m,
      baseURL: baseURL ?? "",
      url: reqPath,
      query: isPlainObject(opts.query) ? opts.query : void 0,
      body: isPlainObject(opts.body) ? opts.body : void 0
    };
    return {
      status: res.status,
      statusText: res.statusText,
      headers: toPOJOHeaders(res.headers),
      config: safeConfig,
      data: res._data
    };
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?._data;
    const e = new Error(error?.message || "Fetch error");
    e.statusCode = status;
    e.data = payload;
    throw e;
  }
};
const apiGETRealEstatePurposeCheckOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstatePurpose/check-options", data);
const apiGETCitySelectOptions = async (data) => await fetchApi("get", "api/v1/buy/city/select-options", data);
const apiGETDistrictSelectOptions = async (data) => await fetchApi("get", "api/v1/buy/{cityCode}/district/select-options", data);
const apiGETRealEstateTypeSelectOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateType/select-options", data);
const apiGETRealEstateLegalUsageSelectOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateLegalUsage/select-options", data);
const apiGETRealEstateZoingCheckOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateZoing/check-options", data);
const apiGETRealEstateZoingCitySelectOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateZoingCity/select-options", data);
const apiGETRealEstateZoingLandSelectOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateZoingLand/select-options", data);
const apiGETRealEstateFloorSelectOptions = async (data) => await fetchApi("get", "api/v1/buy/realEstateFloor/select-options", data);
const useBuyProjectStore = defineStore("buyProject", () => {
  const NAME = "好房網買屋 Housefun 管理後台";
  const options = ref({
    casePurpose: null,
    city: null,
    area: null,
    caseType: null,
    caseUsage: null,
    caseZoing: null,
    zoingCity: null,
    zoingLand: null,
    floor: null
  });
  const apiData = ref({
    casePurposeToken: "",
    caseTitle: "",
    cityID: "",
    districtID: "",
    road: "",
    lane: "",
    alley: "",
    addrNum: "",
    addrNumOf: "",
    floor: "",
    addrNumOfFloor: "",
    caseTypeToken: "",
    caseUsageToken: "",
    caseZoingToken: "",
    caseZoingTypeToken: "",
    caseZoingTypeOther: "",
    caseLandNo: "",
    isSingleFloor: true,
    floorFromToken: "",
    caseFloorFrom: "",
    floorToToken: "",
    caseFloorTo: "",
    caseFloorTotal: ""
  });
  const onApiGETRealEstatePurposeCheckOptions = async () => {
    const { config, status, data } = await apiGETRealEstatePurposeCheckOptions();
    if (status === 200) {
      options.value.casePurpose = data || [];
    }
    return { config, status, data };
  };
  const onApiGETCitySelectOptions = async () => {
    const { config, status, data } = await apiGETCitySelectOptions();
    if (status === 200) {
      options.value.city = data || [];
    }
    return { config, status, data };
  };
  const onApiGETDistrictSelectOptions = async (cityID) => {
    const { config, status, data } = await apiGETDistrictSelectOptions({
      cityCode: cityID
    });
    return { config, status, data };
  };
  const onApiGETRealEstateTypeSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateTypeSelectOptions();
    if (status === 200) {
      options.value.caseType = data || [];
    }
    return { config, status, data };
  };
  const onApiGETRealEstateLegalUsageSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions();
    if (status === 200) {
      options.value.caseUsage = data || [];
    }
    return { config, status, data };
  };
  const onApiGETRealEstateZoingCheckOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingCheckOptions();
    if (status === 200) {
      options.value.caseZoing = data || [];
      apiData.value.caseZoingToken = data[0].code;
    }
    return { config, status, data };
  };
  const onApiGETRealEstateZoingCitySelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions();
    if (status === 200) {
      options.value.zoingCity = data || [];
    }
    return { config, status, data };
  };
  const onApiGETRealEstateZoingLandSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions();
    if (status === 200) {
      options.value.zoingLand = data || [];
    }
    return { config, status, data };
  };
  const onApiGETRealEstateFloorSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateFloorSelectOptions();
    if (status === 200) {
      options.value.floor = data || [];
      apiData.value.floorFromToken = data[0].value;
      apiData.value.floorToToken = data[0].value;
    }
    return { config, status, data };
  };
  return {
    NAME,
    options,
    apiData,
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
    onApiGETDistrictSelectOptions,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateLegalUsageSelectOptions,
    onApiGETRealEstateZoingCheckOptions,
    onApiGETRealEstateZoingCitySelectOptions,
    onApiGETRealEstateZoingLandSelectOptions,
    onApiGETRealEstateFloorSelectOptions
  };
});
export {
  useBuyProjectStore as u
};
//# sourceMappingURL=project.DqU6Ajm9.js.map
