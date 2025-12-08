//=============================================================================
// RPG Maker MZ - RandomWalkOnArea
// Version: 1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ランダムで移動する時、指定された範囲内を歩くように
 * @author 雪あすか
 * 
 * 
 * @help マップ編集で、タイルの R タブを選択して埋めた番号のエリアを、
 * マップイベントのメモに <area:1> で指定
 * 
 * <area:1> --- リージョン番号を指定で、そのリージョンの場所のみを移動します
 * <area:auto> --- イベントが配置されたマスに指定されているリージョン番号について適用します
 * <area:a3> --- 数字の前にaをつけると、元々の位置を中心にした 3x2+1=7 マス四方の四角形の範囲内で動きます（リージョンは見ません）
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 */

(() => {
  const PLUGIN_NAME = "RandomWalkOnArea";

  const Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
  Game_Event.prototype.canPass = function(x, y, d) {
    const result = Game_CharacterBase_canPass.call(this, x, y, d);

    if (result && this.event().meta?.area) {
      const x2 = $gameMap.roundXWithDirection(x, d);
      const y2 = $gameMap.roundYWithDirection(y, d);

      const regionId = $gameMap.regionId(x2, y2);
      let area = this.event().meta.area;
      if (area === 'auto') {
        area = $gameMap.regionId(this.event().x, this.event().y);
        if (!area) return result;
      } else if (area.startsWith('a')) {
        const length = parseInt(area.slice(1));
        return (
          x2 >= this.event().x - length &&
          x2 <= this.event().x + length &&
          y2 >= this.event().y - length &&
          y2 <= this.event().y + length
        );
      }

      return regionId === parseInt(area);
    }

    return result;
  }
})();
