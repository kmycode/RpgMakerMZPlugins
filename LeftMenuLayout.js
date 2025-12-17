//=============================================================================
// RPG Maker MZ - LeftMenuLayout
//=============================================================================

/*:
 * @target MZ
 * @plugindesc メニューを左側に表示する。アイテム一覧を改善する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help メニューを左側に表示し、アイテム一覧で説明文を下に表示します
 * 
 * 【使い方】
 * このプラグインを有効にするだけ
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'LeftMenuLayout';
  const params = PluginManager.parameters(PLUGIN_NAME);

  // マップ上のハンバーガーボタンを左上に
  const Scene_Map_createMenuButton = Scene_Map.prototype.createMenuButton;
  Scene_Map.prototype.createMenuButton = function() {
    Scene_Map_createMenuButton.call(this);
    this._menuButton.x = 4;
  };

  // メニュー右上のキャンセルボタン
  const Scene_MenuBase_createCancelButton = Scene_MenuBase.prototype.createCancelButton;
  Scene_MenuBase.prototype.createCancelButton = function() {
    Scene_MenuBase_createCancelButton.call(this);
    this._cancelButton.x = 4;
  }

  // メニュー左上の次・前ページ移動ボタン
  const Scene_MenuBase_createPageButtons = Scene_MenuBase.prototype.createPageButtons;
  Scene_MenuBase.prototype.createPageButtons = function() {
    Scene_MenuBase_createPageButtons.call(this);
    this._pagedownButton.x = Graphics.boxWidth - this._pagedownButton.width - 4;
    this._pageupButton.x = this._pagedownButton.x - this._pageupButton.width - 4;
  }

  // 戦闘画面のキャンセルボタン
  const Scene_Battle_createCancelButton = Scene_Battle.prototype.createCancelButton;
  Scene_Battle.prototype.createCancelButton = function() {
    Scene_Battle_createCancelButton.call(this);
    this._cancelButton.y = Graphics.boxHeight - this._partyCommandWindow.height - this._cancelButton.height - 4;
    this._cancelButton.x = this._partyCommandWindow.x;
  }

  Scene_Base.prototype.isRightInputMode = function() {
    return false;
  };

  Scene_Base.prototype.isBottomHelpMode = function() {
    return false;
  };

})();
