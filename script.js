// ===============================
// GLOBAL REVEAL STATE (TOP)
// ===============================
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // 🔥 Sold reveal has highest priority
  if (soldRevealState.overlay || soldRevealState.active) {
    skipSoldRevealAnimation();
    return;
  }

  // 🔥 Normal reveal
  if (revealState.active) {
    skipRevealAnimation();
    return;
  }
});





let revealState = {
  active: false,
  overlay: null,
  timeouts: [],
  done: null,
  pendingName: null,
  isThunder: false,
  thunderTarget: null,  // 'gold' or 'purple'
  goldOverlay: null,
  starsState: null
};

let thunderRevealCount = 0;
let lastThunderRevealIndex = -999;
let revealTotalIndex = 0;

let soldState = {
  active: false,
  timeouts: [],
  done: null
};

let retentionState = {
  active: false,
  player: null,
  prevTeam: null,
  highestBidder: null,
  currentBid: 0,
  timer: null,
  timeLeft: 0,
  phase: null
};

let soldRevealState = {
  active: false,
  overlay: null,
  timeouts: [],
  done: null
};


function registerSoldTimeout(id) {
  soldState.timeouts.push(id);
}

function clearSoldState() {
  soldState.timeouts.forEach(clearTimeout);
  soldState.timeouts = [];
  soldState.active = false;
}




document.addEventListener("keydown", (e) => {
  console.log("ESC CHECK:", e.code, revealState.active);

});


function registerTimeout(id) {
  revealState.timeouts.push(id);
}

function skipRevealAnimation() {
  if (!revealState.active) return;

  revealState.timeouts.forEach(clearTimeout);
  revealState.timeouts = [];

  if (revealState.overlay) {
    const nameEl = revealState.overlay.querySelector(".reveal-player-name");
    if (nameEl && revealState.pendingName) {
      nameEl.textContent = revealState.pendingName;
      nameEl.classList.add("visible");
    }
    if (revealState.isThunder && revealState.goldOverlay) {
      revealState.goldOverlay.style.transition = "none";
      revealState.goldOverlay.style.clipPath = "inset(0 0% 0 0)";
    }
    if (revealState.starsState) {
      revealState.starsState.cardType = revealState.thunderTarget || "gold";
    }
    revealState.overlay.remove();
  }

  revealState.active = false;

  if (typeof revealState.done === "function") {
    revealState.done();
  }
}

const tickSound = new Audio("tick.mp3");
const buzzerSound = new Audio("buzzer.mp3");

tickSound.volume = 1.0;
buzzerSound.volume = 0.8;

function clearSoldSummary() {
  const section = document.getElementById("auctionSection");
  if (section) section.innerHTML = "";
}




document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     DATA STORES
     ======================= */
  const players = [];
  const unsoldPlayers = [];
  const bidders = {};
  const bidderTeams = {};
  const teamMeta = {};
  const historyLog = [];
  const playerMeta = {};
  const teamLogos = {
  barca: "logos/barca.png",
  acmilan: "logos/ac milan.png",
  rm: "logos/realmadrid.png",
  mancity: "logos/man city.png",
  bayern: "logos/Bayern munich.png",
  Leeds: "logos/leeds.png",
  Leverkusen: "logos/leverkusen.png",
  intermilan: "logos/Inter-Milan.png"
};


  /* =======================
     DOM REFERENCES
     ======================= */

  const playerInput = document.getElementById("playerInput");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const playerList = document.getElementById("playerList");
  const playerCount = document.getElementById("playerCount");
  const pdModal = document.getElementById("playerDataModal");
const pdName = document.getElementById("pdName");
const pdCardType = document.getElementById("pdCardType");


const pdConfirm = document.getElementById("pdConfirm");
const pdCancel = document.getElementById("pdCancel");
const pdClose = document.getElementById("pdClose");

  const auctionSection = document.getElementById("auctionSection");
  const result = document.getElementById("result");

  const leftBoard = document.getElementById("leftLeaderboard");
  const rightBoard = document.getElementById("rightLeaderboard");

  const unsoldList = document.querySelector("#unsoldPlayers ul");

  const undoToast = document.getElementById("undoToast");
const undoText = document.getElementById("undoText");
const undoBtn = document.getElementById("undoActionBtn");



  /* =======================
     TEAM MODAL
     ======================= */

  const openTeamModalBtn = document.getElementById("openTeamModalBtn");
  const teamModal = document.getElementById("teamModal");
  const teamClose = document.getElementById("teamClose");
  const teamCancel = document.getElementById("teamCancelBtn");
  const teamConfirmBtn = document.getElementById("teamConfirmBtn");

  const teamCaptainInput = document.getElementById("teamCaptainInput");
  const teamNameInput = document.getElementById("teamNameInput");
  const teamLogoInput = document.getElementById("teamLogoInput");

  openTeamModalBtn.onclick = () => {
    editingTeam = null;
    teamCaptainInput.value = "";
    teamNameInput.value = "";
    teamLogoInput.value = "";
    teamConfirmBtn.textContent = "Add Team";
    teamModal.classList.remove("hidden");
  };
  teamClose.onclick = teamCancel.onclick = () => teamModal.classList.add("hidden");

  teamConfirmBtn.onclick = () => {
  const newCaptain = teamCaptainInput.value.trim();
  const teamName = teamNameInput.value.trim();

  if (!newCaptain) {
    alert("Captain name required");
    return;
  }

  /* =======================
     EDIT MODE
     ======================= */
  if (editingTeam) {
  const oldCaptain = editingTeam;

  // 🛑 CASE 1: Captain name NOT changed
  if (newCaptain === oldCaptain) {
    teamMeta[oldCaptain].teamName = teamName;

    const file = teamLogoInput.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = e => {
        teamMeta[oldCaptain].logo = e.target.result;
        updateLeaderboard();
        saveState();
      };
      r.readAsDataURL(file);
    }

    editingTeam = null;
    teamConfirmBtn.textContent = "Add Team";
    teamModal.classList.add("hidden");
    updateLeaderboard();
    saveState();
    return;
  }

  // 🛑 CASE 2: Captain name CHANGED
  if (bidders[newCaptain]) {
    alert("Captain already exists");
    return;
  }

  bidders[newCaptain] = bidders[oldCaptain];
  bidderTeams[newCaptain] = bidderTeams[oldCaptain];
  teamMeta[newCaptain] = {
    ...teamMeta[oldCaptain],
    teamName
  };

  delete bidders[oldCaptain];
  delete bidderTeams[oldCaptain];
  delete teamMeta[oldCaptain];

  const file = teamLogoInput.files[0];
  if (file) {
    const r = new FileReader();
    r.onload = e => {
      teamMeta[newCaptain].logo = e.target.result;
      updateLeaderboard();
      saveState();
    };
    r.readAsDataURL(file);
  }

  editingTeam = null;
  teamConfirmBtn.textContent = "Add Team";
  teamModal.classList.add("hidden");
  updateLeaderboard();
  saveState();
  return;
}

  /* =======================
     ADD MODE (existing)
     ======================= */
  if (bidders[newCaptain]) {
    alert("Duplicate captain");
    return;
  }

  bidders[newCaptain] = 1100;
  bidderTeams[newCaptain] = [];
  teamMeta[newCaptain] = {
    teamName,
    logo: null,
    retentionUsed: false
  };

  const file = teamLogoInput.files[0];
  if (file) {
    const r = new FileReader();
    r.onload = e => {
      teamMeta[newCaptain].logo = e.target.result;
      updateLeaderboard();
      saveState();
    };
    r.readAsDataURL(file);
  }

  teamModal.classList.add("hidden");
  updateLeaderboard();
  saveState();
};

  /* =======================
     HELPERS
     ======================= */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }


  function updatePlayerCount() {
    playerCount.textContent = players.length;
  }

  function showUndoToast(type) {
  lastActionType = type;

  undoText.textContent =
    type === "sold"
      ? "Player sold. Undo?"
      : "Player skipped. Undo?";

  undoToast.classList.remove("hidden");

  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndoToast, 5000);
}

function hideUndoToast() {
  undoToast.classList.add("hidden");
  lastActionType = null;
}

undoBtn.addEventListener("click", () => {
  const action = lastActionType; // ✅ store first

  hideUndoToast();

  if (action === "sold") {
    undoLastSale();
  }

  if (action === "skipped") {
    undoSkippedPlayer();
  }
});



function showResultMessage(msg, timeout = 3000) {
  result.textContent = msg;

  if (timeout) {
    setTimeout(() => {
      result.textContent = "";
    }, timeout);
  }
}


function glowTeam(team) {
  const teamPanel = document.querySelector(`[data-team="${team}"]`);
  if (!teamPanel) return;

  teamPanel.classList.add("team-glow");
  setTimeout(() => {
    teamPanel.classList.remove("team-glow");
  }, 900);
}

function showSoldSummary({ player, bidder, amount }) {
  const meta = playerMeta[player] || {};
  const prevTeam = meta.prevTeam;
  const prevLogo = prevTeam ? teamLogos[prevTeam] : null;
  const newLogo = teamMeta[bidder]?.logo || null;

  auctionSection.innerHTML = `
    <div class="sold-summary">

      <div class="sold-player-name hidden">${player}</div>

      <div class="sold-transfer-row">
        ${prevLogo
          ? `<img class="sold-logo hidden" id="prevLogo" src="${prevLogo}">`
          : `<div class="sold-logo sold-no-team hidden" id="prevLogo"></div>`}
        <span class="sold-arrow hidden" id="soldArrow">➜</span>
        ${newLogo
          ? `<img class="sold-logo hidden" id="newLogo" src="${newLogo}">`
          : `<div class="sold-logo sold-no-team hidden" id="newLogo"></div>`}
      </div>

      <div class="sold-price hidden">₹${amount}</div>

    </div>
  `;

  // 🔥 SEQUENCE CONTROLLER
  setTimeout(() => {
    document.querySelector(".sold-player-name")?.classList.remove("hidden");
  }, 100);

  setTimeout(() => {
    document.getElementById("prevLogo")?.classList.remove("hidden");
  }, 400);

  setTimeout(() => {
    document.getElementById("soldArrow")?.classList.remove("hidden");
  }, 800);

  setTimeout(() => {
    document.getElementById("newLogo")?.classList.remove("hidden");
  }, 1200);

  setTimeout(() => {
    document.querySelector(".sold-price")?.classList.remove("hidden");
  }, 1800);
}


function clearSoldSummary() {
  auctionSection.innerHTML = "";
}

function registerSoldRevealTimeout(id) {
  soldRevealState.timeouts.push(id);
}

function skipSoldRevealAnimation() {
  soldRevealState.timeouts.forEach(clearTimeout);
  soldRevealState.timeouts = [];

  if (soldRevealState.overlay) {
    // instantly show all hidden elements before removing
    soldRevealState.overlay.querySelectorAll(".hidden").forEach(el => {
      el.classList.remove("hidden");
    });
    // small delay so user sees the full result for a frame before dismissing
    setTimeout(() => {
      if (soldRevealState.overlay) {
        soldRevealState.overlay.remove();
        soldRevealState.overlay = null;
      }
      soldRevealState.active = false;
      if (typeof soldRevealState.done === "function") {
        soldRevealState.done();
      }
    }, 80);
  } else {
    soldRevealState.active = false;
    if (typeof soldRevealState.done === "function") {
      soldRevealState.done();
    }
  }
}


  /* =======================
     PLAYERS
     ======================= */
addPlayerBtn.addEventListener("click", () => {
  const name = playerInput.value.trim();
  if (!name) return;

  if (players.map(p => p.toLowerCase()).includes(name.toLowerCase())) {
    alert("Player already exists");
    return;
  }

  openPlayerDataModal(name, false);
});


pdConfirm.addEventListener("click", () => {
  const newName = pdName.value.trim();
  if (!newName) return;

  const cardType = pdCardType.value;
  const prevTeam = document.getElementById("pdPrevTeam").value || null;

  /* =======================
     EDIT MODE
     ======================= */
  if (editingPlayer) {
    const oldName = editingPlayer;

    // 🛑 duplicate name check
    if (
      newName !== oldName &&
      players.some(p => p.toLowerCase() === newName.toLowerCase())
    ) {
      alert("Player name already exists");
      return;
    }

    // 🔄 rename inside players[]
    const idx = players.indexOf(oldName);
    if (idx !== -1) {
      players[idx] = newName;
    }

    // 🔄 migrate metadata
    playerMeta[newName] = {
      cardType,
      prevTeam
    };
    delete playerMeta[oldName];

    // 🔄 update teams
    Object.keys(bidderTeams).forEach(team => {
      const t = bidderTeams[team];
      const pIdx = t.indexOf(oldName);
      if (pIdx !== -1) {
        t[pIdx] = newName;
      }
    });

    // 🔄 update sold history
    soldHistory.forEach(s => {
      if (s.player === oldName) {
        s.player = newName;
      }
    });
    renderSoldHistory();

    // 🔄 update live auction references
    if (currentPlayer === oldName) currentPlayer = newName;
    if (pendingPlayer === oldName) pendingPlayer = newName;

    editingPlayer = null;
    renderPlayers();
    updateLeaderboard();
    closePlayerDataModal();
    saveState();
    return;
  }

  /* =======================
     ADD MODE
     ======================= */
  if (
    players.some(p => p.toLowerCase() === newName.toLowerCase())
  ) {
    alert("Player already exists");
    return;
  }

  players.push(newName);
  playerMeta[newName] = {
    cardType,
    prevTeam
  };

  renderPlayers();
  closePlayerDataModal();
  saveState();
});




  // Open player data modal instead of adding directly
  function openPlayerDataModal(name, isEdit = false) {
    pdName.value = name;

    if (isEdit) {
      pdCardType.value = playerMeta[name]?.cardType || "silver";
      document.getElementById("pdPrevTeam").value = playerMeta[name]?.prevTeam || "";
    } else {
      pdCardType.value = "silver";
      document.getElementById("pdPrevTeam").value = "";
    }

    editingPlayer = isEdit ? name : null;
    pdName.readOnly = false;
    pdConfirm.textContent = isEdit ? "Save Changes" : "Add";
    pdModal.classList.remove("hidden");
  }

function closePlayerDataModal() {
  editingPlayer = null;
  pdConfirm.textContent = "Add";
  pdModal.classList.add("hidden");
  playerInput.value = "";
}
pdClose.addEventListener("click", closePlayerDataModal);
pdCancel.addEventListener("click", closePlayerDataModal);


