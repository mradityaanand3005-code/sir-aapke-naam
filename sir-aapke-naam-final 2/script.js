(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const scenes = $$('.scene');
  const birthday = $('#birthdayAudio');
  const sad = $('#sadAudio');
  const meme = $('#memeAudio');
  const audioTracks = [birthday, sad, meme].filter(Boolean);
  const originalTransferMarkup = $('#transfer').innerHTML;

  let currentScene = 'welcome';
  let soundEnabled = false;
  let photoIndex = 0;
  let partyMode = '';
  let transferMode = '';
  let brandClicks = 0;
  let secretKeys = [];
  let activeTrack = null;
  let audioFadeFrame = 0;
  let toastTimer = 0;
  let fireworkRunning = false;
  let sparks = [];

  audioTracks.forEach((track) => {
    track.volume = 0.68;
    track.preload = 'auto';
  });
  if (birthday) birthday.loop = true;
  if (sad) sad.loop = true;

  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove('show'), 2600);
  }

  function stopTracks(reset = true) {
    window.cancelAnimationFrame(audioFadeFrame);
    audioTracks.forEach((track) => {
      track.pause();
      if (reset) {
        try { track.currentTime = 0; } catch (_) { /* Metadata may not be ready yet. */ }
      }
      track.volume = 0.68;
    });
    activeTrack = null;
  }

  function crossfadeTo(track, options = {}) {
    if (!track || !soundEnabled) return;
    const duration = Math.max(250, options.duration || 750);
    const targetVolume = options.volume ?? 0.68;
    const shouldLoop = options.loop ?? track.loop;
    const outgoing = audioTracks.filter((item) => item !== track && !item.paused);

    window.cancelAnimationFrame(audioFadeFrame);
    track.loop = shouldLoop;
    if (track !== activeTrack || track.paused) {
      try { track.currentTime = 0; } catch (_) { /* Wait for media metadata. */ }
      track.volume = 0;
      const playPromise = track.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => toast('Tap the Sound control to enable music.'));
      }
    }

    const outgoingVolumes = new Map(outgoing.map((item) => [item, item.volume]));
    let startedAt = null;
    function fade(now) {
      if (startedAt === null) startedAt = now;
      const amount = Math.max(0, Math.min(1, (now - startedAt) / duration));
      track.volume = Math.max(0, Math.min(1, targetVolume * amount));
      outgoing.forEach((item) => {
        item.volume = Math.max(0, Math.min(1, outgoingVolumes.get(item) * (1 - amount)));
      });
      if (amount < 1) {
        audioFadeFrame = requestAnimationFrame(fade);
      } else {
        outgoing.forEach((item) => {
          item.pause();
          try { item.currentTime = 0; } catch (_) { /* Ignore seek errors. */ }
          item.volume = 0.68;
        });
        track.volume = targetVolume;
        activeTrack = track;
      }
    }
    audioFadeFrame = requestAnimationFrame(fade);
  }

  function playMemeSting() {
    if (!meme || !soundEnabled) return;
    meme.pause();
    try { meme.currentTime = 0; } catch (_) { /* Ignore seek errors. */ }
    meme.loop = false;
    meme.volume = 0.88;
    const result = meme.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  }

  function setSound(enabled) {
    soundEnabled = Boolean(enabled);
    const button = $('#soundToggle');
    if (button) {
      button.innerHTML = `♫ <span>${soundEnabled ? 'Sound on' : 'Sound off'}</span>`;
      button.setAttribute('aria-pressed', String(soundEnabled));
    }
    if (!soundEnabled) {
      stopTracks(false);
      return;
    }
    crossfadeTo(birthday);
    // if (currentScene === 'party' && partyMode === 'approved') crossfadeTo(birthday);
    // else if (currentScene === 'party' && partyMode === 'thinking') crossfadeTo(sad);
    // else if (currentScene === 'transfer' && transferMode === 'yes') crossfadeTo(sad);
    // else if (currentScene === 'transfer' && transferMode === 'no') crossfadeTo(birthday);
  }

  function showScene(id) {
    const target = document.getElementById(id);
    if (!target) {
      console.error(`Missing scene: ${id}`);
      return;
    }
    currentScene = id;
    scenes.forEach((scene) => {
      const isActive = scene.id === id;
      scene.classList.toggle('active', isActive);
      scene.setAttribute('aria-hidden', String(!isActive));
    });
    const chapter = Number(target.dataset.chapter || 1);
    const chapterLabel = $('#chapter');
    if (chapterLabel) chapterLabel.textContent = `${String(chapter).padStart(2, '0')} / 07`;
    const progress = $('#progressBar');
    if (progress) progress.style.width = `${chapter / 7 * 100}%`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'transfer') {
      stopTracks();
      const response = $('#partyResponse');
      if (response) response.textContent = '';
    }
    if (id === 'finale') launchConfetti($('#finalConfetti'), 100);
  }

  function burstFireworks(count = 30) {
    const canvas = $('#fireworks');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    for (let burst = 0; burst < Math.ceil(count / 18); burst += 1) {
      const x = window.innerWidth * (0.18 + Math.random() * 0.64);
      const y = window.innerHeight * (0.12 + Math.random() * 0.45);
      const number = Math.min(42, count);
      for (let i = 0; i < number; i += 1) {
        const angle = Math.PI * 2 * i / number;
        const velocity = 1.2 + Math.random() * 3.4;
        sparks.push({
          x, y, previousX: x, previousY: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 55 + Math.random() * 25,
          maxLife: 80,
          hue: Math.random() < 0.72 ? 42 + Math.random() * 12 : Math.random() * 360
        });
      }
    }
    if (!fireworkRunning) {
      fireworkRunning = true;
      animateFireworks();
    }
  }

  function animateFireworks() {
    const canvas = $('#fireworks');
    const context = canvas && canvas.getContext('2d');
    if (!canvas || !context) {
      fireworkRunning = false;
      return;
    }
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    sparks = sparks.filter((spark) => spark.life > 0);
    sparks.forEach((spark) => {
      spark.previousX = spark.x;
      spark.previousY = spark.y;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.035;
      spark.vx *= 0.992;
      spark.vy *= 0.992;
      spark.life -= 1;
      context.beginPath();
      context.moveTo(spark.previousX, spark.previousY);
      context.lineTo(spark.x, spark.y);
      context.strokeStyle = `hsla(${spark.hue},90%,70%,${Math.max(0, spark.life / spark.maxLife)})`;
      context.lineWidth = 1.5;
      context.stroke();
    });
    if (sparks.length) requestAnimationFrame(animateFireworks);
    else {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      fireworkRunning = false;
    }
  }

  function launchConfetti(parent, count) {
    if (!parent) return;
    parent.innerHTML = '';
    const colors = ['#e7c477', '#fff0c8', '#f39ab2', '#ffffff'];
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 1.8}s`;
      piece.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
      parent.appendChild(piece);
    }
  }

  function renderPhoto(index) {
    const captions = [
      ['The Man.', 'The Myth. The HOD.', 'Aapki presence hi department ki alag identity hai.'],
      ['Professional mode:', 'ACTIVATED.', 'Sir serious ho jaayein toh Wi-Fi bhi discipline mein aa jaata hai.'],
      ['Main character:', 'ALWAYS.', 'Department ke asli main character. 😎'],
      ['Final status:', 'ONE OF A KIND.', 'Thodi masti, lots of respect. ❤️']
    ];
    photoIndex = (index + captions.length) % captions.length;
    const [first, second, caption] = captions[photoIndex];
    const title = $('#memoryTitle');
    if (title) title.innerHTML = `${first}<br><em>${second}</em>`;
    const captionNode = $('#memoryCaption');
    if (captionNode) captionNode.textContent = caption;
    const number = $('#memoryNumber');
    if (number) number.textContent = String(photoIndex + 1).padStart(2, '0');
    const front = $('.photo-front img');
    const back = $('.photo-back img');
    if (front) front.src = photoIndex % 2 === 0 ? 'assets/hod-portrait.png' : 'assets/hod-full-photo.png';
    if (back) back.src = photoIndex % 2 === 0 ? 'assets/hod-full-photo.png' : 'assets/hod-portrait.png';
    const flash = $('#flash');
    if (flash) {
      flash.classList.remove('show');
      void flash.offsetWidth;
      flash.classList.add('show');
    }
  }

  function addNextButton(message, label, callback) {
    const oldButton = $('.next-dynamic');
    if (oldButton) oldButton.remove();
    const button = document.createElement('button');
    button.className = 'btn glass next-dynamic';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', callback, { once: true });
    const anchor = $('#partyResponse');
    if (anchor) anchor.after(button);
    if (anchor) anchor.textContent = message;
  }

  function startPartyCelebration() {
    partyMode = 'approved';
    $('#approveBtn').disabled = true;
    $('#thinkBtn').disabled = true;
    burstFireworks(90);
    crossfadeTo(birthday, { volume: 0.72, duration: 450 });
    playMemeSting();
    addNextButton(
      '🎉 PARTY REQUEST: APPROVED! Sir ne students ki khushi double kar di!',
      'CONTINUE TO THE TRANSFER INVESTIGATION →',
      () => showScene('transfer')
    );
    toast('PARTY APPROVED! Celebration mode ON 🎆');
  }

  function startPartyThinking() {
    partyMode = 'thinking';
    $('#approveBtn').disabled = true;
    $('#thinkBtn').disabled = true;
    crossfadeTo(sad, { volume: 0.68, duration: 500 });
    addNextButton(
      '🥲 Request status: SOCH KE BATAYENGE. Students ka dil thoda toot gaya...',
      'OKAY SIR, NEXT QUESTION →',
      () => showScene('transfer')
    );
    toast('Students entered emotional mode 😭');
  }

  function showTransferYes() {
    transferMode = 'yes';
    const transfer = $('#transfer');
    transfer.classList.add('emotional');
    
    transfer.innerHTML = `
      <div class="section-label">05 <span></span> CASE UPDATE · EMOTIONAL DAMAGE</div>
      <div class="farewell-result">
        <div class="cry-stickers" aria-label="Crying stickers">😭 🥺 💔 😭</div>
        <p class="eyebrow">TRANSFER RUMOUR: SIR NE CONFIRM KAR DIYA</p>
        <h2>TU SI JAA RAHE HO?</h2>
        <h2 class="pink-title">TU SI NA JAO! 🥺</h2>
        <p class="farewell-text">Jokes apart, Sir. Aapne humein sirf academics nahi sikhaya, balki confidence aur growth mein bhi support kiya hai. Aapki guidance aur memories hamesha humare saath rahengi.</p>
        <div class="sad-sticker">CSE (AI) STUDENTS<br>WILL MISS YOU ❤️</div>
        <button class="btn gold" id="afterFarewell" type="button">ONE LAST MESSAGE →</button>
      </div>`;
    crossfadeTo(sad, { volume: 0.72, duration: 650 });
  }

  function showTransferNo() {
    transferMode = 'no';
    const transfer = $('#transfer');
    transfer.innerHTML = `
      <div class="no-result">
        <div class="section-label">05 <span></span> CASE CLOSED</div>
        <p class="eyebrow">OFFICIAL STUDENT REACTION</p>
        <h2>AREY WAHHH!</h2>
        <h2 class="gold-title">SIR KAHIN NAHI JA RAHE! 😎</h2>
        <p class="muted">Department mein khushi ki lehar! Rumour factory temporarily shut down. Ab celebration toh banti hai! 🎉</p>
        <div class="sky-shot" aria-hidden="true">✦ ✧ ✹ ✦ ✧ ✹ ✦</div>
        <button class="btn gold" id="afterNo" type="button">LET'S CELEBRATE →</button>
      </div>`;
    burstFireworks(100);
    crossfadeTo(birthday, { volume: 0.72, duration: 500 });
    playMemeSting();
  }

  // One delegated click handler survives dynamic scene content and replay.
  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, .brand, .portrait-ring');
    if (!target) return;

    if (target.id === 'startBtn') {
      if (!soundEnabled) setSound(true);
      showScene('cake');
      toast('Surprise unlocked ✨');
      return;
    }
    if (target.id === 'soundToggle') {
      setSound(!soundEnabled);
      return;
    }
    if (target.id === 'blowBtn') {
      const stage = $('#cakeStage');
      if (stage.classList.contains('blown')) return;
      stage.classList.add('blown');
      target.disabled = true;
      $('#blowHint').textContent = 'Wish sent. Aapke liye ek chhota sa celebration!';
      burstFireworks(26);
      window.setTimeout(() => {
        showScene('memories');
        renderPhoto(0);
      }, 1900);
      return;
    }
    if (target.id === 'prevMemory') {
      renderPhoto(photoIndex - 1);
      return;
    }
    if (target.id === 'nextMemory') {
      if (photoIndex === 3) showScene('report');
      else renderPhoto(photoIndex + 1);
      return;
    }
    if (target.dataset.next) {
      showScene(target.dataset.next);
      return;
    }
    if (target.id === 'approveBtn' && !target.disabled) {
      startPartyCelebration();
      return;
    }
    if (target.id === 'thinkBtn' && !target.disabled) {
      startPartyThinking();
      return;
    }
    if (target.id === 'transferYes') {
      showTransferYes();
      return;
    }
    if (target.id === 'transferNo') {
      showTransferNo();
      return;
    }
    if (target.id === 'afterFarewell' || target.id === 'afterNo') {
      showScene('finale');
      return;
    }
    if (target.id === 'replayBtn') {
      stopTracks();
      $('#cakeStage').classList.remove('blown');
      $('#blowBtn').disabled = false;
      $('#blowHint').textContent = 'Button dabaiye. Hawa humne cloud se bheji hai.';
      $('#approveBtn').disabled = false;
      $('#thinkBtn').disabled = false;
      $('#transfer').classList.remove('emotional');
      $('#transfer').innerHTML = originalTransferMarkup;
      const response = $('#partyResponse');
      if (response) response.textContent = '';
      $$('.next-dynamic').forEach((button) => button.remove());
      partyMode = '';
      transferMode = '';
      renderPhoto(0);
      showScene('welcome');
      return;
    }
    if (target.classList.contains('brand')) {
      brandClicks += 1;
      if (brandClicks >= 5) {
        brandClicks = 0;
        toast('SECRET MESSAGE: Sir is the department ka real MVP! 🏆');
        burstFireworks(20);
      }
      return;
    }
    if (target.classList.contains('portrait-ring')) {
      toast('Hidden note: Thank you for being an inspiration, Sir. ❤️');
    }
  });

  // Keyboard Easter egg.
  const secretSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  window.addEventListener('keydown', (event) => {
    secretKeys.push(event.key);
    secretKeys = secretKeys.slice(-secretSequence.length);
    if (secretSequence.every((key, index) => key === secretKeys[index])) {
      toast('EASTER EGG UNLOCKED: HOD LEGEND MODE ✨');
      burstFireworks(32);
      secretKeys = [];
    }
  });

  // Ambient gold particles, kept behind the scenes.
  const particleCanvas = $('#particles');
  const particleContext = particleCanvas && particleCanvas.getContext('2d');
  let particles = [];
  function resizeParticles() {
    if (!particleCanvas || !particleContext) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    particleCanvas.width = window.innerWidth * ratio;
    particleCanvas.height = window.innerHeight * ratio;
    particleCanvas.style.width = `${window.innerWidth}px`;
    particleCanvas.style.height = `${window.innerHeight}px`;
    particleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: 95 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.8 + 0.3,
      velocity: Math.random() * 0.32 + 0.06,
      alpha: Math.random() * 0.55 + 0.12
    }));
  }
  function animateParticles() {
    if (!particleContext) return;
    particleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle) => {
      particle.y -= particle.velocity;
      if (particle.y < -4) {
        particle.y = window.innerHeight + 4;
        particle.x = Math.random() * window.innerWidth;
      }
      particleContext.beginPath();
      particleContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      particleContext.fillStyle = `rgba(231,196,119,${particle.alpha})`;
      particleContext.fill();
    });
    requestAnimationFrame(animateParticles);
  }
  window.addEventListener('resize', resizeParticles);
  resizeParticles();
  animateParticles();

  // Fireworks canvas sizing.
  function resizeFireworks() {
    const canvas = $('#fireworks');
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const context = canvas.getContext('2d');
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener('resize', resizeFireworks);
  resizeFireworks();
  renderPhoto(0);
  showScene('welcome');
})();
