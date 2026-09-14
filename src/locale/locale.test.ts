import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, it, expect } from 'vitest';
import { LocaleProvider, LocaleConsumer, useLocale, DefaultLocale, LocaleContext, LocaleContextKey } from './index';
import { ConfigProvider } from '../configProvider';
import zh_CN from './source/zh_CN';
import en_GB from './source/en_GB';
import ko_KR from './source/ko_KR';

const Probe = defineComponent({
  props: { name: { type: String, default: 'TimePicker' } },
  setup(props) {
    const { locale, localeCode } = useLocale(props.name);
    return () => h('span', `${localeCode.value}:${locale.value?.begin}`);
  },
});

describe('LocaleProvider', () => {
  it('defaults to zh_CN', () => {
    const w = mount(LocaleProvider, { slots: { default: () => h(Probe) } });
    expect(w.text()).toBe('zh-CN:开始');
    expect(DefaultLocale.code).toBe('zh-CN');
    expect(LocaleContext).toBe(LocaleContextKey);
  });
  it('provides locale to descendants and reacts to prop change', async () => {
    const w = mount(LocaleProvider, { props: { locale: en_GB as any }, slots: { default: () => h(Probe) } });
    expect(w.text()).toBe('en-GB:Start');
    await w.setProps({ locale: ko_KR as any });
    expect(w.text()).toBe('ko-KR:시작');
  });
  it('falls back to zh_CN when locale has no code', () => {
    const w = mount(LocaleProvider, { props: { locale: {} as any }, slots: { default: () => h(Probe) } });
    expect(w.text()).toBe('zh-CN:开始');
  });
  it('ConfigProvider locale wins over LocaleProvider', () => {
    const w = mount(LocaleProvider, {
      props: { locale: en_GB as any },
      slots: { default: () => h(ConfigProvider, { locale: ko_KR as any }, () => h(Probe)) },
    });
    expect(w.text()).toBe('ko-KR:시작');
  });
});

describe('LocaleConsumer', () => {
  it('scoped slot receives localeData, localeCode, dateFnsLocale, currency', () => {
    const w = mount(LocaleProvider, {
      props: { locale: en_GB as any },
      slots: {
        default: () =>
          h(LocaleConsumer, { componentName: 'TimePicker' }, {
            default: ({ localeData, localeCode, dateFnsLocale, currency, args }: any) =>
              h('div', `${localeCode} : ${localeData.begin} : ${dateFnsLocale.code} : ${currency} : ${args.length}`),
          }),
      },
    });
    expect(w.text()).toBe('en-GB : Start : en-GB : GBP : 4');
  });
  it('supports React-style children render function prop', () => {
    const w = mount(LocaleConsumer, {
      props: { componentName: 'Modal', children: (d: any, code: string) => h('b', `${code}-${d.confirm}`) },
    });
    expect(w.find('b').text()).toBe('zh-CN-确定');
  });
  it('reads custom component keys added to the locale object', () => {
    const custom = { ...zh_CN, ComponentA: { customKey: 'semi' } };
    const w = mount(LocaleProvider, {
      props: { locale: custom as any },
      slots: {
        default: () => h(LocaleConsumer, { componentName: 'ComponentA' }, { default: ({ localeData }: any) => h('i', localeData.customKey) }),
      },
    });
    expect(w.find('i').text()).toBe('semi');
  });
  it('falls back to default dateFnsLocale when locale lacks one', () => {
    const w = mount(LocaleProvider, {
      props: { locale: { ...en_GB, dateFnsLocale: undefined } as any },
      slots: { default: () => h(LocaleConsumer, { componentName: 'Modal' }, { default: ({ dateFnsLocale }: any) => h('i', dateFnsLocale.code) }) },
    });
    expect(w.find('i').text()).toBe(zh_CN.dateFnsLocale.code);
  });
  it('renders nothing without slot or children', () => {
    const w = mount(LocaleConsumer, { props: { componentName: 'Modal' } });
    expect(w.html()).toBe('<!---->');
  });
});
