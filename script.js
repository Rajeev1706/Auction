// ===============================
// GLOBAL REVEAL STATE (TOP)
// ===============================
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // 1️⃣ Reveal has highest priority
  if (revealState.active) {
    skipRevealAnimation();
    return;
  }

});





let revealState = {
  active: false,
  overlay: null,
  timeouts: [],
  done: null
};

let soldState = {
  active: false,
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

  console.log("SKIPPING REVEAL");

  revealState.timeouts.forEach(clearTimeout);
  revealState.timeouts = [];

  if (revealState.overlay) {
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
  const topPlayers = [];
  const teamLogos = {
  barca: "logos/barca.png",
  psg: "logos/psg.png",
  rm: "logos/realmadrid.png",
  manutd: "logos/manutd.png",
  mancity: "logos/mancity.png",
  liverpool: "logos/liverpool.png",
  chelsea: "logos/chelsea.png",
  santos: "logos/santos.png"
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

const topPlayerInput = document.getElementById("topPlayerInput");
const addTopPlayerBtn = document.getElementById("addTopPlayerBtn");
const topPlayerList = document.getElementById("topPlayerList");
const topPlayerCount = document.getElementById("topPlayerCount");


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

  openTeamModalBtn.onclick = () => teamModal.classList.remove("hidden");
  teamClose.onclick = teamCancel.onclick = () => teamModal.classList.add("hidden");

  teamConfirmBtn.onclick = () => {
    const captain = teamCaptainInput.value.trim();
    if (!captain || bidders[captain]) {
      alert("Invalid or duplicate captain");
      return;
    }

    bidders[captain] = 1200;
    bidderTeams[captain] = [];
    teamMeta[captain] = {
      teamName: teamNameInput.value.trim(),
      logo: null
    };

    const file = teamLogoInput.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = e => {
        teamMeta[captain].logo = e.target.result;
        updateLeaderboard();
      };
      r.readAsDataURL(file);
    }

    teamCaptainInput.value = "";
    teamNameInput.value = "";
    teamLogoInput.value = "";
    teamModal.classList.add("hidden");
    updateLeaderboard();
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

function checkNormalAuctionCompleted() {
  if (
    auctionPhase === "normal" &&
    players.length === 0 &&
    unsoldPlayers.length === 0 &&
    currentPlayer === null
  ) {
    showTopPlayerStart();
  }
}

function showTopPlayerStart() {
  auctionSection.innerHTML = `
    <h2 class="auction-title">⭐ Top Player Allocation</h2>
    <p class="auction-focus">
      All auction players sold.<br>
      Ready to allocate Top Players.
    </p>
    <button id="startTopAllocationBtn" class="danger-btn">
      ▶ Start Top Player Allocation
    </button>
  `;

  const btn = document.getElementById("startTopAllocationBtn");
  if (btn) {
    btn.addEventListener("click", () => {
  auctionPhase = "top";

  // prepare allocation pools
  remainingTopPlayers = [...topPlayers];
  availableTeamsForTop = Object.keys(bidders); // captains
  topAllocationIndex = 0;

  if (remainingTopPlayers.length !== availableTeamsForTop.length) {
  alert("Top players count must match number of teams");
}

   allocateNextTopPlayer();
});

  }
}

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
        ${prevLogo ? `<img class="sold-logo hidden" id="prevLogo" src="${prevLogo}">` : ""}
        <span class="sold-arrow hidden" id="soldArrow">➜</span>
        ${newLogo ? `<img class="sold-logo hidden" id="newLogo" src="${newLogo}">` : ""}
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

  openPlayerDataModal(name);
});

addTopPlayerBtn.addEventListener("click", () => {
  const name = topPlayerInput.value.trim();
  if (!name) return;

  if (
    topPlayers.map(p => p.toLowerCase()).includes(name.toLowerCase()) ||
    players.map(p => p.toLowerCase()).includes(name.toLowerCase())
  ) {
    alert("Player already exists");
    return;
  }

  topPlayers.push(name);
  topPlayerInput.value = "";
  renderTopPlayers();
});



pdConfirm.addEventListener("click", () => {
  const name = pdName.value.trim();
  if (!name) return;

  const cardType = pdCardType.value;
  const prevTeam = document.getElementById("pdPrevTeam").value || null;

  players.push(name);

  playerMeta[name] = {
    cardType,
    prevTeam
  };

  renderPlayers();
  playerInput.value = "";
  closePlayerDataModal();
});




  // Open player data modal instead of adding directly
  function openPlayerDataModal(name) {
  pdName.value = name;
  pdCardType.value = "silver";

  pdModal.classList.remove("hidden");
}

function closePlayerDataModal() {
  pdModal.classList.add("hidden");
}
pdClose.addEventListener("click", closePlayerDataModal);
pdCancel.addEventListener("click", closePlayerDataModal);




  function renderPlayers() {
    playerList.innerHTML = "";
      updatePlayerCount();
    const grid = document.createElement("div");
    grid.className = "player-grid";

    players.forEach(p => {
      const chip = document.createElement("button");
      chip.className = "player-chip";
      chip.textContent = p;
      grid.appendChild(chip);
    });

    playerList.appendChild(grid);
  }

  function renderTopPlayers() {
  topPlayerList.innerHTML = "";
  topPlayerCount.textContent = topPlayers.length;

  const grid = document.createElement("div");
  grid.className = "player-grid";

  topPlayers.forEach(p => {
    const chip = document.createElement("button");
    chip.className = "player-chip";
    chip.textContent = p;
    grid.appendChild(chip);
  });

  topPlayerList.appendChild(grid);
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

    Object.keys(bidders).forEach((bidder, i) => {
      const meta = teamMeta[bidder] || {};
      const team = bidderTeams[bidder] || [];

      const card = document.createElement("div");
card.className = "team-leader";
card.dataset.team = bidder;
      card.innerHTML = `
        ${meta.logo ? `<img class="circle-logo" src="${meta.logo}">` : ""}
        <div class="team-info">
          <h4>${meta.teamName || "Team"} (${team.length})</h4>
          <p><strong>${bidder}</strong> — ₹${bidders[bidder]}</p>
          <div class="team-players">
            ${team.map(p => `<span class="team-player-tag">${p}</span>`).join("") || "<span class='team-player-tag muted'>No players</span>"}
          </div>
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
  let lastSkip = null;
  let undoTimer = null;
  let lastActionType = null; // "sold" | "skipped"
  let pendingPlayer = null;
  let auctionTimer = null;
  let timeLeft = 0;
  let timerRunning = false;
  let extraTimeCount = 0;
  let auctionPhase = "normal"; // "normal" | "top"
  let remainingTopPlayers = [];
  let availableTeamsForTop = [];
  let topAllocationIndex = 0;
  let allocatedTopTeams = new Set();
  let topAllocIndex = 0;




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
  }, 650); // stop after 0.4s
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
  auctionSection.innerHTML = `
    <h2 class="auction-title">🎯 Auction Area</h2>

    <div class="auction-focus">
      🔥 <strong>Bidding for:</strong>
      <span class="player-name">${escapeHtml(currentPlayer)}</span>
    </div>

    <div class="auction-stats">
      <div>💰 <strong>Current Bid:</strong> ₹<span id="currentBid">${currentBid}</span></div>
      <div>👑 <strong>Leading:</strong> <span id="currentBidder">${currentBidder || "None"}</span></div>
    </div>
  `;

  const timerBox = document.createElement("div");
  timerBox.id = "auctionTimer";
  timerBox.className = "auction-timer hidden";
  timerBox.innerHTML = `
  ⏱ <span id="timerValue">20</span>s
`;

auctionSection.appendChild(timerBox);


  Object.keys(bidders).forEach(bidder => {
    const points = bidders[bidder];
    const minBid = currentBid + 5;

    const row = document.createElement("div");
    row.className = "bid-row";

    row.innerHTML = `
      <button class="bid-plus">${bidder} (₹${points}) ➕ ₹5</button>
      <input type="number" class="bid-input" placeholder="Min ₹${minBid}" />
      <button class="bid-set">Set Bid</button>
    `;

    row.querySelector(".bid-plus").addEventListener("click", () => {
  if (points >= currentBid + 5) {
    currentBid += 5;
    currentBidder = bidder;
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

  // 🔑 EVENT BINDINGS (THIS FIXES EVERYTHING)
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
}

function startSoldAnimation({ player, bidder, amount }) {
  soldState.active = true;
  soldState.timeouts = [];

  showSoldSummary({ player, bidder, amount });

  const exitTimeout = setTimeout(() => {
    soldState.active = false;

    // 🔑 restore auction UI
    renderAuctionIdle();
    checkNormalAuctionCompleted();
  }, 4000);

  registerSoldTimeout(exitTimeout);
}





function endAuction() {
  clearAuctionTimer();
  if (!currentPlayer) return;

  if (!currentBidder) {
    unsoldPlayers.push(currentPlayer);
    result.textContent = `❌ No bids for ${currentPlayer}`;
  } else {
  bidders[currentBidder] -= currentBid;
  bidderTeams[currentBidder].push(currentPlayer);

  const sale = {
    player: currentPlayer,
    bidder: currentBidder,
    amount: currentBid
  };

  soldHistory.unshift(sale); // newest on top
  renderSoldHistory();

  lastSale = sale;

 updateLeaderboard();
showUndoToast("sold");

startSoldAnimation({
  player: currentPlayer,
  bidder: currentBidder,
  amount: currentBid
});
}
}


  function startAuction() {
    result.textContent = "";
    if (!players.length && !unsoldPlayers.length) {
  result.textContent = "All players sold!";
  checkNormalAuctionCompleted();
  return;
}


    if (!players.length) {
      players.push(...unsoldPlayers);
      unsoldPlayers.length = 0;
      renderUnsold();
    }

    const idx = Math.floor(Math.random() * players.length);
   const picked = players.splice(idx, 1)[0];
   pendingPlayer = picked;
  renderPlayers();

  revealForAuction(picked, () => {
  currentPlayer = picked;
  currentBid = 25;
  currentBidder = null;
  extraTimeCount = 0;
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

  lastSkip = currentPlayer;
  unsoldPlayers.push(currentPlayer);
  renderUnsold();
  pendingPlayer = null;


  result.textContent = `⏭ ${currentPlayer} skipped`;

  currentPlayer = null;
  currentBid = 25;
  currentBidder = null;

  renderAuctionIdle();
  showUndoToast("skipped");
  checkNormalAuctionCompleted();
}



function reduceBid() {
  if (currentBid > 25) {
    currentBid -= 5;
    showLiveBidding();
  }
}

function undoLastSale() {
  if (!lastSale) {
    alert("Nothing to undo");
    return;
  }

  function undoSkippedPlayer() {
  if (!lastSkip) return;

  currentPlayer = lastSkip;
  lastSkip = null;

  showLiveBidding();
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
  showLiveBidding();

  showResultMessage(`↺ Undo: ${player} returned to auction`, 3000);

}

function allocateNextTopPlayer() {
  if (!topAllocationActive) return;
  if (topAllocIndex >= topPlayers.length) return;

  const availableTeams = Object.keys(bidders).filter(
    t => !allocatedTopTeams.has(t)
  );

  if (!availableTeams.length) return;

  const team =
    availableTeams[Math.floor(Math.random() * availableTeams.length)];

  const player = topPlayers[topAllocIndex];

  bidderTeams[team].push(player);
  allocatedTopTeams.add(team);
  topAllocIndex++;

  updateLeaderboard();

  if (topAllocIndex === topPlayers.length) {
    topAllocationActive = false;
    result.textContent = "⭐ Top Player Allocation Completed";
  }
}

function allocateNextTopPlayer() {
  // 🛡 SAFETY CHECKS
  if (auctionPhase !== "top") return;
  if (!remainingTopPlayers.length) {
    showTopAllocationCompleted();
    return;
  }
  if (!availableTeamsForTop.length) return;

  const player = remainingTopPlayers.shift();

  const teamIndex = Math.floor(Math.random() * availableTeamsForTop.length);
  const team = availableTeamsForTop.splice(teamIndex, 1)[0];

  revealForAuction(player, () => {

  // ⏸️ small pause so user reads name
  setTimeout(() => {

    flyNameToTeam(player, team, () => {

      // ✅ NOW add to team (after animation)
      bidderTeams[team].push(player);
      updateLeaderboard();

      // ✨ glow ONLY that team
      glowTeamPanel(team);

      // 🧹 remove reveal card AFTER name landed
      removeRevealCard();

      setTimeout(() => {
        removeGlowFromTeam(team);
        allocateNextTopPlayer();
      }, 3600);

    });

  }, 800); // ← VERY IMPORTANT pause
});


}

  /* =======================
     CINEMATIC REVEAL
     (UNCHANGED CORE)
     ======================= */

function revealForAuction(name, done) {
  revealState.active = true;
  revealState.done = done;
  revealState.timeouts = [];

  const meta = playerMeta[name] || {};
  const cardType = meta.cardType || "silver";

  const overlay = document.createElement("div");
  overlay.className = "reveal-overlay";
  revealState.overlay = overlay;

  const card = document.createElement("div");
  card.className = "reveal-card entering";
  card.classList.add(cardType);

  const inner = document.createElement("div");
  inner.className = "reveal-card-inner";

  const back = document.createElement("div");
  back.className = "reveal-card-face reveal-card-back";

  const front = document.createElement("div");
  front.className = "reveal-card-face reveal-card-front";

  const nameEl = document.createElement("div");
  nameEl.className = "reveal-player-name";
  nameEl.textContent = name;
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
const nameDelay = 3200;
const vanishDelay =
  auctionPhase === "top" ? 2500 : 1800;

registerTimeout(setTimeout(() => {
  card.classList.add("flipped");
}, flipDelay));

// reveal logo first (if it exists)
if (logoEl && logoEl.src) {
  registerTimeout(setTimeout(() => {
    logoEl.classList.add("visible");
  }, nameDelay - 200));
}

// reveal name (delayed if logo exists)
registerTimeout(setTimeout(() => {
  nameEl.classList.add("visible");
}, logoEl && logoEl.src ? nameDelay + 600 : nameDelay));


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

}, nameDelay + vanishDelay));
;

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
     INIT
     ======================= */

  renderPlayers();
  renderUnsold();
  updateLeaderboard();
  renderAuctionIdle();
  renderTopPlayers();

});