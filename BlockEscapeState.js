//=============================================================================
// RPG Maker MZ - BlockEscapeState
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 特定のステートが有効になっている間、逃げられなくする
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 特定のステートが有効になっている間、逃げられなくする
 * 
 * 【使い方】
 * ステートのメモに <blockEscape> タグを設定します
 * 特定のエネミーに設定することもできます。この場合、このエネミーが退場するまで逃げられなくなります
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'BlockEscapeState';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const BattleManager_canEscape = BattleManager.canEscape;
  BattleManager.canEscape = function() {
    return BattleManager_canEscape.call(this) &&
      !$gameParty.aliveMembers().some((actor) => actor.states().some((state) => state.meta?.blockEscape)) &&
      !$gameTroop.aliveMembers().some((enemy) => enemy.enemy()?.meta?.blockEscape);
  };
})();
