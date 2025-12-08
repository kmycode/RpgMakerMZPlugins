//=============================================================================
// RPG Maker MZ - InitilizeTp
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 戦闘開始時、TPの値を特定の数値にする
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 戦闘開始時、TPの値を特定の数値にします。。
 * 
 * 【使い方】
 * 戦闘開始時のTPを、VariableIdに指定した変数の値に設定します。
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param VariableId
 * @text 変数番号
 * @desc 戦闘開始時のTPは、指定した番号の変数に設定されている数値になります。
 * @type variable
 * @default 0
 */

(() => {
  const PLUGIN_NAME = 'InitilizeTp';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const variableId = parseInt(params.VariableId);

  const Game_Battler_initTp = Game_Battler.prototype.initTp;
  Game_Battler.prototype.initTp = function() {
    if (variableId) {
      const tp = $gameVariables.value(variableId);
      this.setTp(tp);
    } else {
      Game_Battler_initTp.apply(this);
    }
  }

  // 戦闘でダメージを受けた時にTPが勝手に増えないようにする
  Game_Battler.prototype.chargeTpByDamage = function(/* damageRate */) {
  };
})();
