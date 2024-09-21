<script setup lang="ts">

import {onMounted, ref, useTemplateRef} from "vue";
import {PopupDialogAgent} from "@/dialog-window";

const parentMessage = ref<string>("親ウィンドウからのメッセージがここに入ります");

const childMessage = useTemplateRef<HTMLInputElement>("childMessage");

const dialogAgent = new PopupDialogAgent(window);

function sendToParent() {
  const message = childMessage.value?.value;
  dialogAgent.sendMessage("result", {
    message: "## child1 ##" + message
  });
  closeDialog()
}

onMounted(() => {
  if (!window.opener) {
    // 直接開いたときの処理
    alert("直接開かないでください");
    return;
  }

  // 親ウィンドウからdataメッセージを受信する処理
  dialogAgent.addMessageListener("data", (event) => {
    parentMessage.value = event.message;
  })

  // 初期化完了通知
  dialogAgent.sendMessage("initialized", null);

  window.addEventListener("beforeunload", () => {
    dialogAgent.sendMessage("close", null);
  });
})

function closeDialog() {
  window.close();
}
</script>

<template>
  <div>
    <h1>Child1</h1>

    <div>
      <h3 style="background-color: azure">親ウィンドウから来たメッセージ</h3>
      <v-textarea v-model="parentMessage" readonly hide-details></v-textarea>
    </div>

    <div>
      <h3 style="background-color: azure">親ウィンドウに送信するメッセージ</h3>
      <v-text-field
        ref="childMessage"
        label="メッセージ"></v-text-field>
      <v-btn @click="sendToParent">送信</v-btn>
    </div>
    <div>
      <v-divider style="margin-bottom: 1rem;"></v-divider>
      <v-btn @click="closeDialog">ダイアログを閉じる</v-btn>
    </div>
  </div>
</template>

<style scoped>
div {
  padding: 1rem;
}
</style>
