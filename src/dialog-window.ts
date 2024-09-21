
export type MessageType = string;

export type MessageData = {
  messageType: MessageType;
  name: string;
  params: any
};

export type MessageListener = (param: any) => void;

export type DialogOpenOptions = {
  popup?: boolean;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  lockable?: boolean;
}



export class PopupDialogHandler {
  messageListener: {
    [key: string]: MessageListener[];
  }
  myOrigin: string

  constructor(origin: string) {
    console.log("PopupDialogHandler:", origin)
    this.messageListener = {};
    this.myOrigin = origin;
  }

  checkOrigin(other: string) {
    return this.myOrigin === other;
  }

  addMessageListener(messageType: string, listener: MessageListener): void {
    if (messageType in this.messageListener) {
      this.messageListener[messageType].push(listener)
    } else {
      this.messageListener[messageType] = [listener]
    }
  }

  removeMessageListener(messageType: string, listener: MessageListener | null): void {
    if (listener) {
      this.messageListener[messageType] = this.messageListener[messageType].filter(e => {
        return e !== listener
      })
    } else {
      delete this.messageListener[messageType]
    }
  }
}

export class PopupDialogAgent extends PopupDialogHandler {
  owner: Window
  popupId: string

  constructor(window: Window) {
    super(window.origin)
    this.owner = window.opener;
    this.popupId = window.name;

    window.addEventListener('message', (event) => {
      this.dispatchMessage(event);
    })
  }


  sendMessage(messageType: string, params: any) {
    console.log("sendMessage", messageType, params);
    this.owner.postMessage({
      messageType: messageType,
      params: params
    });
  }

  dispatchMessage(event: MessageEvent<MessageData>) {

    if (!this.checkOrigin(event.origin)) {
      return;
    }

    const messageType = event.data?.messageType;
    const params = event.data?.params;

    if (messageType in this.messageListener) {
      this.messageListener[messageType].forEach(listener => {
        listener(params);
      })
    }
  }
}



export class ChildDialogWindow extends PopupDialogHandler {
  parent: PopupDialogOwner;
  source: Window;

  waitingMessageType: MessageType | null
  callback: MessageListener | null

  constructor(parent: PopupDialogOwner, source: Window) {
    super(parent.owner.origin);
    this.parent = parent;
    this.source = source;

    this.waitingMessageType = null;
    this.callback = null;
  }

  get popupId() {
    return this.source.name;
  }

  sendMessage(messageType: MessageType, params: any): void {
    this.source.postMessage({
      messageType: messageType,
      params: params
    });
  }

  /**
   * 受信待機中か判定する処理
   * @param messageType メッセージの種類
   * @param data メッセージのデータ
   * @returns {boolean} 待機中だったときtrueを返却
   */
  checkWait(messageType: MessageType, data: any): boolean {
    if (this.waitingMessageType === messageType) {
      this.callback?.call(this, data);

      // 待機が終わったら変数は開放しておく
      this.waitingMessageType = null;
      this.callback = null;

      return true;
    }
    return false;
  }

  /**
   * メッセージの処理
   * @param messageType メッセージの種類
   * @param params 送信データ
   */
  processMessage(messageType: MessageType, params: any) {
    // 待機中だったときは，ここで切り上げる
    if (this.checkWait(messageType, params)) {
      return;
    }

    if (messageType in this.messageListener) {
      this.messageListener[messageType].forEach(listener => {
        listener(params);
      })
    }
  }

  /**
   * メッセージ受信待機
   * @param messageType 受信メッセージの種類
   * @returns {Promise<any>} 受信時のPromise処理
   */
  async wait(messageType: MessageType): Promise<any> {
    return new Promise((resolve: any) => {
      this.waitingMessageType = messageType;
      this.callback = resolve;
    })
  }
}

/**
 * 親ウィンドウ用の管理クラス
 */
export class PopupDialogOwner extends PopupDialogHandler {
  // 子ウィンドウのキャッシュ（今表示しているウィンドウのリスト）
  popupCache: {
    [key: string]: ChildDialogWindow
  }
  // 親ウィンドウのWindowインスタンス
  owner: Window
  // 排他ロックをかけている子ウィンドウの識別子（null以外の時が排他ロック中）
  lockPopupId: string|null

  constructor(window: Window) {
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
  dispatchMessage(event: MessageEvent<MessageData>) {
    if (!this.checkOrigin(event.origin)) {
      // 異なるオリジンからのメッセージは処理しない
      return;
    }

    // FIXME1: ここのWindowへのキャストのやり方はほんとうに安全か？
    const popupId = (event.source as Window | null)?.name;
    const messageType = event.data?.messageType;
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
  showDialog(url: string, popupId: string, options: DialogOpenOptions): ChildDialogWindow | null {
    const optionList: string[] = []

    optionList.push("left" in options ? `left=${options.left}`: "");
    optionList.push("top" in options ? `top=${options.top}`: "");
    optionList.push("width" in options ? `width=${options.width}`: "");
    optionList.push("height" in options ? `height=${options.height}`: "");
    optionList.push("popup" in options ? `popup=${options.popup?"yes":"no"}`: "");
    const lockable = !!options["lockable"]

    const features = this.__join(",", optionList);
    console.log("features", features)
    const child = this.owner.open(
      url,
      popupId,
      features
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
  __join(delimiter: string, target: string[]): string {
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
