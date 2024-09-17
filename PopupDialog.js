
class PopupDialogHandler {
  messageListener
  myOrigin

  constructor(origin) {
    this.messageListener = {};
    this.myOrigin = origin;
  }

  checkOrigin(other) {
    return this.myOrigin === other;
  }

  addMessageListener(messageType, listener) {
    if (this.messageListener[messageType]) {
      this.messageListener[messageType].push(listener)
    } else {
      this.messageListener[messageType] = [listener]
    }
  }

  removeMessageListener(messageType, listener) {
    if (listener) {
      this.messageListener[messageType] = this.messageListener[messageType].filter(e => {
        return e !== listener
      })
    } else {
      delete this.messageListener[messageType]
    }
  }
}

class PopupDialogAgent extends PopupDialogHandler {
  owner
  popupId

  constructor(window) {
    super(window.origin)
    this.owner = window.opener;
    this.popupId = window.name;

    window.addEventListener('message', (event) => {
      this.dispatchMessage(event);
    })
  }

  sendMessage(messageType, params) {
    this.owner.postMessage({
      type: messageType,
      params: params
    });
  }

  dispatchMessage(event) {
    if (!this.checkOrigin(event)) {
      return;
    }

    const messageType = event.data?.type;
    const params = event.data?.params;

    console.log("[Agent]", this.popupId, messageType, params);
    if (messageType in this.messageListener) {
      this.messageListener[messageType].forEach(listener => {
        listener(params);
      })
    }
  }
}



class ChildDialogWindow extends PopupDialogHandler {
  parent
  source

  waitingMessageType
  callback

  constructor(parent, source) {
    super(parent.owner.myOrigin);
    this.parent = parent;
    this.source = source;
    this.callback = null;
  }

  get popupId() {
    return this.source.name;
  }

  sendMessage(messageType, params) {
    this.source.postMessage({
      type: messageType,
      params: params
    });
  }

  /**
   * 受信待機中か判定する処理
   * @param messageType メッセージの種類
   * @param data メッセージのデータ
   * @returns {boolean} 待機中だったときtrueを返却
   */
  checkWait(messageType, data) {
    if (this.waitingMessageType === messageType) {
      this.callback(data)
      return true;
    }
    return false;
  }

  /**
   * メッセージの処理
   * @param messageType メッセージの種類
   * @param params 送信データ
   */
  processMessage(messageType, params) {
    // 待機中だったときは，ここで切り上げる
    if (this.checkWait(messageType, params)) {
      return;
    }

    if (messageType in this.messageListener) {
      this.messageListener[messageType].forEach(listener => {
        listener(this, params);
      })
    }
  }

  /**
   * メッセージ受信待機
   * @param messageType 受信メッセージの種類
   * @returns {Promise<any>} 受信時のPromise処理
   */
  async wait(messageType) {
    return new Promise((resolve) => {
      this.waitingMessageType = messageType;
      this.callback = resolve;
    })
  }
}

/**
 * 親ウィンドウ用の管理クラス
 */
class PopupDialogOwner extends PopupDialogHandler {
  // 子ウィンドウのキャッシュ（今表示しているウィンドウのリスト）
  popupCache
  // 親ウィンドウのWindowインスタンス
  owner
  // 排他ロックをかけている子ウィンドウの識別子（null以外の時が排他ロック中）
  lockPopupId

  constructor(window) {
    super(window.origin)
    this.popupCache = {}
    this.owner = window;
    this.lockPopupId = null;
  }

  /**
   * messageイベントの開始
   */
  start() {
    this.owner.addEventListener("message", (event) => {
      this.dispatchMessage(event)
    })
  }

  /**
   * messageイベントの停止
   * TODO: これだと出来ないかも
   */
  stop() {
    this.owner.removeEventListener("message", (event) => {
      this.dispatchMessage(event)
    })
  }

  /**
   * メッセージイベントの振り分け処理
   * @param event {MessageEvent} messageイベントのメッセージオブジェクト
   */
  dispatchMessage(event) {
    if (!this.checkOrigin(event.origin)) {
      // 異なるオリジンからのメッセージは処理しない
      return;
    }

    const popupId = event.source?.name;
    const messageType = event.data?.type
    if (!popupId || !messageType) {
      return;
    }

    const child = this.popupCache[popupId]
    const params = event.data?.params;

    if (this.lockPopupId === null) {
      child.processMessage(messageType, params);
    } else if (this.lockPopupId === popupId) {
      child.processMessage(messageType, params);
    }


    if (messageType === "close") {
      // 子ウィンドウがクローズするときは，キャッシュからも破棄
      delete this.popupCache[popupId];
      if (this.lockPopupId === popupId) {
        this.lockPopupId = null;
      }
    }
  }

  /**
   * ウィンドウダイアログの表示
   * @param url ダイアログに表示するURL
   * @param popupId 識別子
   * @param options window.openに渡すパラメータと排他ロックパラメータ
   * @returns {ChildDialogWindow|null}
   */
  showDialog(url, popupId, options) {
    const optionList = []
    for (const key of [
      "left", "top", "width", "height", "toolbar", "menubar", "resizable"
    ]) {
      optionList.push(options[key] ? `${key}=${options[key]}` : "");
    }
    const lockable = !!options["lockable"]


    const child = this.owner.open(
      url,
      popupId,
      this.__join(",", optionList)
    )

    if (!child) {
      console.error("ウィンドウが開けませんでした．");
      return null;
    }

    if (this.popupCache[popupId]) {
      // キャッシュに入っていたら何もしない
      return this.popupCache[popupId];
    }

    child.name = popupId;
    const childDialogWindow = new ChildDialogWindow(this, child);
    this.popupCache[popupId] = childDialogWindow;

    if (lockable) {
      this.lockPopupId = popupId;
    }

    return childDialogWindow;
  }

  /**
   * window.openのoptionsに渡す文字列を生成する処理
   * @param delimiter 区切り文字
   * @param target パラメータの配列
   * @returns {string} 連結した文字列
   * @private
   */
  __join(delimiter, target) {
    let joined = "";
    for(const val of target) {
      if(val !== "") {
        if (joined !== "") {
         joined += delimiter;
        }
        joined += val;
      }
    }
    return joined;
  }

}
