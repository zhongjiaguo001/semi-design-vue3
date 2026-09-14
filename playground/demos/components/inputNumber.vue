<script setup lang="ts">
import { ref, computed } from 'vue';
import { InputNumber, LocaleProvider, Select, Option } from '@/index';
import DemoBlock from '../../DemoBlock.vue';
import zh_CN from '@/locale/source/zh_CN';
import en_GB from '@/locale/source/en_GB';
import en_US from '@/locale/source/en_US';
import ko_KR from '@/locale/source/ko_KR';
import ja_JP from '@/locale/source/ja_JP';
import ar from '@/locale/source/ar';
import vi_VN from '@/locale/source/vi_VN';
import ru_RU from '@/locale/source/ru_RU';
import id_ID from '@/locale/source/id_ID';
import ms_MY from '@/locale/source/ms_MY';
import th_TH from '@/locale/source/th_TH';
import tr_TR from '@/locale/source/tr_TR';
import pt_BR from '@/locale/source/pt_BR';
import zh_TW from '@/locale/source/zh_TW';
import sv_SE from '@/locale/source/sv_SE';
import pl_PL from '@/locale/source/pl_PL';
import nl_NL from '@/locale/source/nl_NL';
import es from '@/locale/source/es';
import it from '@/locale/source/it';
import de from '@/locale/source/de';
import fr from '@/locale/source/fr';
import ro from '@/locale/source/ro';

const importCode = `import { InputNumber } from 'semi-design-vue';`;

// ---------- 自定义显示格式与解析方式 ----------
const log = (v: number | string) => {
  console.log(`Changed to: [${typeof v}] ${v}`);
};
const rmbFormatter = (value: number | string) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const rmbParser = (value: string) => value.replace(/\￥\s?|(,*)/g, '');
const dashFormatter = (value: number | string) => String(value).split('').join('-');
const dashParser = (value: string) => value.replace(/\-/g, '');

// ---------- 纯数字输入框 ----------
const digitsOnly = (value: number | string) => `${value}`.replace(/\D/g, '');
const onNumberChange = (number: number) => console.log(number);

// ---------- 货币展示（国际化） ----------
const language: Record<string, any> = {
  zh_CN,
  en_GB,
  en_US,
  ko_KR,
  ja_JP,
  ar,
  vi_VN,
  ru_RU,
  id_ID,
  ms_MY,
  th_TH,
  tr_TR,
  pt_BR,
  zh_TW,
  es,
  sv_SE,
  pl_PL,
  nl_NL,
  de,
  it,
  fr,
  ro,
};
const languageOptions = [
  ['zh_CN', '简体中文'],
  ['en_US', '英语（美）'],
  ['en_GB', '英语（英）'],
  ['ja_JP', '日语'],
  ['ko_KR', '韩语'],
  ['ar', '阿拉伯语'],
  ['vi_VN', '越南语'],
  ['ru_RU', '俄罗斯语'],
  ['id_ID', '印尼语'],
  ['ms_MY', '马来语'],
  ['th_TH', '泰语'],
  ['tr_TR', '土耳其语'],
  ['pt_BR', '葡萄牙语（巴西）'],
  ['zh_TW', '繁体中文'],
  ['es', '西班牙语'],
  ['de', '德语'],
  ['it', '意大利语'],
  ['fr', '法语'],
  ['ro', '罗马尼亚语'],
  ['sv_SE', '瑞典语'],
  ['pl_PL', '波兰语'],
  ['nl_NL', '荷兰语'],
];
const localeCode = ref('zh_CN');
const locale = computed(() => language[localeCode.value]);
const onLanguageChange = (code: any) => {
  localeCode.value = code as string;
};

