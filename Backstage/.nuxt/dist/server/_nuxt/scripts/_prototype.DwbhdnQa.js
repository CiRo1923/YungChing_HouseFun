const deepClone = (obj, callback) => {
  let object = null;
  if (obj == null || typeof obj !== "object") return obj;
  if (obj.constructor !== Object && obj.constructor !== Array) return obj;
  if (obj.constructor === Date || obj.constructor === RegExp || obj.constructor === Function || obj.constructor === String || obj.constructor === Number || obj.constructor === Boolean)
    return new obj.constructor(obj);
  object = object || new obj.constructor();
  for (const name in obj) {
    object[name] = typeof object[name] === "undefined" ? deepClone(obj[name]) : object[name];
  }
  if (callback) {
    callback(object);
  }
  return object;
};
const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
  };
  const isShallow = (item) => {
    return !(Array.isArray(item) && item.find((item2) => typeof item2 === "object"));
  };
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        if (isShallow(source[key])) {
          Object.assign(target, { [key]: source[key] });
        } else {
          if (!target[key]) Object.assign(target, { [key]: [] });
          Object.assign(target, {
            [key]: source[key].map((item, index) => deepMerge(target[key][index] || item, item))
          });
        }
      }
    }
  }
  return deepMerge(target, ...sources);
};
const emptyData = (obj) => {
  return deepClone(obj, (data) => {
    for (const key in obj) {
      if (data[key]) {
        if (typeof data[key] === "string") {
          data[key] = "";
        } else if (typeof data[key] === "number") {
          data[key] = null;
        } else {
          if (Array.isArray(data[key])) {
            data[key] = [];
          } else if (typeof data[key] !== "boolean") {
            data[key] = {};
          }
        }
      }
    }
  });
};
const numberComma = {
  add(number, isReturnZero) {
    const isZero = isReturnZero !== void 0 ? isReturnZero : true;
    const amount = number ? typeof number === "number" ? number + "" : number : isZero ? "0" : "";
    const regex = /\B(?=(\d{3})+(?!\d))/g;
    return amount ? amount.replace(regex, ",") : "";
  },
  remove(number, isReturnZero) {
    const isZero = isReturnZero !== void 0 ? isReturnZero : true;
    const amount = number ? typeof number === "number" ? number + "" : number : isZero ? "0" : "";
    return amount ? amount.replace(/,/g, "") : "";
  }
};
const unicodLength = (text) => {
  const regexUnicode = (
    // eslint-disable-next-line no-misleading-character-class
    /\ud83c[\udffb-\udfff](?=\ud83c[\udffb-\udfff])|(?:[^\ud800-\udfff][\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]?|[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|\ud83c[\udffb-\udfff])?)*/g
  );
  return text ? text.match(regexUnicode).length : 0;
};
const awaitAllPromise = async (apis) => {
  try {
    await Promise.all(apis);
  } catch (error) {
  }
};
export {
  awaitAllPromise as a,
  deepClone as b,
  deepMerge as d,
  emptyData as e,
  numberComma as n,
  unicodLength as u
};
//# sourceMappingURL=_prototype.DwbhdnQa.js.map
