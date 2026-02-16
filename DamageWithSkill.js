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
 * @help
 * スキルのメモに <damageHp:5> とすると、スキル使用時にHP=5のダメージを受けます
 * ステートのメモに <damageHp:5> とすると、以下の２つの条件を＜どちらも＞満たしている場合にダメージが加算されます
 *   ・使用するスキルにdamageHpが設定されている
 *   ・そのステートが有効である
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
    let damageHp = 0;

    if (skill.meta?.damageHp) {
      damageHp += parseInt(skill.meta?.damageHp);

      for (const state of this.states()) {
        if (state?.meta?.damageHp) {
          damageHp += parseInt(state.meta.damageHp);
        }
      }
    }

    return damageHp;
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
    if (this instanceof Game_Battler) {
      const cost = this.skillHpCost(skill);
      if (cost > 0) {
        this.gainHp(-cost);
        this.startDamagePopup();
      }
    } else {
      this._hp -= this.skillHpCost(skill);
    }
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
