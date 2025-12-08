//=============================================================================
// RPG Maker MZ - ChangePassable
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップで通行可能なタイルの判定条件を変更する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help このタイルの判定条件を変更します。
 *   ・ある座標に「通行できないタイルが１つでもあった場合」に、そこは通れなくなります
 *     （デフォルトでは、「一番上のタイルが通行可能である場合」になります。仕様変更にご注意ください
 *       マップのメモに <checkPassage:original> を追加することで、そのマップだけ元仕様に戻ります）
 *   ・<passage:original> をメモに追加することで、イベントの通行可能設定がタイルセット設定よりも優先されます
 * 
 * 【破壊】
 * このプラグインは以下のメソッドを破壊します。実行順位で上位に移動することをおすすめします
 *   Game_Map.prototype.checkPassage
 * 
 * 【使い方】
 * このプラグインを有効にするだけ
 * 
 * イベントのメモに <passage:override> を追加することで、イベントのプライオリティがタイルセットの設定よりも優先されます。
 * 例えばプライオリティを「通常キャラと同じ」以外に設定した時に、そこを通行できるようになります
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'ChangePassable';
  const params = PluginManager.parameters(PLUGIN_NAME);

  Game_CharacterBase.prototype.isPassablePriority = function() {
    return this._priorityType !== 1 && this.event()?.meta?.passage === 'override';
  };

  Game_Map.prototype.checkPassageEvent = function(x, y) {
    return this.eventsXy(x, y)
      .map((event) => event.isPassablePriority())
      .some((boolValue) => boolValue);
  };

  // 破壊
  const Game_Map_checkPassage = Game_Map.prototype.checkPassage;
  Game_Map.prototype.checkPassage = function(x, y, bit) {
    if ($dataMap?.meta?.checkPassage === 'original') {
      return Game_Map_checkPassage.call(this, x, y, bit);
    }

    if (this.checkPassageEvent(x, y)) {
      return true;
    }

    const flags = this.tilesetFlags();
    const tiles = this.allTiles(x, y);
    let anyPassable = false;
    for (const tile of tiles) {
      const flag = flags[tile];
      if ((flag & 0x10) !== 0) {
        // [*] No effect on passage
        continue;
      }
      if ((flag & bit) === 0) {
        // [o] Passable
        anyPassable = true;
        continue;
      }
      if ((flag & bit) === bit) {
        // [x] Impassable
        return false;
      }
    }
    return anyPassable;
  };
})();
