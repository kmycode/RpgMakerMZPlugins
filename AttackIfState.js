//=============================================================================
// RPG Maker MZ - AttackIfState
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 特定のステートがある敵のみに攻撃する／特定のステートがある敵には攻撃しない
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help エネミーの攻撃対象決定条件にステートを追加します
 * スキル使用相手は、敵・味方両対応です
 * なおアクター（主人公パーティー）には適用されません
 * 
 * 【破壊】
 * 以下のメソッドを破壊するため、このプラグインの実行順序を上位に移動することをおすすめします
 * いずれも、エネミーのスキル（攻撃防御含む）利用時に破壊します。パーティーメンバーの時は元々のメソッドが呼び出されます
 *   Game_Action.targetsForOpponents
 *   Game_Action.targetsForFriends
 * また、上記メソッドは当プラグインが独自に作成したクラスのインスタンスを別のメソッドに渡します。
 * 以下のメソッドを利用する他のプラグインの実装内容によっては、正常に動作しなくなる可能性があります
 *   Game_Action.randomTargets
 *   Game_Action.targetsForAlive
 *   Game_Action.targetsForDead
 *   Game_Action.targetsForDeadAndAlive
 * 
 * 【使い方】
 * スキルのメモに以下を記載
 *   <ifState:10>    --- ID:10のステートがある敵に攻撃する
 *   <ifNotState:10> --- ID:10のステートがない敵に攻撃する
 *   <ifArmor:10>    --- ID:10の防具がある敵に攻撃する
 *   <ifNotArmor:10> --- ID:10の防具がない敵に攻撃する
 * 対象がいない場合はそのまま別の攻撃をします
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'AttackIfState';
  const params = PluginManager.parameters(PLUGIN_NAME);

  // ---------------------------------------------
  // 独自に定義するユニットクラス
  // ---------------------------------------------

  function PartialUnit() {
    this.initialize(...arguments);
    this._members = [];
  }

  PartialUnit.prototype = Object.create(Game_Unit.prototype);
  PartialUnit.prototype.constructor = PartialUnit;

  PartialUnit.prototype.setMembers = function(members) {
    this._members = members;
  }

  PartialUnit.prototype.members = function() {
    return this._members;
  }

  // ---------------------------------------------
  // ユニットからスキル使用可能なターゲットを絞り出す
  // ---------------------------------------------

  const filterSkillTargets = function(unit, skill) {
    let targetMembers = unit.aliveMembers();

    if (skill.meta) {
      const { ifState, ifNotState, ifArmor, ifNotArmor } = skill.meta;

      if (ifState) {
        const skillId = parseInt(ifState);
        targetMembers = targetMembers.filter((member) => member.states().some((state) => state.id === skillId));
      }
      if (ifNotState) {
        const skillId = parseInt(ifNotState);
        targetMembers = targetMembers.filter((member) => !member.states().some((state) => state.id === skillId));
      }
      if (ifArmor) {
        const armorId = parseInt(ifArmor);
        targetMembers = targetMembers.filter((member) => member.hasArmor($dataArmors[armorId]));
      }
      if (ifNotArmor) {
        const armorId = parseInt(ifNotArmor);
        targetMembers = targetMembers.filter((member) => !member.hasArmor($dataArmors[armorId]));
      }
    }

    return targetMembers;
  };

  // ---------------------------------------------
  // スキルを使う前に、このスキルを使う相手がいるか調べる部分
  // ---------------------------------------------

  const Game_BattlerBase_canUse = Game_BattlerBase.prototype.canUse;
  Game_BattlerBase.prototype.canUse = function(item) {
    if (this.isEnemy() && DataManager.isSkill(item)) {
      if (filterSkillTargets(this.opponentsUnit(), item).length === 0) {
        return false;
      }
    }

    return Game_BattlerBase_canUse.call(this, item);
  };

  // ---------------------------------------------
  // スキルを使った後に、使用するターゲットを選ぶ部分
  // ---------------------------------------------

  const Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
  Game_Action.prototype.targetsForOpponents = function() {
    if (this.subject().isActor() || !this.isSkill()) {
      return Game_Action_targetsForOpponents.call(this);
    }

    const targetMembers = filterSkillTargets(this.opponentsUnit(), this.item());
    const unit = new PartialUnit();
    unit.setMembers(targetMembers);

    if (this.isForRandom()) {
        return this.randomTargets(unit);
    } else {
        return this.targetsForAlive(unit);
    }
  };

  const Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
  Game_Action.prototype.targetsForFriends = function() {
    if (this.subject().isActor() || !this.isSkill()) {
      return Game_Action_targetsForFriends.call(this);
    }

    const targetMembers = filterSkillTargets(this.friendsUnit(), this.item());
    const unit = new PartialUnit();
    unit.setMembers(targetMembers);

    if (this.isForUser()) {
        return [this.subject()];
    } else if (this.isForDeadFriend()) {
        return this.targetsForDead(unit);
    } else if (this.isForAliveFriend()) {
        return this.targetsForAlive(unit);
    } else {
        return this.targetsForDeadAndAlive(unit);
    }
  };
})();
