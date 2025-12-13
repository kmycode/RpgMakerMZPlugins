//=============================================================================
// RPG Maker MZ - DropItemLimit
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ドロップアイテムの数に上限を設ける
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help エネミーを倒した時にドロップされるアイテムの数に、マップごとまたはエネミーごとの上限を設けます
 * 
 * 【使い方】
 * エネミーごとに上限を設ける場合、アイテム・武器・防具のメモに以下を設定
 *   <dropLimitPerEnemy:10,3> --- 上限10個。対象エネミーはID:3
 *   <dropLimitPerEnemy:10,3-5-7> --- 上限10個。対象エネミーはID:3、5、7
 * 
 * マップごとに上限を設ける場合、アイテム・武器・防具のメモに以下を設定
 *   <dropLimitPerMap:10,4> --- 上限10個。対象MAPはID:4
 *   <dropLimitPerMap:10,4-5-6> --- 上限10個。対象MAPはID:4、5、6
 *   <dropLimitPerMap:10,4,d> --- 上限10個。対象MAPはID:4とその全ての子孫マップ (descendants)
 *   <blockDroppingOtherMaps:true> --- 上記で指定したマップ以外ではドロップ不可
 *                                     （指定しなければ他のMAPでは制限なしでドロップされる）
 * 
 * dropLimitPerEnemy、dropLimitPerMapは１つのアイテムに複数指定が可能です。
 * 両方指定した場合、両方の上限を超過していないかチェックします
 * 
 * 【注意点】
 * 実装上の都合で、本来「BattleManager.gainDropItems」メソッド内に記述すべき部分を
 * 「Game_Enemy.prototype.makeDropItems」内にまとめて書いてしまっています。
 * そのため、他のプラグインの実装次第で（特に戦闘報酬を計算した後にあげるかあげないか判定したりするもの）
 * うまく動かない場合があります
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param VariableId
 * @text 変数番号
 * @desc 戦闘開始時のTPは、指定した番号の変数に設定されている数値になります。
 * @type variable
 * @default 0
 */

