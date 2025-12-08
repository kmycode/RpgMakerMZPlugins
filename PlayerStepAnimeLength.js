//=============================================================================
// RPG Maker MZ - PlayerStepAnimeLength
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 主人公の歩行アニメーション間隔変更
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 主人公の歩行アニメーションの間隔を設定します。
 * 
 * 【必須】
 * MapEventPageMetaプラグインの機能を利用します
 * 
 * 【使い方】
 * Value数値が大きいほどアニメーションが長くなります
 * 
 * マップイベントのメモに <walkSpeed:3> と入力すると、マップイベントにも設定できます
 * マップイベントの各ページ最初の注釈に <walkSpeed:3> と入力することで、そのページが有効の場合にのみ設定適用します
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param ValueVariableId
 * @text 間隔
 * @desc この変数に格納された値が大きいほどアニメーションがゆっくりになります。デフォルトは 3。0は3と同じ
 * @type variable
 * @default 3
 */

(() => {
  const PLUGIN_NAME = 'PlayerStepAnimeLength';
  const params = PluginManager.parameters(PLUGIN_NAME);

  let valueVariableId = parseInt(params.ValueVariableId);

  const Game_CharacterBase_prototype_animationWait = Game_CharacterBase.prototype.animationWait;
  Game_CharacterBase.prototype.animationWait = function() {
    if (this instanceof Game_Player && valueVariableId) {
      const value = $gameVariables.value(valueVariableId) || 3;
      return (9 - this.realMoveSpeed()) * value;
    } else if (this instanceof Game_Event) {
      // 町の人
      const walkSpeed = this.pageMeta?.walkSpeed || this.event()?.meta?.walkSpeed;
      if (walkSpeed) {
        const walkSpeedNumber = parseInt(walkSpeed);
        return (9 - this.realMoveSpeed()) * walkSpeedNumber;
      }
    }
    return Game_CharacterBase_prototype_animationWait.apply(this);
  };
})();
