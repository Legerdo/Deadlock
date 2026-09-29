import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-sans-kr/900.css';
import '@fontsource/black-han-sans/400.css';
import '@fontsource/anton/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import './ui/styles.css';
import { Game } from './core/Game';
import { installDebugView } from './debug/debug';

const game = new Game();
installDebugView(game);
game.boot().catch((err) => {
  console.error(err);
  const ui = document.getElementById('ui');
  if (ui) ui.innerHTML = `<div class="fatal">게임을 불러오지 못했습니다.<br><small>${String(err?.message ?? err)}</small></div>`;
});
