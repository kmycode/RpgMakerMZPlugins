//=============================================================================
// RPG Maker MZ - DamageWithSkill
//=============================================================================

/*:
 * @target MZ
 * @plugindesc スキル使用時に、使用者にダメージを与える
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help スキルのメモに <damageHp:5> とすると、スキル使用時にHP=5のダメージを受けます
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'DamageWithSkill';

  Game_BattlerBase.prototype.skillHpCost = function(skill) {
    if (skill.meta?.damageHp) {
      return parseInt(skill.meta?.damageHp);
    }
    return 0;
  };

  const Game_BattlerBase_canPaySkillCost = Game_BattlerBase.prototype.canPaySkillCost;
  Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
    return (
      Game_BattlerBase_canPaySkillCost.call(this, skill) &&
      this._hp >= this.skillHpCost(skill)
    );
  };

  const Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
  Game_BattlerBase.prototype.paySkillCost = function(skill) {
    Game_BattlerBase_paySkillCost.call(this, skill);
    this._hp -= this.skillHpCost(skill);
  };

  const Window_BattleLog_displayAction = Window_BattleLog.prototype.displayAction;
  Window_BattleLog.prototype.displayAction = function(subject, item) {
    Window_BattleLog_displayAction.call(this, subject, item);
    if (DataManager.isSkill(item)) {
      const cost = item.meta?.damageHp;
      if (cost && parseInt(cost) > 0) {
        this.push('addText', `${subject.name()} はＨＰを ${cost} 消費した。`);
      }
    }
  }
})();
