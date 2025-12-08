//=============================================================================
// RPG Maker MZ - MapEventTileset
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップ上のイベントが移動する時に適用するタイルセットを指定します
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help マップ上のイベントが移動する時に適用するタイルセットを指定します
 * 
 * 例えば、マップ上のキャラクターには移動できない場所に主人公が移動できるようにしたい場合
 * 単にタイルセットをいじるだけでは、マップ上のキャラもそこに移動できてしまいます
 * そうならないようにします
 * 
 * 【使い方】
 * マップ上のイベントのメモに以下を設定します。
 *   <tileset:3> --- 3はタイルセットのID
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'MapEventTileset';
  const params = PluginManager.parameters(PLUGIN_NAME);

  let overrideTilesetId = undefined;

  const Game_CharacterBase_isMapPassable = Game_CharacterBase.prototype.isMapPassable;
  Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
    if (this instanceof Game_Event) {
      const eventTilesetId = this.event().meta?.tileset;
      if (eventTilesetId) {
        overrideTilesetId = parseInt(eventTilesetId);
      }
    }

    const result = Game_CharacterBase_isMapPassable.call(this, x, y, d);

    overrideTilesetId = undefined;

    return result;
  };

  const Game_Map_tileset = Game_Map.prototype.tileset;
  Game_Map.prototype.tileset = function() {
    if (!overrideTilesetId) {
      return Game_Map_tileset.call(this);
    }
    return $dataTilesets[overrideTilesetId];
  };
})();
