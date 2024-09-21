<script setup lang="ts">
import {onMounted, ref} from "vue";
import {
  ChildDialogWindow,
  DialogOpenOptions,
  PopupDialogOwner
} from "@/dialog-window"

const inputMessage = ref<string>("Hello popup window.");

const owner = new PopupDialogOwner(window);

function showDialog(url: string, popupId: string, options: DialogOpenOptions): ChildDialogWindow {
  const dialog = owner.showDialog(url, popupId, options);
  if (dialog == null) {
    throw new Error("ダイアログが生成できませんでした．");
  }
  return dialog;
}


// ======================================================================
// モーダルダイアログ
const resultChild1Message = ref<string>("");

const coverStyle = ref<Record<string, string>>({
  "display": "none"
});

async function onShowModalDialog() {
  coverStyle.value.display = "block";

  const child1Window = showDialog("/child1/", "child1", {
    left: 50,
    top: 100,
    width: 600,
    height: 600,
    lockable: true
  });

  child1Window.addMessageListener("initialized", () => {
    child1Window.sendMessage("data", {
      message: "[from Parent to Child1]\n" + inputMessage.value
    })
  })

  child1Window.addMessageListener("close", () => {
    coverStyle.value.display = "none";
  })

  // 特定のメッセージタイプを受信するまで待機することで，モーダルウィンドウとして実装できる
  const response = await child1Window.wait("result");

  // 子ウィンドウから届いたメッセージの設定
  resultChild1Message.value = response.message;

  // 非活性レイヤーの非表示
  coverStyle.value.display = "block";
}



// ======================================================================
// モードレスダイアログの表示
const resultChild2Message = ref<string>("");

function onShowModelessDialog() {

  // 子ウィンドウの生成
  const child2Window = showDialog("/child2/", "child2", {
    left: 400,
    top: 100,
    width: 600,
    height: 600
  });

  // 初期化イベントを受信したときの処理
  child2Window.addMessageListener("initialized", () => {
    child2Window.sendMessage("data", {
      message: "[from Parent to Child2]\n" + inputMessage.value
    })
  })

  child2Window.addMessageListener("result", (event) => {
    resultChild2Message.value = event.message;
  })

  child2Window.addMessageListener("close", (event) => {
    console.log("receive close", event)
  })
}

// ======================================================================
onMounted(() => {
  owner.start()
})


</script>

<template>
<div>
  <h1>ダイアログ</h1>
  <div>
    <h3 style="background-color: azure;">ダイアログに送信するメッセージ</h3>
    <v-text-field v-model="inputMessage"></v-text-field>
    <v-btn style="margin: 1rem 0;" @click="onShowModalDialog">モーダルダイアログ表示</v-btn>
    <br>
    <v-btn style="margin: 1rem 0;" @click="onShowModelessDialog">モードレスダイアログ表示</v-btn>
  </div>
  <div>
    <h3 style="background-color: azure;">モーダルダイアログから帰ってきたメッセージ</h3>
    <v-textarea
      v-model="resultChild1Message"
      placeholder="モーダルダイアログの入力値"
      readonly
    ></v-textarea>
    <h3 style="background-color: azure;">モードレスダイアログから帰ってきたメッセージ</h3>
    <v-textarea
      v-model="resultChild2Message"
      placeholder="モードレスダイアログの入力値"
      readonly
    ></v-textarea>
  </div>
  <div class="gray-cover" :style="coverStyle"></div>
</div>
</template>

<style scoped>
div {
  padding: 1rem;
}


.gray-cover {
  position: fixed; /* ブラウザの定位置に固定 */
  background: rgba(0, 0, 0, .5); /* 背景色を半透明の黒色に */
  width: 100%; /* 要素の横幅を画面全体に */
  height: 100%; /* 要素の高さを画面全体に */
  top: 0; /* 要素の固定位置をブラウザ最上部に合わせる */
  left: 0; /* 要素の固定位置をブラウザ左側に合わせる */
  z-index: 1000; /* 要素をコンテンツより前面に（要調整） */
}
</style>
