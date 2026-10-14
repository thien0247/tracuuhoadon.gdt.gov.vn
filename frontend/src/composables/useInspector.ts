// @id 01M4V0HMNSQ56MXP848JV61FVB
// @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * composables/useInspector.ts - Quản lý trạng thái AI Inspector & Modal tra cứu component.
 */
import { ref } from 'vue';

export interface InspectorMeta {
  name: string;
  file: string;
  module: string;
  desc: string;
}

const inspectorMode = ref(false);
const selectedComponent = ref<InspectorMeta | null>(null);

export function useInspector() {
  const toggleInspector = () => {
    inspectorMode.value = !inspectorMode.value;
  };

  const openInspector = (meta: InspectorMeta) => {
    selectedComponent.value = meta;
  };

  const closeInspector = () => {
    selectedComponent.value = null;
  };

  return { inspectorMode, selectedComponent, toggleInspector, openInspector, closeInspector };
}
