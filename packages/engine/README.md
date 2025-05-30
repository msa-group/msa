
MSA Engine
===========


Usage
-----

```js
import Engine from "msa-engine";
import { components } from "msa-spec";

const engine = new Engine();

const Global = {};
const Parameters = {};

engine.parse(yamlText, {
  Global,
  Parameters,
}, { components }).then((parsedEngine) => {
  console.log(parsedEngine.create());
  console.log(parsedEngine.getOperation());
});
```

Parser
------
渲染基础数据
```html
{{name}}
```

渲染 True/False
```html
{{&true}}
True
{{/}}
{{^true}}
False
{{/}}
{{!true}}
False
{{/}}
```
渲染列表
```html
{{#list}}
Index: {{$index}}
Item: {{$item}}
{{/}}
```

渲染嵌套列表
```html
{{#list}}
Index: {{$index}}
Item: {{$item}}
{{#$item.children}}
  ChildIndex: {{$index}}
  Item: {{$item}}
  ParentIndex: {{$parent.$index}}
  ParentItem: {{$parent.$item}}
{{/}}
{{/}}
```

Testing
-------

```bash
npm run dev
```


# 内置 Helper

## comparison

### [{{and}}](buildin/comparison.ts)
逻辑与
**参数**：`...args`

* `...args` **{unknown[]}**
* `returns` **{boolean}**: 返回值，如果所有参数都为 true，则返回 `true`，否则返回 `false`

**Example**

```yaml
{{&and(eq(Parameters.Cpu, 1), eq(Parameters.Memory, 1024))}}
HttpTrigger:
  Type: ALIYUN::FC3::Trigger
{{/}}
```

### [{{or}}](buildin/comparison.ts)
逻辑或
**参数**：`...args`

* `...args` **{unknown[]}**
* `returns` **{boolean}**: 返回值，如果任意一个参数为 true，则返回 `true`，否则返回 `false`

**Example**

```yaml
{{&or(eq(Parameters.Cpu, 1), eq(Parameters.Memory, 1024))}}
HttpTrigger:
  Type: ALIYUN::FC3::Trigger
{{/}}
```

### [{{not}}](buildin/comparison.ts)
逻辑非
**参数**：`a`

* `a` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 为 false，则返回 `true`，否则返回 `false`

**Example**

```yaml
{{&not(eq(Parameters.Cpu, 1))}}
HttpTrigger:
  Type: ALIYUN::FC3::Trigger
{{/}}
```

### [{{eq}}](buildin/comparison.ts)
逻辑判断，如果 `a` **等于** `b`，则返回 true, 否则返回 false
**注**：如果参数为非原始类型，则会进行序列化后以字符串形式进行比较
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 等于 `b`，则返回 `true`，否则返回 `false`

**Example**

```yaml
{{&eq(Parameters.Cpu, 1)}}
HttpTrigger:
  Type: ALIYUN::FC3::Trigger
{{/}}
```

### [{{gt}}](buildin/comparison.ts)
逻辑判断，如果 `a` **大于** `b`，则返回 true, 否则返回 false
**注**：如果参数为非原始类型，则会进行序列化后以字符串形式进行比较
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 大于 `b`，则返回 `true`，否则返回 `false`

### [{{gte}}](buildin/comparison.ts)
逻辑判断，如果 `a` **大于等于** `b`，则返回 true, 否则返回 false
**注**：如果参数为非原始类型，则会进行序列化后以字符串形式进行比较
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 大于等于 `b`，则返回 `true`，否则返回 `false`

### [{{lt}}](buildin/comparison.ts)
逻辑判断，如果 `a` **小于** `b`，则返回 true, 否则返回 false
**注**：如果参数为非原始类型，则会进行序列化后以字符串形式进行比较
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 小于 `b`，则返回 `true`，否则返回 `false`

### [{{lte}}](buildin/comparison.ts)
逻辑判断，如果 `a` **小于等于** `b`，则返回 true, 否则返回 false
**注**：如果参数为非原始类型，则会进行序列化后以字符串形式进行比较
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `a` 小于等于 `b`，则返回 `true`，否则返回 `false`


## utils

### [{{Get}}](buildin/utils.ts)
获取对象的属性, 参考 lodash.get
**参数**：`data`、`key`、`defaultValue`

* `data` **{unknown}**
* `key` **{string}**
* `defaultValue` **{unknown}**

### [{{IsTls}}](buildin/utils.ts)
判断是否为 Https， 参数有可能为 Object
**注**：如果参数为 Object，则需要将 Object 转换为 JSON 字符串后判断是否包含 `:443` 或 `:80`
**参数**：`url`

* `url` **{unknown}**
* `returns` **{boolean}**: 返回值，如果 `url` 为 Https，则返回 `true`，否则返回 `false`

**Example**

