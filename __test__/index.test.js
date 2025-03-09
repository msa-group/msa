import fs from "fs";
import jsYaml from "js-yaml";
import { components } from "../packages/spec/src/index";
import MseEngine from "../packages/engine/src/index";

const debugConfigYaml = fs.readFileSync("./__test__/config.debug.yml");
const debugConfigJson = jsYaml.load(debugConfigYaml);
const text = fs.readFileSync("./__test__/msa.yml", "utf8");

describe("mseEngine", () => {
  it("should be defined", () => {

    const firstScenceParameters = debugConfigJson.SceneProfiles[0].Parameters;

    const engine = new MseEngine();

    engine.parse(text, {
      Global: debugConfigJson.Parameters,
      Parameters: firstScenceParameters,
    }, {
      components
    }).then((parseEngine) => {
      const rs = parseEngine.create()
      console.log(rs);
      // const opt = parseEngine.getArchitecture();
      // console.log(JSON.stringify(opt, null, 2), 'rs...')
      // fs.writeFileSync(, './c.yml')
      // expect(parseEngine).toBeDefined();
    });
  });
});

