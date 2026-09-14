import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ColorPicker, ColorChooseArea, AlphaSlider, ColorSlider, DataPart, ColorPickerFoundation, colorStringToValue, colorValueToString, defaultColorValue } from './index';
import type { ColorValue } from './index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wait = async (ms = 120) => {
  await sleep(ms);
  await flushPromises();
  await nextTick();
};

/** open the Semi Select in DataPart and click the given format option */
const pickFormat = async (wrapper: any, format: string) => {
  await wrapper.find('.semi-colorPicker-formatSelect').trigger('click');
  await wait();
  const opt = Array.from(document.querySelectorAll('.semi-select-option')).find((o) => o.textContent === format) as HTMLElement;
  opt.click();
  await wait();
};

const RED: ColorValue = { hsva: { h: 0, s: 100, v: 100, a: 1 }, rgba: { r: 255, g: 0, b: 0, a: 1 }, hex: '#ff0000' };

const mockRect = (el: Element, x = 0, y = 0, width = 280, height = 280) => {
  (el as any).getBoundingClientRect = () => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON() {} });
};

describe('ColorPicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('renders picker with area, hue slider, data part and default value; no alpha slider by default', async () => {
    const wrapper = mount(ColorPicker);
    await nextTick();
    expect(wrapper.classes()).toContain('semi-colorPicker');
    expect(wrapper.find('.semi-colorPicker-colorChooseArea').exists()).toBe(true);
    expect(wrapper.find('.semi-colorPicker-colorSlider').exists()).toBe(true);
    expect(wrapper.find('.semi-colorPicker-alphaSlider').exists()).toBe(false);
    expect(wrapper.find('.semi-colorPicker-dataPart').exists()).toBe(true);
    const area = wrapper.find('.semi-colorPicker-colorChooseArea');
    expect(area.attributes('style')).toContain('width: 280px');
    expect(area.attributes('style')).toContain('height: 280px');
    expect(area.attributes('aria-valuetext')).toBe('Saturation 71%, Brightness 77%');
    expect(wrapper.find('.semi-colorPicker-colorDemoBlock').attributes('style')).toContain('rgb(57, 197, 187)');
    expect((wrapper.find('.semi-colorPicker-colorPickerInput input').element as HTMLInputElement).value).toBe('#39c5bb');
    expect(wrapper.find('.semi-colorPicker-eyeDropper').exists()).toBe(true);
    expect(wrapper.find('.semi-colorPicker-colorPickerInputNumber').exists()).toBe(false);
  });

  it('width / height / alpha / eyeDropper=false / className / class / topSlot / bottomSlot', () => {
    const wrapper = mount(ColorPicker, {
      props: { width: 200, height: 100, alpha: true, eyeDropper: false, className: 'a', class: 'b', topSlot: h('i', { class: 'top' }), bottomSlot: 'bottom' },
    });
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    const area = wrapper.find('.semi-colorPicker-colorChooseArea');
    expect(area.attributes('style')).toContain('width: 200px');
    expect(area.attributes('style')).toContain('height: 100px');
    expect(wrapper.find('.semi-colorPicker-colorSlider').attributes('style')).toContain('width: 200px');
    expect(wrapper.find('.semi-colorPicker-alphaSlider').exists()).toBe(true);
    expect(wrapper.find('.semi-colorPicker-colorPickerInputNumber').exists()).toBe(true);
    expect(wrapper.find('.semi-colorPicker-eyeDropper').exists()).toBe(false);
    expect(wrapper.find('.top').exists()).toBe(true);
    expect(wrapper.text()).toContain('bottom');
    const slotted = mount(ColorPicker, { slots: { topSlot: () => h('i', { class: 'ts' }), bottomSlot: () => h('i', { class: 'bs' }) } });
    expect(slotted.find('.ts').exists()).toBe(true);
    expect(slotted.find('.bs').exists()).toBe(true);
  });

  it('defaultValue / defaultFormat (rgba / hsva input values)', async () => {
    const rgba = mount(ColorPicker, { props: { defaultValue: RED, defaultFormat: 'rgba' } });
    await nextTick();
    expect((rgba.find('.semi-colorPicker-colorPickerInput input').element as HTMLInputElement).value).toBe('255,0,0');
    expect(rgba.find('.semi-colorPicker-formatSelect .semi-select-selection-text').text()).toBe('rgba');
    const hsva = mount(ColorPicker, { props: { defaultValue: RED, defaultFormat: 'hsva' } });
    await nextTick();
    expect((hsva.find('.semi-colorPicker-colorPickerInput input').element as HTMLInputElement).value).toBe('0,100,100');
  });

  it('clicking the choose area changes saturation/value and emits change + v-model updates', async () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED } });
    const area = wrapper.find('.semi-colorPicker-colorChooseArea');
    mockRect(area.element);
    await area.trigger('mousedown', { clientX: 140, clientY: 140 });
    const change = wrapper.emitted('change')![0][0] as ColorValue;
    expect(change.hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
    expect(change.rgba).toEqual({ r: 128, g: 64, b: 64, a: 1 });
    expect(wrapper.emitted('update:value')![0][0]).toEqual(change);
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual(change);
    // uncontrolled: state updated
    expect(area.attributes('aria-valuetext')).toBe('Saturation 50%, Brightness 50%');
    expect(area.attributes('style')).toContain('cursor: grabbing');
    const handle = area.find('.semi-colorPicker-handle');
    expect(handle.attributes('style')).toContain('left: 130px');
    expect(handle.attributes('style')).toContain('top: 130px');
    // dragging inside the area continues to update, mouseup ends the drag
    area.element.dispatchEvent(new MouseEvent('mousemove', { clientX: 280, clientY: 0, bubbles: true }));
    await nextTick();
    expect((wrapper.emitted('change')!.at(-1)![0] as ColorValue).hsva).toEqual({ h: 0, s: 100, v: 100, a: 1 });
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(area.attributes('style')).toContain('cursor: pointer');
    area.element.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('change')).toHaveLength(2);
    // out of range mouse position is ignored
    await area.trigger('mousedown', { clientX: 500, clientY: 500 });
    expect(wrapper.emitted('change')).toHaveLength(2);
  });

  it('hue slider changes h; alpha slider changes a', async () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED, alpha: true } });
    const slider = wrapper.find('.semi-colorPicker-colorSlider');
    mockRect(slider.element, 0, 0, 280, 10);
    await slider.trigger('mousedown', { clientX: 140, clientY: 5 });
    let change = wrapper.emitted('change')![0][0] as ColorValue;
    expect(change.hsva.h).toBe(180);
    expect(change.hex).toBe('#00ffff');
    expect(wrapper.find('.semi-colorPicker-colorSlider .semi-colorPicker-handle').attributes('style')).toContain('left: 131px');
    window.dispatchEvent(new MouseEvent('mouseup'));
    const alpha = wrapper.find('.semi-colorPicker-alphaSlider');
    mockRect(alpha.element, 0, 0, 280, 10);
    await alpha.trigger('mousedown', { clientX: 140, clientY: 5 });
    change = wrapper.emitted('change')![1][0] as ColorValue;
    expect(change.hsva.a).toBe(0.5);
    expect(change.rgba.a).toBe(0.5);
    expect(change.hex).toBe('#00ffff80');
    expect(wrapper.find('.semi-colorPicker-alphaSlider').attributes('aria-valuetext')).toBe('50%');
    expect(wrapper.find('.semi-colorPicker-alphaHandle').attributes('style')).toContain('left: 131px');
    // alpha number input
    const num = wrapper.find('.semi-colorPicker-colorPickerInputNumber input');
    expect((num.element as HTMLInputElement).value).toBe('50');
    window.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('alpha=false forces a=1 on alpha change and strips hex alpha', () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED } });
    (wrapper.vm as any).foundation.handleAlphaChangeByHandle({ a: 0.3 });
    const change = wrapper.emitted('change')![0][0] as ColorValue;
    expect(change.rgba.a).toBe(1);
    expect(change.hex).toBe('#ff0000');
  });

  it('text input: valid hex / rgba / hsva strings change the color, invalid ones are ignored', async () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED } });
    const input = wrapper.find('.semi-colorPicker-colorPickerInput input');
    await input.setValue('#00ff00');
    expect((wrapper.emitted('change')![0][0] as ColorValue).rgba).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    await input.setValue('zzz');
    expect(wrapper.emitted('change')).toHaveLength(1);
    // hex without # is accepted (chrome quirk)
    await input.setValue('0000ff');
    expect((wrapper.emitted('change')![1][0] as ColorValue).hex).toBe('#0000ff');
    // format switch to rgba
    await pickFormat(wrapper, 'rgba');
    expect((input.element as HTMLInputElement).value).toBe('0,0,255');
    await input.setValue('10,20,30');
    expect((wrapper.emitted('change')![2][0] as ColorValue).rgba).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    await input.setValue('999,0,0');
    expect(wrapper.emitted('change')).toHaveLength(3);
    await pickFormat(wrapper, 'hsva');
    await input.setValue('120,50,50');
    expect((wrapper.emitted('change')![3][0] as ColorValue).hsva).toEqual({ h: 120, s: 50, v: 50, a: 1 });
  });

  it('alpha number input in every format', async () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED, alpha: true } });
    const num = wrapper.find('.semi-colorPicker-colorPickerInputNumber input');
    await num.setValue('50');
    await num.trigger('blur');
    expect((wrapper.emitted('change')!.at(-1)![0] as ColorValue).rgba.a).toBeCloseTo(0.5, 1);
    await pickFormat(wrapper, 'rgba');
    await num.setValue('25');
    await num.trigger('blur');
    expect((wrapper.emitted('change')!.at(-1)![0] as ColorValue).rgba.a).toBe(0.25);
    await pickFormat(wrapper, 'hsva');
    await num.setValue('75');
    await num.trigger('blur');
    expect((wrapper.emitted('change')!.at(-1)![0] as ColorValue).hsva.a).toBe(0.75);
  });

  it('controlled value: emits but does not change until parent updates; v-model works', async () => {
    const wrapper = mount(ColorPicker, { props: { value: RED } });
    const area = wrapper.find('.semi-colorPicker-colorChooseArea');
    mockRect(area.element);
    await area.trigger('mousedown', { clientX: 140, clientY: 140 });
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(area.attributes('aria-valuetext')).toBe('Saturation 100%, Brightness 100%');
    await wrapper.setProps({ value: defaultColorValue });
    expect(area.attributes('aria-valuetext')).toBe('Saturation 71%, Brightness 77%');

    const Parent = defineComponent({
      setup() {
        const v = ref<ColorValue>(RED);
        return () => h('div', [h(ColorPicker, { modelValue: v.value, 'onUpdate:modelValue': (val: ColorValue) => (v.value = val) }), h('span', { id: 'out' }, v.value.hex)]);
      },
    });
    const p = mount(Parent);
    const area2 = p.find('.semi-colorPicker-colorChooseArea');
    mockRect(area2.element);
    await area2.trigger('mousedown', { clientX: 140, clientY: 140 });
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(p.find('#out').text()).toBe('#804040');
    expect(area2.attributes('aria-valuetext')).toBe('Saturation 50%, Brightness 50%');
  });

  it('eyeDropper button uses window.EyeDropper when available', async () => {
    const open = vi.fn().mockResolvedValue({ sRGBHex: '#123456' });
    vi.stubGlobal('EyeDropper', class {
      open = open;
    });
    const wrapper = mount(ColorPicker);
    await wrapper.find('.semi-colorPicker-eyeDropper').trigger('click');
    await flushPromises();
    expect(open).toHaveBeenCalled();
    expect((wrapper.emitted('change')![0][0] as ColorValue).hex).toBe('#123456');
  });

  it('usePopover renders the trigger and the picker inside a popover; popoverProps forwarded; custom children', async () => {
    const wrapper = mount(ColorPicker, {
      attachTo: document.body,
      props: { usePopover: true, defaultValue: RED, popoverProps: { trigger: 'click', motion: false, className: 'pp' } },
    });
    const trigger = wrapper.find('.semi-colorPicker-popover-defaultChildren');
    expect(trigger.exists()).toBe(true);
    expect(trigger.attributes('style')).toContain('background-color: rgb(255, 0, 0)');
    expect(document.querySelector('.semi-colorPicker')).toBeNull();
    await trigger.trigger('click');
    await wait();
    const pop = document.querySelector('.semi-popover-wrapper, .semi-tooltip-wrapper') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.classList.contains('semi-colorPicker-popover')).toBe(true);
    expect(pop.classList.contains('pp')).toBe(true);
    expect(document.querySelector('.semi-colorPicker .semi-colorPicker-colorChooseArea')).toBeTruthy();
    wrapper.unmount();

    const custom = mount(ColorPicker, { props: { usePopover: true }, slots: { default: () => h('button', { class: 'my-trigger' }, 'pick') } });
    expect(custom.find('.my-trigger').exists()).toBe(true);
    expect(custom.find('.semi-colorPicker-popover-defaultChildren').exists()).toBe(false);
  });

  it('statics: colorStringToValue / colorValueToString / foundation converters', () => {
    expect((ColorPicker as any).colorStringToValue).toBe(colorStringToValue);
    expect((ColorPicker as any).colorValueToString).toBe(colorValueToString);
    expect(colorStringToValue('#ff0000')).toEqual(RED);
    const rgba = colorStringToValue('rgba(255, 0, 0, 0.5)');
    expect(rgba.rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(rgba.hex).toBe('#ff000080');
    const rgb = colorStringToValue('rgb(0, 255, 0)');
    expect(rgb.hex).toBe('#00ff00');
    const hsv = colorStringToValue('hsv(120, 100%, 100%)');
    expect(hsv.rgba).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(() => colorStringToValue('nope')).toThrow();
    expect(colorValueToString(RED)).toBe('#ff0000');
    expect(colorValueToString(RED, 'rgba')).toBe('rgba(255, 0, 0, 1)');
    expect(colorValueToString(RED, 'hsva')).toBe('hsva(0, 100%, 100%, 1)');
    expect((ColorPickerFoundation as any).hexToRgba('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect((ColorPicker as any).__SemiComponentName__).toBe('ColorPicker');
  });
});

describe('ColorPicker sub components', () => {
  const makeFoundation = () => {
    const wrapper = mount(ColorPicker, { attachTo: document.body, props: { defaultValue: RED, alpha: true } });
    return (wrapper.vm as any).foundation;
  };

  it('ColorChooseArea standalone: handle position from hsva, onChange on click, style/className', async () => {
    const onChange = vi.fn();
    const wrapper = mount(ColorChooseArea, { props: { hsva: { h: 0, s: 50, v: 50, a: 1 }, foundation: makeFoundation(), onChange, width: 100, height: 100, handleSize: 10, className: 'cca', style: { border: '1px solid red' } } });
    expect(wrapper.classes()).toContain('cca');
    expect(wrapper.attributes('style')).toContain('border: 1px solid red');
    const handle = wrapper.find('.semi-colorPicker-handle');
    expect(handle.attributes('style')).toContain('left: 45px');
    expect(handle.attributes('style')).toContain('top: 45px');
    expect(handle.attributes('style')).toContain('rgb(128, 64, 64)');
    mockRect(wrapper.element, 0, 0, 100, 100);
    await wrapper.trigger('mousedown', { clientX: 100, clientY: 0 });
    expect(onChange).toHaveBeenCalledWith({ s: 100, v: 100 });
    window.dispatchEvent(new MouseEvent('mouseup'));
    await wrapper.setProps({ hsva: { h: 0, s: 0, v: 100, a: 1 } });
    expect(wrapper.find('.semi-colorPicker-handle').attributes('style')).toContain('left: -5px');
  });

  it('ColorSlider / AlphaSlider standalone update positions on prop change', async () => {
    const foundation = makeFoundation();
    const cs = mount(ColorSlider, { props: { hue: 180, foundation, width: 100, handleSize: 10, className: 'csl' } });
    expect(cs.classes()).toContain('csl');
    expect(cs.find('.semi-colorPicker-handle').attributes('style')).toContain('left: 45px');
    await cs.setProps({ hue: 360 });
    expect(cs.find('.semi-colorPicker-handle').attributes('style')).toContain('left: 95px');
    const as = mount(AlphaSlider, { props: { hsva: { h: 0, s: 100, v: 100, a: 0.5 }, foundation, width: 100, handleSize: 10 } });
    expect(as.find('.semi-colorPicker-alphaHandle').attributes('style')).toContain('left: 45px');
    expect(as.find('.semi-colorPicker-alphaSliderInner').attributes('style')).toContain('linear-gradient');
    await as.setProps({ hsva: { h: 0, s: 100, v: 100, a: 1 } });
    expect(as.find('.semi-colorPicker-alphaHandle').attributes('style')).toContain('left: 95px');
  });

  it('DataPart standalone: input value follows currentColor and format', async () => {
    const foundation = makeFoundation();
    const wrapper = mount(DataPart, { attachTo: document.body, props: { currentColor: RED, foundation, alpha: false, eyeDropper: false, width: 150, defaultFormat: 'rgba' } });
    await nextTick();
    expect(wrapper.attributes('style')).toContain('width: 150px');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('255,0,0');
    await wrapper.setProps({ currentColor: colorStringToValue('#00ff00') });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0,255,0');
    expect(wrapper.find('.semi-colorPicker-formatSelect.semi-select').exists()).toBe(true);
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('rgba');
    await wrapper.find('.semi-select').trigger('click');
    await wait();
    const options = Array.from(document.querySelectorAll('.semi-select-option'));
    expect(options.map((o) => o.textContent)).toEqual(['hex', 'rgba', 'hsva']);
    (options[0] as HTMLElement).click();
    await wait();
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('hex');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('#00ff00');
  });
});
