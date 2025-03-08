import buildinSpec from "./specs";
import components from "./components";
import jsYaml from "js-yaml";

export const specMapping = {
  "apig.http": "gateway",
  "apig.service": "service",
  "fc3": "backend",
}

export async function getSpecs(str, config: { Spec?: Record<string, string> } = {}) {

  const spec = config.Spec || {};

  const specKeys = Object.keys(spec);
  const specValues = await Promise.all(specKeys.map(async (key) => {
    const value = spec[key];
    const text = await fetch(value).then(res => {
      if (res.status === 404) return ""
      return res.text()
    });
    return {
      [key]: text
    }
  }));

  const specMap = specValues.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {});

  const match = /{{([^}]+)}}/g;
  let preparedText = str.replace(match, (_match, p1) => {
    if (/^(#if|else|\/if)/g.test(p1)) return `{{${p1}}}`;
    return `"#%%${p1.replace(/"/g, '\\"')}%%"`;
  });

  const json = jsYaml.load(preparedText);
  const composer = (json?.Composer || {}) as Record<string, { Component: string }>;
  const specs = {};
  for (const [key, value] of Object.entries(composer)) {
    // 优先使用应用级 spec
    const spec = specMap[key] || buildinSpec[value.Component];
    if (spec !== undefined) {
      specs[key] = {
        type: specMapping[value.Component] || value.Component,
        spec
      };
    }
  }
  return {
    specMapping,
    specs
  };
}

export { components };