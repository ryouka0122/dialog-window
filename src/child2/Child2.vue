<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {PopupDialogAgent} from "@/dialog-window";

const parentMessage = ref<string>("親ウィンドウからのメッセージがここに入ります");

const childMessage = ref<string>("");

const dialogAgent = new PopupDialogAgent(window);

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

  // タブ閉じたとき，親ウィンドウにcloseメッセージを送信する処理
  window.addEventListener("beforeunload", () => {
    dialogAgent.sendMessage("close", null);
  })

  // 初期化完了通知
  dialogAgent.sendMessage("initialized", null);
})

watch(childMessage, () => {
  dialogAgent.sendMessage("result", {
    message: "** Child2 **" + childMessage.value
  })
})

function closeDialog() {
  window.close();
}
</script>

<template>
  <div>
    <h1>Child2</h1>

    <div>
      <h3 style="background-color: azure">親ウィンドウから来たメッセージ</h3>
      <v-textarea v-model="parentMessage" readonly></v-textarea>
    </div>

    <div>
      <h3 style="background-color: azure">親ウィンドウに送信するメッセージ</h3>
      <v-text-field
        label="メッセージ"
        v-model="childMessage"
      ></v-text-field>
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
