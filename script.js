// ----- LocalStorage Keys -----
const STORAGE_KEYS = {
  backlog: "gamer_dashboard_backlog",
  daily: "gamer_dashboard_daily",
};

// ----- Utility: Save & Load -----
function saveBacklog(backlog) {
  localStorage.setItem(STORAGE_KEYS.backlog, JSON.stringify(backlog));
}

function loadBacklog() {
  const raw = localStorage.getItem(STORAGE_KEYS.backlog);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDaily(daily) {
  localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify(daily));
}

function loadDaily() {
  const raw = localStorage.getItem(STORAGE_KEYS.daily);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ----- Backlog & Daily Logic -----
document.addEventListener("DOMContentLoaded", () => {
  const backlogForm = document.getElementById("backlog-form");
  const backlogList = document.getElementById("backlog-list");
  const backlogCount = document.getElementById("backlog-count");

  const dailyForm = document.getElementById("daily-form");
  const dailyList = document.getElementById("daily-list");
  const dailyProgress = document.getElementById("daily-progress");

  const resetDailyBtn = document.getElementById("reset-daily");

  let backlogItems = loadBacklog();
  let dailyItems = loadDaily();

  function renderBacklog() {
    backlogList.innerHTML = "";
    const template = document.getElementById("backlog-item-template");

    backlogItems.forEach((item, index) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".game-title").textContent = item.title;
      clone.querySelector(".platform-pill").textContent = item.platform;
      const statusEl = clone.querySelector(".status-pill");
      statusEl.textContent = item.status;

      // ステータス別に色を変える
      statusEl.classList.remove(
        "border-neon-purple/60",
        "bg-neon-purple/10",
        "text-neon-purple",
        "border-neon-green/70",
        "bg-neon-green/10",
        "text-neon-green",
        "border-slate-600/80",
        "bg-slate-700/20",
        "text-slate-200"
      );

      if (item.status === "未プレイ") {
        statusEl.classList.add(
          "border-slate-600/80",
          "bg-slate-700/20",
          "text-slate-200"
        );
      } else if (item.status === "プレイ中") {
        statusEl.classList.add(
          "border-neon-purple/60",
          "bg-neon-purple/10",
          "text-neon-purple"
        );
      } else if (item.status === "クリア") {
        statusEl.classList.add(
          "border-neon-green/70",
          "bg-neon-green/10",
          "text-neon-green"
        );
      }

      clone.querySelector(".delete-btn").addEventListener("click", () => {
        backlogItems.splice(index, 1);
        saveBacklog(backlogItems);
        renderBacklog();
      });

      backlogList.appendChild(clone);
    });

    backlogCount.textContent = `${backlogItems.length} Games`;
  }

  backlogForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("game-title").value.trim();
    const platform = document.getElementById("game-platform").value;
    const status = document.getElementById("game-status").value;

    if (!title) return;

    backlogItems.push({ title, platform, status });
    saveBacklog(backlogItems);
    backlogForm.reset();
    renderBacklog();
  });

  // ----- Daily Logic -----
  function updateDailyProgress() {
    const total = dailyItems.length;
    const done = dailyItems.filter((item) => item.done).length;
    dailyProgress.textContent = `${done} / ${total} Done`;
  }

  function renderDaily() {
    dailyList.innerHTML = "";
    const template = document.getElementById("daily-item-template");

    dailyItems.forEach((item, index) => {
      const clone = template.content.cloneNode(true);
      const label = clone.querySelector("label");
      const checkbox = clone.querySelector('input[type="checkbox"]');
      const gameEl = clone.querySelector(".daily-game");
      const taskEl = clone.querySelector(".daily-task");
      const deleteBtn = clone.querySelector(".delete-btn");

      gameEl.textContent = item.game;
      taskEl.textContent = item.task;
      checkbox.checked = !!item.done;

      function applyDoneStyle() {
        if (checkbox.checked) {
          label.classList.add("border-neon-pink/80", "bg-neon-pink/10");
          gameEl.classList.add("line-through", "text-slate-400");
          taskEl.classList.add("line-through", "text-slate-500");
        } else {
          label.classList.remove("border-neon-pink/80", "bg-neon-pink/10");
          gameEl.classList.remove("line-through", "text-slate-400");
          taskEl.classList.remove("line-through", "text-slate-500");
        }
      }

      applyDoneStyle();

      checkbox.addEventListener("change", () => {
        dailyItems[index].done = checkbox.checked;
        saveDaily(dailyItems);
        applyDoneStyle();
        updateDailyProgress();
      });

      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        dailyItems.splice(index, 1);
        saveDaily(dailyItems);
        renderDaily();
        updateDailyProgress();
      });

      dailyList.appendChild(clone);
    });

    updateDailyProgress();
  }

  dailyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const game = document.getElementById("daily-game").value.trim();
    const task = document.getElementById("daily-task").value.trim();
    if (!game || !task) return;
    dailyItems.push({ game, task, done: false });
    saveDaily(dailyItems);
    dailyForm.reset();
    renderDaily();
  });

  resetDailyBtn.addEventListener("click", () => {
    dailyItems = dailyItems.map((item) => ({ ...item, done: false }));
    saveDaily(dailyItems);
    renderDaily();
  });

  // 初期描画
  renderBacklog();
  renderDaily();
});

