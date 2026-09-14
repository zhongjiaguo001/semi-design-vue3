<script setup lang="ts">
import { ref, computed } from 'vue';
import { Slider, InputNumber, Button } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Slider } from 'semi-design-vue';`;

// 带输入框的
const inputValue = ref<number>(10);
const getSliderValue = (newValue: any) => {
  if (isNaN(Number(newValue))) {
    return;
  }
  inputValue.value = newValue / 1;
};

// 自定义提示
const percentFormatter = (v: any) => `${v}%`;

// 带标签的
const degFormatter = (v: any) => `${v}°C`;

// 分段背景
const segValue = ref<number[]>([20, 60]);
const segRange = [10, 100];
const changeSegValue = (newValue: any) => {
  segValue.value = newValue;
};
const railStyle = computed(() => {
  // color of second segment inherits from .semi-slider-track
  const color = ['var(--semi-color-danger)', 'transparent', 'var(--semi-color-success)'];
  const gradientPos = segValue.value.map(
    (val) => Number(((val - segRange[0]) / (segRange[1] - segRange[0])).toFixed(2)) * 100
  );
  return {
    background: `linear-gradient(to right, ${color[0]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[1]}%, ${color[2]} ${gradientPos[1]}%)`,
  };
});

// 受控组件
const controlledValue = ref(10);
const changeControlled = () => {
  controlledValue.value = controlledValue.value + 10;
};

const verticalBoxStyle = {
  height: '300px',
  marginLeft: '30px',
  marginTop: '10px',
  paddingRight: '30px',
  display: 'inline-block',
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="基本滑动条。当 range 为 true 时，支持两侧滑动。当 disabled 为 true 时，滑块处于不可用状态。"
  >
    <div>
      <div>
        <div>Default</div>
        <Slider :show-boundary="true" />
      </div>
      <br />
      <br />
      <div>
        <div>Range</div>
        <Slider :default-value="[20, 60]" range />
      </div>
      <br />
      <br />
      <div>
        <div>Disabled</div>
        <Slider :default-value="40" disabled />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="带输入框的" desc="滑动条的滑块和输入框组件保持同步。">
    <div style="display: flex; align-items: center">
      <div style="width: 320px; margin-right: 15px">
        <Slider :step="1" :value="inputValue" @change="getSliderValue" />
      </div>
      <InputNumber :value="inputValue" :min="0" :max="100" style="width: 100px" @change="getSliderValue" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="自定义提示"
    desc="使用 tipFormatter 可以设置 Tooltip 的显示的格式。设置 tipFormatter={null}，则隐藏 Tooltip。getAriaValueText 用于给滑块的当前值提供一个用户友好的名称。"
  >
    <div>
      <Slider :tip-formatter="percentFormatter" :get-aria-value-text="percentFormatter" />
      <br />
      <br />
      <Slider :tip-formatter="null" />
    </div>
  </DemoBlock>

  <DemoBlock title="带标签的" desc="使用 marks 属性标注滑块的刻度，使用 value / defaultValue 指定滑块位置。">
    <div>
      <div>step=10</div>
      <Slider
        :step="10"
        :marks="{ 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50', 100: '100' }"
        :default-value="[10, 100]"
        :range="true"
      />
      <br />
      <br />
      <div>step=0.1</div>
      <Slider
        :step="0.1"
        :marks="{ 0.1: '0.1', 0.2: '0.2', 0.3: '0.3', 0.4: '0.4', 0.5: '0.5' }"
        :min="0"
        :max="1"
        :default-value="[0.1, 0.5]"
        :range="true"
      />
      <br />
      <br />
      <div>Marks</div>
      <Slider
        :marks="{ 20: '20°C', 40: '40°C' }"
        :default-value="[0, 100]"
        :tip-formatter="degFormatter"
        :range="true"
        :get-aria-value-text="degFormatter"
      />
      <br />
      <br />
      <div>Included</div>
      <Slider
        :marks="{ 20: '20°C', 40: '40°C' }"
        :included="false"
        :default-value="[0, 100]"
        :range="true"
        :tip-formatter="degFormatter"
        :get-aria-value-text="degFormatter"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="分段背景" desc="通过使用 linear-gradient 及 railStyle，配合 onChange 可以实现动态的分段背景效果。">
    <Slider
      range
      :min="segRange[0]"
      :max="segRange[1]"
      :rail-style="railStyle"
      :value="segValue"
      @change="changeSegValue"
    />
  </DemoBlock>

  <DemoBlock title="受控组件" desc="滑块位置即 Slider 的值由 value 控制，配合 onChange 使用。">
    <div>
      <Button style="margin-right: 20px" @click="changeControlled">点击改变value值</Button>
      <br />
      <br />
      <Slider :value="controlledValue" />
    </div>
  </DemoBlock>

  <DemoBlock title="垂直" desc="通过 vertical 设置垂直方向，verticalReverse 反转垂直方向。">
    <div>
      <div :style="verticalBoxStyle">
        <Slider vertical />
      </div>
      <div :style="verticalBoxStyle">
        <Slider vertical vertical-reverse />
      </div>
      <div :style="verticalBoxStyle">
        <Slider vertical range :default-value="[20, 60]" />
      </div>
      <div :style="verticalBoxStyle">
        <Slider vertical vertical-reverse range :default-value="[20, 60]" />
      </div>
      <div :style="verticalBoxStyle">
        <Slider vertical range :marks="{ 20: '20°C', 40: '40°C' }" :step="10" :default-value="[20, 60]" />
      </div>
      <div :style="verticalBoxStyle">
        <Slider vertical vertical-reverse range :marks="{ 20: '20°C', 40: '40°C' }" :step="10" :default-value="[20, 60]" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="滑块带圆点" desc="通过 handleDot 设置滑块上的圆点大小与颜色，range 模式下可传数组分别设置。">
    <div>
      <div>
        <div>Default</div>
        <Slider :show-boundary="true" :handle-dot="{ size: '4px', color: 'blue' }" />
      </div>
      <br />
      <br />
      <div>
        <div>Range</div>
        <Slider
          :default-value="[20, 60]"
          range
          :handle-dot="[
            { size: '4px', color: 'blue' },
            { size: '4px', color: 'pink' },
          ]"
        />
      </div>
    </div>
  </DemoBlock>
</template>
