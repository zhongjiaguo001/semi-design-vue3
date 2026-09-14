<script setup lang="ts">
import { CodeHighlight } from '@/index';
import DemoBlock from '../../DemoBlock.vue';
// 支持其他语言：手动引入 prismjs 对应语言配置
import 'prismjs/components/prism-vala.js';

const jsCode = `
import * as React from 'react"
const Test = ()=>{
    const handleClick = ()=>{
        alert("Click")
    }
    return <div onClick={handleClick}>test</div>
}`;

const cssCode = `.grid {
    .semi-row,
    .semi-row-flex {
        text-align: center;
        .semi-col {
            min-height: 30px;
            line-height: 30px;
            background: var(--semi-color-primary-light-default);
            outline: 1px solid var(--semi-color-primary-light-active);
        }
    }
}
`;

const valaCode = `public class ExampleApp : Gtk.Application {
    public ExampleApp () {
        Object (application_id: "com.example.App");
    }

    public override void activate () {
        var win = new Gtk.ApplicationWindow (this);

        var btn = new Gtk.Button.with_label ("Hello World");
        btn.clicked.connect (win.close);

        win.child = btn;
        win.present ();
    }

    public static int main (string[] args) {
        var app = new ExampleApp ();
        return app.run (args);
    }
}
`;
</script>

<template>
  <DemoBlock title="如何引入" code="import { CodeHighlight } from 'semi-design-vue'" />

  <DemoBlock title="基本用法" desc="向 code 传入代码纯文本，并在 language 传入编程语言名称。">
    <CodeHighlight language="javascript" :code="jsCode" />
  </DemoBlock>

  <DemoBlock title="基本用法 - CSS" desc="language 为 css 的高亮示例。">
    <CodeHighlight language="css" :code="cssCode" />
  </DemoBlock>

  <DemoBlock
    title="支持其他语言"
    desc="除 JavaScript / CSS / 类 C / html / svg 外，其他语言需手动引入配置，如 import 'prismjs/components/prism-vala.js'。"
    code="import 'prismjs/components/prism-vala.js'"
  >
    <CodeHighlight language="vala" :code="valaCode" />
  </DemoBlock>

  <DemoBlock
    title="自定义主题"
    desc="设置 defaultTheme=false 关闭默认主题，然后手动引入 prismjs/themes 下的主题 css 文件即可（此处未引入主题，仅展示无默认主题效果）。"
    code="import 'prismjs/themes/prism-okaidia.css'"
  >
    <CodeHighlight language="javascript" :code="jsCode" :default-theme="false" />
  </DemoBlock>
</template>