```yaml
{{&IsTls(Parameters.Url)}}
HttpTrigger:
  Type: ALIYUN::FC3::Trigger
{{/}}
```

### [{{Join}}](buildin/utils.ts)
合并两个字符串
**参数**：`a`、`b`

* `a` **{string}**
* `b` **{string}**
* `c` **{string}** 默认值为 `-`
* `returns` **{string}**: 返回值，返回合并后的字符串

**Example**

```yaml
{{Join(Parameters.Name, "zxc")}}
{{Join(Parameters.Name, "zxc", "&")}}
```

### [{{SubfixRandom}}](buildin/utils.ts)
在字符串后面添加随机后缀
**参数**：`a`、`b`, `c`

* `a` **{string}**
* `b` **{string}** 随机串长度 默认值为 `4`
* `c` **{string}** 链接符 默认值为 `-`
* `returns` **{string}**: 返回值，返回添加后缀后的字符串

**Example**

```yaml
{{SubfixRandom(Parameters.Name)}}
{{SubfixRandom(Parameters.Name, 8, "_")}}
```

### [{{Subfix}}](buildin/utils.ts)
在字符串后面添加随机后缀，并且只生成一次
**参数**：`...params`

* `...params` **{unknown[]}**
* `returns` **{string}**: 返回值，返回添加后缀后的字符串

**Example**

```yaml
{{Subfix(Parameters.Name)}}
```

### [{{Default}}](buildin/utils.ts)
获取默认值
**参数**：`a`、`b`

* `a` **{unknown}**
* `b` **{unknown}**
* `returns` **{unknown}**: 返回值，如果 `a` 被隐式转换为 false，则返回 `b`，否则返回 `a`

### [{{OSSAddress}}](buildin/utils.ts)
获取 OSS 地址
**参数**：`ossName`、`region`、`type`

* `ossName` **{string}**
* `region` **{string}**
* `type` **{string}** 默认值为 `internal`
* `returns` **{string}**: 返回值，返回 OSS 地址

### [{{IsOSSWebsite}}](buildin/utils.ts)
判断是否为 OSS 网站
**参数**：`address`

* `address` **{string}**
* `returns` **{boolean}**: 返回值，返回是否为 OSS 网站

## ros

### [{{RosOutput}}](buildin/ros.ts)
将参数转为 Ros 的 Fn::GetAtt 格式, 如果有 value ， 则直接返回 value
**参数**：`resourceName`、`field`、`value`

* `resourceName` **{string}**
* `field` **{string}**
* `value` **{any}** 默认值为 `undefined`
* `returns` **{string}**: 返回值，返回 JSON 字符串

**Example**

```yaml
{{RosOutput(ChatgptWeb.HttpTrigger, "UrlIntranet")}}
```

**输出**

```yaml
Fn::GetAtt:
  - ChatgptWebHttpTrigger
  - UrlIntranet
```

### [{{RosRouterServices}}](buildin/ros.ts)
将路由场景和路由服务转换为 Ros 的 Fn::Sub 格式
**参数**：`services`、`scene`

* `services` **{unknown[]}**
* `scene` **{string}**
* `returns` **{string}**: 返回值，返回 JSON 字符串

**Example**

```yaml
{{RosRouterServices(Operation.Services, Operation.Scene)}}
```

**输出**

```yaml
Fn::Sub:
  - '{"Services":[{"ServiceId":"${ServiceId1}","Protocol":"HTTP","Weight":"50%"},{"ServiceId":"${ServiceId2}","Protocol":"HTTP","Weight":"50%"}],"Scene":"SingleService"}'
  - ServiceId1:
      ServiceId:
        Fn::GetAtt:
          - ChatgptWebRouteRouteApi
          - ServiceId
  - ServiceId2:
      ServiceId:
        Fn::GetAtt:
          - ChatgptWebRouteRouteApi
          - ServiceId
```

### [{{RosArray}}](buildin/ros.ts)
将数组转换为 Ros 的 Fn::Sub 格式
**参数**：`arr`

* `arr` **{unknown[]}**
* `returns` **{string}**: 返回值，返回 JSON 字符串

**Example**

```yaml
{{RosArray(["test1", "test2"])}}
```

**输出**

```yaml
Fn::Sub:
  - '["${item1}","${item2}"]'
  - item1: test1
    item2: test2
```


### [{{RosEnvs}}](buildin/ros.ts)
将环境变量对象转换成 SAE 的 Evns 对象数组的形式
**参数**：`obj`

* `obj` **{Record<string, string>}**
* `returns` **{Array<{name: string, value: string}>}**: 返回值，返回 对象数组

**Example**

```yaml
{{RosEnvs({env1: value1, env2: value2})}}
```

**输出**

```yaml
Fn::Sub:
  - "${res}",
  - res:
    - name: env1
      value: value1
    - name: env2
      value: value2
```
