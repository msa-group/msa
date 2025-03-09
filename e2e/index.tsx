import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import jsYaml from "js-yaml";

import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { json } from "@codemirror/lang-json";
import { materialDark } from "@uiw/codemirror-theme-material";

import { components } from "../packages/spec/src/index";
import MseEngine from "../packages/engine/src/index";

const root = document.getElementById("app");


const engine = new MseEngine();

function App() {

  const [msaYaml, setMsaYaml] = useState("");
  const [currentScenceProfile, setCurrentScenceProfile] = useState(null);
  const [globalParameters, setGlobalParameters] = useState({});
  const [rosYaml, setRosYaml] = useState("");
  const [config, setConfig] = useState({ SceneProfiles: [] });
  const [arch, setArch] = useState("");
  const msaYamlRef = useRef(null);
  useEffect(() => {
    fetch("/api/config").then((res) => res.json()).then(({ data }) => {
      let globalConfig = jsYaml.load(data.debugConfigContent);
      const scenceProfiles = globalConfig.SceneProfiles;
      setCurrentScenceProfile(scenceProfiles[0]);
      setGlobalParameters(globalConfig.Parameters);
      setConfig(globalConfig);
    });
  }, []);

  useEffect(() => {
    if (currentScenceProfile) {
      fetch(`/api/msa?filePath=${currentScenceProfile.Template}`).then((res) => res.json()).then(({ data }) => {
        setMsaYaml(data.content);
        engine.parse(data.content, {
          Global: globalParameters,
          Parameters: currentScenceProfile.Parameters,
        }, {
          components
        }).then((parseEngine) => {
          const rs = parseEngine.create();
          const arch = parseEngine.getArchitecture();
          setArch(JSON.stringify(arch, null, 2));
          setRosYaml(rs);
        });
      });
    }
  }, [currentScenceProfile]);

  return (
    <div>
      <header>
        <select id="select-env">
          {
            config.SceneProfiles.map((item) => (
              <option value={item.Template}>{item.DisplayName["zh-cn"]}</option>
            ))
          }
        </select>
      </header>
      <div id="root">
        <div className="left">
          <div className="panel">
            <h3 className="panel-title">
              <div className="flex justify-between full-w">
                <span>MSA YAML Editor</span>
                <button id="generate-btn" onClick={() => {
                  engine.parse(msaYamlRef.current, {
                    Global: globalParameters,
                    Parameters: currentScenceProfile.Parameters,
                  }, {
                    components
                  }).then((parseEngine) => {
                    const rs = parseEngine.create();
                    const arch = parseEngine.getArchitecture();
                    setArch(JSON.stringify(arch, null, 2));
                    setRosYaml(rs);
                  });
                }}>生成</button>
              </div>
            </h3>
            <div className="panel-content">
              <CodeMirror
                id="yaml-viewer-editor"
                value={msaYaml}
                extensions={[yaml()]}
                height="100%"
                width="100%"
                lang="yaml"
                theme={materialDark}
                onChange={(value) => {
                  msaYamlRef.current = value;
                }}
              />
            </div>
          </div>
        </div>
        <div className="right">

          <div className="panel">
            <h3 className="panel-title">MSA YAML</h3>
            <div className="panel-content">
              <CodeMirror
                id="yaml-viewer"
                value={rosYaml}
                extensions={[yaml()]}
                height="100%"
                width="100%"
                lang="yaml"
                theme={materialDark}
                readOnly
              />
            </div>
          </div>
          <div className="panel">
            <h3 className="panel-title">Operation JSON</h3>
            <div className="panel-content">
              <CodeMirror
                id="json-viewer"
                value={arch}
                extensions={[json()]}
                height="100%"
                width="100%"
                lang="json"
                theme={materialDark}
                readOnly
              />
            </div>
          </div>
        </div>
        <dialog id="error-dialog">
          <div id="error-dialog-close">X</div>
          <div id="error-dialog-content"></div>
        </dialog>
      </div>
    </div>
  );
}

createRoot(root).render(<App />);