function openTeamEditModal(captain) {
  editingTeam = captain;

  const meta = teamMeta[captain];

  teamCaptainInput.value = captain;
  teamNameInput.value = meta.teamName || "";
  teamLogoInput.value = "";

  teamConfirmBtn.textContent = "Save Changes";
  teamModal.classList.remove("hidden");
}


teamClose.onclick = teamCancel.onclick = () => {
  editingTeam = null;
  teamConfirmBtn.textContent = "Add Team";
  teamModal.classList.add("hidden");
};



  function renderPlayers() {
  playerList.innerHTML = "";
  updatePlayerCount();

  const grid = document.createElement("div");
  grid.className = "player-grid";

  players.forEach(p => {
    const chip = document.createElement("button");
    chip.className = "player-chip";
    chip.textContent = p;

    chip.onclick = () => {
      openPlayerDataModal(p, true); // 🔥 EDIT MODE
    };

    grid.appendChild(chip);
  });

  playerList.appendChild(grid);
}


function glowTeamPanel(team) {
  const panel = document.querySelector(`[data-team="${team}"]`);
  if (!panel) return;
  panel.classList.add("team-glow");
}

function removeGlowFromTeam(team) {
  const panel = document.querySelector(`[data-team="${team}"]`);
  if (!panel) return;
  panel.classList.remove("team-glow");
}

function removeRevealCard() {
  const overlay = document.querySelector(".reveal-overlay");
  if (overlay) overlay.remove();
}

function glowTeamPanel(team) {
  const panel = document.querySelector(`[data-team="${team}"]`);
  if (!panel) return;
  panel.classList.add("team-glow");
}

function removeGlowFromTeam(team) {
  const panel = document.querySelector(`[data-team="${team}"]`);
  if (!panel) return;
  panel.classList.remove("team-glow");
}



  /* =======================
     UNSOLD
     ======================= */

  function renderUnsold() {
    unsoldList.innerHTML = unsoldPlayers.map(p => `<li>${escapeHtml(p)}</li>`).join("");
  }

  /* =======================
   SOLD HISTORY
   ======================= */

const soldHistory = [];
const soldHistoryList = document.getElementById("soldHistoryList");

function renderSoldHistory() {
  soldHistoryList.innerHTML = soldHistory
    .map(
      s =>
        `<li>${escapeHtml(s.player)} → <strong>${escapeHtml(
          s.bidder
        )}</strong> (₹${s.amount})</li>`
    )
    .join("");
}


  /* =======================
     LEADERBOARD (SPLIT)
     ======================= */

  function updateLeaderboard() {
    leftBoard.innerHTML = "";
    rightBoard.innerHTML = "";

    // Compute top 5 most expensive sold players
    const sorted = [...soldHistory].sort((a, b) => b.amount - a.amount);
    const top5 = sorted.slice(0, 5);
    // Map player name → rank (1 = most expensive)
    const rankMap = {};
    top5.forEach((s, i) => { rankMap[s.player] = i + 1; });

    const maxPlayers = totalPlayersAtStart
      ? Math.ceil(totalPlayersAtStart / Math.max(1, Object.keys(bidders).length))
      : 8;

    // ── Compute badges for leaderboard ──
    let lbAggressiveBidder = null, lbMaxBids = 0;
    Object.entries(sessionBidCounts).forEach(([b, c]) => {
      if (c > lbMaxBids) { lbMaxBids = c; lbAggressiveBidder = b; }
    });
    if (lbMaxBids < 3) lbAggressiveBidder = null;

    let lbRivalA = null, lbRivalB = null, lbRivalMax = 0;
    Object.entries(rivalryMap).forEach(([key, count]) => {
      if (count > lbRivalMax) { lbRivalMax = count; [lbRivalA, lbRivalB] = key.split("|"); }
    });
    if (lbRivalMax < 4) { lbRivalA = null; lbRivalB = null; }

    let lbQuietest = null, lbMinBids = Infinity;
    Object.keys(bidders).forEach(b => {
      const c = sessionBidCounts[b] || 0;
      if (c < lbMinBids) { lbMinBids = c; lbQuietest = b; }
    });
    if (Object.keys(bidders).length < 2 || lbMinBids > 1) lbQuietest = null;

    Object.keys(bidders).forEach((bidder, i) => {
      const meta = teamMeta[bidder] || {};
      const team = bidderTeams[bidder] || [];
      const budget = bidders[bidder];
      const isLowBudget = budget <= 100;
      const isCrown = mostExpensiveSale && mostExpensiveSale.bidder === bidder;
      const strengthPct = Math.min(100, Math.round((team.length / maxPlayers) * 100));

      // ── Badges for this team ──
      const aggBadge = bidder === lbAggressiveBidder
        ? `<span class="lb-badge lb-badge-aggressive" title="${lbMaxBids} bids this session">🔥 Most Aggressive</span>` : "";
      const rivalBadge = (bidder === lbRivalA || bidder === lbRivalB)
        ? `<span class="lb-badge lb-badge-rival" title="Rivals with ${bidder === lbRivalA ? lbRivalB : lbRivalA}">⚔️ Rivals</span>` : "";
      const quietBadge = bidder === lbQuietest
        ? `<span class="lb-badge lb-badge-quiet">😴 Quietest</span>` : "";

      const card = document.createElement("div");
      card.className = "team-leader" + (isLowBudget ? " low-budget" : "");
      card.dataset.team = bidder;
      card.onclick = () => {
        if (revealState.active || soldState.active) return;
        openTeamEditModal(bidder);
      };

      const playerTags = team.map(p => {
        const rank = rankMap[p];
        // 👑 Highest bid: top sold player by price
        const isHighestBid = rank === 1;
        // 🎯 Most contested: the all-time most-bid-on player (only if they are SOLD, i.e. in a team)
        const isMostContested = mostContestedRecord.player === p && mostContestedRecord.count > 0;

        let cls = "team-player-tag";
        if (isHighestBid && isMostContested) cls += " tag-highest-bid tag-most-contested";
        else if (isHighestBid)               cls += " tag-highest-bid";
        else if (isMostContested)            cls += " tag-most-contested";

        const crownLabel   = isHighestBid    ? `<span class="rank-crown">👑</span>` : "";
        const contestLabel = isMostContested ? `<span class="tag-contested-icon">🎯</span>` : "";

        return `<span class="${cls}" title="${isHighestBid ? 'Highest sold player' : ''}${isMostContested ? ' · Most contested' : ''}">${crownLabel}${contestLabel}${escapeHtml(p)}</span>`;
      }).join("") || "<span class='team-player-tag muted'>No players</span>";

      card.innerHTML = `
        ${meta.logo ? `<img class="circle-logo" src="${meta.logo}">` : ""}
        <div class="team-info">
          <h4>
            ${escapeHtml(meta.teamName || "Team")} (${team.length})
            ${isLowBudget ? `<span class="low-budget-badge">Low Budget</span>` : ""}
          </h4>
          <p>
            <strong>${escapeHtml(bidder)}</strong> — ₹${budget}
            ${aggBadge}${rivalBadge}${quietBadge}
          </p>
          <div class="strength-meter">
            <div class="strength-bar" style="width:${strengthPct}%"></div>
          </div>
          <div class="team-players">${playerTags}</div>
        </div>
      `;

      (i < 4 ? leftBoard : rightBoard).appendChild(card);
    });
  }

  /* =======================
     AUCTION CORE
     ======================= */

  let currentPlayer = null;
  let currentBid = 25;
  let currentBidder = null;
  let lastSale = null;
  let auctionLocked = false;
  let lastSkip = null;
  let undoTimer = null;
  let lastActionType = null;
  let pendingPlayer = null;
  let auctionTimer = null;
  let timeLeft = 0;
  let timerRunning = false;
  let extraTimeCount = 0;
  let remainingTopPlayers = [];
  let availableTeamsForTop = [];
  let topAllocationIndex = 0;
  let allocatedTopTeams = new Set();
  let topAllocIndex = 0;
  let editingPlayer = null;
  let editingTeam = null;

  // ── NEW FEATURE STATE ──
  let bidLog = [];
  let recentBidders = [];
  let mostExpensiveSale = null;
  let totalPlayersAtStart = 0;
  let currentBannerGradient = "";
  let warPhraseLastAt = 0;
  let currentWarPhraseIdx = 0;

  // ── SESSION STATS (persist across players) ──
  let sessionBidCounts = {};        // total bids per bidder across whole auction
  let rivalryMap = {};              // "A|B" → head-to-head clash count

  // ── FEATURE: MOST CONTESTED PLAYER ──
  let currentPlayerBidCount = 0;
  let mostContestedRecord = { player: null, count: 0 };

  // ── FEATURE: SILENT ASSASSIN ──
  let auctionPlayerIndex = 0;
  let teamLastBidAuctionIndex = {};
  let silentAssassinCandidate = null;

  // ── FEATURE: SPENDING SPREE ──
  let teamConsecutiveWins = {};
  let lastWinner = null;

  // ── FEATURE: REDEMPTION ARC ──
  let firstRoundUnsoldSet = new Set();
  let isRound2 = false;

  // ── FEATURE: DARK HORSE ──
  let goldSoldPrices = [];

  // ── FEATURE: MILESTONES / RECORD ──
  let milestoneShown = { 25: false, 50: false, 75: false };

  // ── FLASH BANNER STATE (fire-once triggers) ──
  let lastFlashContestCount = 0;   // bid count at which contest flash last fired
  let lastFlashRecordAmount = 0;   // sale amount at which record flash last fired

  /* =======================
     PERSISTENCE
     ======================= */

  let _saveIndicatorTimer = null;

  function saveState() {
    try {
      const state = {
        players,
        unsoldPlayers,
        bidders,
        bidderTeams,
        teamMeta,
        playerMeta,
        soldHistory,
        lastSale,
        mostExpensiveSale,
        totalPlayersAtStart,
        currentPlayer,
        currentBid,
        currentBidder,
        thunderRevealCount,
        lastThunderRevealIndex,
        revealTotalIndex,
        sessionBidCounts,
        rivalryMap,
        mostContestedRecord,
        teamConsecutiveWins,
        lastWinner,
        goldSoldPrices,
        milestoneShown,
        isRound2
      };
      localStorage.setItem("auction_state_v1", JSON.stringify(state));

      // flash "💾 Saved" indicator
      const ind = document.getElementById("saveIndicator");
      if (ind) {
        ind.classList.add("visible");
        clearTimeout(_saveIndicatorTimer);
        _saveIndicatorTimer = setTimeout(() => ind.classList.remove("visible"), 1400);
      }
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem("auction_state_v1");
      if (!raw) return;
      const s = JSON.parse(raw);

      players.push(...(s.players || []));
      unsoldPlayers.push(...(s.unsoldPlayers || []));
      Object.assign(bidders, s.bidders || {});
      Object.assign(bidderTeams, s.bidderTeams || {});
      Object.assign(teamMeta, s.teamMeta || {});
      Object.assign(playerMeta, s.playerMeta || {});
      soldHistory.push(...(s.soldHistory || []));

      lastSale            = s.lastSale            ?? null;
      mostExpensiveSale   = s.mostExpensiveSale   ?? null;
      totalPlayersAtStart = s.totalPlayersAtStart  ?? 0;
      currentPlayer       = s.currentPlayer       ?? null;
      currentBid          = s.currentBid          ?? 25;
      currentBidder       = s.currentBidder       ?? null;
      thunderRevealCount      = s.thunderRevealCount      ?? 0;
      lastThunderRevealIndex  = s.lastThunderRevealIndex  ?? -999;
      revealTotalIndex        = s.revealTotalIndex        ?? 0;
      Object.assign(sessionBidCounts, s.sessionBidCounts || {});
      Object.assign(rivalryMap,       s.rivalryMap       || {});
      Object.assign(teamConsecutiveWins, s.teamConsecutiveWins || {});
      if (s.mostContestedRecord) mostContestedRecord = s.mostContestedRecord;
      if (s.lastWinner)          lastWinner          = s.lastWinner;
      if (s.goldSoldPrices)      goldSoldPrices.push(...s.goldSoldPrices);
      if (s.milestoneShown)      Object.assign(milestoneShown, s.milestoneShown);
      if (s.isRound2)            isRound2            = s.isRound2;
    } catch (e) {
      console.warn("Load failed:", e);
    }
  }
  




  function renderAuctionIdle() {
  if (soldState.active) return;

  auctionSection.innerHTML = `
    <p class="muted">Ready for next auction</p>

    <div class="auction-actions">
      <button id="startAuctionBtn">Start Auction</button>
      <button id="undoLastSaleBtn" class="secondary-btn">↺ Undo Last Sale</button>
    </div>
  `;

  document.getElementById("startAuctionBtn").onclick = startAuction;

  const undoBtn = document.getElementById("undoLastSaleBtn");
  if (undoBtn) {
    undoBtn.onclick = undoLastSale;
  }
}


function startAuctionTimer(seconds) {
  clearAuctionTimer();

  timeLeft = seconds;
  timerRunning = true;

  const timerBox = document.getElementById("auctionTimer");
  const timerValue = document.getElementById("timerValue");

  if (!timerBox || !timerValue) return;

  timerBox.classList.remove("hidden");
  timerBox.classList.remove("red");
  


  timerValue.textContent = timeLeft;

  auctionTimer = setInterval(() => {
    timeLeft--;
    timerValue.textContent = timeLeft;

    if (timeLeft <= 5 && timeLeft > 0) {
  timerBox.classList.add("red");

  tickSound.currentTime = 0;
  tickSound.play();

  setTimeout(() => {
    tickSound.pause();
  }, 650);
}

    // 🔥 SCREEN SHAKE — last 3 seconds
    if (timeLeft <= 3 && timeLeft > 0) {
      auctionSection.classList.add("auction-shake");
      setTimeout(() => auctionSection.classList.remove("auction-shake"), 500);
    }

    // Going once / going twice text
    if (timeLeft === 10 && currentBidder) {
      result.textContent = `🔔 Going once… ${currentBidder} leads at ₹${currentBid}`;
    }
    if (timeLeft === 5 && currentBidder) {
      result.textContent = `🔔 Going twice… ${currentBidder} leads at ₹${currentBid}`;
    }



    if (timeLeft <= 0) {
  clearAuctionTimer();
  timerValue.textContent = "0";
  buzzerSound.play();
  result.textContent = "⏱ Time is up";
}}, 1000);
}

function clearAuctionTimer() {
  if (auctionTimer) {
    clearInterval(auctionTimer);
    auctionTimer = null;
  }
  timerRunning = false;
}


