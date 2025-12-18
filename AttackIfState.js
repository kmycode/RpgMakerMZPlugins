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
 * スキルのメモに以下を記載。なお味方に対するスキルは以下を適宜読み替えること
 *   <ifState:10>    --- ID:10のステートがある敵に攻撃する
 *   <ifNotState:10> --- ID:10のステートがない敵に攻撃する
 *   <ifArmor:10>    --- ID:10の防具がある敵に攻撃する
 *   <ifNotArmor:10> --- ID:10の防具がない敵に攻撃する
 *   <ifHurt:50>     --- HPが50%未満の敵に攻撃する
 *   <ifNotSelf:1>   --- 自分を対象から除外する
 * 対象がいない場合はそのまま別の攻撃をします
 * 
 * エネミーのメモに以下を記載（ifState以外も上記と同じ記載が可能）
 *   <ifState:5,10> --- このエネミーはID:5のスキルについてID:10のステートがある敵に攻撃する
 *                      スキルに設定された条件も一緒に満たす必要がある
 * これによってエネミー個別のスキル使用条件を設定可能です
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
  // スキルを使う前に、このスキルを使う相手がいるか調べる部分
  // ---------------------------------------------

  const Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
  Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
    if (this.isEnemy()) {
      if (this.filterSkillTargets(skill).length === 0) {
        return false;
      }
    }

    return Game_BattlerBase_meetsSkillConditions.call(this, skill);
  };

  function extractEnemyMetaDataForSkill(skill, note) {
    if (!note) return {};

    const regExp = new RegExp(`<([^:]+):${skill.id},([^>]*)>`, 'g');
    const values = {};

    let match;
    while (match = regExp.exec(note)) {
      values[match[1]] = match[2];
    }
    return values;
  }

  Game_BattlerBase.prototype.filterSkillTargets = function(skill, unit) {
    if (skill) {
      unit ??= this.isForFriend(skill) ? this.friendsUnit() : this.opponentsUnit();
    } else {
      return $gameParty.aliveMembers();
    }

    let targetMembers = unit.aliveMembers();
    if (!this.isEnemy()) return targetMembers;

    const checkMeta = (meta) => {
      if (!meta) return;

      const { ifState, ifNotState, ifArmor, ifNotArmor, ifHurt, ifNotSelf } = meta;

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
      if (ifHurt) {
        const rate = parseInt(ifHurt) / 100;
        targetMembers = targetMembers.filter((member) => member.hp / member.mhp < rate);
      }
      if (ifNotSelf) {
        targetMembers = targetMembers.filter((member) => member !== this);
      }
    };

    const enemyMetas = extractEnemyMetaDataForSkill(skill, this.enemy()?.note);

    checkMeta(skill.meta);
    checkMeta(enemyMetas);

    return targetMembers;
  }

  Game_BattlerBase.prototype.checkItemScope = function(item, list) {
    return list.includes(item.scope);
  };

  Game_BattlerBase.prototype.isForFriend = function(item) {
    return this.checkItemScope(item, [7, 8, 9, 10, 11, 12, 13, 14]);
  };

  // ---------------------------------------------
  // スキルを使った後に、使用するターゲットを選ぶ部分
  // ---------------------------------------------

  const Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
  Game_Action.prototype.targetsForOpponents = function() {
    if (this.subject().isActor() || !this.isSkill()) {
      return Game_Action_targetsForOpponents.call(this);
    }

    const targetMembers = this.subject().filterSkillTargets(this.item(), this.opponentsUnit());
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

    const targetMembers = this.subject().filterSkillTargets(this.item(), this.friendsUnit());
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

  // ---------------------------------------------
  // 現状、エネミーの行動はこちら側がコマンドを入力する前に決定する模様
  // エネミーの行動直前に条件が変わる可能性があるので、
  // あらためてコマンド選択するようにする
  // （デフォルトの仕様でもエネミー行動直前にスキルの前提条件が変わる可能性はあるわけで
  //   それは制限事項なんでしょうか？）
  // ---------------------------------------------

  const BattleManager_getNextSubject = BattleManager.getNextSubject;
  BattleManager.getNextSubject = function() {
    const battler = BattleManager_getNextSubject.call(this);
    if (battler?.isEnemy()) {
      $gameTroop._turnCount--;
      battler.makeActions();
      $gameTroop._turnCount++;
    }
    return battler;
  }
})();
