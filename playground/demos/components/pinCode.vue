<script setup lang="ts">
import { ref } from 'vue';
import { PinCode, Button, Text } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { PinCode } from 'semi-design-vue';`;

const log = (...args: any[]) => console.log(...args);

// 受控
const controlledValue = ref('69af41');
const setRandomValue = () => {
  controlledValue.value = String(parseInt(String(Math.random() * 100000000))).slice(0, 6);
};

// 设置字符范围
const upperCaseFormat = /[A-Z]/;
const lowerCaseFormat = (char: string) => /[a-z]/.test(char);

// 手动聚焦失焦
const refValue = ref('69af41');
const pinRef = ref<any>(null);
const focusThird = () => pinRef.value?.focus(2);
const blurThird = () => pinRef.value?.blur(2);
</script>

<template>
  <DemoBlock title="如何引入" desc="PinCode 从 2.62.0 开始支持" :code="importCode" />

  <DemoBlock title="基本使用" desc="三种尺寸：small、default、large；默认值 123456。">
    <PinCode size="small" defaultValue="123456" @complete="(v: string) => log('pincode: ', v)" @change="(v: string) => log(v)" />
    <br />
    <PinCode size="default" defaultValue="123456" @complete="(v: string) => log('pincode: ', v)" @change="(v: string) => log(v)" />
    <br />
    <PinCode size="large" defaultValue="123456" @complete="(v: string) => log('pincode: ', v)" @change="(v: string) => log(v)" />
  </DemoBlock>

  <DemoBlock title="受控" desc="使用 value 传入验证码字符串，配合 onChange 受控使用。">
    <Button @click="setRandomValue">Set Random Value</Button>
    <br />
    <br />
    <PinCode
      format="mixed"
      :value="controlledValue"
      @complete="(v: string) => log('pincode: ', v)"
      @change="(v: string) => { log(v); controlledValue = v; }"
    />
  </DemoBlock>

  <DemoBlock title="设置位数" desc="通过 count 设置位数，默认 6 位，下方 Demo 设置为 4 位。">
    <PinCode size="large" defaultValue="6688" :count="4" @complete="(v: string) => log('pincode: ', v)" @change="(v: string) => log(v)" />
  </DemoBlock>

  <DemoBlock title="设置字符范围" desc="使用 format 控制可输入的字符范围：'number'、'mixed'、正则表达式或校验函数。">
    <Text>纯数字</Text>
    <PinCode format="number" @complete="(v: string) => log('pincode: ', v)" />
    <br />
    <Text>字母和数字</Text>
    <PinCode format="mixed" @complete="(v: string) => log('pincode: ', v)" />
    <br />
    <Text>只大写字母</Text>
    <PinCode :format="upperCaseFormat" @complete="(v: string) => log('pincode: ', v)" />
    <br />
    <Text>只小写字母(函数判断)</Text>
    <PinCode :format="lowerCaseFormat" @complete="(v: string) => log('pincode: ', v)" />
  </DemoBlock>

  <DemoBlock title="手动聚焦失焦" desc="使用 ref 上的方法 focus 与 blur，入参为对应 Input 的序号。">
    <Button @click="focusThird">Focus Third Input</Button>
    <Button style="margin-left: 8px" @click="blurThird">Blur Third Input</Button>
    <br />
    <br />
    <PinCode
      ref="pinRef"
      format="mixed"
      :value="refValue"
      @complete="(v: string) => log('pincode: ', v)"
      @change="(v: string) => { log(v); refValue = v; }"
    />
  </DemoBlock>
</template>