function showLiveBidding() {
  // ① Bidding war — 2 teams bid 3 times each (6 bids), OR 3 teams bid 3 times (last 9 bids)
  let isBiddingWar = false;
  let warTeams = [];
  let intruder = null; // third party who just broke into an existing war

  // Check 2-team war: last 6 bids, only 2 unique teams, each bid at least 3 times
  const last6 = recentBidders.slice(-6);
  if (last6.length >= 6) {
    const unique6 = [...new Set(last6)];
    if (unique6.length === 2 &&
        last6.filter(b => b === unique6[0]).length >= 3 &&
        last6.filter(b => b === unique6[1]).length >= 3) {
      isBiddingWar = true;
      warTeams = unique6;
    }
  }

  // Check 3-team war: last 9 bids, only 3 unique teams, each bid at least 3 times
  if (!isBiddingWar) {
    const last9 = recentBidders.slice(-9);
    if (last9.length >= 9) {
      const unique9 = [...new Set(last9)];
      if (unique9.length === 3 &&
          unique9.every(t => last9.filter(b => b === t).length >= 3)) {
        isBiddingWar = true;
        warTeams = unique9;
      }
    }
  }

  // Intruder check: was there a 2-team war before the last bid broke it?
  if (!isBiddingWar && recentBidders.length >= 7) {
    const prev6 = recentBidders.slice(-7, -1);
    const prevUnique = [...new Set(prev6)];
    const latest = recentBidders[recentBidders.length - 1];
    if (prevUnique.length === 2 &&
        prev6.filter(b => b === prevUnique[0]).length >= 3 &&
        prev6.filter(b => b === prevUnique[1]).length >= 3 &&
        !prevUnique.includes(latest)) {
      intruder = latest;
      warTeams = prevUnique;
    }
  }

  // Fightback check: after intruder joined, a war team bids back
  let fightbackBidder = null;
  let fightbackIntruder = null;
  if (!isBiddingWar && !intruder && recentBidders.length >= 8) {
    const prev7 = recentBidders.slice(-8, -1);
    const prevUnique6 = [...new Set(prev7.slice(0, 6))];
    const prev7Unique = [...new Set(prev7)];
    const latest = recentBidders[recentBidders.length - 1];
    if (prevUnique6.length === 2 &&
        prev7.slice(0,6).filter(b => b === prevUnique6[0]).length >= 3 &&
        prev7.slice(0,6).filter(b => b === prevUnique6[1]).length >= 3 &&
        prev7Unique.length === 3 &&
        prevUnique6.includes(latest)) {
      fightbackBidder = latest;
      fightbackIntruder = prev7Unique.find(t => !prevUnique6.includes(t));
    }
  }

  // Random banner gradients
  const bannerGradients = [
    "linear-gradient(135deg,#ff6b00,#e53935)",
    "linear-gradient(135deg,#6a0dad,#c0392b)",
    "linear-gradient(135deg,#0057b8,#00b4d8)",
    "linear-gradient(135deg,#1a7a4a,#f4c430)",
    "linear-gradient(135deg,#b5179e,#7209b7)",
    "linear-gradient(135deg,#e63946,#f77f00)",
    "linear-gradient(135deg,#023e8a,#48cae4)",
    "linear-gradient(135deg,#d62828,#f77f00)",
    "linear-gradient(135deg,#2d6a4f,#74c69d)",
    "linear-gradient(135deg,#7b2d8b,#e040fb)",
    "linear-gradient(135deg,#c77dff,#480ca8)",
    "linear-gradient(135deg,#ef233c,#8d99ae)",
    "linear-gradient(135deg,#f72585,#b5179e)",
    "linear-gradient(135deg,#3a0ca3,#4cc9f0)",
    "linear-gradient(135deg,#ff4800,#ff9500)",
  ];
  const bg = currentBannerGradient || bannerGradients[0];

  // War phrases (70 total)
  const warPhrases = [
    (t1,t2) => `🔥 Bidding War! — <strong>${t1}</strong> vs <strong>${t2}</strong>`,
    (t1,t2) => `⚔️ It's a battle! — <strong>${t1}</strong> and <strong>${t2}</strong> won't back down!`,
    (t1,t2) => `💰 Who wants it more? — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `😤 Neither side is giving up! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎯 This is getting serious! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🏆 Only one can win! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🚀 The bids keep flying! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `😱 They just won't stop! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `💥 WAR! — <strong>${t1}</strong> vs <strong>${t2}</strong> — someone back down!`,
    (t1,t2) => `👑 Pride is on the line! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🔔 Going… going… NOT gone yet! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `😤 <strong>${t1}</strong> says no, <strong>${t2}</strong> says no too!`,
    (t1,t2) => `🌋 This is ERUPTING! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎪 The crowd is going wild! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `💸 Budget? What budget? — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🥊 A fight to the finish! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎭 Drama in the auction room! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `⚡ Sparks flying! — <strong>${t1}</strong> and <strong>${t2}</strong> are locked in!`,
    (t1,t2) => `🏟️ The whole room is watching — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `😬 Someone is going to regret this — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎰 Place your bets — <strong>${t1}</strong> vs <strong>${t2}</strong> shows no signs of stopping!`,
    (t1,t2) => `🫀 Hearts are racing! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🧨 This could EXPLODE any second — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎸 The auction room just turned into a stage — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🌊 The bids are flooding in — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🏹 Both sides are LOCKED ON — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `😵 Nobody can look away — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🔑 Who holds the key? — <strong>${t1}</strong> or <strong>${t2}</strong>?`,
    (t1,t2) => `🤯 UNBELIEVABLE! — <strong>${t1}</strong> and <strong>${t2}</strong> refuse to quit!`,
    (t1,t2) => `💎 They both want this gem badly — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎤 Someone drop the mic — <strong>${t1}</strong> vs <strong>${t2}</strong> is heating up!`,
    (t1,t2) => `🔮 Nobody knows how this ends — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🌡️ The temperature is RISING — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎯 Every bid is a bullet — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🦁 Two lions fighting — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🚂 This train has no brakes — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `💬 Words won't settle this — only bids will! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🧠 Who blinks first? — <strong>${t1}</strong> or <strong>${t2}</strong>?`,
    (t1,t2) => `🔥 Pure determination — <strong>${t1}</strong> and <strong>${t2}</strong> want this player!`,
    (t1,t2) => `😏 <strong>${t1}</strong> raises. <strong>${t2}</strong> raises back. No end in sight!`,
    (t1,t2) => `🎡 This is a rollercoaster! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🌪️ A storm is brewing — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🏋️ Heavy lifters! — <strong>${t1}</strong> and <strong>${t2}</strong> are going all in!`,
    (t1,t2) => `🎻 A symphony of bids — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🧲 They can't resist! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🏄 Riding the wave — <strong>${t1}</strong> and <strong>${t2}</strong> just keep going!`,
    (t1,t2) => `😤 Neither captain is backing off — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `⚙️ The auction machine is on fire — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🪖 Battle mode activated — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🎆 Fireworks in the auction room — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🕹️ This is the final boss fight — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🧗 Climbing higher and higher — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🥷 Silent but deadly — <strong>${t1}</strong> and <strong>${t2}</strong> keep raising!`,
    (t1,t2) => `🎯 Locked in a duel — <strong>${t1}</strong> vs <strong>${t2}</strong>, who will crack?`,
    (t1,t2) => `🌟 Stars collide! — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🤺 En garde! — <strong>${t1}</strong> vs <strong>${t2}</strong> in a fencing match of bids!`,
    (t1,t2) => `🎠 Going around and around — <strong>${t1}</strong> vs <strong>${t2}</strong>, when does it stop?`,
    (t1,t2) => `🦅 Eagles in the sky — <strong>${t1}</strong> and <strong>${t2}</strong> won't land yet!`,
    (t1,t2) => `🧯 Someone call the fire brigade — <strong>${t1}</strong> vs <strong>${t2}</strong> is BLAZING!`,
    (t1,t2) => `🎳 Strike after strike — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🪄 Magic in the air — <strong>${t1}</strong> and <strong>${t2}</strong> are spellbound!`,
    (t1,t2) => `🚨 RED ALERT — <strong>${t1}</strong> vs <strong>${t2}</strong> is out of control!`,
    (t1,t2) => `🎖️ A medal-worthy battle — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🌈 Every bid more colourful than the last — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🔴 CODE RED! — <strong>${t1}</strong> and <strong>${t2}</strong> are going to the wire!`,
    (t1,t2) => `🎢 Hold on tight! — <strong>${t1}</strong> vs <strong>${t2}</strong> is one wild ride!`,
    (t1,t2) => `💫 Out of this world — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🥵 Someone is sweating — <strong>${t1}</strong> vs <strong>${t2}</strong>!`,
    (t1,t2) => `🏁 No finish line in sight — <strong>${t1}</strong> vs <strong>${t2}</strong> keeps going!`,
    (t1,t2) => `🫵 The room points at <strong>${t1}</strong> and <strong>${t2}</strong> — who breaks first?`,
  ];

  // Fightback phrases (30 total)
  const fightbackPhrases = [
    (b,i) => `😤 <strong>${b}</strong> is NOT giving up that easy!`,
    (b,i) => `🔥 <strong>${b}</strong> fires back — <strong>${i}</strong>, you thought wrong!`,
    (b,i) => `💪 <strong>${b}</strong> says — I was here first!`,
    (b,i) => `👊 <strong>${b}</strong> hits back hard — <strong>${i}</strong> better be ready!`,
    (b,i) => `😡 <strong>${b}</strong> is furious — nobody takes this from them!`,
    (b,i) => `🚀 <strong>${b}</strong> raises the stakes — <strong>${i}</strong>, can you keep up?`,
    (b,i) => `⚡ <strong>${b}</strong> won't back down for anyone — not even <strong>${i}</strong>!`,
    (b,i) => `🤺 <strong>${b}</strong> counter-attacks! — The battle rages on!`,
    (b,i) => `😏 <strong>${b}</strong> smiles and bids again — this is far from over!`,
    (b,i) => `🔔 <strong>${b}</strong> responds instantly — Did you really think that'd stop them?`,
    (b,i) => `🏆 <strong>${b}</strong> refuses to lose — <strong>${i}</strong>, you've been warned!`,
    (b,i) => `💥 <strong>${b}</strong> explodes back — This is a WAR now!`,
    (b,i) => `😤 Watch out <strong>${i}</strong> — <strong>${b}</strong> just came alive!`,
    (b,i) => `🎯 <strong>${b}</strong> locks in — They're not going anywhere!`,
    (b,i) => `🌋 <strong>${b}</strong> erupts! — <strong>${i}</strong> just woke a sleeping giant!`,
    (b,i) => `😈 <strong>${b}</strong> grins and raises — <strong>${i}</strong>, welcome to the fight!`,
    (b,i) => `🛡️ <strong>${b}</strong> stands their ground — nobody is taking this player!`,
    (b,i) => `🔥 <strong>${b}</strong> says ENOUGH — bidding back with full force!`,
    (b,i) => `👀 <strong>${b}</strong> stares down <strong>${i}</strong> and raises the bid!`,
    (b,i) => `⚔️ <strong>${b}</strong> draws the sword — <strong>${i}</strong>, the real fight starts now!`,
    (b,i) => `🦁 <strong>${b}</strong> roars back — <strong>${i}</strong>, you poked the wrong lion!`,
    (b,i) => `😂 <strong>${b}</strong> laughs at <strong>${i}</strong>'s bid and goes higher!`,
    (b,i) => `🧠 <strong>${b}</strong> was expecting this — already one step ahead of <strong>${i}</strong>!`,
    (b,i) => `🎯 <strong>${b}</strong> has tunnel vision — <strong>${i}</strong> doesn't exist right now!`,
    (b,i) => `🥶 Ice cold response from <strong>${b}</strong> — <strong>${i}</strong> didn't shake them at all!`,
    (b,i) => `🏃 <strong>${b}</strong> sprints back into the race — <strong>${i}</strong>, try harder!`,
    (b,i) => `🌊 <strong>${b}</strong> rides the wave right back — <strong>${i}</strong>, hold on!`,
    (b,i) => `🎭 The audience gasps as <strong>${b}</strong> bids again — <strong>${i}</strong> is shook!`,
    (b,i) => `🔑 <strong>${b}</strong> holds the key — <strong>${i}</strong> is not getting in!`,
    (b,i) => `💎 <strong>${b}</strong> says this gem is MINE — <strong>${i}</strong>, back off!`,
  ];

  // Intruder phrases (20 total)
  const intruderPhrases = [
    (n,t1,t2) => `⚡ <strong>${n}</strong> enters the war! — ${t1} vs ${t2}, watch out!`,
    (n,t1,t2) => `🚨 Here comes <strong>${n}</strong>! — ${t1} &amp; ${t2} have a new challenger!`,
    (n,t1,t2) => `💥 <strong>${n}</strong> crashes the party! — ${t1} vs ${t2} just got spicy!`,
    (n,t1,t2) => `😤 <strong>${n}</strong> says "Not so fast!" — ${t1} vs ${t2}, it's a 3-way now!`,
    (n,t1,t2) => `🔥 <strong>${n}</strong> jumps in! — ${t1} &amp; ${t2} didn't see that coming!`,
    (n,t1,t2) => `⚔️ <strong>${n}</strong> has entered the building! — ${t1} vs ${t2} vs <strong>${n}</strong>!`,
    (n,t1,t2) => `👀 <strong>${n}</strong> is HERE! — ${t1} and ${t2} better step up!`,
    (n,t1,t2) => `🎯 <strong>${n}</strong> wants a piece too! — This just got interesting!`,
    (n,t1,t2) => `😱 SURPRISE! <strong>${n}</strong> shows up! — ${t1} vs ${t2} is now a full battle!`,
    (n,t1,t2) => `🌪️ <strong>${n}</strong> blows in! — ${t1} &amp; ${t2}, your war just got a new enemy!`,
    (n,t1,t2) => `😎 Nobody invited <strong>${n}</strong> — but they're here anyway!`,
    (n,t1,t2) => `🤑 <strong>${n}</strong> smells an opportunity — ${t1} &amp; ${t2}, stay alert!`,
    (n,t1,t2) => `🎺 ANNOUNCING — <strong>${n}</strong> has arrived! — ${t1} vs ${t2}, it's getting crowded!`,
    (n,t1,t2) => `😂 <strong>${n}</strong> was watching quietly… not anymore! — ${t1} &amp; ${t2} beware!`,
    (n,t1,t2) => `🕵️ <strong>${n}</strong> was waiting for the right moment — and that moment is NOW!`,
    (n,t1,t2) => `🐉 <strong>${n}</strong> awakens! — ${t1} &amp; ${t2}, the dragon has entered the room!`,
    (n,t1,t2) => `🎲 <strong>${n}</strong> rolls the dice! — ${t1} vs ${t2}, this just became unpredictable!`,
    (n,t1,t2) => `🚁 <strong>${n}</strong> drops in from nowhere! — ${t1} &amp; ${t2} didn't see that coming!`,
    (n,t1,t2) => `💣 <strong>${n}</strong> throws a grenade into the war! — ${t1} vs ${t2}, brace yourselves!`,
    (n,t1,t2) => `🎭 Plot twist! — <strong>${n}</strong> steps forward! — ${t1} &amp; ${t2}, your duel just became a trio!`,
    (n,t1,t2) => `🧨 <strong>${n}</strong> lights the fuse! — ${t1} &amp; ${t2}, this just got dangerous!`,
    (n,t1,t2) => `🌊 <strong>${n}</strong> surges in like a wave! — ${t1} vs ${t2}, hold your ground!`,
    (n,t1,t2) => `🦅 <strong>${n}</strong> swoops down! — ${t1} &amp; ${t2} didn't expect that!`,
    (n,t1,t2) => `🎪 Ladies and gentlemen — <strong>${n}</strong> has joined the circus! — ${t1} vs ${t2}!`,
    (n,t1,t2) => `🔮 The crystal ball saw this coming — <strong>${n}</strong> is in! — ${t1} vs ${t2} vs <strong>${n}</strong>!`,
    (n,t1,t2) => `🚂 <strong>${n}</strong> rolls in like a freight train! — ${t1} &amp; ${t2}, move aside!`,
    (n,t1,t2) => `🥷 Out of the shadows — <strong>${n}</strong> strikes! — ${t1} vs ${t2}, new threat detected!`,
    (n,t1,t2) => `😈 The villain has arrived — <strong>${n}</strong> is here! — ${t1} &amp; ${t2}, beware!`,
    (n,t1,t2) => `🎯 <strong>${n}</strong> takes aim at this player too — ${t1} &amp; ${t2}, competition just tripled!`,
    (n,t1,t2) => `🌟 A new star enters! — <strong>${n}</strong> wants in — ${t1} vs ${t2} vs <strong>${n}</strong>!`,
  ];

  // Only refresh war phrase every 4 bids (2 back-and-forth exchanges)
  const bidsSinceLastPhrase = recentBidders.length - warPhraseLastAt;
  const shouldRefreshPhrase = bidsSinceLastPhrase >= 4 || warPhraseLastAt === 0;

  // Build banner
  let bannerHtml = "";
  if (fightbackBidder) {
    const phrase = fightbackPhrases[Math.floor(Math.random() * fightbackPhrases.length)];
    warPhraseLastAt = recentBidders.length;
    bannerHtml = `<div class="bidding-war-banner" style="background:${bg}">${phrase(escapeHtml(fightbackBidder), escapeHtml(fightbackIntruder))}</div>`;
  } else if (intruder) {
    const phrase = intruderPhrases[Math.floor(Math.random() * intruderPhrases.length)];
    warPhraseLastAt = recentBidders.length;
    bannerHtml = `<div class="bidding-war-banner intruder-banner" style="background:${bg}">${phrase(escapeHtml(intruder), escapeHtml(warTeams[0]), escapeHtml(warTeams[1]))}</div>`;
  } else if (isBiddingWar) {
    if (shouldRefreshPhrase) {
      currentWarPhraseIdx = Math.floor(Math.random() * warPhrases.length);
      warPhraseLastAt = recentBidders.length;
    }
    const phrase = warPhrases[currentWarPhraseIdx];
    bannerHtml = `<div class="bidding-war-banner" style="background:${bg}">${phrase(escapeHtml(warTeams[0]), escapeHtml(warTeams[1]))}</div>`;
  }

  // ── SPENDING RATE ──
  let spendingAlertHtml = "";
  {
    let topBidder = null, topSpend = 0;
    Object.keys(bidders).forEach(b => {
      const wins = soldHistory.filter(s => s.bidder === b);
      if (wins.length >= 3) {
        const recent = wins.slice(0, Math.min(5, wins.length));
        const total  = recent.reduce((s, w) => s + w.amount, 0);
        if (total > 300 && total > topSpend) { topSpend = total; topBidder = b; }
      }
    });
    if (topBidder) {
      spendingAlertHtml = `<div class="spending-alert">⚠️ <strong>${escapeHtml(topBidder)}</strong> has spent ₹${topSpend} in their last ${Math.min(5, soldHistory.filter(s=>s.bidder===topBidder).length)} players!</div>`;
    }
  }

  // ── PLAYER NAME GLOW ──
  // Purple glow: current player holds the most-contested record
  const isContestedLive = mostContestedRecord.player === currentPlayer && mostContestedRecord.count > 0;
  // Gold glow: current bid is already breaking the highest-sale record
  const isRecordBidLive = mostExpensiveSale !== null && currentBid > mostExpensiveSale.amount;

  let playerNameClass = "player-name";
  if (isContestedLive && isRecordBidLive) playerNameClass += " player-name-both";
  else if (isContestedLive)              playerNameClass += " player-name-contested";
  else if (isRecordBidLive)             playerNameClass += " player-name-record";

  auctionSection.innerHTML = `
    <h2 class="auction-title">🎯 Auction Area</h2>

    ${bannerHtml}
    ${spendingAlertHtml}

    <div class="auction-focus">
      🔥 <strong>Bidding for:</strong>
      <span class="${playerNameClass}">${escapeHtml(currentPlayer)}</span>
    </div>

    <div class="auction-stats">
      <div>💰 <strong>Current Bid:</strong> ₹<span id="currentBid">${currentBid}</span></div>
      <div>👑 <strong>Leading:</strong> <span id="currentBidder">${currentBidder || "None"}</span></div>
    </div>
  `;

  const timerBox = document.createElement("div");
  timerBox.id = "auctionTimer";
  timerBox.className = "auction-timer hidden";
  timerBox.innerHTML = `⏱ <span id="timerValue">20</span>s`;
  auctionSection.appendChild(timerBox);

  // Sort bidders — most recent bidder first, then 2nd most recent, then rest alphabetically
  const recentOrder = [];
  for (let i = recentBidders.length - 1; i >= 0; i--) {
    if (!recentOrder.includes(recentBidders[i])) {
      recentOrder.push(recentBidders[i]);
    }
  }
  const allBidders = Object.keys(bidders);
  const sortedBidders = [
    ...recentOrder.filter(b => allBidders.includes(b)),
    ...allBidders.filter(b => !recentOrder.includes(b))
  ];

  // ── MOST AGGRESSIVE BIDDER ──
  let aggressiveBidder = null;
  let maxBids = 0;
  Object.entries(sessionBidCounts).forEach(([b, count]) => {
    if (count > maxBids) { maxBids = count; aggressiveBidder = b; }
  });
  if (maxBids < 3) aggressiveBidder = null;

  // ── TOP RIVALRY PAIR ──
  let rivalA = null, rivalB = null, rivalMax = 0;
  Object.entries(rivalryMap).forEach(([key, count]) => {
    if (count > rivalMax) { rivalMax = count; [rivalA, rivalB] = key.split("|"); }
  });
  if (rivalMax < 4) { rivalA = null; rivalB = null; }

  // ── QUIETEST TEAM ──
  let quietestBidder = null, minBidCount = Infinity;
  Object.keys(bidders).forEach(b => {
    const c = sessionBidCounts[b] || 0;
    if (c < minBidCount) { minBidCount = c; quietestBidder = b; }
  });
  // Only show if there are multiple teams and the quietest has at most 1 bid
  if (Object.keys(bidders).length < 2 || minBidCount > 1) quietestBidder = null;

  sortedBidders.forEach(bidder => {
    const points = bidders[bidder];
    const minBid = currentBid + 5;
    const isWar = (isBiddingWar && warTeams.includes(bidder)) || bidder === intruder;

    const row = document.createElement("div");
    row.className = "bid-row" + (isWar ? " bid-row-war" : "");

    row.innerHTML = `
      <div class="bid-row-header">
        <span class="bid-captain-name">${escapeHtml(bidder)}</span>
      </div>
      <div class="bid-row-controls">
        <button class="bid-plus">(₹${points}) ➕ ₹5</button>
        <input type="number" class="bid-input" placeholder="Min ₹${minBid}" />
        <button class="bid-set">Set Bid</button>
      </div>
    `;

    row.querySelector(".bid-plus").addEventListener("click", () => {
      if (points >= currentBid + 5) {
        currentBid += 5;
        currentBidder = bidder;
        recentBidders.push(bidder);
        bidLog.push({ bidder, amount: currentBid });
        // live record bid flash
        if (mostExpensiveSale && currentBid > mostExpensiveSale.amount && currentBid > lastFlashRecordAmount) {
          lastFlashRecordAmount = currentBid;
          showLiveFlashBanner(
            `🏆 LIVE RECORD BID! — <strong>₹${currentBid}</strong> for <strong>${escapeHtml(currentPlayer)}</strong>!`,
            "linear-gradient(135deg,#7b2d00,#e67e22,#ffd700)"
          );
        }
        // track session stats
        sessionBidCounts[bidder] = (sessionBidCounts[bidder] || 0) + 1;
        currentPlayerBidCount++;
        if (currentPlayerBidCount > mostContestedRecord.count) {
          const wasNewRecord = mostContestedRecord.count > 0;
          mostContestedRecord = { player: currentPlayer, count: currentPlayerBidCount };
          // flash banner only when a new all-time record is set (not first time)
          if (wasNewRecord && currentPlayerBidCount > lastFlashContestCount) {
            lastFlashContestCount = currentPlayerBidCount;
            showLiveFlashBanner(
              `🎯 New Most Contested Record! — <strong>${escapeHtml(currentPlayer)}</strong> — ${currentPlayerBidCount} bids!`,
              "linear-gradient(135deg,#1a0050,#6a00c0,#b44fff)"
            );
          } else if (!wasNewRecord) {
            lastFlashContestCount = currentPlayerBidCount;
          }
        }
        // rivalry
        if (recentBidders.length >= 2) {
          const prev = recentBidders[recentBidders.length - 2];
          if (prev !== bidder) {
            const key = [prev, bidder].sort().join("|");
            rivalryMap[key] = (rivalryMap[key] || 0) + 1;
          }
        }
        // silent assassin tracking
        const prevIdx = teamLastBidAuctionIndex[bidder];
        if (prevIdx !== undefined && auctionPlayerIndex - prevIdx >= 5) {
          silentAssassinCandidate = bidder;
        }
        teamLastBidAuctionIndex[bidder] = auctionPlayerIndex;
        // last stand banner (show once per bid, not on every render)
        if (bidders[bidder] - currentBid <= 100 && bidders[bidder] - currentBid >= 0) {
          result.textContent = `⚔️ All or nothing bid from ${bidder}!`;
          setTimeout(() => { if (result.textContent.includes("All or nothing")) result.textContent = ""; }, 2500);
        }
        saveState();
        showLiveBidding();
        startAuctionTimer(20);
      }
    });

    row.querySelector(".bid-set").addEventListener("click", () => {
      const val = parseInt(row.querySelector(".bid-input").value);
      if (isNaN(val) || val <= currentBid) {
        alert("Bid must be greater than current bid");
        return;
      }
      if (val > points) {
        alert("Not enough points");
        return;
      }
      currentBid = val;
      currentBidder = bidder;
      recentBidders.push(bidder);
      bidLog.push({ bidder, amount: currentBid });
      // live record bid flash
      if (mostExpensiveSale && currentBid > mostExpensiveSale.amount && currentBid > lastFlashRecordAmount) {
        lastFlashRecordAmount = currentBid;
        showLiveFlashBanner(
          `🏆 LIVE RECORD BID! — <strong>₹${currentBid}</strong> for <strong>${escapeHtml(currentPlayer)}</strong>!`,
          "linear-gradient(135deg,#7b2d00,#e67e22,#ffd700)"
        );
      }
      // track session stats
      sessionBidCounts[bidder] = (sessionBidCounts[bidder] || 0) + 1;
      currentPlayerBidCount++;
      if (currentPlayerBidCount > mostContestedRecord.count) {
        const wasNewRecord2 = mostContestedRecord.count > 0;
        mostContestedRecord = { player: currentPlayer, count: currentPlayerBidCount };
        if (wasNewRecord2 && currentPlayerBidCount > lastFlashContestCount) {
          lastFlashContestCount = currentPlayerBidCount;
          showLiveFlashBanner(
            `🎯 New Most Contested Record! — <strong>${escapeHtml(currentPlayer)}</strong> — ${currentPlayerBidCount} bids!`,
            "linear-gradient(135deg,#1a0050,#6a00c0,#b44fff)"
          );
        } else if (!wasNewRecord2) {
          lastFlashContestCount = currentPlayerBidCount;
        }
      }
      if (recentBidders.length >= 2) {
        const prev = recentBidders[recentBidders.length - 2];
        if (prev !== bidder) {
          const key = [prev, bidder].sort().join("|");
          rivalryMap[key] = (rivalryMap[key] || 0) + 1;
        }
      }
      const prevIdx2 = teamLastBidAuctionIndex[bidder];
      if (prevIdx2 !== undefined && auctionPlayerIndex - prevIdx2 >= 5) {
        silentAssassinCandidate = bidder;
      }
      teamLastBidAuctionIndex[bidder] = auctionPlayerIndex;
      if (bidders[bidder] - currentBid <= 100 && bidders[bidder] - currentBid >= 0) {
        result.textContent = `⚔️ All or nothing bid from ${bidder}!`;
        setTimeout(() => { if (result.textContent.includes("All or nothing")) result.textContent = ""; }, 2500);
      }
      saveState();
      showLiveBidding();
      startAuctionTimer(20);
    });

    auctionSection.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "auction-actions";
  actions.innerHTML = `
    <button id="endBidBtn" class="danger-btn">⛔ End Bidding</button>
    <button id="extraTimeBtn" class="secondary-btn">⏳ Extra Time (+30s)</button>
    <button id="changeBidderBtn" class="secondary-btn">↔ Change Current Bidder</button>
    <button id="skipBtn" class="secondary-btn">⏭ Skip Player</button>
    <button id="reduceBtn" class="secondary-btn">➖ Reduce Bid ₹5</button>
    <button id="undoBtn" class="secondary-btn">↺ Undo Last Sale</button>
  `;
  auctionSection.appendChild(actions);

  const endBtn = document.getElementById("endBidBtn");
  if (endBtn) endBtn.addEventListener("click", endAuction);
  const changeBtn = document.getElementById("changeBidderBtn");
  if (changeBtn) changeBtn.addEventListener("click", changeCurrentBidder);
  const skipBtn = document.getElementById("skipBtn");
  if (skipBtn) skipBtn.addEventListener("click", skipCurrentPlayer);
  const reduceBtn = document.getElementById("reduceBtn");
  if (reduceBtn) reduceBtn.addEventListener("click", reduceBid);
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) undoBtn.addEventListener("click", undoLastSale);
  const extraTimeBtn = document.getElementById("extraTimeBtn");
  if (extraTimeBtn) {
    extraTimeBtn.addEventListener("click", () => {
      extraTimeCount++;
      startAuctionTimer(30);
    });
  }

  // Scroll to top of auction panel after every render
  auctionSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startSoldAnimation({ player, bidder, amount }) {
  soldState.active = true;
  soldState.timeouts = [];

  showSoldSummary({ player, bidder, amount });

  const exitTimeout = setTimeout(() => {
    soldState.active = false;

    // 🔑 restore auction UI
    renderAuctionIdle();
  }, 4000);

  registerSoldTimeout(exitTimeout);
}





function endAuction() {
  clearAuctionTimer();
  if (!currentPlayer) return;

  if (!currentBidder) {
    if (!isRound2) firstRoundUnsoldSet.add(currentPlayer);
    unsoldPlayers.push(currentPlayer);
    result.textContent = `❌ No bids for ${currentPlayer}`;
    currentPlayer = null;
    saveState();
    renderAuctionIdle();
    return;
  }

  const meta = playerMeta[currentPlayer] || {};
  const prevTeam = meta.prevTeam;

  const canRetain =
    prevTeam &&
    prevTeam !== currentBidder &&
    teamMeta[prevTeam] &&
    teamMeta[prevTeam].retentionUsed === false;

  if (canRetain) {
    // 🔐 ACTIVATE RETENTION (no UI yet)
    retentionState.active = true;
    retentionState.player = currentPlayer;
    retentionState.prevTeam = prevTeam;
    retentionState.highestBidder = currentBidder;
    retentionState.currentBid = currentBid;
    retentionState.phase = "decision";

    auctionLocked = true;
    return; // ⛔ stop normal sale
  }

  // ✅ NORMAL SALE
  const salePlayer  = currentPlayer;
  const saleBidder  = currentBidder;
  const saleAmount  = currentBid;
  const saleMeta    = playerMeta[salePlayer] || {};
  const saleCardType = saleMeta.cardType || "silver";

  // ── Collect story banners BEFORE mutating state ──
  const storyBanners = [];
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── PHRASE BANKS ──

  // 🏠 HOMECOMING — (player, team) both always named
  const homePhrases = (p, t) => [
    `🏠 <strong>He's going home!</strong><br><span>${p} returns to <strong>${t}</strong> — back where it all began!</span>`,
    `🏡 <strong>Full circle!</strong><br><span>${p} is back with <strong>${t}</strong> — right where they belong!</span>`,
    `💚 <strong>Welcome back!</strong><br><span>${p} reunites with <strong>${t}</strong> — the old team is whole again!</span>`,
    `🔄 <strong>A dream return!</strong><br><span>${p} is heading back to <strong>${t}</strong> — nobody saw this coming!</span>`,
    `🕊️ <strong>The prodigal returns!</strong><br><span>${p} goes back to <strong>${t}</strong> — back to their roots!</span>`,
    `🥹 <strong>Emotional reunion!</strong><br><span>${p} and <strong>${t}</strong> are together again — the crowd is moved!</span>`,
    `🌟 <strong>They never really left!</strong><br><span>${p} rejoins <strong>${t}</strong> — a perfect, perfect reunion!</span>`,
    `🎉 <strong>Homecoming!</strong><br><span><strong>${t}</strong> gets their player back — ${p} is home!</span>`,
    `💫 <strong>Destiny!</strong><br><span>${p} was always meant to return to <strong>${t}</strong>!</span>`,
    `🫶 <strong>Where the heart is!</strong><br><span>${p} chose <strong>${t}</strong> over everyone else — loyalty wins!</span>`,
    `🔁 <strong>The return of a legend!</strong><br><span>${p} goes back to <strong>${t}</strong> — the fans are going wild!</span>`,
    `🌈 <strong>Back to the beginning!</strong><br><span>${p}'s journey brings them back to <strong>${t}</strong>!</span>`,
    `🏅 <strong>A sentimental signing!</strong><br><span>${p} picks <strong>${t}</strong> — loyalty over everything!</span>`,
    `🤝 <strong>Old friends reunite!</strong><br><span>${p} and <strong>${t}</strong> are back together — what a moment!</span>`,
    `💛 <strong>They came back!</strong><br><span>Nobody saw this reunion — ${p} returns to <strong>${t}</strong>!</span>`,
    `🎸 <strong>The comeback tour!</strong><br><span>${p} is back where <strong>${t}</strong> knows their name!</span>`,
    `🕯️ <strong>Like they never left!</strong><br><span>${p} slides right back into <strong>${t}</strong> — seamless!</span>`,
    `🦋 <strong>Full circle moment!</strong><br><span>${p} comes back to <strong>${t}</strong> — the story ends where it began!</span>`,
    `🏆 <strong>Back to their people!</strong><br><span>${p} and <strong>${t}</strong> reunite — the team that knows them best!</span>`,
    `🎯 <strong>Right where they belong!</strong><br><span>${p} is going back to <strong>${t}</strong> — it was written in the stars!</span>`,
  ];

  // 💔 BETRAYAL — (victim, stealer, player) all three named
  const betrayalPhrases = (victim, stealer, player) => [
    `💔 <strong>Betrayal!</strong><br><span><strong>${victim}</strong> loses ${player} to <strong>${stealer}</strong> — their own former player is gone!</span>`,
    `😤 <strong>That stings!</strong><br><span><strong>${victim}</strong> just watched ${player} walk straight to <strong>${stealer}</strong>. Ouch!</span>`,
    `🗡️ <strong>Stabbed in the back!</strong><br><span>${player} leaves <strong>${victim}</strong> for <strong>${stealer}</strong> — the enemy!</span>`,
    `😱 <strong>They couldn't hold on!</strong><br><span><strong>${victim}</strong> watches helplessly as ${player} joins <strong>${stealer}</strong>!</span>`,
    `🔥 <strong>Poached!</strong><br><span><strong>${stealer}</strong> rips ${player} away from <strong>${victim}</strong> — the ultimate theft!</span>`,
    `😢 <strong>Heartbreak for ${victim}!</strong><br><span>${player} leaves them for <strong>${stealer}</strong> — this one hurts!</span>`,
    `⚡ <strong>Stolen!</strong><br><span><strong>${victim}</strong> tried, but <strong>${stealer}</strong> takes ${player} right from them!</span>`,
    `💸 <strong>Outbid on their own player!</strong><br><span><strong>${victim}</strong> watches ${player} leave for <strong>${stealer}</strong> in disbelief!</span>`,
    `🏴 <strong>A bitter loss!</strong><br><span><strong>${victim}</strong> can't keep ${player} — <strong>${stealer}</strong> swoops in!</span>`,
    `😠 <strong>How could this happen?!</strong><br><span>${player} leaves <strong>${victim}</strong> for <strong>${stealer}</strong> — nobody can believe it!</span>`,
    `🌩️ <strong>Devastating!</strong><br><span><strong>${victim}</strong> loses ${player} to <strong>${stealer}</strong> — their own former player!</span>`,
    `🤯 <strong>Unbelievable!</strong><br><span>${player} sold from under <strong>${victim}</strong>'s nose — straight to <strong>${stealer}</strong>!</span>`,
    `🚨 <strong>Alert the fans!</strong><br><span>${player} leaves <strong>${victim}</strong> for <strong>${stealer}</strong> — the room is stunned!</span>`,
    `😬 <strong>That's going to leave a mark!</strong><br><span><strong>${victim}</strong> can't believe ${player} is now with <strong>${stealer}</strong>!</span>`,
    `🎭 <strong>Plot twist!</strong><br><span><strong>${victim}</strong> came to keep ${player}, but <strong>${stealer}</strong> had other plans!</span>`,
    `🧨 <strong>Explosive!</strong><br><span>${player} walks from <strong>${victim}</strong> to <strong>${stealer}</strong> — the room erupts!</span>`,
    `🥶 <strong>Ice cold!</strong><br><span>${player} shows no loyalty — <strong>${victim}</strong> is left in the cold by <strong>${stealer}</strong>!</span>`,
    `🪦 <strong>RIP loyalty!</strong><br><span>${player} leaves <strong>${victim}</strong> for <strong>${stealer}</strong>. Business is business!</span>`,
    `🫠 <strong>Crushed!</strong><br><span><strong>${victim}</strong> watches their player ${player} get claimed by <strong>${stealer}</strong>!</span>`,
    `🏹 <strong>No mercy!</strong><br><span><strong>${stealer}</strong> takes ${player} right in front of <strong>${victim}</strong> — ruthless!</span>`,
  ];

  const redemptionPhrases = (player, amount) => [
    `📈 <strong>Redemption Arc!</strong><br><span>${player} — from rejected to ₹${amount}!</span>`,
    `🔥 <strong>Nobody wanted them last round!</strong><br><span>Now ${player} sells for ₹${amount}. What a turnaround!</span>`,
    `🌅 <strong>Rise from the ashes!</strong><br><span>${player} was overlooked — now they go for ₹${amount}!</span>`,
    `💪 <strong>The underdog wins!</strong><br><span>${player} was passed over once. ₹${amount} says they matter now!</span>`,
    `🦅 <strong>They flew under the radar!</strong><br><span>${player} was unsold last time. ₹${amount} later — who's laughing now?</span>`,
    `😤 <strong>Disrespected no more!</strong><br><span>${player} was rejected — now they go for ₹${amount}!</span>`,
    `🌟 <strong>Late bloomer!</strong><br><span>${player} was skipped in round 1. ₹${amount} in round 2!</span>`,
    `📣 <strong>They said nobody wanted them!</strong><br><span>${player} just sold for ₹${amount}. Proved everyone wrong!</span>`,
    `🎭 <strong>Plot twist of the auction!</strong><br><span>${player} — unsold to ₹${amount}. What a story!</span>`,
    `🚀 <strong>From zero to hero!</strong><br><span>${player} was skipped last round, now flying at ₹${amount}!</span>`,
    `🏆 <strong>The comeback is complete!</strong><br><span>${player} was unwanted — now they're valued at ₹${amount}!</span>`,
    `🔔 <strong>The second chance paid off!</strong><br><span>${player} gets ₹${amount} this time around!</span>`,
    `👑 <strong>Royalty in disguise!</strong><br><span>${player} was ignored last round — ₹${amount} says otherwise!</span>`,
    `⚡ <strong>Lightning strikes twice!</strong><br><span>${player} missed out last round, but ₹${amount} makes it right!</span>`,
    `🎯 <strong>Worth the wait!</strong><br><span>${player} had to wait for round 2 — but ₹${amount} made it worthwhile!</span>`,
    `🌊 <strong>The tide has turned!</strong><br><span>${player} was unsold. Now they're worth ₹${amount}!</span>`,
    `🎪 <strong>The crowd changes its mind!</strong><br><span>${player} goes from unwanted to ₹${amount} — incredible!</span>`,
    `😲 <strong>Nobody saw this value!</strong><br><span>${player} was a steal waiting to happen — ₹${amount} proves it!</span>`,
    `🧩 <strong>The missing piece found!</strong><br><span>${player} was skipped, then snapped up for ₹${amount}!</span>`,
    `🎖️ <strong>Delayed recognition!</strong><br><span>${player} had to wait, but ₹${amount} is the reward!</span>`,
  ];

  const darkHorsePhrases = (player, amount) => [
    `🐎 <strong>Dark Horse!</strong><br><span>Nobody saw ${player} coming — Silver card sold for ₹${amount}!</span>`,
    `😲 <strong>What just happened?!</strong><br><span>${player} is a Silver card but sold for ₹${amount}. Unbelievable!</span>`,
    `🔥 <strong>The underdog bites back!</strong><br><span>Silver card ${player} going for ₹${amount} — more than most Golds!</span>`,
    `🌪️ <strong>Nobody expected this!</strong><br><span>${player} just shattered expectations with a ₹${amount} sale!</span>`,
    `💥 <strong>Silver going Gold!</strong><br><span>${player} proves the card type means nothing — ₹${amount}!</span>`,
    `👀 <strong>Hidden gem!</strong><br><span>They said Silver. The market said ₹${amount}. The market wins!</span>`,
    `🤯 <strong>What a price for a Silver!</strong><br><span>${player} at ₹${amount} is the surprise of the auction!</span>`,
    `🏆 <strong>Value doesn't care about card colour!</strong><br><span>${player} — Silver in name, Gold in price at ₹${amount}!</span>`,
    `🎯 <strong>Scouts were right!</strong><br><span>${player} was underrated. ₹${amount} corrects that today!</span>`,
    `😮 <strong>Jaw on the floor!</strong><br><span>Silver card ${player} sells for ₹${amount} — more than the Golds!</span>`,
    `🌟 <strong>A star in disguise!</strong><br><span>${player} had Silver on the card but Gold in the auction at ₹${amount}!</span>`,
    `🦁 <strong>Don't judge by the card!</strong><br><span>${player} just roared — ₹${amount} for a Silver!</span>`,
    `🧨 <strong>Explosive value!</strong><br><span>${player} blows up the auction — Silver card, ₹${amount} price!</span>`,
    `🎪 <strong>The crowd goes wild!</strong><br><span>₹${amount} for a Silver card? ${player} just stole the show!</span>`,
    `📊 <strong>The stats lied!</strong><br><span>${player}'s card said Silver. The bids said ₹${amount}!</span>`,
    `🦄 <strong>A rare one!</strong><br><span>${player} — a Silver card unicorn selling for ₹${amount}!</span>`,
    `🔮 <strong>Someone knew something!</strong><br><span>${player} goes for ₹${amount} — Silver card, Gold demand!</span>`,
    `😤 <strong>Disrespectful to the Golds!</strong><br><span>${player} is a Silver card but embarrassed them all at ₹${amount}!</span>`,
    `🎵 <strong>Playing a different tune!</strong><br><span>${player} — Silver by grading, ₹${amount} by bidding!</span>`,
    `🏄 <strong>Riding the wave!</strong><br><span>${player} surfs to ₹${amount} on a Silver card!</span>`,
  ];

  const spreePhrases = team => [
    `🛒 <strong>On a Spending Spree!</strong><br><span>${team} is unstoppable — 3 players in a row!</span>`,
    `🔥 <strong>Can't stop, won't stop!</strong><br><span>${team} sweeps 3 straight — who can slow them down?!</span>`,
    `🚀 <strong>Hat-trick of wins!</strong><br><span>${team} takes 3 in a row — the auction belongs to them!</span>`,
    `💸 <strong>Money is no object!</strong><br><span>${team} just won their 3rd player in a row — unstoppable!</span>`,
    `😤 <strong>Dominant!</strong><br><span>${team} owns this auction — 3 players, no competition!</span>`,
    `⚡ <strong>Electric run!</strong><br><span>${team} on a 3-win streak — nobody can match this energy!</span>`,
    `🏆 <strong>The auction belongs to them!</strong><br><span>${team} — 3 in a row and showing no signs of stopping!</span>`,
    `🦁 <strong>The lion is hunting!</strong><br><span>${team} has won 3 straight — everyone else is watching!</span>`,
    `🎯 <strong>Triple threat!</strong><br><span>${team} picks up 3 consecutive players — flawless!</span>`,
    `🌊 <strong>A tsunami of wins!</strong><br><span>${team} sweeps through — 3 players, no resistance!</span>`,
    `😱 <strong>Who can stop them?!</strong><br><span>${team} is on fire — 3 wins on the bounce!</span>`,
    `👑 <strong>Royalty at the auction table!</strong><br><span>${team} wins 3 in a row — bow down!</span>`,
    `🎪 <strong>The crowd belongs to ${team}!</strong><br><span>3 players in a row — what a run!</span>`,
    `🥊 <strong>Knockout after knockout!</strong><br><span>${team} wins 3 straight — nobody landing a punch on them!</span>`,
    `🚂 <strong>The freight train keeps rolling!</strong><br><span>${team} — 3 wins, no stops!</span>`,
    `🎸 <strong>Three-chord masterpiece!</strong><br><span>${team} plays it perfectly — 3 players in a row!</span>`,
    `🌋 <strong>The volcano keeps erupting!</strong><br><span>${team} wins again — 3 straight, no end in sight!</span>`,
    `🤑 <strong>The budget is flying!</strong><br><span>${team} doesn't care about the money — 3 wins in a row!</span>`,
    `🧠 <strong>Tactical masterclass!</strong><br><span>${team} outsmarts everyone — 3 players in a row!</span>`,
    `🎆 <strong>Fireworks from ${team}!</strong><br><span>3 consecutive wins — this is their auction!</span>`,
  ];

  const boardPhrases = team => [
    `📣 <strong>Finally on the board!</strong><br><span>${team} gets their first player!</span>`,
    `🎉 <strong>They've arrived!</strong><br><span>${team} is no longer empty-handed!</span>`,
    `🌟 <strong>The wait is over!</strong><br><span>${team} finally has someone to call their own!</span>`,
    `🚀 <strong>Houston, we have a player!</strong><br><span>${team} opens their account!</span>`,
    `😤 <strong>They were too quiet!</strong><br><span>${team} breaks their silence with their first signing!</span>`,
    `🎯 <strong>First blood!</strong><br><span>${team} gets off the mark — the rebuild begins!</span>`,
    `🏁 <strong>And they're off!</strong><br><span>${team} finally has their first player!</span>`,
    `💪 <strong>The drought is over!</strong><br><span>${team} lands their first player of the auction!</span>`,
    `🦋 <strong>Awakening!</strong><br><span>${team} was waiting for the right moment — and it's now!</span>`,
    `🔔 <strong>The bell rings for ${team}!</strong><br><span>Their first player is signed and sealed!</span>`,
    `🥳 <strong>Cause for celebration!</strong><br><span>${team} finally has a player to show for their patience!</span>`,
    `🌅 <strong>A new dawn!</strong><br><span>${team} opens their account — the squad is born!</span>`,
    `🎬 <strong>And so it begins!</strong><br><span>${team} has their first player — watch out!</span>`,
    `🤝 <strong>The first handshake!</strong><br><span>${team} welcomes their first signing of the day!</span>`,
    `😌 <strong>Relief for ${team}!</strong><br><span>The long wait ends — they have their first player!</span>`,
    `⚡ <strong>Sparked to life!</strong><br><span>${team} was dormant — now they've fired up with their first signing!</span>`,
    `🏗️ <strong>The foundation is laid!</strong><br><span>${team} builds from the ground up — first player secured!</span>`,
    `🧩 <strong>The first piece!</strong><br><span>${team} fits their first player into the puzzle!</span>`,
    `🎊 <strong>Party time for ${team}!</strong><br><span>They've been waiting — and the wait was worth it!</span>`,
    `🌱 <strong>A seed is planted!</strong><br><span>${team}'s squad begins — first player in the books!</span>`,
  ];

  const assassinPhrases = team => [
    `🥷 <strong>Silent Assassin!</strong><br><span>Nobody saw ${team} coming — they'd been quiet for 5+ players!</span>`,
    `😶 <strong>The silent one strikes!</strong><br><span>${team} was watching… waiting… and now they pounce!</span>`,
    `🐍 <strong>A snake in the grass!</strong><br><span>${team} stayed hidden — and just snatched the prize!</span>`,
    `🌑 <strong>Out of the shadows!</strong><br><span>${team} has been lurking — now they reveal themselves!</span>`,
    `😏 <strong>They were planning this all along!</strong><br><span>${team} plays the long game and wins it!</span>`,
    `🎭 <strong>The patient predator!</strong><br><span>${team} waited 5+ players — and struck at the perfect moment!</span>`,
    `🕵️ <strong>The spy strikes!</strong><br><span>${team} was watching silently — and just took everyone by surprise!</span>`,
    `👻 <strong>The ghost appears!</strong><br><span>${team} was invisible — and just claimed their prize!</span>`,
    `🔕 <strong>Silence was the strategy!</strong><br><span>${team} let everyone else fight — then swooped in!</span>`,
    `🦈 <strong>The shark surfaces!</strong><br><span>${team} circled silently — now they bite!</span>`,
    `🌙 <strong>A midnight strike!</strong><br><span>Nobody noticed ${team} — until it was too late!</span>`,
    `🏹 <strong>One arrow, one kill!</strong><br><span>${team} saved themselves for this moment — and nailed it!</span>`,
    `🧊 <strong>Ice cold patience!</strong><br><span>${team} waited and waited — and walked away with the player!</span>`,
    `🎯 <strong>Precision timing!</strong><br><span>${team} stayed silent for 5+ players — then struck with surgical precision!</span>`,
    `🦉 <strong>The wise owl strikes!</strong><br><span>${team} watched everything — and chose the perfect moment!</span>`,
    `🌿 <strong>Camouflage expert!</strong><br><span>${team} blended into the background — then leapt out of nowhere!</span>`,
    `😴 <strong>Sleeping giant awakens!</strong><br><span>${team} looked dormant — but they were calculating every bid!</span>`,
    `🔇 <strong>Muted, not defeated!</strong><br><span>${team} said nothing for 5+ players — then spoke the loudest!</span>`,
    `🧠 <strong>The mastermind reveals!</strong><br><span>${team}'s silence was the strategy — and it worked perfectly!</span>`,
    `⚔️ <strong>One strike is all it took!</strong><br><span>${team} waited patiently and delivered the perfect blow!</span>`,
  ];

  // ── GRADIENT POOLS per category ──
  const homeGradients = [
    "linear-gradient(135deg,#1a7a4a,#27ae60,#2ecc71)",
    "linear-gradient(135deg,#145a32,#1e8449,#58d68d)",
    "linear-gradient(135deg,#0b5345,#148f77,#45b39d)",
    "linear-gradient(135deg,#1f618d,#2980b9,#7fb3d3)",
    "linear-gradient(135deg,#186a3b,#28b463,#82e0aa)",
    "linear-gradient(135deg,#117a65,#1abc9c,#76d7c4)",
  ];
  const betrayalGradients = [
    "linear-gradient(135deg,#7b0000,#c0392b,#e74c3c)",
    "linear-gradient(135deg,#641e16,#922b21,#e74c3c)",
    "linear-gradient(135deg,#4a0000,#a93226,#ff5733)",
    "linear-gradient(135deg,#6e2f1a,#d35400,#e59866)",
    "linear-gradient(135deg,#78281f,#cb4335,#f1948a)",
    "linear-gradient(135deg,#1c0a00,#7b241c,#c0392b)",
  ];
  const redemptionGradients = [
    "linear-gradient(135deg,#0057b8,#00b4d8,#48cae4)",
    "linear-gradient(135deg,#154360,#1a5276,#5dade2)",
    "linear-gradient(135deg,#1b2631,#2e86c1,#85c1e9)",
    "linear-gradient(135deg,#0e2f44,#117a65,#48c9b0)",
    "linear-gradient(135deg,#1a237e,#1565c0,#42a5f5)",
    "linear-gradient(135deg,#003366,#0077b6,#90e0ef)",
  ];
  const darkHorseGradients = [
    "linear-gradient(135deg,#4a3f00,#c9a227,#f4c430)",
    "linear-gradient(135deg,#7d6608,#d4ac0d,#f9e79f)",
    "linear-gradient(135deg,#6e2f1a,#d35400,#ffd700)",
    "linear-gradient(135deg,#3d1a00,#b7770d,#f0b429)",
    "linear-gradient(135deg,#1c0a00,#c9a227,#fdebd0)",
    "linear-gradient(135deg,#4d3800,#b8860b,#ffd700)",
  ];
  const spreeGradients = [
    "linear-gradient(135deg,#0f3460,#16213e,#e94560)",
    "linear-gradient(135deg,#1a0030,#6a0dad,#e94560)",
    "linear-gradient(135deg,#0d0221,#3a0ca3,#f72585)",
    "linear-gradient(135deg,#10002b,#5a189a,#e040fb)",
    "linear-gradient(135deg,#03045e,#0077b6,#ff4800)",
    "linear-gradient(135deg,#1b0030,#7b2ff7,#e94560)",
  ];
  const boardGradients = [
    "linear-gradient(135deg,#1a3a1a,#27ae60,#82e0aa)",
    "linear-gradient(135deg,#0d3b1e,#196f3d,#58d68d)",
    "linear-gradient(135deg,#0b3d0b,#1e8449,#a9dfbf)",
    "linear-gradient(135deg,#145a32,#1abc9c,#76d7c4)",
    "linear-gradient(135deg,#0e3d2b,#117a65,#45b39d)",
    "linear-gradient(135deg,#093624,#0e6655,#52be80)",
  ];
  const assassinGradients = [
    "linear-gradient(135deg,#0d0d0d,#1a1a2e,#4a0e8f)",
    "linear-gradient(135deg,#000000,#0d0d0d,#6a0dad)",
    "linear-gradient(135deg,#0a0010,#16002b,#4b0082)",
    "linear-gradient(135deg,#050510,#10002b,#3a0ca3)",
    "linear-gradient(135deg,#000000,#1a1a2e,#7b2fbe)",
    "linear-gradient(135deg,#0d0221,#200150,#5a189a)",
  ];

  // ── HOMECOMING ──
  const prevTeamKey = saleMeta.prevTeam;
  if (prevTeamKey && saleBidder.toLowerCase().replace(/[\s\-]/g,"") === prevTeamKey.toLowerCase()) {
    storyBanners.push({
      html: rnd(homePhrases(escapeHtml(salePlayer), escapeHtml(saleBidder))),
      gradient: rnd(homeGradients)
    });
  }

  // ── BETRAYAL ──
  const prevCaptain = prevTeamKey
    ? Object.keys(bidders).find(c => c.toLowerCase().replace(/[\s\-]/g,"") === prevTeamKey.toLowerCase())
    : null;
  if (prevCaptain && prevCaptain !== saleBidder) {
    storyBanners.push({
      html: rnd(betrayalPhrases(escapeHtml(prevCaptain), escapeHtml(saleBidder), escapeHtml(salePlayer))),
      gradient: rnd(betrayalGradients)
    });
  }

  // ── REDEMPTION ARC ──
  if (isRound2 && firstRoundUnsoldSet.has(salePlayer) && saleAmount >= 100) {
    storyBanners.push({
      html: rnd(redemptionPhrases(escapeHtml(salePlayer), saleAmount)),
      gradient: rnd(redemptionGradients)
    });
  }

  // ── DARK HORSE ──
  const avgGold = goldSoldPrices.length
    ? goldSoldPrices.reduce((a,b) => a+b, 0) / goldSoldPrices.length
    : null;
  if (saleCardType === "silver" && avgGold !== null && saleAmount > avgGold) {
    storyBanners.push({
      html: rnd(darkHorsePhrases(escapeHtml(salePlayer), saleAmount)),
      gradient: rnd(darkHorseGradients)
    });
  }

  // ── RECORD BREAKER ──
  const isNewRecord = !mostExpensiveSale || saleAmount > mostExpensiveSale.amount;
  if (isNewRecord && mostExpensiveSale) {
    storyBanners.unshift({
      html: `🏆 <strong>NEW RECORD!</strong><br><span>₹${saleAmount} — the highest sale of the auction!</span>`,
      gradient: rnd(["linear-gradient(135deg,#7b2d00,#ff8c00,#ffd700)","linear-gradient(135deg,#5d4000,#c9a227,#ffd700)","linear-gradient(135deg,#3d1a00,#e67e22,#ffd700)"]),
      isRecord: true
    });
  }

  // ── SPENDING SPREE ──
  if (lastWinner === saleBidder) {
    teamConsecutiveWins[saleBidder] = (teamConsecutiveWins[saleBidder] || 1) + 1;
  } else {
    teamConsecutiveWins[saleBidder] = 1;
  }
  lastWinner = saleBidder;
  if (teamConsecutiveWins[saleBidder] === 3) {
    storyBanners.push({
      html: rnd(spreePhrases(escapeHtml(saleBidder))),
      gradient: rnd(spreeGradients)
    });
  }

  // ── FINALLY ON THE BOARD ──
  if ((bidderTeams[saleBidder] || []).length === 0) {
    storyBanners.push({
      html: rnd(boardPhrases(escapeHtml(saleBidder))),
      gradient: rnd(boardGradients)
    });
  }

  // ── SILENT ASSASSIN ──
  if (silentAssassinCandidate === saleBidder) {
    storyBanners.push({
      html: rnd(assassinPhrases(escapeHtml(saleBidder))),
      gradient: rnd(assassinGradients)
    });
  }

  // 🎯 Milestone banners (25 / 50 / 75%)
  const soldAfter = soldHistory.length + 1; // after this sale
  if (totalPlayersAtStart > 0) {
    const pct = soldAfter / totalPlayersAtStart;
    if (pct >= 0.75 && !milestoneShown[75]) {
      milestoneShown[75] = true;
      storyBanners.push({ html: `🎯 <strong>75% Complete!</strong><br><span>Three quarters of players sold!</span>`, gradient: "linear-gradient(135deg,#6a0dad,#9b59b6,#d7bde2)" });
    } else if (pct >= 0.50 && !milestoneShown[50]) {
      milestoneShown[50] = true;
      storyBanners.push({ html: `🎯 <strong>Halfway There!</strong><br><span>Half the players have found their teams!</span>`, gradient: "linear-gradient(135deg,#023e8a,#0096c7,#90e0ef)" });
    } else if (pct >= 0.25 && !milestoneShown[25]) {
      milestoneShown[25] = true;
      storyBanners.push({ html: `🎯 <strong>25% Complete!</strong><br><span>The auction is just getting started!</span>`, gradient: "linear-gradient(135deg,#1a7a4a,#27ae60,#a9dfbf)" });
    }
  }

  // ── NOW mutate state ──
  bidders[saleBidder] -= saleAmount;
  bidderTeams[saleBidder].push(salePlayer);

  const sale = { player: salePlayer, bidder: saleBidder, amount: saleAmount };
  soldHistory.unshift(sale);
  renderSoldHistory();
  lastSale = sale;

  if (isNewRecord) mostExpensiveSale = sale;

  // track Gold prices for dark horse
  if (saleCardType === "gold") goldSoldPrices.push(saleAmount);

  // reset consecutive wins for other teams
  Object.keys(teamConsecutiveWins).forEach(c => {
    if (c !== saleBidder) teamConsecutiveWins[c] = 0;
  });

  updateLeaderboard();
  showUndoToast("sold");
  saveState();

  showSoldFullScreen({
    player: salePlayer,
    bidder: saleBidder,
    amount: saleAmount,
    afterDone: () => {
      if (storyBanners.length) {
        showStoryBannersSequence(storyBanners, renderAuctionIdle);
      } else {
        renderAuctionIdle();
      }
    }
  });
}

function showSoldFullScreen({ player, bidder, amount, afterDone }) {
  soldRevealState.active = true;
  soldRevealState.timeouts = [];

  soldRevealState.done = () => {
    soldRevealState.active = false;
    (afterDone || renderAuctionIdle)();
  };

  const meta = playerMeta[player] || {};
  const prevTeam = meta.prevTeam;
  const prevLogo = prevTeam ? teamLogos[prevTeam] : null;
  const newLogo = teamMeta[bidder]?.logo || null;

  const overlay = document.createElement("div");
  overlay.className = "reveal-overlay"; // 🔥 reuse same black background
  soldRevealState.overlay = overlay;

  overlay.innerHTML = `
    <div class="sold-summary">
      <div class="sold-player-name hidden">${player}</div>

      <div class="sold-transfer-row">
        ${prevLogo
          ? `<img class="sold-logo hidden" id="prevLogo" src="${prevLogo}">`
          : `<div class="sold-logo sold-no-team hidden" id="prevLogo"></div>`}
        <span class="sold-arrow hidden" id="soldArrow">➜</span>
        ${newLogo
          ? `<img class="sold-logo hidden" id="newLogo" src="${newLogo}">`
          : `<div class="sold-logo sold-no-team hidden" id="newLogo"></div>`}
      </div>

      <div class="sold-price hidden">₹${amount}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 🎬 TIMED SEQUENCE
  registerSoldRevealTimeout(setTimeout(() => {
    overlay.querySelector(".sold-player-name")?.classList.remove("hidden");
  }, 400));

  registerSoldRevealTimeout(setTimeout(() => {
    overlay.querySelector("#prevLogo")?.classList.remove("hidden");
  }, 800));

  registerSoldRevealTimeout(setTimeout(() => {
    overlay.querySelector("#soldArrow")?.classList.remove("hidden");
  }, 1200));

  registerSoldRevealTimeout(setTimeout(() => {
    overlay.querySelector("#newLogo")?.classList.remove("hidden");
  }, 1600));

  registerSoldRevealTimeout(setTimeout(() => {
    overlay.querySelector(".sold-price")?.classList.remove("hidden");
  }, 2000));

  // ⏱ AUTO EXIT
  registerSoldRevealTimeout(setTimeout(() => {
    skipSoldRevealAnimation();
  }, 4200));
}

  function startAuction() {
    result.textContent = "";
    if (!players.length && !unsoldPlayers.length) {
      auctionSection.innerHTML = `
        <div style="text-align:center; padding: 18px 0;">
          <p style="font-weight:700; color:#28a745; font-size:15px;">🎉 All players have been sold!</p>
          <button id="viewTop10Btn" style="margin-top:10px; background:linear-gradient(135deg,#ffd700,#ff8c00); color:#3a1a00; font-size:15px; font-weight:800; padding:12px 28px; border-radius:999px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(255,180,0,.45);">
            🏆 View Top 10 Players
          </button>
        </div>
      `;
      document.getElementById("viewTop10Btn").onclick = showAuctionSummary;
      return;
    }

    if (!players.length) {
      players.push(...unsoldPlayers);
      unsoldPlayers.length = 0;
      isRound2 = true;
      renderUnsold();
    }

    // track total for strength meter
    if (totalPlayersAtStart === 0) {
      totalPlayersAtStart = players.length + soldHistory.length;
    }

    bidLog = [];
    recentBidders = [];
    warPhraseLastAt = 0;
    currentWarPhraseIdx = 0;
    currentPlayerBidCount = 0;
    silentAssassinCandidate = null;
    lastFlashContestCount = 0;
    lastFlashRecordAmount = 0;
    auctionPlayerIndex++;

    const bannerGradients = [
      "linear-gradient(135deg,#ff6b00,#e53935)",
      "linear-gradient(135deg,#6a0dad,#c0392b)",
      "linear-gradient(135deg,#0057b8,#00b4d8)",
      "linear-gradient(135deg,#1a7a4a,#f4c430)",
      "linear-gradient(135deg,#b5179e,#7209b7)",
      "linear-gradient(135deg,#e63946,#f77f00)",
      "linear-gradient(135deg,#023e8a,#48cae4)",
      "linear-gradient(135deg,#d62828,#f77f00)",
      "linear-gradient(135deg,#2d6a4f,#74c69d)",
      "linear-gradient(135deg,#7b2d8b,#e040fb)",
      "linear-gradient(135deg,#c77dff,#480ca8)",
      "linear-gradient(135deg,#ef233c,#8d99ae)",
      "linear-gradient(135deg,#f72585,#b5179e)",
      "linear-gradient(135deg,#3a0ca3,#4cc9f0)",
      "linear-gradient(135deg,#ff4800,#ff9500)",
    ];
    currentBannerGradient = bannerGradients[Math.floor(Math.random() * bannerGradients.length)];

    const idx = Math.floor(Math.random() * players.length);
   const picked = players.splice(idx, 1)[0];
   pendingPlayer = picked;
  renderPlayers();

  // ── FINAL 5 / LAST PLAYER banners ──
  const remaining = players.length + unsoldPlayers.length;
  if (remaining === 0) {
    showPreRevealBanner(
      "🎬 LAST PLAYER STANDING",
      "This is it — the final player of the auction!",
      "linear-gradient(135deg,#1a0030,#6a0dad,#b44fff)"
    );
  } else if (remaining === 4 && !milestoneShown["final5"]) {
    milestoneShown["final5"] = true;
    showPreRevealBanner(
      "⚡ FINAL 5 PLAYERS",
      "Only 5 players remain — every bid counts now!",
      "linear-gradient(135deg,#c0392b,#e74c3c,#ff6b6b)"
    );
  }

  revealTotalIndex++;
  const pickedCardType = playerMeta[picked]?.cardType || "silver";

  // Thunder only makes sense for gold and purple cards (silver has nothing below it)
  // gold   → always reveals as silver first, thunder upgrades to gold
  // purple → reveals as silver OR gold first, thunder upgrades to purple
  // silver → never gets thunder
  const canThunder = pickedCardType === "gold" || pickedCardType === "purple";

  const isThunder =
    canThunder &&
    thunderRevealCount < 4 &&
    revealTotalIndex > 5 &&
    (revealTotalIndex - lastThunderRevealIndex) > 5 &&
    Math.random() < 0.45;

  if (isThunder) {
    thunderRevealCount++;
    lastThunderRevealIndex = revealTotalIndex;
  }

  // Thunder combo is determined strictly by the player's actual card type
  // gold card   → always silver → gold
  // purple card → randomly silver → purple OR gold → purple
  let thunderCombo = null;
  if (isThunder) {
    if (pickedCardType === "gold") {
      thunderCombo = { from: "silver", to: "gold" };
    } else if (pickedCardType === "purple") {
      thunderCombo = Math.random() < 0.5
        ? { from: "silver", to: "purple" }
        : { from: "gold",   to: "purple" };
    }
  }

  revealForAuction(picked, isThunder, thunderCombo, () => {
  currentPlayer = picked;
  currentBid = 25;
  currentBidder = null;
  extraTimeCount = 0;
  saveState();
  showLiveBidding();
});

  }

  function changeCurrentBidder() {
  const names = Object.keys(bidders);
  if (names.length === 0) return;

  const choice = prompt(
    "Enter bidder name to set as current:\n" + names.join(", ")
  );

  if (!choice || !bidders.hasOwnProperty(choice)) {
    alert("Invalid bidder name");
    return;
  }

  currentBidder = choice;
  showLiveBidding();
}

function skipCurrentPlayer() {
  if (!currentPlayer) return;

  if (!isRound2) firstRoundUnsoldSet.add(currentPlayer);

  lastSkip = currentPlayer;
  unsoldPlayers.push(currentPlayer);
  renderUnsold();

  result.textContent = `⏭ ${currentPlayer} skipped`;

  currentPlayer = null;
  currentBid = 25;
  currentBidder = null;

  saveState();
  renderAuctionIdle();
  showUndoToast("skipped");
}



function reduceBid() {
  if (currentBid > 25) {
    currentBid -= 5;
    showLiveBidding();
  }
}

function undoSkippedPlayer() {
  if (!lastSkip) {
    alert("Nothing to undo");
    return;
  }

  // remove from unsold list
  const idx = unsoldPlayers.lastIndexOf(lastSkip);
  if (idx !== -1) {
    unsoldPlayers.splice(idx, 1);
  }

  renderUnsold();

  // restore auction state
  currentPlayer = lastSkip;
  currentBid = 25;
  currentBidder = null;

  lastSkip = null;

  saveState();
  showLiveBidding();
  showResultMessage(`↺ Undo: ${currentPlayer} restored to auction`, 3000);
}

function undoLastSale() {
  clearSoldState();

  if (!lastSale) {
    alert("Nothing to undo");
    return;
  }


  const { player, bidder, amount } = lastSale;

  // 🔥 FIX 2: restore current pending player back to pool
if (pendingPlayer && pendingPlayer !== player) {
  players.unshift(pendingPlayer);
  pendingPlayer = null;
  renderPlayers();
}


  // refund points
  bidders[bidder] += amount;

  // remove player from team
  const team = bidderTeams[bidder];
  const idx = team.lastIndexOf(player);
  if (idx !== -1) team.splice(idx, 1);

    // 🔥 FIX 1: remove from sold history
  const historyIndex = soldHistory.findIndex(
    s =>
      s.player === player &&
      s.bidder === bidder &&
      s.amount === amount
  );
   if (historyIndex !== -1) {
    soldHistory.splice(historyIndex, 1);
    renderSoldHistory();
  }

  // restore auction state
  currentPlayer = player;
  currentBid = 25;
  currentBidder = null;

  lastSale = null;

  updateLeaderboard();
  saveState();
  showLiveBidding();

  showResultMessage(`↺ Undo: ${player} returned to auction`, 3000);

}



  /* =======================
     STORY BANNERS
     ======================= */

  function showStoryBannersSequence(banners, onDone) {
    if (!banners.length) { onDone(); return; }

    const overlay = document.createElement("div");
    overlay.className = "story-overlay";

    overlay.innerHTML = banners.map(b => `
      <div class="story-card ${b.isRecord ? 'story-card-record' : ''}" style="background:${b.gradient}">
        <div class="story-text">${b.html}</div>
      </div>
    `).join("") + `<div class="story-overlay-hint">Click anywhere or press Esc to continue</div>`;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("visible"));

    const dismiss = () => {
      overlay.classList.add("fade-out");
      setTimeout(() => { overlay.remove(); onDone(); }, 500);
    };

    const timer = setTimeout(dismiss, 4000);

    overlay.addEventListener("click", () => { clearTimeout(timer); dismiss(); });

    const keyHandler = (e) => {
      if (e.key === "Escape" || e.key === " ") {
        clearTimeout(timer);
        document.removeEventListener("keydown", keyHandler);
        dismiss();
      }
    };
    document.addEventListener("keydown", keyHandler);
  }

  // Flash banner — appears briefly during live auction, auto-dismisses
  function showLiveFlashBanner(html, gradient) {
    // Remove any existing flash banner
    const existing = document.getElementById("liveFlashBanner");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.id = "liveFlashBanner";
    el.className = "live-flash-banner";
    el.style.background = gradient;
    el.innerHTML = html;
    document.body.appendChild(el);

    // Animate in
    requestAnimationFrame(() => el.classList.add("visible"));

    // Auto dismiss after 3.5s
    setTimeout(() => {
      el.classList.add("fade-out");
      setTimeout(() => el.remove(), 600);
    }, 3500);
  }

  function showPreRevealBanner(title, subtitle, gradient) {
    const overlay = document.createElement("div");
    overlay.className = "pre-reveal-banner";
    overlay.style.background = gradient;
    overlay.innerHTML = `
      <div class="pre-reveal-title">${title}</div>
      <div class="pre-reveal-sub">${subtitle}</div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("visible"));
    setTimeout(() => {
      overlay.classList.add("fade-out");
      setTimeout(() => overlay.remove(), 600);
    }, 3000);
  }

  /* =======================
     CINEMATIC REVEAL
     (UNCHANGED CORE)
     ======================= */

function generateLightningPoints(x1, y1, x2, y2) {
  const points = [{x: x1, y: y1}];
  const segments = 14;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;
    const roughness = 42 * Math.sin(t * Math.PI);
    const offset = (Math.random() - 0.5) * roughness * 2;
    points.push({ x: mx + nx * offset, y: my + ny * offset });
  }
  points.push({x: x2, y: y2});
  return points;
}

