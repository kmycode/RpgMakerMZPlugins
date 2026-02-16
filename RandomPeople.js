//=============================================================================
// RPG Maker MZ - RandomPeople
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 人間キャラを自動生成しマップ上に設置します
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 人間キャラを自動生成しマップ上に設置します。人混みを手っ取り早く作ります
 * 
 * 【使い方】
 * コマンドを呼び出します
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command appearPeople
 * @text 人を出現させる
 * 
 * @arg imageFileName
 * @text 出現する歩行グラフィック
 * @type file
 * @dir img/characters
 * 
 * @arg number
 * @text 出現人数
 * @type number
 * @default 1
 * 
 * @arg regionId
 * @text 出現範囲リージョンID
 * @type number
 * @default 1
 * 
 * @arg note
 * @text イベントに設定するノート。メタタグなど設定可能
 * @type multiline_string
 */

(() => {
  const PLUGIN_NAME = 'RandomPeople';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const variableId = parseInt(params.VariableId);

  Game_Map.prototype.addDynamicEvent = function(event) {
    this._events[event.event().id] = event;
  }

  function Game_RandomPersonEvent() {
    this.initialize(...arguments);
  }

  Game_RandomPersonEvent.prototype = Object.create(Game_Event.prototype);
  Game_RandomPersonEvent.prototype.constructor = Game_RandomPersonEvent;

  Game_RandomPersonEvent.prototype.initialize = function(mapObj, pluginOptions) {
    Game_Character.prototype.initialize.call(this);
    this._mapId = mapObj.mapId();
    this._eventData = this.generateData(mapObj, pluginOptions);
    this._eventId = this._eventData.id;
    this.locate(this.event().x, this.event().y);
    this.refresh();
  };
  
  Game_RandomPersonEvent.prototype.event = function() {
    return this._eventData;
  };

  Game_Map.prototype.getRegionCells = function(regionId) {
    const positions = [];

    for (let y = 0; y < this.height(); y++) {
      for (let x = 0; x < this.width(); x++) {
        if (this.tileId(x, y, 5) === regionId) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  };

  const extractMetadata = function(note) {
    const tmpObj = { note, meta: {} };
    DataManager.extractMetadata(tmpObj);

    return tmpObj.meta;
  }

  Game_RandomPersonEvent.prototype.generateData = function(mapObj, pluginOptions) {
    const { regionId, imageFileName, imageFileIndex, note } = pluginOptions;
    console.log(imageFileName)

    const id = mapObj.events().length === 0 ? 1 : Math.max(...mapObj.events().map((ev) => ev.eventId())) + 1;

    const regionCells = mapObj.getRegionCells(regionId)
      .filter((cell) => !mapObj.events().some((ev) => cell.x === ev.x && cell.y === ev.y));
    if (regionCells.length === 0) return;
    const { x, y } = regionCells[Math.randomInt(regionCells.length)];

    const meta = extractMetadata(note);

    const data = {
      id,
      name: 'Random generated event',
      note: '',
      meta,
      pages: [
        {
          conditions: {
            actorId: 1,
            actorValid: false,
            itemId: 1,
            itemValid: false,
            selfSwitchCh: 'A',
            selfSwitchValid: false,
            switch1Id: 1,
            switch1Valid: false,
            switch2Id: 1,
            switch2Valid: false,
            variableId: 1,
            variableValid: false,
            variableValue: 0
          },
          image: {
            tileId: 0,
            characterName: imageFileName,
            characterIndex: imageFileIndex,
            direction: 2,
            pattern: 1
          },
          list: [],
          moveFrequency: 3,
          moveRoute: {
            list: [{ code: 0, parameters: []}],
            repeat: true,
            skippable: false,
            wait: false
          },
          moveSpeed: 3,
          moveType: 1,
          priorityType: 1,
          stepAnime: false,
          through: false,
          directionFix: false,
          trigger: 0,
          walkAnime: true
        }
      ],
      x,
      y
    };

    return data;
  };

  let addedCharacters = [];

  Spriteset_Map.prototype.addEventCharacter = function(event) {
    const sprite = new Sprite_Character(event);
    this._characterSprites.push(sprite);
    this._tilemap.addChild(sprite);
  };

  const Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    if (addedCharacters.length > 0) {
      const targetCharacters = addedCharacters;
      addedCharacters = [];
      for (const event of targetCharacters) {
        this._spriteset.addEventCharacter(event);
      }
    }

    Scene_Map_update.call(this);
  }

  function appearPerson(regionId, imageFileName, note) {
    const imageFileIndex = Math.randomInt(8);
    const event = new Game_RandomPersonEvent($gameMap, {
      regionId,
      imageFileName,
      imageFileIndex,
      note,
    });
    $gameMap.addDynamicEvent(event);
    addedCharacters.push(event);
  }

  PluginManager.registerCommand(PLUGIN_NAME, "appearPeople", args => {
    const { imageFileName, number: numberStr, regionId: regionIdStr, note } = args;
    for (let i = 0; i < parseInt(numberStr); i++) {
      appearPerson(parseInt(regionIdStr), imageFileName, note);
    }
    $gameMap.refreshTileEvents();
  });
})();
