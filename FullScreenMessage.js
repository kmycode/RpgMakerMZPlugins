//=============================================================================
// RPG Maker MZ - FullScreenMessage
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 画面全体のメッセージボックスを表示する
 * @author 雪あすか
 * 
 * 
 * @help 画面全体を覆うメッセージボックス。テキストのみ、グラフィック描画不可
 * 
 * @command showMessage
 * @text フルスクリーンでメッセージ表示
 * @desc フルスクリーンで所定のメッセージを表示します
 * @arg message
 * @type multiline_string
 * @text 表示するテキスト
 * @desc 画面上に表示するテキスト
 * 
 * @command showItemNote
 * @text フルスクリーンでアイテムのメモを表示
 * @desc フルスクリーンで、アイテムのメモのうち「===FSM」で囲まれた部分を表示します
 * @arg itemId
 * @type item
 * @text 表示するアイテム
 * @desc 画面上に表示するメッセージの設定されたアイテムを指定します
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 */

(() => {
  const PLUGIN_NAME = "FullScreenMessage";

  let isFullScreen = false;
  let oldContentsHeight = 0;
  let oldHeight = 0;

  Window_Message.prototype.updateContentSize = function() {
    if (!oldContentsHeight) {
      oldContentsHeight = this.contents.height;
    }

    if (isFullScreen) {
      if (this.contents.height !== Graphics.boxHeight) {
        this.contents.resize(this.contents.width, Graphics.boxHeight);
      }
    } else {
      if (this.contents.height === Graphics.boxHeight) {
        this.contents.resize(this.contents.width, oldContentsHeight);
      }
    }
  };

  const Window_Message_updatePlacement = Window_Message.prototype.updatePlacement;
  Window_Message.prototype.updatePlacement = function() {
    if (!isFullScreen) {
      if (oldHeight) {
        this.height = oldHeight;
      }
      return Window_Message_updatePlacement.call(this);
    }
    if (!oldHeight) {
      oldHeight = this.height;
    }

    this.y = 52;
    this.height = Graphics.boxHeight - 52;
  };

  const Window_Message_newPage = Window_Message.prototype.newPage;
  Window_Message.prototype.newPage = function(textState) {
    this.updateContentSize();
    Window_Message_newPage.call(this, textState);
  };

  const Window_Message_isEndOfText = Window_Message.prototype.isEndOfText;
  Window_Message.prototype.isEndOfText = function(textState) {
    const isEnd = Window_Message_isEndOfText.call(this, textState);

    if (isEnd && isFullScreen) {
      isFullScreen = false;
    }

    return isEnd;
  };

  const showMessage = (message) => {
    isFullScreen = true;
    $gameMessage.setFaceImage('', 0);
    $gameMessage.setSpeakerName('');
    $gameMessage.add(message);
  };

  PluginManager.registerCommand(PLUGIN_NAME, "showMessage", args => {
    const message = args.message;
    showMessage(message);
  });

  PluginManager.registerCommand(PLUGIN_NAME, "showItemNote", args => {
    const itemIdStr = args.itemId;
    if (!itemIdStr) return;

    const itemId = parseInt(itemIdStr);
    const item = $dataItems[itemId];
    if (!item?.note) return;

    if (item.note.includes('===FSM')) {
      const message = item.note.split('===FSM')[1].trim();
      showMessage(message);
    } else {
      showMessage(item.note);
    }
  });
})();
