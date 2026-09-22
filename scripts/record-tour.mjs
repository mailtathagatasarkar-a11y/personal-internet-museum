// The demo film. Recorded against the built site, so it shows what ships:
//
//   npm run build
//   (cd out && python -m http.server 4100)
//   playwright-cli open && playwright-cli resize 1920 1080
//   playwright-cli video-start --size 1920x1080 --fps 30 --cursor
//   playwright-cli run-code --filename=scripts/record-tour.mjs
//   playwright-cli video-stop
//   ffmpeg -ss 1.4 -i <webm> -t 32.6 -r 30 -c:v libx264 -preset slow -crf 20
//     -pix_fmt yuv420p -movflags +faststart -an -vf "scale=1920:1080:flags=lanczos,
//     fade=t=in:st=0:d=0.4:color=0xE8E3D7,fade=t=out:st=32.1:d=0.5:color=0xE8E3D7"
//     museum.mp4
//
// A tour of the museum, for a short demo film. Drives the real site: no
// scripted camera, just the things a visitor does, with pauses to read.
// Recorded with --cursor, which paces every pointer action, so the zoom
// beat is driven from the keyboard to keep the film moving.
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const hold = (ms) => page.waitForTimeout(ms);

  // 01 — Arrive. The curtain lifts and the camera pulls back to the poster.
  await page.goto('http://localhost:4100/', { waitUntil: 'domcontentloaded' });
  await hold(3900);

  // Come closer, so the labels under the prints appear, then step back.
  await page.keyboard.press('+');
  await hold(600);
  await page.keyboard.press('+');
  await hold(1100);
  await page.keyboard.press('-');
  await hold(500);
  await page.keyboard.press('-');
  await hold(600);

  // 02 — Notice one thing, and open it.
  await page.click('.obj[data-id="braun-t3"]');
  await hold(1700);

  // 03 — Follow the connection that explains itself.
  const ipod = page.locator('.rel', { hasText: 'Apple iPod' }).first();
  await ipod.hover();
  await hold(800);
  await ipod.click();
  await hold(1600);

  // 04 — Follow the thread the two of them sit on.
  const thread = page.locator('button', { hasText: 'Functional minimalism' }).first();
  await thread.click();
  await hold(1900);

  // 05 — Step back out to the whole room.
  await page.keyboard.press('Escape');
  await hold(400);
  await page.click('.hud-link:has-text("Reset")');
  await hold(1100);

  // 06 — The hall: four rooms, and past the last one the first again.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press(']');
    await hold(1450);
  }
  await hold(1100);
  return 'toured';
}

