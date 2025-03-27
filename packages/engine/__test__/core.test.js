import * as fs from "fs";
import Engine from "../src/index";

const template = fs.readFileSync("./__test__/core-render.yml", 'utf8');
const res = fs.readFileSync("./__test__/core-res.yml", 'utf8');
describe("Engine", () => {
  it("core render", () => {
    const engine = new Engine();
    const rs = engine.core.render(template, {
      NamespaceId: "test-namespace-123",
      ServiceConnection: "http://127.0.0.1:12345",
      RedisHost: "http://127.0.0.1:12345",
      RedisPort: 6379,
      RedisPassword: "123456",
      DbHost: "http://127.0.0.1:12345",
      DbPort: 3306,
      DbUsername: "root",
      DbPassword: "123456",
      DbDatabase: "test",
      PgVectorHost: "http://127.0.0.1:12345",
      PgVectorPort: 5432,
      PgVectorUser: "root",
      PgVectorPassword: "123456",
      AccountId: "1234567890",
      RegionId: "cn-beijing",
    });
    expect(rs).toBe(res);
  });
});