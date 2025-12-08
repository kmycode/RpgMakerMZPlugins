//=============================================================================
// RPG Maker MZ - ItemSelectionRange
//=============================================================================

/*:
 * @target MZ
 * @plugindesc アイテム選択時、意図したアイテムのみを選択肢に出すように
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 特定のタグが設定されたアイテムのみを選択肢に表示します
 * 
 * 【使い方】
 * アイテム選択表示前の、メッセージ表示前にコマンドを呼び出します
 * 
 * 入力するコマンドは３行です
 * 　コマンド１：プラグイン呼び出し
 * 　コマンド２：メッセージ（任意・省略可能）
 * 　コマンド３：アイテム選択
 * 
 * また、アイテム選択後に設定リセットは不要です。
 * 
 * アイテムのメモに <testTag> など適当な名前のタグを追加します
 * （コロン : とその右側の値は指定しなくてもいいですし、他のプラグインと併用して指定してもいいです）
 * 次に、本プラグインを呼び出す時にタグの名前（ここでは「testTag」）をパラメータとして指定します。
 * すると、自分が所持しているもののうち <testTag> が指定されたアイテムのみが選択肢に表示されます
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command setItemInputRange
 * @text アイテム選択のタグ条件を設定
 * @desc 指定したタグの設定されたアイテムのみを選択肢に表示します
 * 
 * @arg tagName
 * @text タグ名
 * @type string
 * @desc アイテムのメモ欄にこのタグが設定されていれば選択肢に表示されます
 */

(() => {
  const PLUGIN_NAME = 'ItemSelectionRange';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Message_initialize = Game_Message.prototype.initialize;
  Game_Message.prototype.initialize = function() {
    Game_Message_initialize.call(this);
    this.resetItemRange();
  }

  Game_Message.prototype.resetItemRange = function() {
    this._itemTagName = null;
  }

  Game_Message.prototype.filteredItemTagName = function() {
    return this._itemTagName;
  }

  Game_Message.prototype.filterItemByTagName = function(tagName) {
    this._itemTagName = tagName;
  }

  const Window_EventItem_close = Window_EventItem.prototype.close;
  Window_EventItem.prototype.close = function() {
    Window_EventItem_close?.call(this);
    $gameMessage.resetItemRange();
  }

  const Window_EventItem_includes = Window_EventItem.prototype.includes;
  Window_EventItem.prototype.includes = function(item) {
    const result = Window_EventItem_includes.call(this, item);
    if (!result || !item?.meta) return result;

    const tagName = $gameMessage.filteredItemTagName();
    if (!tagName) return result;

    return item.meta[tagName];
  }

  PluginManager.registerCommand(PLUGIN_NAME, "setItemInputRange", args => {
    $gameMessage.filterItemByTagName(args.tagName);
  });
})();
