// @id 01M4V0HMNXMKGV66HB630AFGQN
// @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * composables/useTheme.ts - Quản lý chế độ hiển thị Sáng/Tối chuẩn VDDS.
 */
import { ref } from 'vue';

const theme = ref<'light' | 'dark'>((localStorage.getItem('gdt_theme') as 'light' | 'dark') || 'light');

export function useTheme() {
  const applyTheme = (val: 'light' | 'dark') => {
    theme.value = val;
    localStorage.setItem('gdt_theme', val);
    document.documentElement.setAttribute('data-theme', val);
  };

  const toggleTheme = () => {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark');
  };

  const initTheme = () => {
    applyTheme(theme.value);
  };

  return { theme, toggleTheme, initTheme };
}