function flashAndStrike(overlay, fromX, toX, toY, onHit) {
  // ── FLASH ──
  const flash = document.createElement("div");
  flash.style.cssText = "position:absolute;inset:0;background:rgba(255,220,80,0.55);z-index:8;pointer-events:none;";
  flash.style.opacity = "1";
  overlay.appendChild(flash);
  setTimeout(() => { flash.style.transition = "opacity 0.4s ease"; flash.style.opacity = "0"; }, 80);
  setTimeout(() => { flash.remove(); }, 520);

  // ── SVG LIGHTNING BOLT ──
  const pts = generateLightningPoints(fromX, 0, toX, toY);
  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");

  const W = window.innerWidth, H = window.innerHeight;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.style.cssText = "position:absolute;inset:0;z-index:7;pointer-events:none;overflow:visible;";

  function makePath(color, width, opacity) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", pathD);
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", width);
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("fill", "none");
    p.setAttribute("opacity", opacity);
    return p;
  }

  // glow layer + bright core
  svg.appendChild(makePath("#ffcc00", "12", "0.4"));
  svg.appendChild(makePath("#ffe040", "6",  "0.85"));
  svg.appendChild(makePath("#ffffff", "2",  "1"));

  overlay.appendChild(svg);
  onHit();

  // flicker: redraw slightly offset path
  setTimeout(() => {
    const pts2 = generateLightningPoints(fromX, 0, toX, toY);
    const d2 = pts2.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    svg.querySelectorAll("path").forEach(p => p.setAttribute("d", d2));
  }, 80);

  // fade out
  setTimeout(() => {
    svg.style.transition = "opacity 0.45s ease";
    svg.style.opacity = "0";
    setTimeout(() => svg.remove(), 500);
  }, 260);
}


