//=============================================================================
// RPG Maker MZ - StateFailedMessage
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 攻撃後、特定のステートが付与され「なかった」場合にメッセージ表示
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 攻撃後、相手に特定のステートが付与されなかった場合にバトルログにメッセージを表示します
 * 
 * 【使い方】
 * スキル、ステートのいずれかのメモにメッセージを記載します。
 * 両方に記載している場合は、スキルに記載のメッセージが優先されます
 * 
 * スキルのメモに以下を記載
 *   <stateFailedMessage:10,メッセージ> --- ID:10のステートが付与されていない場合にメッセージを追加する
 * 
 * ステートのメモに以下を記載
 *   <stateFailedMessage:メッセージ> --- 攻撃中のスキル使用によってこのステートの付与に失敗した場合にメッセージを追加する
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'StateFailedMessage';
  const params = PluginManager.parameters(PLUGIN_NAME);

  // ---------------------------------------------

  const skillEffectStateMessages = (skill) => {
    return skill.effects
      .filter((effect) => effect.code === Game_Action.EFFECT_ADD_STATE)
      .map((effect) => ({
        stateId: effect.dataId,
        message: $dataStates[effect.dataId]?.meta?.stateFailedMessage,
      }))
      .filter((msg) => msg.message)
      .map((msg) => `${msg.stateId},${msg.message}`);
  }

  const Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
  Window_BattleLog.prototype.displayActionResults = function(subject, target) {
    Window_BattleLog_displayActionResults.call(this, subject, target);
    const baseLineMethod = this._methods.pop();

    const result = target.result();
    const action = BattleManager._action;
    const item = action.item();
    if (!action || !item || !result.used || !result.isHit() || !action.isSkill()) {
      if (baseLineMethod) {
        this._methods.push(baseLineMethod);
      }
      return;
    }

    const message = item.meta.stateFailedMessage ?? skillEffectStateMessages(item)[0];

    if (message) {
      const parameters = message.split(',');
      const stateId = parseInt(parameters[0]);

      if (!target.states().some((state) => state.id === stateId)) {
        this.push('addText', parameters.slice(1).join(','));
      }
    }

    this._methods.push(baseLineMethod);
  }
})();
