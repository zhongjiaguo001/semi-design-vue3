<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Option,
  Row,
  Space,
  TextArea,
  Toast,
  useFieldApi,
  useFieldState,
  useForm,
  useFormApi,
  useFormState,
  withField,
  withFormApi,
  withFormState,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const onSubmit = (values: any) => Toast.success({ content: JSON.stringify(values) });
const onSubmitFail = () => Toast.error({ content: '校验未通过' });

const initValues = { name: 'semi', shortcut: 'se' };
const bindInit = { username: '', 'user[0]': '', 'siblings.1': '' };

const formLevelValidator = (values: any) => {
  const errors: Record<string, string> = {};
  if (values.name !== 'mike') errors.name = 'you must name mike';
  if (values.sex !== 'female') errors.sex = 'must be woman';
  return errors;
};
const formLevelAsync = (values: any) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      const errors: Record<string, string> = {};
      if (values.name !== 'mike') errors.name = 'you must name mike';
      resolve(errors);
    }, 400);
  });
const fieldSync = (val: string) => {
  if (!val) return '不能为空';
  if (val.length <= 5) return '长度必须大于 5';
  return '';
};

let rulesApi: any;
const getRulesApi = (api: any) => {
  rulesApi = api;
};
const validateNameField = () => rulesApi?.validate(['name']);

let silentApi: any;
const getSilentApi = (api: any) => {
  silentApi = api;
};
const silentValidate = () => {
  silentApi
    ?.validate?.({ silent: true })
    .then(() => Toast.success({ content: '静默校验通过' }))
    .catch(() => Toast.error({ content: '静默校验未通过（不展示错误）' }));
};
const normalValidate = () => {
  silentApi
    ?.validate?.()
    .then(() => Toast.success({ content: '校验通过' }))
    .catch(() => Toast.error({ content: '校验未通过' }));
};

const effectNote = ref('');
const onEffectChange = (state: any) => {
  effectNote.value = state?.values?.type === 'custom' ? '已选择自定义' : '自动放出';
};

const keepField = ref(true);

const [hookFormApi, hookFormState] = useForm();

const PriceInput = withField(Input, { maintainCursor: true });

const FieldTools = defineComponent({
  name: 'FormFieldTools',
  setup() {
    const api = useFieldApi('name');
    const st = useFieldState('name');
    return () =>
      h(Space, { style: { marginBottom: '8px' } }, () => [
        h(Button, { size: 'small', onClick: () => api.setValue('semi') }, () => 'setValue semi'),
        h('span', { class: 'form-note' }, `fieldState: ${JSON.stringify(st.value)}`),
      ]);
  },
});

const StatePreview = defineComponent({
  name: 'FormStatePreview',
  setup() {
    const formState = useFormState();
    return () => h('pre', { class: 'form-pre' }, JSON.stringify(formState?.value?.values ?? {}, null, 2));
  },
});

const ApiReset = defineComponent({
  name: 'FormApiReset',
  setup() {
    const formApi = useFormApi();
    return () => h(Button, { onClick: () => formApi?.reset?.() }, () => 'formApi.reset');
  },
});

const WithApiBtn = withFormApi(
  defineComponent({
    name: 'WithApiBtn',
    props: { formApi: { type: Object, default: undefined } },
    setup(props) {
      return () => h(Button, { onClick: () => props.formApi?.setValue?.('name', 'from-hoc') }, () => 'withFormApi 写入');
    },
  })
);
const WithStateView = withFormState(
  defineComponent({
    name: 'WithStateView',
    props: { formState: { type: Object, default: undefined } },
    setup(props) {
      return () => h('span', { class: 'form-note' }, `withFormState.name=${props.formState?.values?.name ?? ''}`);
    },
  })
);

const modalVisible = ref(false);
const hookValues = computed(() => JSON.stringify(hookFormState.values ?? {}));

const formRender = ({ formState }: any) =>
  h('div', [
    h(Form.Input as any, { field: 'renderName', label: 'render 写法', style: { width: '240px' } }),
    h('p', { class: 'form-note' }, `values: ${JSON.stringify(formState?.values || {})}`),
  ]);
</script>

