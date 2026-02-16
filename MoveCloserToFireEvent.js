//=============================================================================
// RPG Maker MZ - MoveCloserToFireEvent
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 一定距離まで近づいたらイベントを発動する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help このゲーム独自のプラグイン
 * 
 * 【必須】
 * このプラグインには MapEventPageMeta.js が別途必要です。一緒に登録しないとエラーは出ませんが動作しません（順番は問いません）
 * 
 * 【使い方】
 * マップイベントで現在アクティブになっている（出現条件を満たしている）ページの冒頭の注釈に以下タグを設定します
 *   <fireDistance:3>        --- このイベントまで距離が3マス「以下」になった時にそのページのイベントが自動的に開始されます
 *                               イベントに近づく時に発生します
 *   <fireDistanceFar:3>     --- このイベントまで距離が3マス「以上」になった時にそのページのイベントが自動的に開始されます
 *                               イベントから離れる時に発生します。設定するときはフラグや主人公の現在位置に注意してください
 *   <fireDistanceFar:3,8>   --- このイベントまで距離が3マス「以上」になった時に、同じマップのID:8のイベントが開始されます
 *                               ID:8のイベントは現在の出現条件を満たしているページの内容が実行されます
 *                               ID:8のイベントは、主人公が自分で到達できないような場所に配置するのをおすすめします
 *                               それが難しい場合は switchDistanceFar の利用をご検討ください
 *   <switchDistanceFar:3,8> --- このイベントまで距離が3マス「以上」になった時に、ID:8のスイッチがONになります
 *   <fireRegionIn:1>        --- No.1のリージョンに入った時にイベントが実行されます
 *   <fireRegionOut:1>       --- No.1のリージョンから出た時にイベントが実行されます
 * 出現条件を調整することで、同じ座標で複数のイベントを発生させることができます。
 * 
 * なお、出現条件を満たしている限りイベントは繰り返し発生するため、セルフスイッチなどを活用して
 * 一度実行されたイベントが２回以上繰り返されないよう工夫する必要があります（基本は「自動実行」と同じだと思ってください）
 * 
 * ページのトリガー（発生条件）は何でも構いませんが、
 * 「自動実行」「並列処理」を設定するとこのプラグインの意味がなくなるので注意してください。
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'MoveCloserToFireEvent';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const calcDistance = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  const Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
  Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    if (!$gameMap.isEventRunning()) {
      // $gameMap.isEventRunningをイベント開始直後に分岐してしまわないよう、元メソッドはこの位置から呼び出す
      Game_Player_startMapEvent.call(this, x, y, triggers, normal);

      for (const event of $gameMap.events()) {
        if (!event.pageMeta) continue;

        const { fireDistance, fireDistanceFar, switchDistanceFar, fireRegionIn, fireRegionOut } = event.pageMeta;

        if (fireDistance) {
          const distance = parseInt(fireDistance);
          const currentDistance = calcDistance(x, y, event.x, event.y);
          if (distance >= currentDistance) {
            event.start();
          }
        }
        if (fireDistanceFar) {
          const [ distance, eventId ] = fireDistanceFar.split(',').map((v) => parseInt(v));
          const currentDistance = calcDistance(x, y, event.x, event.y);
          if (distance <= currentDistance) {
            if (eventId) {
              const targetEvent = $gameMap.event(eventId);
              targetEvent.start();
            } else {
              event.start();
            }
          }
        }
        if (switchDistanceFar) {
          const [ distance, switchId ] = switchDistanceFar.split(',').map((v) => parseInt(v));
          const currentDistance = calcDistance(x, y, event.x, event.y);
          if (distance <= currentDistance) {
            $gameSwitches.setValue(switchId, true);
          }
        }
        if (fireRegionIn) {
          const regionId = (fireRegionIn === 'auto' && event.event()) ?
            $gameMap.regionId(event.event().x, event.event().y) : parseInt(fireRegionIn);

          if ($gameMap.regionId($gamePlayer.x, $gamePlayer.y) === regionId) {
            event.start();
          }
        }
        if (fireRegionOut) {
          const regionId = parseInt(fireRegionOut);
          if ($gameMap.regionId($gamePlayer.x, $gamePlayer.y) !== regionId) {
            event.start();
          }
        }
      }
    }
  };
})();
