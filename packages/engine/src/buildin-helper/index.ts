import { getComparionsHelper } from './comparison';
import { getUtilsHelper } from './utils';
import { getRosHelper } from './ros';
import { getK8sHelper } from './k8s';


export const getBuildInHelper = () => {
  return {
    ...getComparionsHelper(),
    ...getUtilsHelper(),
    ...getRosHelper(),
    ...getK8sHelper(),
  };
}
