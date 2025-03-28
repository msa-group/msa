
export const getK8sHelper = () => {
  const K8s = {

    GetConfigMapRef: (config: { Name: string }[]) => {
      return config.map(item => {
        return {
          configMapRef: {
            name: item.Name,
          },
        };
      });
    },
    GetSecretRef: (secret: { Name: string }[]) => {
      return secret.map(item => {
        return {
          secretRef: {
            name: item.Name,
          },
        };
      });
    },
    GetEnvFrom: (config: { Name: string }[], secret: { Name: string }[]) => {
      return [...K8s.GetConfigMapRef(config), ...K8s.GetSecretRef(secret)];
    },

  }
  return K8s;
}

const K8sHelper = getK8sHelper();

export default K8sHelper;
