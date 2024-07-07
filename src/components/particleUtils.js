const generateRandomColor = (baseColor) => {
  const rgb = parseInt(baseColor.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  const variation = 30;
  const newR = Math.max(
    0,
    Math.min(255, r + Math.floor(Math.random() * variation * 2) - variation)
  );
  const newG = Math.max(
    0,
    Math.min(255, g + Math.floor(Math.random() * variation * 2) - variation)
  );
  const newB = Math.max(
    0,
    Math.min(255, b + Math.floor(Math.random() * variation * 2) - variation)
  );

  return `rgb(${newR},${newG},${newB})`;
};

export const createParticles = (
  particlesRef,
  canvas,
  particleCount,
  particleSpeed,
  particleSize,
  particleColor
) => {
  particlesRef.current = [];
  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.1 + Math.random() * 0.2) * particleSpeed;
    particlesRef.current.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: (0.5 + Math.random() * 0.5) * particleSize,
      color: generateRandomColor(particleColor),
      life: Infinity,
    });
  }
};

export const animateParticles = (
  canvasRef,
  particlesRef,
  beatRef,
  animationFrameRef,
  particleSpeed
) => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  const animate = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      let radius = particle.radius;
      if (beatRef.current) {
        radius *= 1.5;
        particle.vx += (Math.random() - 0.5) * 0.2 * particleSpeed;
        particle.vy += (Math.random() - 0.5) * 0.2 * particleSpeed;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  animate();
};
