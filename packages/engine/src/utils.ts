export function toArray<T>(value: T): T[] {
  return Array.isArray(value) ? value : [value];
}

export function toNotEmptyArray<T>(value: T): T[] {
  return toArray(value).filter(Boolean);
}

export function sortByDependsOn(list: [string, any][]) {
  const result = [];
  const visited = new Set();

  function visit([key, item]: [string, any]) {
    if (visited.has(item)) return;
    const dependsOn = toNotEmptyArray(item.DependsOn);
    if (dependsOn.length > 0) {
      for (const dependency of dependsOn) {
        if (!dependency) continue;
        const [depName] = dependency.split('.');
        const depItem = list.find(([name]) => name === depName);
        if (depItem) {
          visit(depItem);
        }
      }
    }
    visited.add(item);
    result.push([key, item]);
  }

  for (const item of list) {
    visit(item);
  }

  return result;
}

export function findKeyBy<T>(obj: T, targetKey: string, callback?: (obj: T, key: string) => void): any[] {
  const results: any[] = [];

  function traverse(currentObj: T) {
    for (const key in currentObj) {
      if (currentObj.hasOwnProperty(key)) {
        // 如果匹配目标 key，执行回调并添加到结果数组中
        if (key === targetKey) {
          callback?.(currentObj, key);
          results.push(currentObj[key]);
        }

        // 如果当前值是对象或数组，继续递归查找
        if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
          traverse(currentObj[key] as T);
        }
      }
    }
  }

  traverse(obj);
  return results;
}


export function mergeName(...names: string[]) {
  return names.join('');
}

export const randomStringOrNumber = (function () {
  const dir = new Set();
  return (len: number): string => {
    const res = Math.random().toString(36).substring(2, len + 2);
    if (dir.has(res)) {
      return randomStringOrNumber(len);
    }
    dir.add(res);
    return res;
  }
})();


export function removeNullValues(obj: Record<string, any>) {
  // 遍历对象的所有属性
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // 如果当前值为 null，直接删除属性
      if (value === null) {
        delete obj[key];
      }
      // 如果当前值是对象且非 null，递归处理
      else if (typeof value === "object" && !Array.isArray(value)) {
        removeNullValues(value); // 递归删除嵌套对象中的 null
        // 如果子对象处理后变成空对象，可删除父级属性（按需启用下方代码）
        // if (Object.keys(value).length === 0) delete obj[key];
      }
      // 如果当前值是数组，遍历处理数组中的对象元素
      else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === "object" && item !== null) {
            removeNullValues(item);
          }
        });
      }
    }
  }
  return obj;
}

export function addContextPrefix(p1: string, nameMapping?: Record<string, Record<string, string | boolean>>) {
  // 记录当前是否在处理对象的键
  let isProcessingObjectKey = false;

  // 匹配对象字面量、标识符、字符串、数字和布尔值
  const result = p1.replace(/({)|(:)|(})|(\$\w+(?:\.\$?\w+)*|\b\w+(?:\.\w+)*\b)|"[^"]*"|'[^']*'|\b\d+\b|\b(?:true|false|null|undefined)\b/g,
    (match, objectStart, colon, objectEnd, identifier, offset, string) => {
      let t = "";
      // 处理对象开始标记
      if (objectStart) {
        isProcessingObjectKey = true;
        return match;
      }

      // 处理冒号，表示从键切换到值
      if (colon) {
        isProcessingObjectKey = false;
        return match;
      }

      // 处理对象结束标记
      if (objectEnd) {
        return match;
      }

      // 如果是字符串、数字或布尔值，直接返回
      if (
        (match.startsWith('"') && match.endsWith('"')) ||
        (match.startsWith("'") && match.endsWith("'")) ||
        /^\d+$/.test(match) ||
        /^(true|false)$/.test(match)
      ) {
        return match;
      }

      // 处理特殊值
      if (match === "undefined") {
        return "undefined";
      }
      if (match === "null") {
        return "null";
      }

      // 如果是对象的键，不添加前缀
      if (isProcessingObjectKey) {
        isProcessingObjectKey = false;  // 键处理完后重置状态
        return match;
      }

      // 处理以 $ 开头的特殊变量
      if (identifier && identifier.startsWith("$")) {
        return "context." + identifier;
      }

      // 处理一般标识符
      if (identifier && identifier.includes('.')) {
        const parts = identifier.split('.');
        // 如果第一部分已经是以 $ 开头，则不添加 __Global__
        if (parts[0].startsWith("$")) {
          return "context." + identifier;
        } else {
          parts[0] = parts[0] === "Parameters" ? `context.${parts[0]}` : `context.__Global__.${parts[0]}`;
          if (nameMapping && nameMapping[identifier]) {
            if (!nameMapping[identifier].__resource__) {
              return undefined;
            }
            return `context.__Global__.${identifier}.__resource__`;
          }
          return parts.join('.');
        }
      }

      // 默认处理
      if (identifier) {
        t = identifier === "Parameters" ? `context.${identifier}` : `context.__Global__.${identifier}`;
        if (nameMapping) {
          if (nameMapping[match]) {
            if (!nameMapping[match].__resource__) {
              return undefined;
            }
            return `context.__Global__.${identifier}.__resource__`;
          }
        }
        return t
      }
      return match;
    });
  return result;
}

export function addContextPrefixWithoutGlobal(p1: string) {
  // 记录当前是否在处理对象的键
  let isProcessingObjectKey = false;

  // 匹配对象字面量、标识符、字符串、数字和布尔值
  const result = p1.replace(/({)|(:)|(})|(\$\w+(?:\.\$?\w+)*|\b\w+(?:\.\w+)*\b)|"[^"]*"|'[^']*'|\b\d+\b|\b(?:true|false|null|undefined)\b/g,
    (match, objectStart, colon, objectEnd, identifier, offset, string) => {
      // 处理对象开始标记
      if (objectStart) {
        isProcessingObjectKey = true;
        return match;
      }

      // 处理冒号，表示从键切换到值
      if (colon) {
        isProcessingObjectKey = false;
        return match;
      }

      // 处理对象结束标记
      if (objectEnd) {
        return match;
      }

      // 如果是字符串、数字或布尔值，直接返回
      if (
        (match.startsWith('"') && match.endsWith('"')) ||
        (match.startsWith("'") && match.endsWith("'")) ||
        /^\d+$/.test(match) ||
        /^(true|false)$/.test(match)
      ) {
        return match;
      }

      // 处理特殊值
      if (match === "undefined") {
        return "undefined";
      }
      if (match === "null") {
        return "null";
      }

      // 如果是对象的键，不添加前缀
      if (isProcessingObjectKey) {
        isProcessingObjectKey = false;  // 键处理完后重置状态
        return match;
      }

      // 处理以 $ 开头的特殊变量
      if (identifier && identifier.startsWith("$")) {
        return "context." + identifier;
      }

      // 处理一般标识符
      if (identifier && identifier.includes('.')) {
        const parts = identifier.split('.');
        // 如果第一部分已经是以 $ 开头，则不添加 __Global__
        if (parts[0].startsWith("$")) {
          return "context." + identifier;
        } else {
          parts[0] = `context.${parts[0]}`;
          return parts.join('.');
        }
      }

      if (identifier) {
        return `context.${identifier}`;
      }

      
      return match;
    });
  return result;
}