import { describe, it, expect, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { theme, useToken, getInjectedThemeStyles, generateThemeCss } from './index';
import ConfigProvider from '../configProvider';
import Button from '../button';
import Tooltip from '../tooltip';
import Modal from '../modal';
import Space from '../space';
import Switch from '../switch';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

describe('theme integration (antd style)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('inherit: false ignores parent tokens', async () => {
    const Probe = defineComponent({
      setup() {
        const { token } = useToken();
        return () => h('i', { id: 'p', 'data-primary': token.value.colorPrimary, 'data-radius': token.value.borderRadius });
      },
    });
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { token: { colorPrimary: '#00b96b', borderRadius: 9 } } },
      slots: {
        default: () =>
          h(ConfigProvider, { theme: { token: { borderRadius: 2 }, inherit: false } }, () => h(Probe)),
      },
    });
    await wait(0);
    expect(w.find('#p').attributes('data-primary')).toBe('#0064fa'); // default seed, not the parent's green
    expect(w.find('#p').attributes('data-radius')).toBe('2');
    w.unmount();
  });

  it('component tokens accept plain css variables and only affect that component', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { components: { Button: { '--semi-button-border-radius': '999px' } } } },
      slots: { default: () => [h(Button, null, () => 'x'), h(Switch)] },
    });
    await wait(0);
    const styles = getInjectedThemeStyles();
    const css = styles.map((s) => s.textContent).join('\n');
    const scope = w.find('div').classes().find((c) => c.startsWith('semi-theme-'));
    expect(css).toContain(`.${scope} .semi-button{--semi-button-border-radius:999px;}`);
    expect(css).not.toContain('.semi-switch{');
    w.unmount();
  });

  it('changing the theme at runtime injects a new stylesheet and removes the previous one', async () => {
    const cfg = ref<any>({ token: { colorPrimary: '#00b96b' } });
    const Host = defineComponent({
      setup() {
        return () => h(ConfigProvider, { theme: cfg.value }, () => h(Button, null, () => 'x'));
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await wait(0);
    const first = getInjectedThemeStyles();
    expect(first).toHaveLength(1);
    expect(first[0].textContent).toContain('#00b96b');

    cfg.value = { token: { colorPrimary: '#ff0000' }, algorithm: theme.darkAlgorithm };
    await wait(0);
    const second = getInjectedThemeStyles();
    expect(second).toHaveLength(1);
    expect(second[0].id).not.toBe(first[0].id);
    expect(second[0].textContent).toContain('#ff0000');
    expect(second[0].textContent).toContain('--semi-color-bg-0:#16161a;');
    w.unmount();
    expect(getInjectedThemeStyles()).toHaveLength(0);
  });

  it('portals (tooltip) receive the theme scope class and follow theme changes', async () => {
    const cfg = ref<any>({ token: { colorPrimary: '#00b96b' } });
    const Host = defineComponent({
      setup() {
        return () =>
          h(ConfigProvider, { theme: cfg.value }, () =>
            h(Tooltip, { content: 'tip', trigger: 'custom', visible: true, motion: false }, () => h(Button, null, () => 't'))
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await wait();
    const portal = document.querySelector('.semi-portal') as HTMLElement;
    expect(portal).toBeTruthy();
    const scopeClass = Array.from(portal.classList).find((c) => c.startsWith('semi-theme-'));
    expect(scopeClass).toBeTruthy();
    expect(w.find('div').classes()).toContain(scopeClass);

    // dark theme: portal must gain semi-always-dark and the new scope class
    cfg.value = { algorithm: theme.darkAlgorithm };
    await wait();
    const portal2 = document.querySelector('.semi-portal') as HTMLElement;
    expect(portal2.classList.contains('semi-always-dark')).toBe(true);
    expect(Array.from(portal2.classList).some((c) => c.startsWith('semi-theme-'))).toBe(true);
    expect(Array.from(portal2.classList).includes(scopeClass as string)).toBe(false);
    w.unmount();
  });

  it('modal created inside the provider inherits the theme scope', async () => {
    const visible = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(ConfigProvider, { theme: { token: { colorPrimary: '#00b96b' } } }, () =>
            h(Modal, { visible: visible.value, title: 'T', motion: false, getPopupContainer: () => document.body }, () => h('span', 'body'))
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    visible.value = true;
    await wait();
    const modal = document.querySelector('.semi-modal') as HTMLElement;
    expect(modal).toBeTruthy();
    const wrap = modal.closest('.semi-portal') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(Array.from(wrap.classList).some((c) => c.startsWith('semi-theme-'))).toBe(true);
    w.unmount();
  });

  it('theme.generate exposes the antd palette algorithm', () => {
    const palette = theme.generate('#00b96b');
    expect(palette).toHaveLength(10);
    expect(palette[5]).toBe('#00b96b');
    expect(theme.getDesignToken({ token: { colorPrimary: '#00b96b' } }).colorPrimaryHover).toBe(palette[6]);
  });

  it('compact + dark algorithm emit smaller control heights', async () => {
    const g = generateThemeCss({ token: { colorPrimary: '#0064fa' }, algorithm: [theme.darkAlgorithm, theme.compactAlgorithm] });
    expect(g.css).toContain('--semi-height-control-default:24px;');
    expect(g.css).toContain('--semi-color-bg-0:#16161a;');
    expect(g.css).toContain('--semi-blue-5:');
  });

  it('Space and Switch are usable together inside a themed provider (regression: named exports)', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { token: { colorPrimary: '#722ed1' } } },
      slots: { default: () => h(Space, { vertical: true }, () => [h(Button, null, () => 'a'), h(Switch, { defaultChecked: true })]) },
    });
    await wait(0);
    expect(w.find('.semi-space').exists()).toBe(true);
    expect(w.find('.semi-switch').classes()).toContain('semi-switch-checked');
    w.unmount();
  });
});
