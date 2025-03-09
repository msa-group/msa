const fs = require('fs');
const path = require('path');


function watchFile(watch = true, build = false) {

  const specPath = path.resolve(__dirname, '../specs');
  const componentPath = path.resolve(__dirname, '../components');
  const specFiles = fs.readdirSync(specPath);
  const componentFiles = fs.readdirSync(componentPath);
  // fs.mkdirSync('src/buildin-components', { recursive: true });
  // fs.mkdirSync('lib/buildin-components', { recursive: true });
  const specs = {};
  const components = {};

  for (const file of specFiles) {
    const text = fs.readFileSync(`${specPath}/${file}`, 'utf8');
    const fileName = file.replace(/\.spec\.[^/.]+$/, '');
    specs[fileName] = text;
  }

  for (const file of componentFiles) {
    const text = fs.readFileSync(`${componentPath}/${file}`, 'utf8');
    const fileName = file.replace(/\.[^/.]+$/, '');
    components[fileName] = text;
  }

  fs.writeFileSync(path.resolve(__dirname, '../src/components.js'), `export default ${JSON.stringify(components)}`,);
  fs.writeFileSync(path.resolve(__dirname, '../src/specs.js'), `export default ${JSON.stringify(specs)}`,);
  // if (watch) {
  //   fs.watch(watchPath, { recursive: true }, (event, file) => {
  //     const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
  //     const fileName = file.replace(/\.[^/.]+$/, '');
  //     j[fileName] = text;
  //     fs.writeFileSync(`src/buildin-components/index.js`, `export default ${JSON.stringify(j)}`,);
  //   });
  //   fs.watch('msa/spec', { recursive: true }, (event, file) => {
  //     const text = fs.readFileSync(`msa/spec/${file}`, 'utf8');
  //     const fileName = file.replace(/\.spec\.[^/.]+$/, '');
  //     specs[fileName] = text;
  //     fs.writeFileSync(`src/buildin-spec/index.js`, `export default ${JSON.stringify(specs)}`,);
  //   });
  // }

}

watchFile();
