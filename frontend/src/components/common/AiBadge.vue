<!-- @id 01M4V0HMMJTV6V77PFNGJ4V8K7 -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="ai-inspector-wrap" :class="{ 'ai-inspector-ring': inspectorMode }">
    <div v-if="inspectorMode" class="ai-badge-label" @click="openInspector(meta)">
      {{ name }}
    </div>
    <div v-if="inspectorMode" class="ai-badge-hint" title="Bấm để xem thông tin component" @click="openInspector(meta)">
      ?
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInspector, type InspectorMeta } from '@/composables/useInspector';

const props = defineProps<{
  name: string;
  file: string;
  module: string;
  desc: string;
}>();

const { inspectorMode, openInspector } = useInspector();

const meta = computed<InspectorMeta>(() => ({
  name: props.name,
  file: props.file,
  module: props.module,
  desc: props.desc
}));
</script>
