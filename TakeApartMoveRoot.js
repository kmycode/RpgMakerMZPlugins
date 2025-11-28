//=============================================================================
// RPG Maker MZ - TakeApartMoveRoot
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 移動ルートを指定コマンドを途中で中断できるようにする
 * @author 雪あすか
 * 
 * 
 * @help このゲーム向けの調整です。メッセージの色の自動変更など
 * 
 * @command stopPlayerMove
 * @text 主人公の移動を停止
 * @desc 並列処理などで主人公が移動している場合、その移動を強制的に停止します。
 * 
 * 【利用規約】
 * WTFPL
 */

(() => {
  const PLUGIN_NAME = "TakeApartMoveRoot";

  PluginManager.registerCommand(PLUGIN_NAME, "stopPlayerMove", args => {
    $gamePlayer.processRouteEnd();
  });
})();
