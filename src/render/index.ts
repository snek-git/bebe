import { VIEW_W, VIEW_H } from '../config';
import { renderMap, renderRoomLabels, renderExit, renderDoors } from './map';
import {
  renderTVs, renderCheesePickups, renderToolPickups, renderDistractions,
  renderLootItems, renderCheeses, renderBabies, renderPlayer,
  renderContainers, renderKeyPickups, renderGearPickups,
} from './entities';
import { renderVisionCones } from './visioncones';
import { renderUI, renderToolWheel, renderDetectionOverlay } from './ui';
import { renderTitle, renderGameOver, renderWinScreen, renderPauseScreen } from './screens';
import type { Game } from '../types';

export function render(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = '#0e0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (game.state === 'title') {
    renderTitle(ctx);
    return;
  }

  renderMap(ctx, game);
  renderExit(ctx, game);
  renderRoomLabels(ctx, game);
  renderDoors(ctx, game);
  renderTVs(ctx, game);
  renderContainers(ctx, game);
  renderKeyPickups(ctx, game);
  renderGearPickups(ctx, game);
  renderCheesePickups(ctx, game);
  renderToolPickups(ctx, game);
  renderDistractions(ctx, game);
  renderLootItems(ctx, game);
  renderVisionCones(ctx, game);
  renderCheeses(ctx, game);
  renderBabies(ctx, game);
  renderPlayer(ctx, game);
  renderUI(ctx, game);
  renderDetectionOverlay(ctx, game);
  renderToolWheel(ctx, game);

  if (game.state === 'gameover') renderGameOver(ctx, game);
  if (game.state === 'win') renderWinScreen(ctx, game);
  if (game.state === 'paused') renderPauseScreen(ctx);
}