const currencyDefault = 123456.78;
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本输入框" desc="step 设置步长；shiftStep 按住 shift 时的步长；min / max 限定上下界。">
    <div style="width: 280px">
      <label>简单数字输入框</label>
      <InputNumber />
      <br /><br />

      <label>设置了步长 step=2 </label>
      <InputNumber :step="2" />
      <br /><br />

      <label>设置 shiftStep=100， 按住 shift 同时点击按钮，可以一次增加/减少100 </label>
      <InputNumber :shiftStep="100" />
      <br /><br />

      <label>设置了上下界 min=1,max=10</label>
      <InputNumber :min="1" :max="10" :defaultValue="1" />
      <br /><br />
    </div>
  </DemoBlock>

  <DemoBlock title="基本输入框 - 2" desc="defaultValue / disabled / precision / innerButtons。">
    <div style="width: 280px">
      <label>设置了默认值 defaultValue=1 </label>
      <InputNumber :defaultValue="1" />
      <br /><br />

      <label>禁用 disabled=true</label>
      <InputNumber :defaultValue="2" disabled />
      <br /><br />

      <label>设置了小数位数 precision=2 </label>
      <InputNumber :precision="2" :defaultValue="1.234" />
      <br /><br />

      <label>设置了 innerButtons=true </label>
      <InputNumber :innerButtons="true" suffix="小时" :defaultValue="1" style="width: 190px" />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="隐藏步进器" desc="通过 innerButtons，你可以将右侧的步进器隐藏进内部，仅 hover 时才会显示。">
    <InputNumber innerButtons style="width: 190px" />
  </DemoBlock>

  <DemoBlock title="隐藏步进器 - 2" desc="hideButtons 设为 true，彻底隐藏步进器。">
    <InputNumber hideButtons style="width: 190px" />
  </DemoBlock>

  <DemoBlock title="尺寸" desc="size 可选 default / large / small。">
    <div style="width: 180px">
      <label>默认尺寸 size=default</label>
      <InputNumber />
      <br /><br />

      <label>大尺寸 size=large</label>
      <InputNumber size="large" />
      <br /><br />

      <label>小尺寸 size=small</label>
      <InputNumber size="small" />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义显示格式与解析方式" desc="formatter 和 parser 一对方法，一般需要同时设置，否则无法正确解析值。">
    <div style="width: 180px">
      <label>人民币</label>
      <InputNumber @change="log" :defaultValue="1000" :min="0" :formatter="rmbFormatter" :parser="rmbParser" />
      <br /><br />

      <label>自定义串</label>
      <InputNumber @change="log" :defaultValue="1111" :formatter="dashFormatter" :parser="dashParser" />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="纯数字输入框" desc="搭配 formatter 和 numberChange 事件可以实现纯数字输入框。">
    <InputNumber :formatter="digitsOnly" @numberChange="onNumberChange" :min="0" :max="Number.MAX_SAFE_INTEGER" />
  </DemoBlock>

  <DemoBlock
    title="货币展示"
    desc="国际化模式下通过 currency={true} 开启，组件会自动根据 localeCode 展示对应货币种类。（注意切换语言类型后需要更新组件 key 值）"
  >
    <div style="padding-bottom: 20px">
      <Select @change="onLanguageChange" insetLabel="切换语言" style="width: 250px" defaultValue="zh_CN">
        <Option v-for="[code, name] in languageOptions" :key="code" :value="code">{{ name }}</Option>
      </Select>
    </div>
    <LocaleProvider :locale="locale">
      <InputNumber :key="localeCode" :currency="true" :defaultValue="123456.78" />
    </LocaleProvider>
  </DemoBlock>

  <DemoBlock title="货币展示 - 2" desc="也可以通过手动传 localeCode 和 currency 指定展示的货币种类。">
    <div>
      <div>🇨🇳 人民币</div>
      <InputNumber localeCode="zh-CN" currency="CNY" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇪🇺 欧元</div>
      <InputNumber localeCode="de-DE" currency="EUR" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇯🇵 日元</div>
      <InputNumber localeCode="ja-JP" currency="JPY" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇻🇳 越南盾</div>
      <InputNumber localeCode="vi-VN" currency="VND" :defaultValue="currencyDefault" />
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock
    title="货币展示 - 3"
    desc="支持 symbol、code、name 三种展示方式，通过 currencyDisplay 属性控制，默认以货币符号展示。showCurrencySymbol 设置为 false 隐藏货币符号/代码/名称的展示。"
  >
    <div>
      <div>🇨🇳 CNY ➕ code</div>
      <InputNumber currency="CNY" currencyDisplay="code" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇨🇳 CNY ➕ symbol</div>
      <InputNumber currency="CNY" currencyDisplay="symbol" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇨🇳 CNY ➕ name</div>
      <InputNumber currency="CNY" currencyDisplay="name" :defaultValue="currencyDefault" />
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="货币展示 - 4" desc="隐藏货币符号、代码或名称的展示，通过前后缀展示货币符号。">
    <div>
      <div>🇨🇳 CNY ➕ code</div>
      <InputNumber style="width: 200px" currency="CNY" prefix="CNY" :showCurrencySymbol="false" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇨🇳 CNY ➕ symbol</div>
      <InputNumber style="width: 200px" currency="CNY" prefix="￥" :showCurrencySymbol="false" :defaultValue="currencyDefault" />
      <br />
      <br />
      <div>🇨🇳 CNY ➕ name</div>
      <InputNumber style="width: 200px" currency="CNY" suffix="人民币" :showCurrencySymbol="false" :defaultValue="currencyDefault" />
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock
    title="科学计数法显示"
    desc="当数字较长时，可以通过 scientificNotation 属性启用科学计数法显示。失去焦点时显示科学计数法，获得焦点时显示完整数字。仅影响显示格式，change / numberChange 中的值仍为完整数字；不支持货币模式。"
  >
    <div style="width: 280px">
      <label>启用科学计数法（默认阈值 15 位）</label>
      <InputNumber scientificNotation :defaultValue="123456789012345" />
      <br /><br />

      <label>自定义阈值（10 位）</label>
      <InputNumber :scientificNotation="{ threshold: 10 }" :defaultValue="1234567890" />
      <br /><br />

      <label>超大数字</label>
      <InputNumber scientificNotation :defaultValue="9999999999999999" />
      <br /><br />

      <label>小数场景</label>
      <InputNumber scientificNotation :precision="10" :defaultValue="0.000000123456789" />
      <br /><br />
    </div>
  </DemoBlock>
</template>