(() => {
  const PLUGIN_NAME = 'DropItemLimit';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Party_initialize = Game_Party.prototype.initialize;
  Game_Party.prototype.initialize = function() {
    Game_Party_initialize.call(this);

    // $gamePartyオブジェクトのプロパティはセーブデータに含まれる
    this._dropItemHistoryOfEnemies = {};
    this._dropItemHistoryOfMaps = {};
  }

  Game_Party.prototype.allDropItemHistoryOfEnemies = function() {
    return this._dropItemHistoryOfEnemies ?? {};
  }

  Game_Party.prototype.allDropItemHistoryOfMaps = function() {
    return this._dropItemHistoryOfMaps ?? {};
  }

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

  Game_Party.prototype.countCurrentDroppedItemsPerMaps = function(mapIds, itemId) {
    const history = this.allDropItemHistoryOfMaps();
    return mapIds.reduce((sum, mapId) => {
      if (!history[mapId]) return sum;
      return sum + (history[mapId][itemId] ?? 0);
    }, 0);
  }

  Game_Party.prototype.countCurrentDroppedItemsPerEnemies = function(enemyIds, itemId) {
    const history = this.allDropItemHistoryOfEnemies();
    return enemyIds.reduce((sum, enemyId) => {
      if (!history[enemyId]) return sum;
      return sum + (history[enemyId][itemId] ?? 0);
    }, 0);
  }

  Game_Party.prototype.increaseDropItemHistory = function(itemId, enemyId) {
    this._dropItemHistoryOfMaps ??= {};
    this._dropItemHistoryOfEnemies ??= {};
    const mapId = $gameMap.mapId();

    this._dropItemHistoryOfMaps[mapId] ??= {};
    this._dropItemHistoryOfMaps[mapId][itemId] =
      (this._dropItemHistoryOfMaps[mapId][itemId] ?? 0) + 1;

    this._dropItemHistoryOfEnemies[enemyId] ??= {};
    this._dropItemHistoryOfEnemies[enemyId][itemId] =
      (this._dropItemHistoryOfEnemies[enemyId][itemId] ?? 0) + 1;

    console.dir(this._dropItemHistoryOfMaps)
  }

  function parseSetting(setting) {
    const parameters = setting.split(',');
    const targetIds = parameters[1].split('-').map((id) => parseInt(id));
    const limit = parseInt(parameters[0]);
    return { targetIds, limit, options: parameters[2] ?? '' };
  };

  function getDescendantMaps(mapId) {
    if (!$dataMapInfos) return [mapId];

    const getChildMaps = (mapId) => {
      return $dataMapInfos.filter((info) => info?.parentId === mapId).map((info) => info.id);
    }

    return getChildMaps(mapId).map((childId) => getDescendantMaps(childId)).flat().concat(mapId);
  }

  Game_Party.prototype.dropItemStockOfMap = function(item) {
    if (item?.meta?.dropLimitPerMap) {
      const dropLimitPerMaps = extractMultipleMetaData('dropLimitPerMap', item.note);
      for (const setting of dropLimitPerMaps.map((line) => parseSetting(line))) {
        const { targetIds: targetMapsRaw, limit, options } = setting;
        const targetMaps = options.includes('d')
          ? targetMapsRaw.map((mapId) => getDescendantMaps(mapId)).flat()
          : targetMapsRaw;
        if (targetMaps.includes($gameMap.mapId())) {
          const current = this.countCurrentDroppedItemsPerMaps(targetMaps, item.id);
          console.log(`dropitem: current = ${current}, limit = ${limit}`);
          return limit - current;
        }
      }

      if (item.meta.blockDroppingOtherMaps) {
        return 0;
      }
    }

    return 9999;
  }

  Game_Party.prototype.reachDropItemLimitOfMap = function(item) {
    return this.dropItemStockOfMap(item) <= 0;
  };

  Game_Party.prototype.dropItemStockOfEnemy = function(item, enemyId) {
    if (item?.meta?.dropLimitPerEnemy) {
      const dropLimitPerEnemies = extractMultipleMetaData('dropLimitPerEnemy', item.note);
      for (const setting of dropLimitPerEnemies.map((line) => parseSetting(line))) {
        const { targetIds: targetEnemies, limit } = setting;
        if (targetEnemies.includes(enemyId)) {
          const current = this.countCurrentDroppedItemsPerEnemies(targetEnemies, enemyId);
          return limit - current;
        }
      }
    }

    return 9999;
  }

  Game_Party.prototype.reachDropItemLimitOfEnemy = function(item, enemyId) {
    return this.dropItemStockOfEnemy(item, enemyId) <= 0;
  }

  Game_Party.prototype.reachDropItemLimit = function(item, enemyId) {
    return this.reachDropItemLimitOfMap(item) || this.reachDropItemLimitOfEnemy(item, enemyId);
  };

  // 条件分岐からのスクリプト呼び出し用
  Game_Party.prototype.reachDropItemLimitOfMapByItemId = function(itemId) {
    const item = $dataItems[itemId];
    if (!item) return true;

    return this.reachDropItemLimitOfMap(item);
  };

  // 条件分岐からのスクリプト呼び出し用
  Game_Party.prototype.reachDropItemLimitOfEnemyByItemId = function(itemId, enemyId) {
    const item = $dataItems[itemId];
    if (!item) return true;

    return this.reachDropItemLimitOfEnemy(item, enemyId);
  };

  // 条件分岐や変数操作からのスクリプト呼び出し用
  Game_Party.prototype.dropItemStockOfMapByItemId = function(itemId) {
    const item = $dataItems[itemId];
    if (!item) return 9999;

    return this.dropItemStockOfMap(item);
  }
  
  // 条件分岐や変数操作からのスクリプト呼び出し用
  Game_Party.prototype.dropItemStockOfEnemyByItemId = function(itemId, enemyId) {
    const item = $dataItems[itemId];
    if (!item) return 9999;

    return this.dropItemStockOfEnemy(item, enemyId);
  }

  const Game_Enemy_makeDropItems = Game_Enemy.prototype.makeDropItems;
  Game_Enemy.prototype.makeDropItems = function() {
    const dropItems = Game_Enemy_makeDropItems.call(this);
    const result = [];
    for (const item of dropItems) {
      if (!$gameParty.reachDropItemLimit(item, this.enemyId())) {
        $gameParty.increaseDropItemHistory(item.id, this.enemyId());
        result.push(item);
      }
    }

    return result;
  };
})();
