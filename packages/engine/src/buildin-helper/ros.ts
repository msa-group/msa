import { toNotEmptyArray } from "../utils";



export const getRosHelper = () => {
  const Ros = {
    RosOutput: (resourceName: string, field: string, value?: any) => {
      if (value) return value;
      const temp = {
        ['Fn::GetAtt']: toNotEmptyArray([resourceName, field]),
      };
      return temp;
    },
    RosOutputHostName: (resourceName: string, field: string) => {
      const temp = {
        ['Fn::Select']: [
          '1',
          {
            ['Fn::Split']: ['://', Ros.RosOutput(resourceName, field)],
          },
        ],
      };
      return temp;
    },
    RosRouterServices: (service: any[] = [], scene?: string) => {
      const services = toNotEmptyArray(service);
      const serviceIds = services.map((_item, i) => `ServiceId${i + 1}`);
      const json = !scene ?
        (
          services.map((item, i) => ({
            ...item,
            ServiceId: `\${${serviceIds[i]}}`,
          }))
        ) :
        (
          {
            Services: services.map((item, i) => ({
              ...item,
              ServiceId: `\${${serviceIds[i]}}`,
            })),
            Scene: scene,
          }
        );
      const serviceJSONString = JSON.stringify(json);
      const serviceObject = services.reduce((acc, item, i) => {
        return {
          ...acc,
          [serviceIds[i]]: item?.['ServiceId'],
        }
      }, {});

      const temp = {
        ["Fn::Sub"]: [
          serviceJSONString,
          serviceObject,
        ]
      }
      return temp;
    },
    RosArray: (arr: any[]) => {
      const arrStr = toNotEmptyArray(arr).map((_item, i) => `\${item${i + 1}}`);
      const res = toNotEmptyArray(arr).reduce((acc, item, i) => {
        return {
          ...acc,
          [`item${i + 1}`]: item,
        }
      }, {});
      const temp = {
        ["Fn::Sub"]: [
          JSON.stringify(arrStr),
          res,
        ]
      }
      return temp;
    },
    RosEnvs: (obj: any) => {
      let res = [];
      Object.entries(obj).map(([key, value]) => {
        res.push( {
          name: key,
          value: value,
        })
      });
      return {
        ["Fn::Sub"]: [
          "${ConfigMapData}",
          {ConfigMapData: res},
        ]
      }
    },
  };
  return Ros;
}

const RosHelper = getRosHelper();

export default RosHelper;
