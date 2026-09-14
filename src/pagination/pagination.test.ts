import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Pagination from './index';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

const pageItems = (w: any) => w.findAll('li.semi-page-item').filter((li: any) => !li.classes().includes('semi-page-prev') && !li.classes().includes('semi-page-next'));
const pageTexts = (w: any) => pageItems(w).map((li: any) => li.text());

describe('Pagination', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders default ul with prev/next and pages (total 1 -> one page, both disabled)', () => {
    const w = mount(Pagination);
    expect(w.element.tagName).toBe('UL');
    expect(w.classes()).toContain('semi-page');
    const prev = w.find('.semi-page-prev');
    const next = w.find('.semi-page-next');
    expect(prev.classes()).toContain('semi-page-item');
    expect(prev.classes()).toContain('semi-page-item-disabled');
    expect(prev.attributes('aria-disabled')).toBe('true');
    expect(prev.attributes('aria-label')).toBe('Previous');
    expect(prev.attributes('role')).toBe('button');
    expect(prev.attributes('x-semi-prop')).toBe('prevText');
    expect(prev.find('.semi-icon-chevron_left').exists()).toBe(true);
    expect(next.classes()).toContain('semi-page-item-disabled');
    expect(next.attributes('aria-label')).toBe('Next');
    expect(next.find('.semi-icon-chevron_right').exists()).toBe(true);
    expect(pageTexts(w)).toEqual(['1']);
    expect(pageItems(w)[0].classes()).toContain('semi-page-item-active');
    expect(pageItems(w)[0].attributes('aria-current')).toBe('page');
    expect(pageItems(w)[0].attributes('aria-label')).toBe('Page 1');
  });

  it('total/pageSize compute page list (<=7 pages: no ellipsis)', () => {
    const w = mount(Pagination, { props: { total: 70, pageSize: 10 } });
    expect(pageTexts(w)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(w.find('.semi-page-next').classes()).not.toContain('semi-page-item-disabled');
  });

  it('pageSize defaults to first of pageSizeOpts then 10', () => {
    const w = mount(Pagination, { props: { total: 100, pageSizeOpts: [25, 50] } });
    expect(pageTexts(w)).toEqual(['1', '2', '3', '4']);
    const d = mount(Pagination, { props: { total: 60, pageSizeOpts: [] } });
    expect(pageTexts(d)).toHaveLength(6);
  });

  it('truncation logic for > 7 pages', async () => {
    const w = mount(Pagination, { props: { total: 200, pageSize: 10, currentPage: 1 } });
    expect(pageTexts(w)).toEqual(['1', '2', '3', '4', '...', '19', '20']);
    expect(pageItems(w)[4].attributes('aria-label')).toBe('More');
    await w.setProps({ currentPage: 4 });
    expect(pageTexts(w)).toEqual(['1', '2', '3', '4', '5', '...', '20']);
    await w.setProps({ currentPage: 10 });
    expect(pageTexts(w)).toEqual(['1', '...', '9', '10', '11', '...', '20']);
    await w.setProps({ currentPage: 18 });
    expect(pageTexts(w)).toEqual(['1', '...', '16', '17', '18', '19', '20']);
    expect(w.find('.semi-page-next').classes()).not.toContain('semi-page-item-disabled');
    await w.setProps({ currentPage: 20 });
    expect(w.find('.semi-page-next').classes()).toContain('semi-page-item-disabled');
    expect(w.find('.semi-page-prev').classes()).not.toContain('semi-page-item-disabled');
  });

  it('uncontrolled: defaultCurrentPage, clicking pages / prev / next emits pageChange + change + update events', async () => {
    const w = mount(Pagination, { props: { total: 50, pageSize: 10, defaultCurrentPage: 2 } });
    expect(pageItems(w)[1].classes()).toContain('semi-page-item-active');
    await pageItems(w)[3].trigger('click');
    expect(pageItems(w)[3].classes()).toContain('semi-page-item-active');
    expect(w.emitted('pageChange')![0]).toEqual([4]);
    expect(w.emitted('change')![0]).toEqual([4, 10]);
    expect(w.emitted('update:currentPage')![0]).toEqual([4]);
    expect(w.emitted('update:modelValue')![0]).toEqual([4]);
    await w.find('.semi-page-next').trigger('click');
    expect(pageItems(w)[4].classes()).toContain('semi-page-item-active');
    expect(w.emitted('pageChange')![1]).toEqual([5]);
    expect(w.find('.semi-page-next').classes()).toContain('semi-page-item-disabled');
    // disabled next does nothing
    await w.find('.semi-page-next').trigger('click');
    expect(w.emitted('pageChange')).toHaveLength(2);
    await w.find('.semi-page-prev').trigger('click');
    expect(w.emitted('pageChange')![2]).toEqual([4]);
    // clicking the active page does nothing
    await pageItems(w)[3].trigger('click');
    expect(w.emitted('pageChange')).toHaveLength(3);
  });

  it('controlled: currentPage does not change without parent update', async () => {
    const w = mount(Pagination, { props: { total: 50, pageSize: 10, currentPage: 1 } });
    await pageItems(w)[2].trigger('click');
    expect(w.emitted('pageChange')![0]).toEqual([3]);
    expect(w.emitted('change')![0]).toEqual([3, 10]);
    await nextTick();
    expect(pageItems(w)[0].classes()).toContain('semi-page-item-active');
    expect(pageItems(w)[2].classes()).not.toContain('semi-page-item-active');
    await w.setProps({ currentPage: 3 });
    expect(pageItems(w)[2].classes()).toContain('semi-page-item-active');
  });

  it('v-model (modelValue) works', async () => {
    const Parent = defineComponent({
      setup() {
        const page = ref(1);
        return () => h('div', [h(Pagination, { total: 50, modelValue: page.value, 'onUpdate:modelValue': (v: number) => (page.value = v) }), h('i', { id: 'out' }, String(page.value))]);
      },
    });
    const w = mount(Parent);
    await pageItems(w)[4].trigger('click');
    expect(w.find('#out').text()).toBe('5');
    expect(pageItems(w)[4].classes()).toContain('semi-page-item-active');
  });

  it('total / pageSize prop updates recompute the list', async () => {
    const w = mount(Pagination, { props: { total: 30, pageSize: 10 } });
    expect(pageTexts(w)).toHaveLength(3);
    await w.setProps({ total: 55 });
    expect(pageTexts(w)).toHaveLength(6);
    await w.setProps({ pageSize: 20 });
    expect(pageTexts(w)).toHaveLength(3);
  });

  it('showTotal renders total pages via locale (zh_CN default, en_US via LocaleProvider)', () => {
    const w = mount(Pagination, { props: { total: 95, pageSize: 10, showTotal: true } });
    expect(w.find('.semi-page-total').text()).toBe('总页数：10');
    const en = mount(LocaleProvider, { props: { locale: en_US as any }, slots: { default: () => h(Pagination, { total: 95, pageSize: 10, showTotal: true }) } });
    expect(en.find('.semi-page-total').text()).toBe('Total pages: 10');
    expect(mount(Pagination).find('.semi-page-total').exists()).toBe(false);
  });

  it('prevText / nextText as prop and slot', () => {
    const w = mount(Pagination, { props: { prevText: 'Prev', nextText: h('b', 'Nxt') } });
    expect(w.find('.semi-page-prev').text()).toBe('Prev');
    expect(w.find('.semi-page-prev .semi-icon').exists()).toBe(false);
    expect(w.find('.semi-page-next b').text()).toBe('Nxt');
    const s = mount(Pagination, { slots: { prevText: () => '<', nextText: () => '>' } });
    expect(s.find('.semi-page-prev').text()).toBe('<');
    expect(s.find('.semi-page-next').text()).toBe('>');
  });

  it('disabled: wrapper class, items all-disabled, no page change on click', async () => {
    const w = mount(Pagination, { props: { total: 200, pageSize: 10, disabled: true, defaultCurrentPage: 1 } });
    expect(w.classes()).toContain('semi-page-disabled');
    const items = pageItems(w);
    expect(items[0].classes()).toContain('semi-page-item-all-disabled');
    expect(items[0].classes()).toContain('semi-page-item-all-disabled-active');
    expect(w.find('.semi-page-prev').attributes('aria-disabled')).toBe('true');
    expect(w.find('.semi-page-next').classes()).toContain('semi-page-item-disabled');
    await items[2].trigger('click');
    expect(w.emitted('pageChange')).toBeUndefined();
    await w.find('.semi-page-next').trigger('click');
    expect(w.emitted('pageChange')).toBeUndefined();
    // "..." is not wrapped by a Popover when disabled
    expect(items[4].attributes('aria-describedby')).toBeUndefined();
  });

  it('class / style / data attrs pass through, other attrs do not', () => {
    const w = mount(Pagination, { attrs: { class: 'c', style: { margin: '2px' }, 'data-id': 'p', title: 'nope' } });
    expect(w.classes()).toContain('c');
    expect((w.element as HTMLElement).style.margin).toBe('2px');
    expect(w.attributes('data-id')).toBe('p');
    expect(w.attributes('title')).toBeUndefined();
  });

  it('hideOnSinglePage hides when one page (unless showSizeChanger)', () => {
    expect(mount(Pagination, { props: { total: 5, hideOnSinglePage: true } }).html()).toBe('');
    expect(mount(Pagination, { props: { total: 5, hideOnSinglePage: true, showSizeChanger: true } }).find('ul').exists()).toBe(true);
    expect(mount(Pagination, { props: { total: 50, hideOnSinglePage: true } }).find('ul').exists()).toBe(true);
    expect(mount(Pagination, { props: { total: 5, hideOnSinglePage: true, size: 'small' } }).html()).toBe('');
  });

  describe('showSizeChanger (Select)', () => {
    const openSelect = async (w: any) => {
      await w.find('.semi-page-switch .semi-select').trigger('click');
      await wait(200);
      return Array.from(document.querySelectorAll('.semi-page-select-dropdown .semi-select-option')) as HTMLElement[];
    };
    // jsdom never fires CSS animation events: emulate the popover leave animation ending so the
    // Select's close callback (which notifies `change` in controlled mode) runs like in a browser
    const pickOption = async (options: HTMLElement[], text: string) => {
      options.find((o) => o.textContent === text)!.click();
      await wait(50);
      document.querySelectorAll('.semi-popover-wrapper').forEach((el) => el.dispatchEvent(new Event('animationend')));
      await wait(200);
    };

    it('renders switch with locale labels and pageSize inserted into opts', async () => {
      const w = mount(Pagination, { attachTo: document.body, props: { total: 100, pageSize: 15, showSizeChanger: true } });
      const sw = w.find('.semi-page-switch');
      expect(sw.exists()).toBe(true);
      const select = sw.find('.semi-select');
      expect(select.exists()).toBe(true);
      expect(sw.find('.semi-select-selection-text').text()).toBe('每页条数：15');
      const options = await openSelect(w);
      expect(options.map((o) => o.textContent)).toEqual(['每页条数：10', '每页条数：15', '每页条数：20', '每页条数：40', '每页条数：100']);
      w.unmount();
    });

    it('changing size emits pageSizeChange/update:pageSize/change and re-computes current page', async () => {
      const w = mount(Pagination, { attachTo: document.body, props: { total: 100, pageSize: 10, showSizeChanger: true, defaultCurrentPage: 5 } });
      const options = await openSelect(w);
      await pickOption(options, '每页条数：40');
      expect(w.emitted('pageSizeChange')![0]).toEqual([40]);
      expect(w.emitted('update:pageSize')![0]).toEqual([40]);
      // first item of page 5 (index 41) is on page 2 with size 40
      expect(w.emitted('pageChange')![0]).toEqual([2]);
      expect(w.emitted('change')![0]).toEqual([2, 40]);
      expect(pageTexts(w)).toEqual(['1', '2', '3']);
      expect(pageItems(w)[1].classes()).toContain('semi-page-item-active');
      expect(w.find('.semi-page-switch .semi-select-selection-text').text()).toBe('每页条数：40');
      w.unmount();
    });

    it('preventPageChangeOnPageSizeChange keeps current page', async () => {
      const w = mount(Pagination, { attachTo: document.body, props: { total: 100, pageSize: 10, showSizeChanger: true, defaultCurrentPage: 2, preventPageChangeOnPageSizeChange: true } });
      const options = await openSelect(w);
      await pickOption(options, '每页条数：20');
      expect(w.emitted('pageChange')).toBeUndefined();
      expect(w.emitted('change')![0]).toEqual([2, 20]);
      expect(pageItems(w)[1].classes()).toContain('semi-page-item-active');
      w.unmount();
    });

    it('disabled select when disabled', () => {
      const w = mount(Pagination, { props: { showSizeChanger: true, disabled: true } });
      expect(w.find('.semi-page-switch .semi-select').classes()).toContain('semi-select-disabled');
    });

    it('pageSizeOpts are used as options, current pageSize inserted in order', async () => {
      const w = mount(Pagination, { attachTo: document.body, props: { total: 300, showSizeChanger: true, pageSizeOpts: [50, 80, 90, 200] } });
      expect(pageTexts(w)).toEqual(['1', '2', '3', '4', '5', '6']);
      const options = await openSelect(w);
      expect(options.map((o) => o.textContent)).toEqual(['每页条数：50', '每页条数：80', '每页条数：90', '每页条数：200']);
      w.unmount();
    });
  });

  describe('showQuickJumper', () => {
    it('renders quick jump with locale texts and InputNumber; disabled when single page or disabled', () => {
      const w = mount(Pagination, { props: { total: 100, showQuickJumper: true } });
      const qj = w.find('.semi-page-quickjump');
      expect(qj.exists()).toBe(true);
      expect(qj.classes()).not.toContain('semi-page-quickjump-disabled');
      expect(qj.text()).toContain('跳至');
      expect(qj.text()).toContain('页');
      expect(qj.find('.semi-input-number').exists()).toBe(true);
      expect(qj.find('.semi-page-quickjump-input-number').exists()).toBe(true);
      expect(qj.find('.semi-input-number-suffix-btns').exists()).toBe(false);
      const single = mount(Pagination, { props: { total: 5, showQuickJumper: true } });
      expect(single.find('.semi-page-quickjump').classes()).toContain('semi-page-quickjump-disabled');
      expect(single.find('input').attributes('disabled')).toBeDefined();
      const dis = mount(Pagination, { props: { total: 100, showQuickJumper: true, disabled: true } });
      expect(dis.find('.semi-page-quickjump').classes()).toContain('semi-page-quickjump-disabled');
    });

    it('Enter jumps to page (clamped to total pages), blur jumps too, input is cleared', async () => {
      const w = mount(Pagination, { props: { total: 100, pageSize: 10, showQuickJumper: true } });
      const input = w.find('.semi-page-quickjump input');
      await input.setValue('4');
      await input.trigger('keypress', { key: 'Enter', keyCode: 13 });
      await nextTick();
      expect(w.emitted('pageChange')![0]).toEqual([4]);
      expect(pageItems(w)[3].classes()).toContain('semi-page-item-active');
      expect((input.element as HTMLInputElement).value).toBe('');
      await input.setValue('999');
      await input.trigger('keypress', { key: 'Enter', keyCode: 13 });
      expect(w.emitted('pageChange')![1]).toEqual([10]);
      await input.setValue('0');
      await input.trigger('blur');
      await nextTick();
      expect(w.emitted('pageChange')![2]).toEqual([1]);
      // blur with empty value does nothing
      await input.trigger('blur');
      expect(w.emitted('pageChange')).toHaveLength(3);
    });
  });

  describe('size=small', () => {
    it('renders compact div with current/total', () => {
      const w = mount(Pagination, { props: { size: 'small', total: 100, pageSize: 10, defaultCurrentPage: 3 } });
      expect(w.element.tagName).toBe('DIV');
      expect(w.classes()).toContain('semi-page-small');
      expect(w.classes()).toContain('semi-page');
      const item = w.find('.semi-page-item-small');
      expect(item.classes()).toContain('semi-page-item');
      expect(item.text()).toBe('3/10');
      expect(w.find('.semi-page-prev').exists()).toBe(true);
      expect(w.find('.semi-page-next').exists()).toBe(true);
      expect(w.find('.semi-page-switch').exists()).toBe(false);
    });

    it('prev / next navigate in small mode; disabled flag', async () => {
      const w = mount(Pagination, { props: { size: 'small', total: 30, pageSize: 10 } });
      await w.find('.semi-page-next').trigger('click');
      expect(w.find('.semi-page-item-small').text()).toBe('2/3');
      expect(w.emitted('pageChange')![0]).toEqual([2]);
      const d = mount(Pagination, { props: { size: 'small', total: 30, disabled: true } });
      expect(d.classes()).toContain('semi-page-disabled');
      expect(d.find('.semi-page-item-small').classes()).toContain('semi-page-item-all-disabled');
    });

    it('hoverShowPageSelect wraps the counter in a Popover listing all pages; selecting a page navigates', async () => {
      const w = mount(Pagination, { attachTo: document.body, props: { size: 'small', total: 100, pageSize: 10, hoverShowPageSelect: true } });
      const item = w.find('.semi-page-item-small');
      expect(item.attributes('aria-describedby')).toBeDefined();
      await item.trigger('mouseenter');
      await wait(200);
      const list = document.querySelector('.semi-page-rest-list') as HTMLElement;
      expect(list).toBeTruthy();
      const rows = list.querySelectorAll('.semi-page-rest-item');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].getAttribute('role')).toBe('listitem');
      expect(rows[0].textContent).toBe('1');
      (rows[2] as HTMLElement).click();
      await nextTick();
      expect(w.emitted('pageChange')![0]).toEqual([3]);
      expect(w.find('.semi-page-item-small').text()).toBe('3/10');
      w.unmount();
    });

    it('hoverShowPageSelect is ignored when disabled; allPageNumbers updates with total', async () => {
      const w = mount(Pagination, { props: { size: 'small', total: 100, hoverShowPageSelect: true, disabled: true } });
      expect(w.find('.semi-page-item-small').attributes('aria-describedby')).toBeUndefined();
      const w2 = mount(Pagination, { props: { size: 'small', total: 20, hoverShowPageSelect: true } });
      await w2.setProps({ total: 50 });
      expect((w2.vm as any).foundation.getState('allPageNumbers')).toEqual([1, 2, 3, 4, 5]);
    });

    it('small mode supports showQuickJumper', () => {
      const w = mount(Pagination, { props: { size: 'small', total: 100, showQuickJumper: true } });
      expect(w.find('.semi-page-quickjump').exists()).toBe(true);
    });
  });

  it('"..." shows a Popover with the rest pages (virtual list) and navigates on click; popoverPosition / popoverZIndex forwarded', async () => {
    const w = mount(Pagination, { attachTo: document.body, props: { total: 200, pageSize: 10, popoverPosition: 'top', popoverZIndex: 1234 } });
    const more = pageItems(w)[4];
    expect(more.text()).toBe('...');
    expect(more.attributes('aria-describedby')).toBeDefined();
    await more.trigger('mouseenter');
    await wait(200);
    const list = document.querySelector('.semi-page-rest-list') as HTMLElement;
    expect(list).toBeTruthy();
    expect(list.style.height).toBe('160px');
    const portal = document.querySelector('.semi-portal') as HTMLElement;
    expect(portal.style.zIndex).toBe('1234');
    const rows = Array.from(list.querySelectorAll('.semi-page-rest-item'));
    expect(rows[0].textContent).toBe('5');
    // virtualised: not all 14 rest pages are rendered
    expect(rows.length).toBeLessThan(14);
    (rows[1] as HTMLElement).click();
    await nextTick();
    expect(w.emitted('pageChange')![0]).toEqual([6]);
    expect(pageTexts(w)).toEqual(['1', '...', '5', '6', '7', '...', '20']);
    w.unmount();
  });

  it('rest list smaller than 5 items shrinks height', async () => {
    const w = mount(Pagination, { attachTo: document.body, props: { total: 90, pageSize: 10 } });
    // 9 pages, current 1 -> [1,2,3,4,...,8,9] rest right = [5,6,7]
    await pageItems(w)[4].trigger('mouseenter');
    await wait(200);
    const list = document.querySelector('.semi-page-rest-list') as HTMLElement;
    expect(list.style.height).toBe('96px');
    expect(list.querySelectorAll('.semi-page-rest-item')).toHaveLength(3);
    w.unmount();
  });

  it('rtl direction sets rest list direction', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Pagination, { total: 200, pageSize: 10 }) },
    });
    await pageItems(w)[4].trigger('mouseenter');
    await wait(200);
    const list = document.querySelector('.semi-page-rest-list') as HTMLElement;
    expect(list.style.direction).toBe('rtl');
    w.unmount();
  });

  it('exposed methods: goPage / goNext / goPrev / changePageSize', async () => {
    const w = mount(Pagination, { props: { total: 100, pageSize: 10 } });
    const vm = w.vm as any;
    vm.goPage(5);
    await nextTick();
    expect(w.emitted('pageChange')![0]).toEqual([5]);
    vm.goNext();
    await nextTick();
    expect(w.emitted('pageChange')![1]).toEqual([6]);
    vm.goPrev();
    await nextTick();
    expect(w.emitted('pageChange')![2]).toEqual([5]);
    vm.changePageSize(50);
    await nextTick();
    expect(w.emitted('pageSizeChange')![0]).toEqual([50]);
    expect(pageTexts(w)).toEqual(['1', '2']);
  });

  it('registers / unregisters the document keydown handler', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const w = mount(Pagination);
    expect(add).toHaveBeenCalledWith('keydown', expect.any(Function));
    w.unmount();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    add.mockRestore();
    remove.mockRestore();
  });
});
