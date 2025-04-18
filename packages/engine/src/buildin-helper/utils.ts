import { isEmpty, get } from "lodash";
import { randomStringOrNumber } from "../utils";
import log from "../log";


export const getUtilsHelper = () => {
  let suffix = '';
  const Utils = {
    Get: (data, key, defaultValue) => {
      return get(data, key, defaultValue);
    },
    /**
     * 判断是否为 Https， 参数有可能为 Object
     * @param url
     * @returns
     */
    IsTls: (url: unknown) => {
      const urlString = typeof url === "object" ? JSON.stringify(url) : String(url);
      if (/:443/.test(urlString)) {
        return true;
      } else {
        return false;
      }
    },
    /**
     * 将参数转为 JSON 字符串
     * 参数有可能为 Object、Array、String、Number、Function
     * 如果是 Object 类型，则需要将单花括号替换为特定字符，以避免 handles 解析错误
     * 详见 templateWithLTToHandlebars 规则
     */
    JSONStringify: (value, indent = 0) => {
      if (value === undefined || value === null) return value;
      if (typeof value === "string") {
        if (/^\d+$/.test(value)) {
          return value;
        }
        // 处理多行字符串， 并且保持正确缩进
        if (value.includes("\n")) {
          try {
            return JSON.stringify(value);
          } catch (error) {
            console.error("JSONStringify in buildin-helper error: ", error);
            return value;
          }
        }
        try {
          // JSON.parse(value);
          const parsed = JSON.parse(value);
          const isObject = typeof parsed === 'object';
          if (isObject) {
            return JSON.stringify(value);
          } else {
            return value;
          }
        } catch (error) {
          return value;
        }
      }
      if (
        typeof value === "number" ||
        typeof value === "function" ||
        typeof value === "boolean"
      ) return value;
      return JSON.stringify(value);
    },

    SubfixRandom: (str: string, len: number = 4, symbol: string = '-') => {
      return `${str}${symbol}${randomStringOrNumber(len)}`;
    },

    Subfix: (str: string, len: number = 4, symbol: string = '-') => {
      if (suffix) return `${str}${symbol}${suffix}`;
      suffix = randomStringOrNumber(len);
      return `${str}${symbol}${suffix}`;
    },

    Join: (arr: string[], symbol: string = '') => {
      return arr.join(symbol);
    },

    Default: <T, B>(value: T, defaultValue: B) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      return value;
    },

    GetOperationPath: (operation: { Path: string }, type: "type" | "value") => {
      if (!operation || isEmpty(operation)) {
        log.warn('operation is undefined');
        return "";
      };
      const [pathType, pathValue] = (operation.Path || "").split(" ");
      if (type === "type") {
        return pathType;
      } else if (type === "value") {
        return pathValue;
      }
    },

    IsEmpty: (value: unknown) => {
      return value === undefined || value === null || value === '';
    },

    IsNotEmpty: (value: unknown) => {
      return !Utils.IsEmpty(value);
    },

    OSSAddress: (ossName: string, region: string, type = "internal") => {
      return `${ossName}.${Utils.Join(["oss", region, type].filter(Boolean), "-")}.aliyuncs.com`
    },

    IsOSSWebsite: (address: string) => {
      if (typeof address !== 'string') {
        return false;
      }
      const matched = /oss-.+\.(aliyuncs.com)$/.test(address);
      return matched;
    },

    Indent: (str: string = "", indent: number = 2) => {
      return str.split('\n').map(line => ' '.repeat(indent) + line).join('\n');
    },

    Merge: (a: Record<string, any>, b: Record<string, any>) => {
      return {
        ...a,
        ...b, 
      }
    },

    Connect: (...args: [][]) => {
      return args.flat(1);
    }

    

  }
  return Utils;
}

const UtilsHelper = getUtilsHelper();

export default UtilsHelper;
