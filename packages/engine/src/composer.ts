import type { ComposerData, GlobalData } from "./types";
import { toNotEmptyArray} from "./utils";
import { get } from "lodash";

class Composer {
  name: string;
  props: Record<string, any>;
  dependsOn: string[];
  parameters: Record<string, any>;
  operation?: Record<string, any>;
  componentName: string;

  constructor(data: ComposerData, global: GlobalData, nameMapping: Record<string, Record<string, string>>) {
    const localParameters = get(global, `Parameters.${data.name}`, {});
    this.name = data.name;
    this.props = data.props || {};
    this.operation = data.operation;
    this.dependsOn = toNotEmptyArray(data.dependsOn).map(dep => {
      const curDep = get(nameMapping, dep);
      if (typeof curDep === "object") {
        return curDep.__resource__;
      }
      return curDep;
    });
    this.parameters = {
      ...global.Parameters,
      ...data.parameters,
      ...localParameters,
    }
    this.componentName = data.componentName;
  }
}

export default Composer;
