import * as jsYaml from "js-yaml";
import { get } from "lodash";
import { findKeyBy, mergeName, toArray, toNotEmptyArray } from "./utils";
import { keywords } from "./const";

class Component {
  name: string;
  mergedName: string;
  props: Record<string, any>;
  parameters: Record<string, any>;
  json: Record<string, any>;
  dependsOn: string[];
  localJson: Record<string, any>;
  templateNameMapToMergedName: Record<string, string>;
  nameMapping: Record<string, Record<string, string>>;
  deletedMergedName: Set<string>;
  mergedNames: Set<string>;
  operation: Record<string, any>;
  isResource: boolean;
  componentName: string;
  composerName: string;
  existedComponents: string[];
  constructor(data) {
    const json = data.json || {};
    this.name = data.name;
    this.composerName = data.parent.name;
    this.mergedName = mergeName(data.parent.name, this.name);
    this.props = { ...(json.Properties || {}), ...data.props };
    this.existedComponents = data.existedComponents || [];
    this.parameters = {
      ...(data.parameters || {}),
    };
    this.json = json;
    // __Empty 表示没有依赖, 但需要为其加上 MsaResource 资源的依赖
    const deps = toNotEmptyArray(data.dependsOn || "__Empty").map(dep => {
      const depKey = `${data.parent.name}.${dep}`;
      const componentNameMap = data.nameMapping[data.parent.name];
      const primaryDep = componentNameMap.__resource__;
      const curDep = get(componentNameMap, depKey);
      return data?.json?.MsaResource ? [curDep] : [primaryDep, curDep];
    }).flat(1).filter(Boolean);

    this.dependsOn = [...data.parent.dependsOn, ...deps]
      .filter(dep => !this.existedComponents.includes(dep));

    this.localJson = data.localJson;
    this.templateNameMapToMergedName = data.nameMapping[data.parent.name] || {};
    this.nameMapping = data.nameMapping || {};
    this.deletedMergedName = data.deletedMergedName;
    this.mergedNames = data.mergedNames;
    this.operation = data.operation;
    this.isResource = Boolean(data.json.MsaResource);
    this.componentName = data.componentName;
  }

  toJson() {
    const others: Record<string, any> = {};
    if (this.dependsOn.length > 0) {
      others.DependsOn = this.dependsOn;
    }
    const res = {
      ...this.json,
      ...others,
      Properties: this.props,
    }

    const implicitDependsOn = [];
    findKeyBy(res, keywords.FnGetAtt, (obj, key) => {
      const value = toArray(obj[key]).filter(name => !this.deletedMergedName.has(name)).map(name => {
        const inDependsName = this.mergedNames.has(name)
          ? name :
          get(this.templateNameMapToMergedName, name) || get(this.nameMapping, name);
        if (inDependsName) {
          implicitDependsOn.push(inDependsName);
        }
        return inDependsName || name;
      });
      obj[key] = value;
    });
    findKeyBy(res, keywords.Ref, (obj, key) => {
      const value = obj[key];
        const isInMergedNames = get(this.templateNameMapToMergedName, value) || get(this.nameMapping,value);
        if (isInMergedNames) {
          obj[key] = isInMergedNames;
        }
    })

    if (implicitDependsOn.length > 0) {
      others.DependsOn = [...new Set([...(others.DependsOn || []), ...implicitDependsOn])]
        .filter(
          dep => !this.existedComponents.includes(dep)
        );
    }

    Object.assign(res, others);

    return {
      [this.mergedName]: res,
    }
  }

  toYaml() {
    const json = this.toJson();
    return {
      [this.mergedName]: jsYaml.dump(json, { lineWidth: -1 }),
    };
  }

}

export default Component;