function startStarsAnimation(canvas, starsState) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const stars = [];

  for (let i = 0; i < 130; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 2.2,
      speed: 0.08 + Math.random() * 0.35,
      tw: Math.random() * Math.PI * 2,
      tws: 0.018 + Math.random() * 0.045
    });
  }

  let fadeIn = 0;

  function loop() {
    if (!canvas.parentElement) return;

    fadeIn = Math.min(1, fadeIn + 0.018);
    ctx.clearRect(0, 0, W, H);

    const isGold = starsState.cardType === 'gold'; // kept for reference

    for (const s of stars) {
      s.y -= s.speed;
      s.tw += s.tws;
      if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }

      const alpha = fadeIn * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.tw)));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = starsState.cardType === 'gold'
        ? `hsla(46, 92%, 62%, ${alpha})`
        : starsState.cardType === 'purple'
          ? `hsla(270, 80%, 72%, ${alpha})`
          : `hsla(210, 18%, 84%, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }

  loop();
}

function revealForAuction(name, isThunder, thunderCombo, done) {
  revealState.active = true;
  revealState.done = done;
  revealState.timeouts = [];
  revealState.pendingName = name;
  revealState.isThunder = isThunder;
  revealState.thunderTarget = thunderCombo ? thunderCombo.to : null;
  revealState.goldOverlay = null;
  revealState.starsState = null;

  const meta = playerMeta[name] || {};
  const actualCardType = meta.cardType || "silver";
  // Thunder always starts as the "from" card type
  const cardType = isThunder ? thunderCombo.from : actualCardType;

  const overlay = document.createElement("div");
  overlay.className = "reveal-overlay";
  revealState.overlay = overlay;

  const starsCanvas = document.createElement("canvas");
  starsCanvas.className = "reveal-stars-canvas";
  starsCanvas.width = window.innerWidth;
  starsCanvas.height = window.innerHeight;
  overlay.appendChild(starsCanvas);

  const card = document.createElement("div");
  card.className = "reveal-card entering";
  card.classList.add(cardType);

  const inner = document.createElement("div");
  inner.className = "reveal-card-inner";

  const back = document.createElement("div");
  back.className = "reveal-card-face reveal-card-back";

  const front = document.createElement("div");
  front.className = "reveal-card-face reveal-card-front";

  // Overlay for thunder — class depends on target card type
  let goldOverlay = null;
  if (isThunder) {
    goldOverlay = document.createElement("div");
    goldOverlay.className = thunderCombo.to === "purple"
      ? "purple-reveal-overlay"
      : "gold-reveal-overlay";
    front.appendChild(goldOverlay);
    revealState.goldOverlay = goldOverlay;
  }

  const nameEl = document.createElement("div");
  nameEl.className = "reveal-player-name";
  nameEl.textContent = "";

  const logoEl = document.createElement("img");
  const prevTeam = meta.prevTeam;
  if (prevTeam && teamLogos[prevTeam]) {
    logoEl.src = teamLogos[prevTeam];
    logoEl.className = "reveal-team-logo";
  }

  front.appendChild(nameEl);
  if (logoEl.src) front.appendChild(logoEl);
  inner.appendChild(back);
  inner.appendChild(front);
  card.appendChild(inner);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  void card.offsetWidth;

  const flipDelay = 2600;
  const charInterval = 140;
  const typingDuration = name.length * charInterval;
  const holdAfterName = 3000;

  // Staggered thunder timing (relative to flip)
  const rightBoltDelay  = 850;   // right bolt fires 850ms after flip
  const rightGoldDelay  = 1050;  // right half turns gold 200ms after right bolt
  const leftBoltDelay   = 1900;  // left bolt fires
  const leftGoldDelay   = 2100;  // full card turns gold
  const nameExtraDelay  = isThunder ? 2700 : 600; // name waits for thunder to settle

  const nameStartDelay = flipDelay + nameExtraDelay + (logoEl.src ? 300 : 0);

  // Stars start as "from" card type, switch to "to" type after second bolt
  const starsState = { cardType: isThunder ? thunderCombo.from : cardType };
  revealState.starsState = starsState;

  // ── FLIP + STARS ──
  registerTimeout(setTimeout(() => {
    card.classList.add("flipped");
    startStarsAnimation(starsCanvas, starsState);
  }, flipDelay));

  if (isThunder && goldOverlay) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const cardHalfW = 195;

    // ── RIGHT THUNDER ──
    registerTimeout(setTimeout(() => {
      flashAndStrike(overlay, cx + cardHalfW * 1.6, cx + cardHalfW * 0.55, cy - 60, () => {
        // right half turns gold
        registerTimeout(setTimeout(() => {
          goldOverlay.style.clipPath = "inset(0 0 0 50%)";
        }, rightGoldDelay - rightBoltDelay));
      });
    }, flipDelay + rightBoltDelay));

    // ── LEFT THUNDER ──
    registerTimeout(setTimeout(() => {
      flashAndStrike(overlay, cx - cardHalfW * 1.6, cx - cardHalfW * 0.55, cy - 60, () => {
        // full card turns to target + stars switch
        registerTimeout(setTimeout(() => {
          goldOverlay.style.clipPath = "inset(0 0% 0 0)";
          starsState.cardType = thunderCombo.to;
        }, leftGoldDelay - leftBoltDelay));
      });
    }, flipDelay + leftBoltDelay));
  }

  // ── BACKGROUND LOGO ──
  const bgLogo = document.createElement("div");
  bgLogo.className = "reveal-bg-logo";
  overlay.insertBefore(bgLogo, starsCanvas);

  // ── LOGO ──
  if (logoEl && logoEl.src) {
    registerTimeout(setTimeout(() => {
      logoEl.classList.add("visible");
      // fade in club logo as background 400ms after it appears on card
      registerTimeout(setTimeout(() => {
        bgLogo.style.backgroundImage = `url("${logoEl.src}")`;
        bgLogo.classList.add("visible");
      }, 400));
    }, nameStartDelay - 200));
  }

  // ── TYPEWRITER NAME ──
  registerTimeout(setTimeout(() => {
    nameEl.classList.add("visible");
    name.split("").forEach((char, i) => {
      registerTimeout(setTimeout(() => {
        nameEl.textContent += char;
      }, i * charInterval));
    });
  }, nameStartDelay));

  // ── VANISH after hold ──
  registerTimeout(setTimeout(() => {
    card.classList.add("vanish");
    registerTimeout(setTimeout(() => {
      if (revealState.overlay) {
        revealState.overlay.remove();
        revealState.overlay = null;
      }
      revealState.active = false;
      done();
    }, 900));
  }, nameStartDelay + typingDuration + holdAfterName));
}


function flyCardToTeam(player, team) {
  const source = document.querySelector(".reveal-card");
  const target = document.querySelector(
    `[data-team="${team}"]`
  );

  if (!source || !target) return;

  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  const chip = document.createElement("div");
  chip.className = "flying-chip";
  chip.textContent = player;

  chip.style.left = `${s.left + s.width / 2}px`;
  chip.style.top = `${s.top + s.height / 2}px`;
  chip.style.transform = "translate(-50%, -50%) scale(1.2)";
  chip.style.opacity = "1";

  document.body.appendChild(chip);

  // ✨ small delay to trigger transition
  requestAnimationFrame(() => {
    chip.style.left = `${t.left + t.width / 2}px`;
    chip.style.top = `${t.top + 16}px`;
    chip.style.transform = "translate(-50%, -50%) scale(0.9)";
    chip.style.opacity = "0.95";
    target.classList.add("highlight");
setTimeout(() => target.classList.remove("highlight"), 700);

  });

  // 🧹 cleanup
  setTimeout(() => {
    chip.remove();
  }, 950);
}

function flyNameToTeam(player, team, onComplete) {
  const source = document.querySelector(".reveal-card .reveal-player-name");
  const teamPanel = document.querySelector(`[data-team="${team}"]`);
  const targetList = teamPanel?.querySelector(".team-players");

  if (!source || !teamPanel || !targetList) {
    onComplete?.();
    return;
  }

  const s = source.getBoundingClientRect();
  const t = targetList.getBoundingClientRect();

  const clone = source.cloneNode(true);
  clone.classList.add("flying-name");

  clone.style.position = "fixed";
  clone.style.left = `${s.left}px`;
  clone.style.top = `${s.top}px`;
  clone.style.width = `${s.width}px`;
  clone.style.zIndex = "9999";

 document.body.appendChild(clone);
clone.getBoundingClientRect(); // 🔥 forces browser to paint

  // 🔥 Force browser to register initial position
  clone.getBoundingClientRect();

  // ✈️ Animate
  clone.style.left = `${t.left + 10}px`;
  clone.style.top = `${t.top + 10}px`;
  clone.style.transform = "scale(0.9)";
  clone.style.opacity = "0.3";

  setTimeout(() => {
    clone.remove();
    onComplete?.();
  }, 1200);
}




  /* =======================
     END OF AUCTION SUMMARY ⑥
     ======================= */

  function showAuctionSummary() {
    // Top 10 most expensive players
    const top10 = [...soldHistory]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const medals = ["🥇","🥈","🥉"];
    const posColors = [
      "#FFD700","#C0C0C0","#CD7F32",
      "#4FC3F7","#81C784","#FF8A65",
      "#CE93D8","#80DEEA","#FFCC02","#A5D6A7"
    ];

    const top10Rows = top10.map((s, i) => {
      const meta = teamMeta[s.bidder] || {};
      const teamName = escapeHtml(meta.teamName || s.bidder);
      const medal = i < 3 ? medals[i] : `<span style="font-weight:800;color:#888">${i+1}</span>`;
      const col = posColors[i];

      return `
        <div class="top10-row" style="border-left: 4px solid ${col}">
          <div class="top10-rank">${medal}</div>
          <div class="top10-avatar" style="background:${col}22; border: 2px solid ${col}">
            ${meta.logo ? `<img src="${meta.logo}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">` : `<span style="font-size:18px;">⚽</span>`}
          </div>
          <div class="top10-info">
            <div class="top10-name">${escapeHtml(s.player)}</div>
            <div class="top10-team">${teamName}</div>
          </div>
          <div class="top10-price" style="color:${col}">₹${s.amount}</div>
        </div>
      `;
    }).join("");

    auctionSection.innerHTML = `
      <div class="top10-screen">
        <div class="top10-title">🏆 Top 10 Most Expensive Players</div>
        <div class="top10-list">${top10Rows}</div>
      </div>
    `;
  }


  /* =======================
     CLEAR ALL DATA
     ======================= */

  document.getElementById("clearDataBtn").addEventListener("click", () => {
    const confirmed = confirm(
      "⚠️ Are you sure you want to clear ALL data?\n\nThis will delete all teams, players, bids and history. This cannot be undone."
    );
    if (!confirmed) return;

    localStorage.removeItem("auction_state_v1");

    // wipe all in-memory stores
    players.length = 0;
    unsoldPlayers.length = 0;
    soldHistory.length = 0;
    Object.keys(bidders).forEach(k => delete bidders[k]);
    Object.keys(bidderTeams).forEach(k => delete bidderTeams[k]);
    Object.keys(teamMeta).forEach(k => delete teamMeta[k]);
    Object.keys(playerMeta).forEach(k => delete playerMeta[k]);

    // reset auction state
    currentPlayer       = null;
    currentBid          = 25;
    currentBidder       = null;
    lastSale            = null;
    lastSkip            = null;
    mostExpensiveSale   = null;
    totalPlayersAtStart = 0;
    thunderRevealCount      = 0;
    lastThunderRevealIndex  = -999;
    revealTotalIndex        = 0;
    bidLog              = [];
    recentBidders       = [];
    Object.keys(sessionBidCounts).forEach(k => delete sessionBidCounts[k]);
    Object.keys(rivalryMap).forEach(k => delete rivalryMap[k]);
    Object.keys(teamConsecutiveWins).forEach(k => delete teamConsecutiveWins[k]);
    Object.keys(teamLastBidAuctionIndex).forEach(k => delete teamLastBidAuctionIndex[k]);
    mostContestedRecord = { player: null, count: 0 };
    goldSoldPrices.length = 0;
    firstRoundUnsoldSet.clear();
    milestoneShown = { 25: false, 50: false, 75: false };
    isRound2 = false;
    lastWinner = null;
    auctionPlayerIndex = 0;
    currentPlayerBidCount = 0;

    renderPlayers();
    renderUnsold();
    renderSoldHistory();
    updateLeaderboard();
    renderAuctionIdle();

    result.textContent = "✅ All data cleared!";
    setTimeout(() => { result.textContent = ""; }, 3000);
  });

  /* =======================
     INIT
     ======================= */

  loadState();
  renderPlayers();
  renderUnsold();
  renderSoldHistory();
  updateLeaderboard();

  // If we were mid-auction when page closed, resume live bidding
  if (currentPlayer) {
    showLiveBidding();
  } else {
    renderAuctionIdle();
  }

});