//=============================================================================
// RPG Maker MZ - AllMoveToward
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップ上のイベントが一斉に主人公に近づく or 遠ざかる
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help マップ上のイベントを一度に動かして、主人公に近づいたり遠ざかってもらったりします
 * 
 * 【使い方】
 * 対象イベントに共通のイベント名orタグ名を指定します（ワイルドカード・正規表現不可）
 * あとはコマンドを呼ぶだけで動きます
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/edit/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command moveToward
 * @text こちらに向かって移動
 * @arg targetEventName
 * @text 対象となるイベント名
 * @desc タグと同時に指定した場合、イベント名が優先されます
 * @arg targetEventTag
 * @text 対象となるイベントタグ
 * @desc イベント名と同時に指定した場合、イベント名が優先されます
 * @arg count
 * @text 移動回数
 * @type number
 * @default 1
 * @arg wait
 * @text 移動中コマンド実行を止めるか
 * @type boolean
 * @default true
 * 
 * 
 * @command moveAway
 * @text 遠ざかるように移動
 * @arg targetEventName
 * @text 対象となるイベント名
 * @desc タグと同時に指定した場合、イベント名が優先されます
 * @arg targetEventTag
 * @text 対象となるイベントタグ
 * @desc イベント名と同時に指定した場合、イベント名が優先されます
 * @arg count
 * @text 移動回数
 * @type number
 * @default 1
 * @arg wait
 * @text 移動中コマンド実行を止めるか
 * @type boolean
 * @default true
 * 
 * 
 * @command moveRandom
 * @text ランダム移動
 * @arg targetEventName
 * @text 対象となるイベント名
 * @desc タグと同時に指定した場合、イベント名が優先されます
 * @arg targetEventTag
 * @text 対象となるイベントタグ
 * @desc イベント名と同時に指定した場合、イベント名が優先されます
 * @arg count
 * @text 移動回数
 * @type number
 * @default 1
 * @arg wait
 * @text 移動中コマンド実行を止めるか
 * @type boolean
 * @default true
 */

(() => {
  const PLUGIN_NAME = 'AllMoveToward';
  const params = PluginManager.parameters(PLUGIN_NAME);


  const filterEvent = (event, args) => {
    if (!event) return false;

    if (args.targetEventName) {
      return event.name === args.targetEventName;
    }
    if (args.targetEventTag) {
      return event.meta[targetEventTag];
    }

    return false;
  }

  const setCommands = (interpreter, args, commandTemplate) => {
    const count = parseInt(args.count);
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(commandTemplate);
    }

    // process route end
    list.push({ code: 0, parameters: [], });

    let sampleEvent = null;
    for (const event of $gameMap.events().filter((ev) => filterEvent(ev.event(), args))) {
      // code 10 = 主人公に向かって移動
      event.forceMoveRoute({ list });
      sampleEvent = event;
    }

    if (!sampleEvent) return;

    if (String(args.wait) === 'true') {
      interpreter._characterId = sampleEvent._eventId;
      interpreter.setWaitMode('route');
    }
  };

  PluginManager.registerCommand(PLUGIN_NAME, "moveToward", function(args) {
    setCommands(this, args, { code: 10, parameters: [], });
  });

  PluginManager.registerCommand(PLUGIN_NAME, "moveAway", function(args) {
    setCommands(this, args, { code: 11, parameters: [], });
  });

  PluginManager.registerCommand(PLUGIN_NAME, "moveRandom", function(args) {
    setCommands(this, args, { code: 9, parameters: [], });
  });
})();
