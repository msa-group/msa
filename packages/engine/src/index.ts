import jsYaml from "js-yaml";
import { get } from "lodash";
import ParseEngine from "./parseEngine";
import {
  mergeName,
  removeNullValues,
  sortByDependsOn,
  addContextPrefix,
  addContextPrefixWithoutGlobal,
} from "./utils";
import { getBuildInHelper } from "./buildin-helper";
import Composer from "./composer";
import Component from "./component";
import plugins from "./plugins";
import core from "./parser/core";

import type {
  Composor,
  EngineContext,
  GlobalData,
  ParseOptions,
} from "./types";

class Engine {
  private context: EngineContext;
  private buildinHelpers: Record<string, any> = {};
  private registeredHelper: Record<string, any> = {};
  private globalData: GlobalData = { Parameters: {} };
  private nameMapping: Record<string, Record<string, string>> = {};
  private deletedMergedName: Set<string> = new Set();
  private mergedNames: Set<string> = new Set();
  private buildinComponents: Record<string, any> = {};
  private existedComponents: string[] = [];

  core = {
    render: (template: string, view: Record<string, any>) => {
      return core.render(template, view, {}, {
        formatToken: addContextPrefixWithoutGlobal,
      });
    }
  }

  constructor() {
    this.init();
  }

  private init() {
    this.nameMapping = {};
    this.deletedMergedName = new Set();
    this.mergedNames = new Set();
    this.buildinComponents = {};
    this.existedComponents = [];
    this.context = {
      fullComponent: {},
      templateText: {
        // 主模板 Composer 的内容
        main: "",
        // 子模板 每个 Template 的模板
        dependencies: {},
      },
      // 模版被 js-yaml 解析后的 JSON 格式数据
      templateJson: {
        // 主模板 Composer 的内容
        main: {},
        // 子模板 每个 Template 的内容
        dependencies: {},
      },
      // js-yaml 转为 JSON 后解析出来的全局数据
      data: {},
      // 最终输出的 yaml 字符串
      resultYamlString: `ROSTemplateFormatVersion: '2015-09-01'
Resources:`,

      serviceJson: {},
    };
  }

  registerHelper<T>(helpers: { [key: string]: T }) {
    // this.buildinHelpers = { ...this.buildinHelpers, ...helpers };
    this.registeredHelper = helpers;
  }

  parse(
    str: string,
    parameters: Record<string, any> = {},
    options: ParseOptions,
  ): Promise<ParseEngine> {
    if (!options.components) {
      return Promise.reject(new Error("components is required"));
    }
    this.init();
    const buildinHelpersInst = getBuildInHelper();
    this.buildinHelpers = { ...buildinHelpersInst, ...this.registeredHelper };
    this.buildinComponents = get(options, "components", {});
    return new Promise(async (resolve) => {
      try {
        await this.#parserNameMapping(str, { parameters });
        this.#parserMainYaml(str, { parameters });
        const parseEngine = new ParseEngine(this.context, this.nameMapping);
        resolve(parseEngine);
      } catch (error) {
        console.log(error);
      }
    });
  }

