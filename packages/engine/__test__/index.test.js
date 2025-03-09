import * as fs from "fs";
// import Engine from "../src/index";
import Engine from "../src/index";
import jsYaml from "js-yaml";
import { components } from "msa-spec";

const debugConfigYaml = fs.readFileSync("./__test__/config.debug.yml");
const debugConfigJson = jsYaml.load(debugConfigYaml);

describe("Engine", () => {
  it("should be defined", () => {
    const text = fs.readFileSync("./__test__/Msa.yml", "utf8");
    const engine = new Engine();

    const firstScenceParameters = debugConfigJson.SceneProfiles[0].Parameters;
    // console.log(JSON.stringify(firstScenceParameters))
    

    // console.log(specs, 'specs...')
    engine.parse(text, {
      Global: debugConfigJson.Parameters,
      Parameters: firstScenceParameters,
    }, {
      components
    }).then((parseEngine) => {
      const rs = parseEngine.create()
      console.log(rs);
      const opt = parseEngine.getArchitecture();
      // console.log(JSON.stringify(opt, null, 2), 'rs...')
      // fs.writeFileSync(, './c.yml')
      // expect(parseEngine).toBeDefined();
    });

  });
});