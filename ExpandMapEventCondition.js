//=============================================================================
// RPG Maker MZ - ExpandMapEventCondition
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップイベントで、ページ選択条件を拡張する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help マップイベントで、ページ選択条件に複数の項目を追加します
 * 
 * 【必須】
 * このプラグインには MapEventPageMeta.js が別途必要です。一緒に登録しないとエラーが出ます（順番は問いません）
 * 
 * 【使い方】
 * 各ページの先頭の注釈に、以下を設定します（それぞれ１つのページに１つしか指定できません）
 *   <variableEq:5,10> --- ID:5の変数が10でなければならない
 *   <switchOff:5>     --- ID:5のスイッチがOffでなければならない
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'ExpandMapEventCondition';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Event_meetsConditions = Game_Event.prototype.meetsConditions;
  Game_Event.prototype.meetsConditions = function(page) {
    const result = Game_Event_meetsConditions.call(this, page);
    if (!result) return result;

    const meta = this.extractPageMeta(page);
    if (!meta) return result;

    const { variableEq, switchOff } = meta;
    if (variableEq) {
      const { variableId, value } = variableEq.split(',').map((v) => parseInt(v));
      if ($gameVariables.value(variableId) !== value) {
        return false;
      }
    }
    if (switchOff) {
      const switchId = parseInt(switchOff);
      if ($gameSwitches.value(switchId)) {
        return false;
      }
    }

    return result;
  }
})();
