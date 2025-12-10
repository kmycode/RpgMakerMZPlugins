//=============================================================================
// RPG Maker MZ - ResetSelfSwitches
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 全てのマップの特定のセルフスイッチをリセットする
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 全てのセルフスイッチを任意のタイミングでリセットする
 * 
 * 【使い方】
 * プラグイン設定で変数IDを指定。その変数の中身を変更したタイミングで、全てのマップの全てのイベントのセルフスイッチをOFFにする
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param VariableId
 * @text 変数番号
 * @desc この変数の変更がトリガーになります
 * @type variable
 * @default 0
 * 
 * @param SwitchType
 * @text 変更するスイッチ
 * @desc このスイッチがOFFになります
 * @type select
 * @option A
 * @value A
 * @option B
 * @value B
 * @option C
 * @value C
 * @option D
 * @value D
 * @default D
 */

(() => {
  const PLUGIN_NAME = 'ResetSelfSwitches';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const triggerVariableId = parseInt(params.VariableId);
  const switchType = params.SwitchType;

  const Game_Variables_setValue = Game_Variables.prototype.setValue;
  Game_Variables.prototype.setValue = function(variableId, value) {
    if (variableId !== triggerVariableId) {
      return Game_Variables_setValue.call(this, variableId, value);
    }

    const oldValue = this.value(variableId);
    Game_Variables_setValue.call(this, variableId, value);

    if (oldValue !== value) {
      $gameSelfSwitches.resetAllSwitchesOfType(switchType);
    }
  }

  Game_SelfSwitches.prototype.resetAllSwitchesOfType = function(type) {
    const keys = Object.keys(this._data).filter((key) => Array.isArray(key) && key[2] === type);
    for (const key of keys) {
      delete this._data[key];
    }

    this.onChange();
  }
})();
