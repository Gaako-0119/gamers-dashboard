// ----- LocalStorage Keys -----
const STORAGE_KEYS = {
  backlog: "gamer_dashboard_backlog",
  daily: "gamer_dashboard_daily",
};

// ----- ステータスごとのスタイル定義（色変更はここだけ編集すればOK） -----
const STATUS_STYLES = {
  未プレイ: ["border-slate-600/80", "bg-slate-700/20", "text-slate-200"],
  プレイ中: ["border-neon-purple/60", "bg-neon-purple/10", "text-neon-purple"],
  クリア: ["border-neon-green/70", "bg-neon-green/10", "text-neon-green"],
};

// 全ステータスのクラスをまとめた配列（remove用）
const ALL_STATUS_CLASSES = Object.values(STATUS_STYLES).flat();

// ----- Utility: Save & Load -----
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, defaultValue = []) {
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// ----- Backlog & Daily Logic -----
document.addEventListener("DOMContentLoaded", () => {
  const backlogForm = document.getElementById("backlog-form");
  const backlogList = document.getElementById("backlog-list");
  const backlogCount = document.getElementById("backlog-count");

  const filterPlatform = document.getElementById("filter-platform");
  const filterStatus = document.getElementById("filter-status");
  const sortOrder = document.getElementById("sort-order");

  const dailyForm = document.getElementById("daily-form");
  const dailyList = document.getElementById("daily-list");
  const dailyProgress = document.getElementById("daily-progress");

  const resetDailyBtn = document.getElementById("reset-daily");

  let backlogItems = loadData(STORAGE_KEYS.backlog);
  let dailyItems = loadData(STORAGE_KEYS.daily);

  let editingBacklogIndex = -1;
  let editingDailyIndex = -1;

  const backlogSubmitBtn = backlogForm.querySelector('button[type="submit"]');
  const dailySubmitBtn = dailyForm.querySelector('button[type="submit"]');

  function resetBacklogFormToAdd() {
    editingBacklogIndex = -1;
    backlogForm.reset();
    backlogSubmitBtn.textContent = "追加";
  }

  function resetDailyFormToAdd() {
    editingDailyIndex = -1;
    dailyForm.reset();
    dailySubmitBtn.textContent = "追加";
  }

  // フィルター・ソート後のバックログ配列を計算する（DOMは触らない純粋な加工ロジック）
  function getProcessedBacklogItems() {
    const platformValue = filterPlatform.value;
    const statusValue = filterStatus.value;
    const sortValue = sortOrder.value;

    // 元配列のインデックスを保持した作業用配列を生成
    let working = backlogItems.map((item, index) => ({ item, originalIndex: index }));

    // ハードでフィルタリング
    if (platformValue !== "All") {
      working = working.filter(({ item }) => item.platform === platformValue);
    }

    // ステータスでフィルタリング
    if (statusValue !== "All") {
      working = working.filter(({ item }) => item.status === statusValue);
    }

    // 並び替え
    if (sortValue === "newest") {
      working.sort((a, b) => b.originalIndex - a.originalIndex);
    } else if (sortValue === "oldest") {
      working.sort((a, b) => a.originalIndex - b.originalIndex);
    } else if (sortValue === "title") {
      working.sort((a, b) =>
        a.item.title.localeCompare(b.item.title, "ja", {
          sensitivity: "base",
          numeric: true,
        })
      );
    }

    return working;
  }

  function handleBacklogFilterChange() {
    if (editingBacklogIndex >= 0) {
      resetBacklogFormToAdd();
    }
    renderBacklog();
  }

  // フィルター・ソートのイベント設定
  filterPlatform.addEventListener("change", handleBacklogFilterChange);
  filterStatus.addEventListener("change", handleBacklogFilterChange);
  sortOrder.addEventListener("change", handleBacklogFilterChange);

  function renderBacklog() {
    const working = getProcessedBacklogItems();

    backlogList.innerHTML = "";
    const template = document.getElementById("backlog-item-template");

    working.forEach(({ item, originalIndex }) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".game-title").textContent = item.title;
      clone.querySelector(".platform-pill").textContent = item.platform;
      const statusEl = clone.querySelector(".status-pill");
      statusEl.textContent = item.status;

      // ステータス別に色を変える（STATUS_STYLESを参照）
      statusEl.classList.remove(...ALL_STATUS_CLASSES);
      const classes = STATUS_STYLES[item.status] ?? STATUS_STYLES["未プレイ"];
      statusEl.classList.add(...classes);

      clone.querySelector(".edit-btn").addEventListener("click", () => {
        const target = backlogItems[originalIndex];
        document.getElementById("game-title").value = target.title;
        document.getElementById("game-platform").value = target.platform;
        document.getElementById("game-status").value = target.status;
        backlogSubmitBtn.textContent = "更新";
        editingBacklogIndex = originalIndex;
      });

      clone.querySelector(".delete-btn").addEventListener("click", () => {
        backlogItems.splice(originalIndex, 1);
        saveData(STORAGE_KEYS.backlog, backlogItems);
        renderBacklog();
        if (editingBacklogIndex === originalIndex) {
          resetBacklogFormToAdd();
        } else if (editingBacklogIndex > originalIndex) {
          editingBacklogIndex--;
        }
      });

      backlogList.appendChild(clone);
    });

    // フィルタ後の件数を表示
    backlogCount.textContent = `${working.length} Games`;
  }

  backlogForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("game-title").value.trim();
    const platform = document.getElementById("game-platform").value;
    const status = document.getElementById("game-status").value;

    if (!title) return;

    if (editingBacklogIndex >= 0) {
      backlogItems[editingBacklogIndex] = { title, platform, status };
      saveData(STORAGE_KEYS.backlog, backlogItems);
      resetBacklogFormToAdd();
    } else {
      backlogItems.push({ title, platform, status });
      saveData(STORAGE_KEYS.backlog, backlogItems);
      // 追加時はフィルターを初期状態に戻して、新規アイテムが必ず表示されるようにする
      filterPlatform.value = "All";
      filterStatus.value = "All";
      sortOrder.value = "newest";
      backlogForm.reset();
    }
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
        saveData(STORAGE_KEYS.daily, dailyItems);
        applyDoneStyle();
        updateDailyProgress();
      });

      const editBtn = clone.querySelector(".edit-btn");
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const item = dailyItems[index];
        document.getElementById("daily-game").value = item.game;
        document.getElementById("daily-task").value = item.task;
        dailySubmitBtn.textContent = "更新";
        editingDailyIndex = index;
      });

      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        dailyItems.splice(index, 1);
        saveData(STORAGE_KEYS.daily, dailyItems);
        renderDaily();
        updateDailyProgress();
        if (editingDailyIndex === index) resetDailyFormToAdd();
        else if (editingDailyIndex > index) editingDailyIndex--;
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

    if (editingDailyIndex >= 0) {
      dailyItems[editingDailyIndex] = {
        ...dailyItems[editingDailyIndex],
        game,
        task,
      };
      saveData(STORAGE_KEYS.daily, dailyItems);
      resetDailyFormToAdd();
    } else {
      dailyItems.push({ game, task, done: false });
      saveData(STORAGE_KEYS.daily, dailyItems);
      dailyForm.reset();
    }
    renderDaily();
  });

  resetDailyBtn.addEventListener("click", () => {
    dailyItems = dailyItems.map((item) => ({ ...item, done: false }));
    saveData(STORAGE_KEYS.daily, dailyItems);
    if (editingDailyIndex >= 0) resetDailyFormToAdd();
    renderDaily();
  });

  // 初期描画
  renderBacklog();
  renderDaily();
});

