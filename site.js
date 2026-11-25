const canvas = document.querySelector('#field');
const ctx = canvas.getContext('2d');

if (ctx) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = 2 * Math.PI;
  const palette = ['#7752d0', '#a378e9', '#cd9aff', '#e8c4ff', '#82a5ee'];
  let seed = 815;
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastFrame = 0;
  let morph = 0;
  let scroll = 0;
  let pointer = null;

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const points = Array.from({length: 2100}, () => {
    const t = random() * tau;
    const ring = random() * tau;
    const spread = Math.sqrt(random()) * .47;
    const bend = 2.06 + .67 * Math.cos(3 * t);
    const radius = bend + Math.cos(ring) * spread;
    const u = t / tau * 2 - 1;
    const v = random() * 2 - 1;

    return {
      x: radius * Math.cos(2 * t),
      y: radius * Math.sin(2 * t),
      z: .91 * Math.sin(3 * t) + Math.sin(ring) * spread,
      waveX: u * 3.5,
      waveY: v * 1.75,
      waveZ: Math.sin(u * 5 + v * 2) * .64 + Math.cos(v * 4) * .35,
      color: palette[Math.floor(random() * palette.length)],
      size: random(),
      opacity: .19 + random() * .62
    };
  });

  function draw(time, shape) {
    ctx.clearRect(0, 0, width, height);
    const compact = width < 680;
    const scale = Math.min(width * (compact ? .145 : .106), height * (compact ? .136 : .165));
    const centerX = width * (compact ? .59 : .685);
    const centerY = height * (compact ? .32 : .47);
    const spin = .6 + time * .00013;
    const tilt = -.36 - Math.sin(time * .00015) * .16;
    const cs = Math.cos(spin);
    const ss = Math.sin(spin);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const count = compact ? 1260 : points.length;

    for (let i = 0; i < count; i += 1) {
      const point = points[i];
      const x = point.x + (point.waveX - point.x) * shape;
      const y = point.y + (point.waveY - point.y) * shape;
      const z = point.z + (point.waveZ - point.z) * shape;
      const turnedX = x * cs + z * ss;
      const depth = -x * ss + z * cs;
      const tiltedY = y * ct - depth * st;
      const tiltedZ = y * st + depth * ct;
      const perspective = 5.8 / (7 - tiltedZ);

      let px = centerX + turnedX * scale * perspective;
      let py = centerY + tiltedY * scale * perspective * .84;
      if (pointer) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 112) {
          const push = (1 - distance / 112) * .64;
          px += dx * push;
          py += dy * push;
        }
      }

      const size = (.65 + point.size * 1.55) * perspective;
      const protectText = px < width * .48 && py > height * (compact ? .40 : .49);
      ctx.globalAlpha = point.opacity * (1 - shape * .43) * (protectText ? .39 : .92);
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, tau);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function tick(time) {
    if (time - lastFrame >= 30) {
      morph += (scroll - morph) * .095;
      draw(time, morph);
      lastFrame = time;
    }
    frame = requestAnimationFrame(tick);
  }

  function updateScroll() {
    scroll = Math.min(1, window.scrollY / (height * .92));
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    updateScroll();
    draw(0, motion.matches ? 0 : morph);
  }

  function updateAnimation() {
    if (!motion.matches && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      if (motion.matches) draw(0, 0);
    }
  }

  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('scroll', updateScroll, {passive: true});
  window.addEventListener('pointermove', (event) => {
    if (!motion.matches && event.pointerType !== 'touch') {
      pointer = {x: event.clientX, y: event.clientY};
    }
  }, {passive: true});
  document.addEventListener('pointerleave', () => { pointer = null; });
  document.addEventListener('visibilitychange', updateAnimation);
  motion.addEventListener('change', updateAnimation);
  resize();
  updateAnimation();
}