  #mergePluginClassId(data: any) {
    if (data.PluginClassName && !data.PluginClassId) {
      data.PluginClassId = plugins.find(
        (v) =>
          v.name === data.PluginClassName || v.alias === data.PluginClassName,
      )?.id;
    }
    return data;
  }

  async #parserNameMapping(
    text: string,
    config: { parameters: Record<string, any> },
  ) {
    const globalParameters = get(config, "parameters.Global", {});
    const inLocalParameters = get(config, "parameters.Parameters", {});
    const contextData = {
      Parameters: {
        ...globalParameters,
        ...inLocalParameters,
      },
    };
    this.context.data = {
      ...this.context.data,
      ...contextData,
    };
    const globalData = { ...this.buildinHelpers };

    const composerYaml = core.render(text, contextData, globalData, {
      formatToken: addContextPrefix,
    });
    const composerJson = jsYaml.load(composerYaml);
    // this.context.templateText.main = preparedText;
    this.#analyzeTemplate(composerJson);
    this.#parseSubTemplate(composerJson);
  }

  async #parserMainYaml(str: string, parameters: any) {
    const params = {
      ...get(parameters, "parameters.Global", {}),
      ...get(parameters, "parameters.Parameters", {}),
    };
    Object.assign(this.context.data.Parameters, params);

    const globalData = { ...this.buildinHelpers, ...this.nameMapping };
    const msaYaml = core.render(
      str,
      { Parameters: this.context.data.Parameters },
      globalData,
      {
        formatToken: (token: string) =>
          addContextPrefix(token, this.nameMapping),
        mergeView: this.#mergePluginClassId,
      },
    );
    const composerJson = jsYaml.load(msaYaml);
    this.context.templateJson.main = composerJson;
    const sortedByDependsOn = sortByDependsOn(
      Object.entries(composerJson.Composer || {}),
    );
    for (const [composerKey, composerContent] of sortedByDependsOn) {
      const composerData = {
        name: composerKey,
        parameters: {
          ...composerContent.Parameters,
          ...get(parameters, `parameters.Parameters.${composerKey}`, {}),
        },
        props: composerContent.Properties,
        dependsOn: composerContent.DependsOn,
        componentName: composerContent.Component,
        existed: composerContent.Existed,
      };
      const composerInstance = new Composer(
        composerData,
        this.context.data,
        this.nameMapping,
      );
      this.#parserComponentYaml(composerInstance, composerContent.Component);
    }
  }

  #parserComponentYaml(composerInstance: Composer, component: string) {
    const componentText = get(this.buildinComponents, component, "") as string;
    if (
      composerInstance.parameters?.PluginClassName &&
      !composerInstance.parameters?.PluginClassId
    ) {
      const plugin = plugins.find(
        (v) =>
          v.name === composerInstance.parameters.PluginClassName ||
          v.alias === composerInstance.parameters.PluginClassName,
      );
      if (plugin) {
        composerInstance.parameters.PluginClassId = plugin.id;
      }
    }

    const contextData = {
      Parameters: {
        ...this.context.data.Parameters,
        ...composerInstance.parameters,
      },
    };
    const globalData = { ...this.buildinHelpers, ...this.nameMapping };
    let self = this;

    const componentYaml = core.render(componentText, contextData, globalData, {
      formatToken: (token: string) => addContextPrefix(token, this.nameMapping),
      mergeView: this.#mergePluginClassId,
    });

    let r = componentYaml;

    // TODO: 命名需要优化
    let h = "";
    const a = jsYaml.load(componentYaml) as Record<string, any>;
    const z = removeNullValues(a);
    for (const [name, value] of Object.entries(z)) {
      self.nameMapping[composerInstance.name][name] =
        `${composerInstance.name}${name}`;
      const data = {
        name,
        parent: composerInstance,
        json: value,
        parameters: composerInstance.parameters,
        props: get(composerInstance.props, name, {}),
        dependsOn: value.DependsOn,
        localJson: {},
        nameMapping: self.nameMapping,
        deletedMergedName: self.deletedMergedName,
        mergedNames: self.mergedNames,
        existed: composerInstance.existed,
        existedComponents: this.existedComponents,
      };

      const componentInstance = new Component(data);
      if (composerInstance.existed) {
        this.existedComponents.push(componentInstance.mergedName);
      }
      this.context.fullComponent[componentInstance.mergedName] =
        componentInstance;
      if (!composerInstance.existed) {
        h = h + componentInstance.toYaml()[componentInstance.mergedName];
      }
    }
    r = h;

    const k = jsYaml.load(r);
    this.context.templateJson.dependencies[composerInstance.componentName] = k;
    const g = jsYaml.dump(k);

    const indentedYamlText = g
      .split("\n")
      .map((line, index) => (index === 0 ? line : `  ${line}`))
      .join("\n");
    this.context.resultYamlString += `\n  ${indentedYamlText}\n`;
  }

  #analyzeTemplate(composerJson) {
    const composer = composerJson.Composer as Composor;
    if (!composer) return {};
    for (const [key, value] of Object.entries(composer)) {
      this.context.templateText.dependencies[key] = value.Component;
    }
    return this.context.templateText.dependencies;
  }

  async #parseSubTemplate(composerJson: any) {
    const dependencies = this.context.templateText.dependencies;
    for (const [key, value] of Object.entries(dependencies)) {
      const msa = composerJson.Composer[key];
      const data = {
        name: key,
        parameters: msa.Parameters,
        props: msa.Properties,
        dependsOn: msa.DependsOn,
        componentName: msa.Component,
      };
      const composerInstance = new Composer(
        data,
        this.globalData,
        this.nameMapping,
      );

      const template = get(this.buildinComponents, value, "") as string;
      let t = template;

      const contextData = {
        Parameters: {
          ...this.context.data.Parameter,
          ...composerInstance.parameters,
        },
      };
      const parsedText = core.render(t, contextData, this.buildinHelpers, {
        formatToken: addContextPrefix,
      });

      const componentJson = jsYaml.load(parsedText) as Record<string, any>;

      for (const [componentKey, value] of Object.entries(componentJson)) {
        const component = {
          name: componentKey,
          mergedName: mergeName(key, componentKey),
          isResource: value.MsaResource,
        };

        if (this.nameMapping[composerInstance.name]) {
          this.nameMapping[composerInstance.name][component.name] =
            component.mergedName;
          if (component.isResource) {
            // __resource__ 标记该资源为主资源
            this.nameMapping[composerInstance.name]["__resource__"] =
              component.mergedName;
          }
        } else {
          this.nameMapping[composerInstance.name] = {
            [component.name]: component.mergedName,
          };
          if (component.isResource) {
            this.nameMapping[composerInstance.name]["__resource__"] =
              component.mergedName;
          }
        }
        this.mergedNames.add(mergeName(composerInstance.name, component.name));
      }
    }
  }
}

export default Engine;
