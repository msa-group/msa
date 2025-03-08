const { getSpecs } = require('../index');
const fs = require('fs');

const msaYaml = fs.readFileSync('./__test__/msa.yml', 'utf8');

describe('getSpecs', () => {
  it('should return the specs', async () => {
    const res = await getSpecs(msaYaml, {
      Spec: {
        HttpApi: "https://msa-share.oss-cn-hangzhou.aliyuncs.com/projects/nextchat-ai-gateway/templates/apig.http.spec.yml"
      }
    })
    console.log(res);
  });
});
