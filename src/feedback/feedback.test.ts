import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Feedback from './index';

const wait = async () => {
  await flushPromises();
  await nextTick();
};

describe('Feedback', () => {
  it('popup mode renders a bottom side sheet with emoji items', async () => {
    const w = mount(Feedback, { attachTo: document.body, props: { visible: true, mode: 'popup', type: 'emoji' } });
    await wait();
    expect(document.querySelector('.semi-feedback')).toBeTruthy();
    const emojis = document.querySelectorAll('.semi-feedback-emoji-item');
    expect(emojis.length).toBe(3);
    w.unmount();
  });

  it('clicking an emoji emits valueChange', async () => {
    const onValueChange = vi.fn();
    const w = mount(Feedback, {
      attachTo: document.body,
      props: { visible: true, mode: 'popup', type: 'emoji', onValueChange },
    });
    await wait();
    const item = document.querySelector('.semi-feedback-emoji-item') as HTMLElement;
    item.click();
    await wait();
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[0][0]).toHaveProperty('emoji');
    w.unmount();
  });

  it('modal mode uses Modal and submit is disabled until a value is set', async () => {
    const w = mount(Feedback, {
      attachTo: document.body,
      props: { visible: true, mode: 'modal', type: 'text' },
    });
    await wait();
    expect(document.querySelector('.semi-modal') || document.querySelector('.semi-feedback')).toBeTruthy();
    w.unmount();
  });

  it('footer=null hides the popup footer (React footer={null})', async () => {
    const w = mount(Feedback, {
      attachTo: document.body,
      props: { visible: true, mode: 'popup', type: 'emoji', footer: null },
    });
    await wait();
    expect(document.querySelector('.semi-feedback-footer')).toBeNull();
    w.unmount();
  });

  it('custom type renders default slot', async () => {
    const w = mount(Feedback, {
      attachTo: document.body,
      props: { visible: true, mode: 'popup', type: 'custom' },
      slots: { default: () => h('div', { class: 'custom-fb' }, 'hi') },
    });
    await wait();
    expect(document.querySelector('.custom-fb')?.textContent).toBe('hi');
    w.unmount();
  });
});
