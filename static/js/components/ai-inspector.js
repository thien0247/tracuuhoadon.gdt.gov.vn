/**
 * ai-inspector.js
 * AI Inspector Mode: Store toàn cục + Component nhãn nhận diện per-component.
 * Alt+I để bật/tắt. Hiện popover thông tin + 1-click copy cho AI Agent.
 */
(() => {
  const { ref, computed, onMounted, onBeforeUnmount, h } = Vue;

  // ── Singleton reactive store ──────────────────────────────────────────────
  const inspectorMode = ref(false);

  function toggleInspector() { inspectorMode.value = !inspectorMode.value; }

  function handleKeydown(e) {
    if (e.altKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      toggleInspector();
    }
  }

  window.AiInspectorStore = { inspectorMode, toggleInspector };

  // ── AiComponentBadge component ────────────────────────────────────────────
  window.AiComponentBadge = {
    name: 'AiComponentBadge',
    props: {
      name:   { type: String, required: true },
      file:   { type: String, default: '' },
      module: { type: String, default: '' },
      desc:   { type: String, default: '' },
    },
    setup(props) {
      const popoverOpen = ref(false);
      const copied = ref('');

      const activeClass = computed(() =>
        inspectorMode.value ? 'ai-inspector-ring' : ''
      );

      function copyText(text, key) {
        navigator.clipboard.writeText(text).catch(() => {});
        copied.value = key;
        setTimeout(() => { copied.value = ''; }, 1500);
      }

      function copyName() { copyText(props.name, 'name'); }

      function copyPrompt() {
        const md = [
          `## Component: \`<${props.name} />\``,
          `- **File:** \`${props.file}\``,
          `- **Module:** ${props.module}`,
          `- **Mô tả:** ${props.desc}`,
          ``,
          `> Tôi muốn chỉnh sửa component \`${props.name}\` tại \`${props.file}\`.`,
        ].join('\n');
        copyText(md, 'prompt');
      }

      onMounted(() => document.addEventListener('keydown', handleKeydown));
      onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown));

      return { inspectorMode, popoverOpen, copied, activeClass, copyName, copyPrompt };
    },
    template: `
      <div class="ai-inspector-wrap" :class="activeClass" style="position:relative">
        <slot />

        <!-- Inspector label (visible only when mode is ON) -->
        <div v-if="inspectorMode" class="ai-badge-label" @click.stop="popoverOpen=!popoverOpen">
          &lt;{{ name }} /&gt;
        </div>

        <!-- ? button (always visible, small) -->
        <button class="ai-badge-hint" @click.stop="popoverOpen=!popoverOpen" :title="'[AI Inspector] ' + name">
          ?
        </button>

        <!-- Popover -->
        <div v-if="popoverOpen" class="ai-popover" @click.stop>
          <div class="ai-popover-header">
            <span>🔬 AI Inspector</span>
            <button class="ai-popover-close" @click="popoverOpen=false">✕</button>
          </div>
          <div class="ai-popover-body">
            <div class="ai-popover-row"><span class="ai-popover-key">Component</span>
              <code class="ai-popover-val">&lt;{{ name }} /&gt;</code></div>
            <div class="ai-popover-row"><span class="ai-popover-key">File</span>
              <code class="ai-popover-val">{{ file }}</code></div>
            <div class="ai-popover-row"><span class="ai-popover-key">Module</span>
              <span class="ai-popover-val">{{ module }}</span></div>
            <div class="ai-popover-row ai-popover-desc"><span class="ai-popover-key">Chức năng</span>
              <span class="ai-popover-val">{{ desc }}</span></div>
          </div>
          <div class="ai-popover-actions">
            <button class="ai-btn-copy" @click="copyName">
              {{ copied==='name' ? '✅ Đã copy!' : '📋 Copy tên' }}
            </button>
            <button class="ai-btn-prompt" @click="copyPrompt">
              {{ copied==='prompt' ? '✅ Đã copy!' : '🤖 Copy AI Prompt' }}
            </button>
          </div>
        </div>
      </div>
    `,
  };
})();