<template>
  <DemoBlock title="如何引入" code="import { Form } from 'semi-design-vue'" />

  <DemoBlock title="基本写法" desc="Form.Input 等字段绑定 field，submit 拿到 values。">
    <Form :initValues="{ name: 'Ada', agree: true }" style="width: 360px" @submit="onSubmit">
      <Form.Input field="name" label="姓名" />
      <Form.InputNumber field="age" label="年龄" :initValue="18" />
      <Form.Switch field="agree" label="同意协议" />
      <Button html-type="submit" theme="solid">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="通过 render 属性传入" desc="Form 的 render 入参为 { formState, formApi, values }。">
    <Form :render="formRender" style="width: 360px" />
  </DemoBlock>

  <DemoBlock title="通过 child render function" desc="默认插槽可拿到 { formState, values, formApi }。">
    <Form style="width: 360px" @submit="onSubmit">
      <template #default="{ values }">
        <Form.Input field="phone" label="PhoneNumber" placeholder="Enter your phone number" style="width: 100%" />
        <Form.Checkbox field="agree" noLabel>I have read and agree</Form.Checkbox>
        <Button html-type="submit" theme="solid" :disabled="!values.agree">Log in</Button>
      </template>
    </Form>
  </DemoBlock>

  <DemoBlock title="已支持的表单控件" desc="Form.Input / Select / DatePicker / Switch / Checkbox / RadioGroup / Slider / Rating / TagInput 等。">
    <Form style="width: 420px" @submit="onSubmit">
      <Form.Input field="name" label="姓名" />
      <Form.Select field="role" label="角色" style="width: 100%">
        <Option value="rd">开发</Option>
        <Option value="ued">设计</Option>
      </Form.Select>
      <Form.DatePicker field="date" label="日期" style="width: 100%" />
      <Form.Switch field="open" label="开关" />
      <Form.CheckboxGroup field="skills" label="技能" :options="['Vue', 'React']" />
      <Form.RadioGroup field="level" label="级别" :options="['P5', 'P6']" />
      <Form.Slider field="progress" label="进度" />
      <Form.Rating field="score" label="评分" />
      <Form.TagInput field="tags" label="标签" />
      <Button html-type="submit" theme="solid">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="表单控件值的绑定" desc="field 支持 username、user[0]、siblings.1、parents[0].name 等路径。">
    <Form :initValues="bindInit" style="width: 100%" @submit="onSubmit">
      <template #default="{ formState }">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Input field="username" placeholder="username" />
            <Form.Input field="user[0]" placeholder="user[0]" />
            <Form.Input field="siblings.1" placeholder="siblings.1" />
            <Form.Input field="parents[0].name" placeholder="parents[0].name" />
          </Col>
          <Col :span="12">
            <Form.Label text="FormState 实时映射" />
            <TextArea :value="JSON.stringify(formState.values)" :rows="8" />
          </Col>
        </Row>
      </template>
    </Form>
  </DemoBlock>

  <DemoBlock title="表单布局" desc="默认垂直。layout='horizontal' 水平排列。labelPosition / labelAlign 控制标签。">
    <Space vertical align="start" :spacing="24" style="width: 100%">
      <Form style="width: 360px" @submit="onSubmit">
        <template #default="{ values }">
          <Form.Input field="phone" label="PhoneNumber" />
          <Form.Input field="password" label="Password" />
          <Form.Checkbox field="agree" noLabel>同意协议</Form.Checkbox>
          <Button html-type="submit" theme="solid" :disabled="!values.agree">Log in</Button>
        </template>
      </Form>
      <Form layout="horizontal">
        <Form.Input field="phone" label="PhoneNumber" />
        <Form.Input field="password" label="Password" />
      </Form>
      <Form labelPosition="left" labelAlign="right" labelWidth="80px" style="width: 420px">
        <Form.Input field="name" label="姓名" />
        <Form.Input field="title" label="职位" />
      </Form>
    </Space>
  </DemoBlock>

  <DemoBlock title="表单分组" desc="Form.Section 只影响布局，不影响数据结构。">
    <Form style="width: 560px" @submit="onSubmit">
      <Form.Section text="基本信息">
        <Form.Input field="name" label="考试名称" initValue="TCS 任务平台" style="width: 100%" />
      </Form.Section>
      <Form.Section text="合格标准">
        <Space>
          <Form.InputNumber field="pass" :initValue="60" label="及格正确率" style="width: 120px" />
          <Form.InputNumber field="number" :initValue="10" label="合格人数" style="width: 120px" />
        </Space>
      </Form.Section>
      <Form.Section text="考试人员">
        <Form.Switch field="open" label="对外开放" checkedText="开" uncheckedText="关" />
        <Form.Select field="users" label="考生" multiple style="width: 100%" :initValue="['1', '2']">
          <Option value="1">曲晨一</Option>
          <Option value="2">夏可曼</Option>
        </Form.Select>
      </Form.Section>
      <Button html-type="submit" theme="solid">创建考试</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="wrapperCol / labelCol" desc="在 Form 上统一 Field 栅格，无需每个 Field 包 Row/Col。">
    <Form :wrapperCol="{ span: 20 }" :labelCol="{ span: 4 }" labelPosition="left" labelAlign="right">
      <Form.Input field="name" label="姓名" style="width: 250px" />
      <Form.Select field="role" label="角色" style="width: 250px">
        <Option value="rd">开发</Option>
        <Option value="ued">设计</Option>
      </Form.Select>
    </Form>
  </DemoBlock>

  <DemoBlock title="隐藏 Label" desc="noLabel 关闭自动 Label，仍展示 ErrorMessage。pure 与原始控件 DOM 一致。">
    <Form style="width: 400px" @submit="onSubmit">
      <Form.Input field="name" noLabel trigger="blur" placeholder="noLabel，仍有错误信息" style="width: 250px" :rules="[{ required: true, message: 'required' }]" />
      <Form.Input field="purename" pure placeholder="pure：DOM 与普通 Input 一致" />
      <Button html-type="submit">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="内嵌 Label" desc="labelPosition='inset'。支持 Input / InputNumber / DatePicker / Select 等。">
    <Form labelPosition="inset" layout="horizontal">
      <Form.Input field="name" label="姓名" initValue="semi" style="width: 220px" />
      <Form.Select field="role" label="角色" initValue="rd" style="width: 220px">
        <Option value="rd">开发</Option>
        <Option value="ued">设计</Option>
      </Form.Select>
      <Form.DatePicker field="date" label="开始日期" :initValue="new Date()" style="width: 220px" />
    </Form>
  </DemoBlock>

  <DemoBlock title="导出 Label、ErrorMessage 使用" desc="const { Label, ErrorMessage } = Form，自行组合布局时复用默认样式。">
    <Form.Label text="自定义 Label" required />
    <Form.ErrorMessage error="这是一条错误信息" showValidateIcon />
  </DemoBlock>

  <DemoBlock title="使用 Form.Slot 放置自定义组件" desc="Slot 继承 Form 的 labelWidth / labelAlign / wrapperCol。">
    <Form labelPosition="left" labelWidth="80px" style="width: 420px">
      <Form.Input field="name" label="姓名" />
      <Form.Slot label="辅助信息">
        <span class="form-note">这里是自定义内容，布局与 Field 对齐。</span>
      </Form.Slot>
    </Form>
  </DemoBlock>

  <DemoBlock title="helpText / extraText" desc="helpText 在控件下方；extraText 可放额外说明。">
    <Form style="width: 360px">
      <Form.Input field="name" label="姓名" helpText="blur 后校验" extraText="将用于展示" trigger="blur" :rules="[{ required: true, message: 'required' }]" />
    </Form>
  </DemoBlock>

  <DemoBlock title="使用 InputGroup 组合多个 Field" desc="Form.InputGroup 统一 Label，内部 Field 不再单独出 Label。">
    <Form style="width: 420px">
      <Form.InputGroup label="数值范围">
        <Form.Input field="start" style="width: 120px" placeholder="开始" />
        <Form.Input field="end" style="width: 120px" placeholder="结束" />
      </Form.InputGroup>
    </Form>
  </DemoBlock>

  <DemoBlock title="Modal 弹出层中的表单">
    <Button @click="modalVisible = true">打开表单弹层</Button>
    <Modal v-model:visible="modalVisible" title="新建" :footer="null">
      <Form @submit="(v: any) => { onSubmit(v); modalVisible = false; }">
        <Form.Input field="name" label="名称" :rules="[{ required: true, message: '必填' }]" />
        <Button html-type="submit" theme="solid">确定</Button>
      </Form>
    </Modal>
  </DemoBlock>

  <DemoBlock title="配置初始值与校验规则" desc="initValues / field.initValue。rules 基于 async-validator。trigger 默认 change。stopValidateWithError 遇第一条失败即停。">
    <Form :initValues="initValues" style="width: 360px" @submit="onSubmit" @submitFail="onSubmitFail">
      <Form.Input
        field="name"
        label="name"
        trigger="blur"
        :rules="[
          { required: true, message: 'required error' },
          { validator: (_r: any, value: string) => value === 'semi', message: 'should be semi' },
        ]"
      />
      <Form.Input
        field="shortcut"
        label="shortcut"
        stopValidateWithError
        :rules="[
          { required: true, message: 'required error' },
          { validator: (_r: any, value: string) => value === 'semi', message: 'should be semi' },
        ]"
      />
      <Button html-type="submit">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="自定义校验（Form 级别）" desc="validator 返回 { [field]: message }。配置后 Field 级 rules 不再生效。">
    <Space vertical align="start" :spacing="16">
      <Form :validator="formLevelValidator" layout="horizontal" @submit="onSubmit" @submitFail="onSubmitFail">
        <Form.Input field="name" trigger="blur" />
        <Form.Input field="sex" trigger="blur" />
        <Button html-type="submit" theme="solid">同步校验提交</Button>
      </Form>
      <Form :validator="formLevelAsync" layout="horizontal" @submit="onSubmit" @submitFail="onSubmitFail">
        <Form.Input field="name" trigger="blur" />
        <Button html-type="submit" theme="solid">异步校验提交</Button>
      </Form>
    </Space>
  </DemoBlock>

  <DemoBlock title="自定义校验（Field 级别）" desc="Field validator: (val, values) => string | Promise<string>。与 rules[].validator 互斥。">
    <Form style="width: 400px">
      <Form.Input field="familyName" label="syncValidate" :validator="fieldSync" trigger="blur" />
      <Button html-type="reset">reset</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="手动触发指定 Field 校验" desc="formApi.validate(['name']) 只校验指定字段；不传参校验全部。">
    <Form :getFormApi="getRulesApi" style="width: 360px">
      <Form.Input field="name" label="姓名" :rules="[{ required: true, message: '必填' }]" />
      <Space>
        <Button @click="validateNameField">只校验 name</Button>
        <Button html-type="submit" theme="solid">提交全部校验</Button>
      </Space>
    </Form>
  </DemoBlock>

  <DemoBlock title="静默校验" desc="formApi.validate({ silent: true }) 拿结果但不更新错误 UI / touched。">
    <Form :getFormApi="getSilentApi" style="width: 360px">
      <Form.Input field="username" label="用户名" :rules="[{ required: true, message: '用户名不能为空' }, { min: 3, message: '至少 3 个字符' }]" />
      <Space>
        <Button @click="silentValidate">静默校验</Button>
        <Button @click="normalValidate">普通校验</Button>
      </Space>
    </Form>
  </DemoBlock>

  <DemoBlock title="表单联动" desc="用 values / onChange 根据字段显示其他控件。">
    <Form style="width: 420px" @change="onEffectChange">
      <template #default="{ values }">
        <Form.RadioGroup field="type" label="答案放出时间" direction="vertical" initValue="always">
          <Form.Radio value="always">自动放出</Form.Radio>
          <Form.Radio value="custom">自定义放出时间</Form.Radio>
        </Form.RadioGroup>
        <Form.DatePicker v-if="values.type === 'custom'" field="customTime" type="dateTimeRange" noLabel style="width: 100%" />
        <p class="form-note">{{ effectNote }}</p>
      </template>
    </Form>
  </DemoBlock>

  <DemoBlock title="动态删减表单项" desc="v-if 控制 Field 挂载。">
    <Form style="width: 360px" @submit="onSubmit">
      <template #default="{ values }">
        <Form.Switch field="more" label="填写更多" />
        <Form.Input v-if="values.more" field="extra" label="补充信息" />
        <Button html-type="submit" theme="solid">提交</Button>
      </template>
    </Form>
  </DemoBlock>

  <DemoBlock title="动态表单保留状态（keepState）" desc="卸载 Field 后仍保留值；再次挂载可恢复。">
    <Space style="margin-bottom: 12px">
      <span>显示备注</span>
      <Button size="small" @click="keepField = !keepField">{{ keepField ? '卸载' : '挂载' }}</Button>
    </Space>
    <Form style="width: 360px" @submit="onSubmit">
      <Form.Input v-if="keepField" field="note" label="备注" keepState />
      <Button html-type="submit" theme="solid">提交（卸载后值仍在）</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="使用 ArrayField" desc="arrayFields / addWithInitValue / remove。">
    <Form @submit="onSubmit">
      <Form.ArrayField field="users" :initValue="[{ name: 'Ada' }]">
        <template #default="{ arrayFields, addWithInitValue }">
          <div v-for="f in arrayFields" :key="f.key" style="display: flex; gap: 8px; margin-bottom: 8px">
            <Form.Input :field="`${f.field}.name`" :no-label="true" style="width: 160px" />
            <Button type="danger" theme="borderless" @click="f.remove()">删除</Button>
          </div>
          <Button @click="addWithInitValue({ name: 'New' })">新增</Button>
        </template>
      </Form.ArrayField>
      <br />
      <Button html-type="submit" theme="solid">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="嵌套 ArrayField">
    <Form @submit="onSubmit">
      <Form.ArrayField field="teams" :initValue="[{ name: 'A', members: [{ name: 'Ada' }] }]">
        <template #default="{ arrayFields, addWithInitValue }">
          <div v-for="team in arrayFields" :key="team.key" style="margin-bottom: 16px; padding: 12px; border: 1px solid var(--semi-color-border)">
            <Form.Input :field="`${team.field}.name`" label="团队" />
            <Form.ArrayField :field="`${team.field}.members`">
              <template #default="{ arrayFields: members, addWithInitValue: addMember }">
                <div v-for="m in members" :key="m.key" style="display: flex; gap: 8px; margin-bottom: 8px">
                  <Form.Input :field="`${m.field}.name`" :no-label="true" style="width: 140px" />
                  <Button size="small" type="danger" theme="borderless" @click="m.remove()">删成员</Button>
                </div>
                <Button size="small" @click="addMember({ name: '' })">加成员</Button>
              </template>
            </Form.ArrayField>
            <Button size="small" type="danger" theme="borderless" @click="team.remove()">删除团队</Button>
          </div>
          <Button @click="addWithInitValue({ name: '', members: [] })">新增团队</Button>
        </template>
      </Form.ArrayField>
      <br />
      <Button html-type="submit" theme="solid">提交</Button>
    </Form>
  </DemoBlock>

  <DemoBlock title="Hooks：useForm / useFormApi / useFormState" desc="Form.useForm() 得到 [formApi, formState]，通过 form 传入。子组件内 useFormApi / useFormState。">
    <Form :form="hookFormApi" :initValues="{ name: 'hook' }" style="width: 400px">
      <Form.Input field="name" label="姓名" />
      <ApiReset />
      <StatePreview />
      <p class="form-note">外部 formState.values：{{ hookValues }}</p>
    </Form>
  </DemoBlock>

  <DemoBlock title="Hooks：useFieldApi / useFieldState">
    <Form :initValues="{ name: 'field' }" style="width: 400px">
      <FieldTools />
      <Form.Input field="name" label="姓名" />
    </Form>
  </DemoBlock>

  <DemoBlock title="HOC：withFormApi / withFormState">
    <Form :initValues="{ name: 'hoc' }" style="width: 400px">
      <Form.Input field="name" label="姓名" />
      <Space>
        <WithApiBtn />
        <WithStateView />
      </Space>
    </Form>
  </DemoBlock>

  <DemoBlock title="withField 封装自定义表单控件" desc="withField(Input) 把任意控件接入 Form 数据流。">
    <Form style="width: 360px" @submit="onSubmit">
      <PriceInput field="price" label="价格" />
      <Button html-type="submit" theme="solid">提交</Button>
    </Form>
  </DemoBlock>
</template>

<style scoped>
.form-note {
  margin: 0;
  color: var(--semi-color-text-2);
  font-size: 13px;
}
.form-pre {
  margin: 8px 0 0;
  padding: 8px;
  background: var(--semi-color-fill-0);
  font-size: 12px;
  max-height: 160px;
  overflow: auto;
}
</style>
