import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, h } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import UserGuide from './index';

const wait = async () => {
  await flushPromises();
  await nextTick();
};

describe('UserGuide', () => {
  it('renders nothing when visible is false', () => {
    const w = mount(UserGuide, { props: { visible: false, steps: [{ title: 't' }] } });
    expect(w.find('.semi-userGuide-modal').exists()).toBe(false);
    expect(w.find('.semi-userGuide-popover').exists()).toBe(false);
  });

  it('modal mode renders title, description, next and skip', async () => {
    const onSkip = vi.fn();
    const onNext = vi.fn();
    const onFinish = vi.fn();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        mode: 'modal',
        steps: [
          { title: 'Step one', description: 'Hello' },
          { title: 'Step two', description: 'World' },
        ],
        onSkip,
        onNext,
        onFinish,
      },
    });
    await wait();
    expect(document.querySelector('.semi-userGuide-modal') || w.find('.semi-userGuide-modal').exists()).toBeTruthy();
    expect(document.body.textContent).toContain('Step one');
    expect(document.body.textContent).toContain('Hello');
    const buttons = Array.from(document.querySelectorAll('.semi-userGuide-modal-footer button, .semi-modal button'));
    const label = (b: Element) => (b.textContent || '').trim();
    const skip = buttons.find((b) => label(b).includes('跳过') || label(b).toLowerCase().includes('skip'));
    const next = buttons.find((b) => label(b).includes('下一步') || label(b).toLowerCase().includes('next'));
    expect(skip || next).toBeTruthy();
    (next as HTMLElement)?.click();
    await wait();
    expect(onNext).toHaveBeenCalled();
    expect(document.body.textContent).toContain('Step two');
    const finish = Array.from(document.querySelectorAll('button')).find((b) => {
      const t = (b.textContent || '').trim();
      return t.includes('完成') || t.toLowerCase().includes('finish');
    });
    (finish as HTMLElement)?.click();
    await wait();
    expect(onFinish).toHaveBeenCalled();
    w.unmount();
  });

  it('popup mode attaches a popover to the target', async () => {
    const target = document.createElement('button');
    target.textContent = 'target';
    document.body.appendChild(target);
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        mode: 'popup',
        steps: [{ target: () => target, title: 'Tip', description: 'Do this' }],
      },
    });
    await wait();
    expect(document.body.textContent).toContain('Tip');
    expect(document.querySelector('.semi-userGuide-spotlight') || document.querySelector('.semi-popover')).toBeTruthy();
    w.unmount();
    target.remove();
  });
});

