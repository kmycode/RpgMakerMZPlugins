//=============================================================================
// RPG Maker MZ - ReplaceMap
//=============================================================================

/*:
 * @target MZ
 * @plugindesc スイッチに応じて、マップを適宜置き換える
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help スイッチに応じて、マップを置き換えます
 * 
 * 【破壊】
 * 以下メソッドを破壊します。他プラグインとの競合にご注意ください
 *   Game_Map.prototype.data
 *   Game_Map.prototype.tileId
 * ※$dataReplacedMapとか不要だし上記メソッドを別に破壊しなくてもいいと思うのですが、
 *   このプラグインを使ったシステムの制作を中止したこともあり動作確認ができないので、各自適当に改良してください
 * 
 * 【使い方】
 * ルートマップ、置き換え対象のマップ（複数）を用意します
 * 全てのマップは同じ横幅・高さでなければいけません
 * 
 * 次に、ルートマップのメモに以下を指定
 *   <replaceMap:1,2> --- スイッチ 2 がONなら ID:1 のマップに置き換えます（複数指定可能）
 *                        複数指定した場合、後に指定したものが優先されます
 *   <replaceMap:1,2,3> --- スイッチ 2,3 がどちらもONなら ID:1 のマップに置き換えられます
 *                          スイッチは2つといわずいくつでも指定可能で、全てONである必要があります
 *   <replaceMap:1>   --- 無条件で ID:1 のマップに置き換えます
 * 
 *   <replaceMapArea:1,10,20,30,40,5> --- 座標(10,20)から座標(30,40)までの範囲を ID:1 のマップから
 *                                        スイッチ 5 がONの場合に限りコピー
 *                                        （スイッチ無し、複数指定も可能）
 * 
 * エリア置換の場合、指定したコピー元マップの指定した矩形内でリージョン255が設定されている部分はコピーしません
 * 矩形以外の形状をコピーしたい場合に活用してください
 * 
 * イベントはルートマップのものが使われます。対象マップのイベントは全てなかったことにされるのでご注意を
 * 
 * P.S. 主人公がこの置き換えマップの設定が適用されたマップに移動したい場合、移動先はルートマップを指定してください
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command requestReloadMapWhenNextTransfer
 * @text 次回移動時にマップリロードを要求
 * @desc 次回移動時にマップリロードを強制的に行います。同じマップへ移動する時に有効です。移動コマンドの直前に呼び出します
 * 
 * 
 * @command moveSamePositionWithReload
 * @text リロードとともに全く同じ場所へ移動
 * @desc マップリロードを強制的に行ったうえで、全く同じ場所に移動します
 */

$dataReplacedMap = null;

(() => {
  const PLUGIN_NAME = 'ReplaceMap';
  const params = PluginManager.parameters(PLUGIN_NAME);

  function extractMultipleMetaData(key, note) {
    if (!note) return [];

    const regExp = new RegExp(`<${key}:([^>]*)>`, 'g');
    const values = [];

    let match;
    while (match = regExp.exec(note)) {
      values.push(match[1]);
    }
    return values;
  }

  function loadMap(mapId, name) {
    const filename = "Map%1.json".format(mapId.padZero(3));
    this.loadDataFile(name, filename);
  }

  let mapAreas = [];

  const DataManager_onXhrLoad = DataManager.onXhrLoad;
  DataManager.onXhrLoad = function(xhr, name, src, url) {
    DataManager_onXhrLoad.call(this, xhr, name, src, url);

    if (name === '$dataMap') {
      let hit = false;
      $dataReplacedMap = null;
      mapAreas = [];

      if ($dataMap.meta.replaceMap || $dataMap.meta.replaceMapArea) {
        const replaceAreas = extractMultipleMetaData('replaceMapArea', $dataMap.note).reverse();
        for (const replaceArea of replaceAreas) {
          const [ mapId, x1, y1, x2, y2, ...switchIds ] = replaceArea.split(',').map(str => parseInt(str));
          if (mapId > 0 && x2 > x1 && y2 > y1 && (switchIds.length === 0 || !switchIds.some((switchId) => !$gameSwitches.value(switchId)))) {
            // Load map of area
            mapAreas.push({ mapId, data: null, copied: false, x1, y1, x2, y2, });
            loadMap.call(this, mapId, `$mapArea__${mapId}`);
          }
        }

        const replaceMaps = extractMultipleMetaData('replaceMap', $dataMap.note).reverse();
        for (const replaceMap of replaceMaps) {
          const [ mapId, ...switchIds ] = replaceMap.split(',').map(str => parseInt(str));
          if (mapId > 0 && (switchIds.length === 0 || !switchIds.some((switchId) => !$gameSwitches.value(switchId)))) {
            // Load map
            loadMap.call(this, mapId, '$dataReplacedMap');
            hit = true;
            break;
          }
        }
      }

      if (!hit) {
        $dataReplacedMap = $dataMap;
      }
    } else if (name.startsWith('$mapArea__')) {
      const mapId = parseInt(name.split('__')[1]);
      const targetAreas = mapAreas.filter((area) => area.mapId === mapId);
      for (const area of targetAreas) {
        area.data = window[name];
      }
      window[name] = undefined;
      this.replaceMapArea(mapId);
    } else if (name === '$dataReplacedMap') {
      for (const mapId of mapAreas.map((area) => area.mapId)) {
        this.replaceMapArea(mapId);
      }
    }
  }

  DataManager.replaceMapArea = function(mapId) {
    if (!$dataReplacedMap) return;

    const width = $dataReplacedMap.width;
    const height = $dataReplacedMap.height;
    
    const targetAreas = mapAreas.filter((area) => area.mapId === mapId);
    for (const area of targetAreas) {
      const { data, x1, y1, x2, y2, copied } = area;
      if (copied || !data) continue;

      for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
          const regionIndex = (5 * height + y) * width + x;
          if (data.data[regionIndex] === 255) continue;
          for (let z = 0; z <= 4; z++) {
            // z 0-3: マップタイル
            // z 4  : 影
            // z 5  : リージョン
            const index = (z * height + y) * width + x;
            $dataReplacedMap.data[index] = data.data[index];
          }
        }
      }

      area.copied = true;
    }
  }

  const DataManager_makeEmptyMap = DataManager.makeEmptyMap;
  DataManager.makeEmptyMap = function() {
    DataManager_makeEmptyMap.call(this);
    $dataReplacedMap = $dataMap;
  }

  const DataManager_loadMapData = DataManager.loadMapData;
  DataManager.loadMapData = function(mapId) {
    $dataReplacedMap = null;
    mapAreas = [];
    DataManager_loadMapData.call(this, mapId);
  }

  const DataManager_isMapLoaded = DataManager.isMapLoaded;
  DataManager.isMapLoaded = function() {
    return DataManager_isMapLoaded.call(this) &&
      !!$dataReplacedMap &&
      !mapAreas.some((area) => !area.copied);
  }

  // 破壊
  Game_Map.prototype.data = function() {
    return $dataReplacedMap.data;
  }

  // 破壊
  Game_Map.prototype.tileId = function(x, y, z) {
    const width = $dataMap.width;
    const height = $dataMap.height;
    return $dataReplacedMap.data[(z * height + y) * width + x] || 0;
  };

  PluginManager.registerCommand(PLUGIN_NAME, "requestReloadMapWhenNextTransfer", args => {
    $gamePlayer.requestMapReload();
  });

  PluginManager.registerCommand(PLUGIN_NAME, "moveSamePositionWithReload", args => {
    $gamePlayer.requestMapReload();
    $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2);
  });

})();
