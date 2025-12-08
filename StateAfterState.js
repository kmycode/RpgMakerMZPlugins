//=============================================================================
// RPG Maker MZ - StateAfterState
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ステート取り除かれた直後に新たなステートを付与する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help ステートを取り除かれた直後に、後続のステートを付与します。
 * 
 * 【使い方】
 * ステートのメモに以下を記載
 *   <afterState:10> --- このステートが解除された直後に常にID:10のステートを付与
 *   <afterState:10,0.7> --- このステートが解除された直後に70%の確率でID:10のステートを付与
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'StateAfterState';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Battler_removeState = Game_Battler.prototype.removeState;
  Game_Battler.prototype.removeState = function(stateId) {
    Game_Battler_removeState.call(this, stateId);

    const state = $dataStates[stateId];
    if (!state?.meta?.afterState) return;

    const parameters = state.meta.afterState.split(',');
    const rate = parameters.length >= 2 ? parseFloat(parameters[1]) : 1;
    const newStateId = parseInt(parameters[0]);

    if (rate >= 1 || Math.random() <= rate) {
      this.addState(newStateId);
    }
  };
})();
