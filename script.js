const PAGES = [
  { id: "home", name: "首页", shortName: "首页", src: "assets/home.png" },
  { id: "ticket-1", name: "飞行学员组合包", shortName: "飞行员", src: "assets/pilot.png" },
  { id: "ticket-2", name: "民防部队组合包", shortName: "民防部队", src: "assets/civil-defense.png" },
  { id: "ticket-3", name: "赏金猎人组合包", shortName: "赏金猎人", src: "assets/bounty-hunter.png" },
  { id: "ticket-4", name: "深空探索组合包", shortName: "深空探索", src: "assets/deep-space.png" },
  { id: "ticket-5", name: "开拓者赞助组合包", shortName: "开拓者", src: "assets/pioneer.png" },
  { id: "cart", name: "飞行学员购物车", shortName: "购物车", src: "assets/cart.png" },
];

const phone = document.querySelector("#phone");
const phoneScreen = document.querySelector("#phoneScreen");
const h5Image = document.querySelector("#h5Image");
const assetState = document.querySelector("#assetState");
const assetStateTitle = document.querySelector("#assetStateTitle");
const assetPath = document.querySelector("#assetPath");
const assetHint = document.querySelector("#assetHint");
const pageName = document.querySelector("#pageName");
const pagePicker = document.querySelector("#pagePicker");
const homeNavHotspots = document.querySelector("#homeNavHotspots");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const playback = {
  pageId: PAGES[0].id,
  phase: "scrolling",
  phaseStartedAt: 0,
  lastFrameAt: 0,
  paused: false,
  manualPauseUntil: 0,
  resetFrom: 0,
};

const BOTTOM_HOLD_MS = 1800;
const TOP_RESET_MS = 1100;
const TOP_HOLD_MS = 650;
const PAGE_SCROLL_MS = 17000;

function getPage(pageId) {
  return PAGES.find((page) => page.id === pageId) || PAGES[0];
}

function renderPagePicker() {
  pagePicker.replaceChildren(
    ...PAGES.map((page) => {
      const button = document.createElement("button");
      const isActive = page.id === playback.pageId;
      button.type = "button";
      button.className = `page-button${isActive ? " is-active" : ""}`;
      button.textContent = page.shortName;
      button.setAttribute("aria-label", `查看${page.name}`);
      button.setAttribute("aria-pressed", String(isActive));
      button.addEventListener("click", () => updatePage(page.id));
      return button;
    }),
  );
}

function updatePage(pageId) {
  const page = getPage(pageId);
  playback.pageId = page.id;
  playback.phase = "scrolling";
  playback.phaseStartedAt = performance.now();
  playback.lastFrameAt = performance.now();
  phoneScreen.scrollTop = 0;

  h5Image.classList.add("is-hidden");
  h5Image.style.width = page.id === "cart" ? "409.5px" : "408px";
  h5Image.alt = `${page.name} H5 长图`;
  homeNavHotspots.hidden = page.id !== "home";
  assetState.className = "asset-state is-loading";
  assetStateTitle.textContent = `正在载入${page.name}`;
  assetPath.textContent = page.src;
  assetHint.textContent = "替换图片后会自动显示";

  h5Image.onload = () => {
    h5Image.classList.remove("is-hidden");
    assetState.className = "asset-state is-ready";
    phoneScreen.scrollTop = 0;
  };

  h5Image.onerror = () => {
    h5Image.classList.add("is-hidden");
    homeNavHotspots.hidden = true;
    assetState.className = "asset-state is-missing";
    assetStateTitle.textContent = `${page.name}等待替换`;
    assetHint.textContent = "请放入同名 PNG，也可在 script.js 中修改路径";
    phoneScreen.scrollTop = 0;
  };

  h5Image.src = `${page.src}?page=${encodeURIComponent(page.id)}`;
  pageName.textContent = page.name;
  renderPagePicker();
}

function restartCurrentPage() {
  playback.phase = "scrolling";
  playback.phaseStartedAt = performance.now();
  playback.lastFrameAt = performance.now();
}

function autoPlay(frameTime) {
  const delta = Math.min(frameTime - playback.lastFrameAt, 34);
  playback.lastFrameAt = frameTime;

  if (
    playback.paused ||
    frameTime < playback.manualPauseUntil ||
    prefersReducedMotion.matches
  ) {
    requestAnimationFrame(autoPlay);
    return;
  }

  const maxScroll = Math.max(0, phoneScreen.scrollHeight - phoneScreen.clientHeight);

  if (playback.phase === "scrolling") {
    if (maxScroll <= 1) {
      playback.phase = "bottom-hold";
      playback.phaseStartedAt = frameTime;
    } else {
      const speed = maxScroll / PAGE_SCROLL_MS;
      phoneScreen.scrollTop = Math.min(maxScroll, phoneScreen.scrollTop + speed * delta);
      if (phoneScreen.scrollTop >= maxScroll - 1) {
        playback.phase = "bottom-hold";
        playback.phaseStartedAt = frameTime;
      }
    }
  } else if (playback.phase === "bottom-hold") {
    if (frameTime - playback.phaseStartedAt >= BOTTOM_HOLD_MS) {
      playback.phase = "resetting";
      playback.phaseStartedAt = frameTime;
      playback.resetFrom = phoneScreen.scrollTop;
    }
  } else if (playback.phase === "resetting") {
    const progress = Math.min(1, (frameTime - playback.phaseStartedAt) / TOP_RESET_MS);
    const eased = 1 - Math.pow(1 - progress, 4);
    phoneScreen.scrollTop = playback.resetFrom * (1 - eased);
    if (progress >= 1) {
      phoneScreen.scrollTop = 0;
      playback.phase = "top-hold";
      playback.phaseStartedAt = frameTime;
    }
  } else if (playback.phase === "top-hold") {
    if (frameTime - playback.phaseStartedAt >= TOP_HOLD_MS) {
      restartCurrentPage();
    }
  }

  requestAnimationFrame(autoPlay);
}

phone.addEventListener("pointerenter", () => {
  playback.paused = true;
});

phone.addEventListener("pointermove", (event) => {
  if (prefersReducedMotion.matches) return;
  const rect = phone.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  phone.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
  phone.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
});

phone.addEventListener("pointerleave", () => {
  playback.paused = false;
  playback.lastFrameAt = performance.now();
  phone.style.setProperty("--tilt-x", "0deg");
  phone.style.setProperty("--tilt-y", "0deg");
});

phoneScreen.addEventListener(
  "wheel",
  () => {
    playback.manualPauseUntil = performance.now() + 2200;
  },
  { passive: true },
);

phoneScreen.addEventListener(
  "touchmove",
  () => {
    playback.manualPauseUntil = performance.now() + 2200;
  },
  { passive: true },
);

homeNavHotspots.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  button.classList.remove("is-pressed");
  requestAnimationFrame(() => button.classList.add("is-pressed"));
  window.setTimeout(() => button.classList.remove("is-pressed"), 420);

  if (button.dataset.menu === "cart") {
    window.setTimeout(() => updatePage("cart"), 160);
  }
});

prefersReducedMotion.addEventListener("change", () => {
  playback.lastFrameAt = performance.now();
});

updatePage(playback.pageId);
requestAnimationFrame(autoPlay);
