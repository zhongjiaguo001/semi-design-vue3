import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { theme, generate, getDesignToken, generateThemeCss, parseColor, toTriplet, mix, getInjectedThemeStyles, useToken } from './index';
import ConfigProvider from '../configProvider';
import Button from '../button';

describe('theme/colors', () => {
  it('parses hex / rgb / hsl', () => {
    expect(parseColor('#0064fa')).toEqual({ r: 0, g: 100, b: 250, a: 1 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(parseColor('rgba(1, 2, 3, 0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('nope')).toBeNull();
  });
  it('generates a 10 step palette with the seed at index 5 (ant design algorithm)', () => {
    const p = generate('#1890ff');
    expect(p).toHaveLength(10);
    expect(p[5]).toBe('#1890ff');
    // reference values from @ant-design/colors
    expect(p[0]).toBe('#e6f7ff');
    expect(p[9]).toBe('#002766');
  });
  it('generates dark palette blended into background', () => {
    const p = generate('#1890ff', { theme: 'dark' });
    expect(p).toHaveLength(10);
    expect(p[0]).toBe('#111d2c');
  });
  it('triplet and mix', () => {
    expect(toTriplet('#0064fa')).toBe('0,100,250');
    expect(mix('#000000', '#ffffff', 50)).toBe('#808080');
  });
});

describe('theme/getDesignToken', () => {
  it('returns defaults', () => {
    const t = getDesignToken();
    expect(t.colorPrimary).toBe('#0064fa');
    expect(t.colorPrimaryHover).toBeDefined();
    expect(t.isDark).toBe(false);
    expect(t.borderRadius).toBe(3);
  });
  it('applies seed token overrides & derives palettes', () => {
    const t = getDesignToken({ token: { colorPrimary: '#00b96b', borderRadius: 8 } });
    expect(t.colorPrimary).toBe('#00b96b');
    expect(t.palettes.primary[5]).toBe('#00b96b');
    expect(t.colorPrimaryHover).toBe(t.palettes.primary[6]);
    expect(t.borderRadiusLG).toBe(16);
  });
  it('dark algorithm inverts neutrals', () => {
    const t = getDesignToken({ algorithm: theme.darkAlgorithm });
    expect(t.isDark).toBe(true);
    expect(t.colorBgBase).toBe('#16161a');
    expect(t.colorTextBase).toBe('#f9f9f9');
  });
  it('compact algorithm reduces sizes and can be combined', () => {
    const t = getDesignToken({ algorithm: [theme.darkAlgorithm, theme.compactAlgorithm] });
    expect(t.isDark).toBe(true);
    expect(t.controlHeight).toBe(24);
    expect(t.fontSize).toBe(12);
    const t2 = getDesignToken({ algorithm: theme.compactAlgorithm });
    expect(t2.isDark).toBe(false);
    expect(t2.controlHeight).toBe(24);
  });
  it('map token override wins over algorithm', () => {
    const t = getDesignToken({ token: { colorPrimaryHover: '#123456' } });
    expect(t.colorPrimaryHover).toBe('#123456');
  });
});

describe('theme/generateThemeCss', () => {
  it('emits only css vars affected by given tokens', () => {
    const g = generateThemeCss({ token: { colorPrimary: '#00b96b' } });
    expect(g.className).toMatch(/^semi-theme-/);
    expect(g.css).toContain(`.${g.className}.${g.className}, body .${g.className}{`);
    expect(g.css).toContain('--semi-color-primary:#00b96b;');
    expect(g.css).toContain('--semi-blue-5:0,185,107;');
    expect(g.css).toContain('--semi-color-link:#00b96b;');
    expect(g.css).not.toContain('--semi-color-success:');
    expect(g.css).not.toContain('--semi-color-text-0');
  });
  it('dark algorithm emits neutral vars', () => {
    const g = generateThemeCss({ algorithm: theme.darkAlgorithm });
    expect(g.isDark).toBe(true);
    expect(g.css).toContain('--semi-color-bg-0:#16161a;');
    expect(g.css).toContain('--semi-color-text-0:');
    expect(g.css).toContain('--semi-color-success:');
  });
  it('component tokens are scoped to the component class', () => {
    const g = generateThemeCss({ components: { Button: { colorPrimary: '#ff0000', borderRadius: 10 } } });
    expect(g.css).toContain(`.${g.className} .semi-button{`);
    expect(g.css).toContain('--semi-color-primary:#ff0000;');
    expect(g.css).toContain('--semi-border-radius-small:10px;');
    // unknown component falls back to semi-<name>
    const g2 = generateThemeCss({ components: { Foo: { '--my-var': '1px' } } as any });
    expect(g2.css).toContain('.semi-foo{--my-var:1px;}');
  });
  it('target body writes vars on body', () => {
    const g = generateThemeCss({ token: { colorPrimary: '#00b96b' }, target: 'body' });
    expect(g.className).toBe('');
    expect(g.css.startsWith('body, body[theme-mode]{')).toBe(true);
  });
  it('fontSize / controlHeight emit extra rules', () => {
    const g = generateThemeCss({ token: { fontSize: 16, controlHeight: 40 } });
    expect(g.css).toContain('font-size:16px');
    expect(g.css).toContain('height:40px');
    expect(g.css).toContain('--semi-height-control-default:40px');
  });
  it('same config produces same hash, different config different hash', () => {
    const a = generateThemeCss({ token: { colorPrimary: '#00b96b' } });
    const b = generateThemeCss({ token: { colorPrimary: '#00b96b' } });
    const c = generateThemeCss({ token: { colorPrimary: '#00b96c' } });
    expect(a.hash).toBe(b.hash);
    expect(a.hash).not.toBe(c.hash);
  });
});

describe('ConfigProvider theme integration', () => {
  it('injects style, wraps children with scope class and exposes useToken', async () => {
    const Probe = defineComponent({
      setup() {
        const { token, hashId } = useToken();
        return () => h('i', { id: 'probe', 'data-primary': token.value.colorPrimary, 'data-hash': hashId.value });
      },
    });
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { token: { colorPrimary: '#00b96b' } } },
      slots: { default: () => [h(Button, null, () => 'x'), h(Probe)] },
    });
    await nextTick();
    const root = wrapper.find('div');
    expect(root.classes().some((c) => c.startsWith('semi-theme-'))).toBe(true);
    expect(root.attributes('style')).toContain('display: contents');
    const styles = getInjectedThemeStyles();
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain('--semi-color-primary:#00b96b;');
    expect(wrapper.find('#probe').attributes('data-primary')).toBe('#00b96b');
    expect(wrapper.find('#probe').attributes('data-hash')).toBe(styles[0].getAttribute('data-semi-theme'));

    // change theme -> style replaced
    await wrapper.setProps({ theme: { token: { colorPrimary: '#ff0000' } } });
    await nextTick();
    const styles2 = getInjectedThemeStyles();
    expect(styles2.length).toBe(1);
    expect(styles2[0].textContent).toContain('--semi-color-primary:#ff0000;');

    wrapper.unmount();
    expect(getInjectedThemeStyles().length).toBe(0);
  });

  it('dark algorithm adds semi-always-dark class', async () => {
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { algorithm: theme.darkAlgorithm } },
      slots: { default: () => h('span', 'x') },
    });
    await nextTick();
    expect(wrapper.find('div').classes()).toContain('semi-always-dark');
    wrapper.unmount();
  });

  it('nested providers inherit tokens', async () => {
    const Probe = defineComponent({
      setup() {
        const { token } = useToken();
        return () => h('i', { id: 'probe', 'data-primary': token.value.colorPrimary, 'data-radius': token.value.borderRadius });
      },
    });
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      props: { theme: { token: { colorPrimary: '#00b96b', borderRadius: 9 } } },
      slots: {
        default: () => h(ConfigProvider, { theme: { token: { borderRadius: 2 } } }, () => h(Probe)),
      },
    });
    await nextTick();
    expect(wrapper.find('#probe').attributes('data-primary')).toBe('#00b96b');
    expect(wrapper.find('#probe').attributes('data-radius')).toBe('2');
    wrapper.unmount();
  });

  it('renders children without wrapper when no theme/direction', () => {
    const wrapper = mount(ConfigProvider, { slots: { default: () => h('span', { id: 's' }, 'x') } });
    expect(wrapper.element.tagName).toBe('SPAN');
  });
});
