const assert = require("assert");
const game = require("../app.js");

function expect(condition, message) {
  assert.ok(condition, message);
}

function run() {
  game.resetMatch();
  let snapshot = game.getStateSnapshot();
  expect(snapshot.match.turn === 1, "new match should start on turn 1");
  expect(!snapshot.match.gameOver, "new match should not be complete");

  game.setAction("reserve");
  const firstCardId = snapshot.match.market[0].id;
  game.dispatch({ type: "RESERVE_CARD", payload: { cardId: firstCardId } });
  snapshot = game.getStateSnapshot();
  expect(snapshot.match.market.length === 2, "reserve should remove one market card");
  expect(snapshot.match.players[0].reservedCards.length === 1, "reserve should add one reserved card");

  game.setAction("draft");
  game.dispatch({ type: "TAKE_GEM", payload: { index: 0 } });
  game.dispatch({ type: "TAKE_GEM", payload: { index: 1 } });
  game.dispatch({ type: "TAKE_GEM", payload: { index: 2 } });
  game.endTurn();
  snapshot = game.getStateSnapshot();
  expect(snapshot.match.activePlayer === 1, "end turn should pass to player two");
  expect(snapshot.match.turn === 1, "turn counter should remain until round wraps");

  const forcedEndgame = game.getStateSnapshot();
  forcedEndgame.match.players[1].points = game.VICTORY_TARGET_POINTS;
  forcedEndgame.ui.action = "draft";
  forcedEndgame.ui.feedback = "";
  forcedEndgame.ui.spectatorRunning = false;
  game.setStateSnapshot(forcedEndgame);
  game.endTurn();
  snapshot = game.getStateSnapshot();
  expect(Boolean(snapshot.match.gameOver), "endgame should be detected at end turn");
  expect(snapshot.match.gameOver.winnerName === "Player Two", "winner should match highest eligible points");

  game.resetMatch();
  snapshot = game.getStateSnapshot();
  expect(!snapshot.match.gameOver, "rematch/new match should clear endgame state");
  expect(snapshot.match.turn === 1, "rematch/new match should reset turn count");

  const invalidUiSnapshot = game.getStateSnapshot();
  invalidUiSnapshot.ui.action = "invalid-action";
  invalidUiSnapshot.ui.feedback = 42;
  invalidUiSnapshot.ui.spectatorRunning = true;
  game.setStateSnapshot(invalidUiSnapshot);
  snapshot = game.getStateSnapshot();
  expect(snapshot.ui.action === "draft", "state restore should coerce unknown ui action to draft");
  expect(snapshot.ui.feedback === "", "state restore should coerce non-string feedback to empty");
  expect(snapshot.ui.spectatorRunning === false, "state restore should never auto-enable spectator mode");

  console.log("Gameplay smoke checks passed.");
}

run();