describe('UserGuide - API parity', () => {
  const makeTarget = () => {
    const t = document.createElement('button');
    t.textContent = 'target';
    document.body.appendChild(t);
    return t;
  };
  const buttons = () =>
    Array.from(document.querySelectorAll('.semi-userGuide-popup-content-buttons button, .semi-userGuide-modal-footer button'));
  const label = (b: Element) => (b.textContent || '').trim();
  const raf = () => new Promise((r) => requestAnimationFrame(() => r(null)));

  it('theme primary (global and per step) adds primary class', async () => {
    const t = makeTarget();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: { visible: true, theme: 'primary', steps: [{ target: t, title: 'A' }] },
    });
    await wait();
    expect(document.querySelector('.semi-userGuide-popup-content-primary')).toBeTruthy();
    w.unmount();
    const w2 = mount(UserGuide, {
      attachTo: document.body,
      props: { visible: true, steps: [{ target: t, title: 'A', theme: 'primary' }] },
    });
    await wait();
    expect(document.querySelector('.semi-userGuide-popup-content-primary')).toBeTruthy();
    w2.unmount();
    t.remove();
  });

  it('nextButtonProps / prevButtonProps / finishText / showSkipButton / showPrevButton', async () => {
    const t = makeTarget();
    const onPrev = vi.fn();
    const onChange = vi.fn();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        steps: [
          { target: t, title: 'A' },
          { target: t, title: 'B' },
        ],
        nextButtonProps: { children: 'Next' },
        prevButtonProps: { children: 'Prev', theme: 'borderless' },
        finishText: '我知道啦！',
        showSkipButton: false,
        onPrev,
        onChange,
      },
    });
    await wait();
    expect(buttons().map(label)).toEqual(['Next']);
    expect(document.querySelector('.semi-userGuide-popup-content-indicator')?.textContent).toBe('1/2');
    (buttons()[0] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledWith(1);
    expect(w.emitted('update:current')?.[0]).toEqual([1]);
    expect(buttons().map(label)).toEqual(['Prev', '我知道啦！']);
    expect(buttons()[0].className).toContain('semi-button-borderless');
    (buttons()[0] as HTMLElement).click();
    await wait();
    expect(onPrev).toHaveBeenCalledWith(0);
    await w.setProps({ showPrevButton: false });
    (buttons().find((b) => label(b) === 'Next') as HTMLElement).click();
    await wait();
    expect(buttons().map(label)).toEqual(['我知道啦！']);
    w.unmount();
    t.remove();
  });

  it('controlled current does not advance by itself; skip emits update:visible', async () => {
    const t = makeTarget();
    const onSkip = vi.fn();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        current: 0,
        steps: [
          { target: t, title: 'StepA' },
          { target: t, title: 'StepB' },
        ],
        onSkip,
      },
    });
    await wait();
    const next = buttons().find((b) => label(b).includes('下一步') || label(b).toLowerCase().includes('next')) as HTMLElement;
    next.click();
    await wait();
    expect(w.emitted('change')?.[0]).toEqual([1]);
    expect(document.body.textContent).toContain('StepA');
    expect(document.body.textContent).not.toContain('StepB');
    await w.setProps({ current: 1 });
    await wait();
    expect(document.body.textContent).toContain('StepB');
    await w.setProps({ current: 0 });
    await wait();
    const skip = buttons().find((b) => label(b).includes('跳过') || label(b).toLowerCase().includes('skip')) as HTMLElement;
    skip.click();
    await wait();
    expect(onSkip).toHaveBeenCalled();
    expect(w.emitted('update:visible')?.[0]).toEqual([false]);
    w.unmount();
    t.remove();
  });

  it('step position / showArrow / spotlightPadding / mask overrides', async () => {
    const t = makeTarget();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        spotlightPadding: 10,
        steps: [{ target: t, title: 'A', position: 'right', showArrow: false, spotlightPadding: 15, mask: false, className: 'step-cls' }],
      },
    });
    await wait();
    const pop = document.querySelector('.semi-popover-wrapper') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.className).toContain('semi-userGuide-popover');
    expect(pop.className).toContain('step-cls');
    expect(document.querySelector('.semi-popover-icon-arrow')).toBeFalsy();
    const anchor = w.find('div[style*="position: fixed"]');
    expect(anchor.attributes('style')).toContain('width: 30px');
    await raf();
    await wait();
    expect(document.querySelector('.semi-userGuide-spotlight-rect')).toBeTruthy();
    expect(document.querySelector('.semi-userGuide-spotlight-transparent-rect')).toBeFalsy();
    w.unmount();
    t.remove();
  });

  it('mask=true renders overlay rects', async () => {
    const t = makeTarget();
    const w = mount(UserGuide, { attachTo: document.body, props: { visible: true, steps: [{ target: t, title: 'A' }] } });
    await raf();
    await wait();
    expect(document.querySelectorAll('.semi-userGuide-spotlight-transparent-rect').length).toBe(4);
    w.unmount();
    t.remove();
  });

  it('mask=false hides overlay rects; zIndex applied to spotlight; className/style on popover', async () => {
    const t = makeTarget();
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        mask: false,
        zIndex: 2000,
        className: 'my-guide',
        style: { color: 'rgb(1, 2, 3)' },
        steps: [{ target: t, title: 'A' }],
      },
    });
    await raf();
    await wait();
    const svg = w.find('.semi-userGuide-spotlight');
    expect(svg.exists()).toBe(true);
    expect((svg.element as HTMLElement).style.zIndex).toBe('2000');
    expect(document.querySelector('.semi-userGuide-spotlight-transparent-rect')).toBeFalsy();
    const pop = document.querySelector('.semi-popover-wrapper.my-guide') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.style.color).toBe('rgb(1, 2, 3)');
    w.unmount();
    t.remove();
  });

  it('getPopupContainer renders the popover into the container', async () => {
    const t = makeTarget();
    const container = document.createElement('div');
    container.id = 'ug-container';
    document.body.appendChild(container);
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: { visible: true, getPopupContainer: () => container, steps: [{ target: t, title: 'A' }] },
    });
    await wait();
    expect(container.querySelector('.semi-popover-wrapper')).toBeTruthy();
    w.unmount();
    t.remove();
    container.remove();
  });

  it('modal mode renders cover, indicator and prev button', async () => {
    const w = mount(UserGuide, {
      attachTo: document.body,
      props: {
        visible: true,
        mode: 'modal',
        className: 'my-modal-guide',
        steps: [
          { title: 'A', description: 'a', cover: () => h('img', { class: 'cover-img', src: 'x.png' }) },
          { title: 'B', description: 'b', cover: () => h('img', { class: 'cover-img', src: 'y.png' }) },
        ],
      },
    });
    await wait();
    expect(document.querySelector('.semi-userGuide-modal.my-modal-guide')).toBeTruthy();
    expect(document.querySelector('.semi-userGuide-modal-cover .cover-img')).toBeTruthy();
    expect(document.querySelectorAll('.semi-userGuide-modal-indicator-item').length).toBe(2);
    expect(document.querySelectorAll('.semi-userGuide-modal-indicator-item-active').length).toBe(1);
    const next = buttons().find((b) => label(b).includes('下一步') || label(b).toLowerCase().includes('next')) as HTMLElement;
    next.click();
    await wait();
    expect((document.querySelectorAll('.semi-userGuide-modal-indicator-item')[1] as HTMLElement).className).toContain('active');
    expect(buttons().some((b) => label(b).includes('上一步') || label(b).toLowerCase().includes('prev'))).toBe(true);
    w.unmount();
  });

  it('visible toggling disables/enables body scroll', async () => {
    const t = makeTarget();
    document.body.style.overflow = '';
    const w = mount(UserGuide, { attachTo: document.body, props: { visible: false, steps: [{ target: t, title: 'A' }] } });
    await w.setProps({ visible: true });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    await w.setProps({ visible: false });
    await wait();
    expect(document.body.style.overflow).toBe('');
    w.unmount();
    t.remove();
  });
});
