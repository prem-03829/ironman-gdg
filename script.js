// -----------------------------
// Energy allocation logic
// -----------------------------
const TOTAL_ENERGY = 100;
const REACTOR_CIRCUMFERENCE = 565.48; // 2 * PI * 90 (SVG circle radius)

const totalEnergyEl = document.getElementById("totalEnergy");
const usedEnergyEl = document.getElementById("usedEnergy");
const remainingEnergyEl = document.getElementById("remainingEnergy");
const allocationFeedback = document.getElementById("allocationFeedback");
const reactorPercentEl = document.getElementById("reactorPercent");
const reactorUnitsEl = document.getElementById("reactorUnits");
const reactorRing = document.getElementById("reactorRing");
const reactorCore = document.getElementById("reactorCore");
const systemCards = Array.from(document.querySelectorAll(".system-card"));

if (
  totalEnergyEl &&
  usedEnergyEl &&
  remainingEnergyEl &&
  allocationFeedback &&
  reactorPercentEl &&
  reactorUnitsEl &&
  reactorRing &&
  reactorCore &&
  systemCards.length > 0
) {
  totalEnergyEl.textContent = String(TOTAL_ENERGY);

  function toInt(value) {
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) ? 0 : num;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getCardValue(card) {
    const input = card.querySelector(".power-input");
    return clamp(toInt(input.value), 0, TOTAL_ENERGY);
  }

  function getUsedEnergy() {
    return systemCards.reduce((total, card) => total + getCardValue(card), 0);
  }

  function setFeedback(message, isError) {
    allocationFeedback.textContent = message;
    allocationFeedback.style.color = isError ? "#ffa3a3" : "#ffcf8a";
  }

  // Reactor visualization reflects remaining energy in real time.
  function updateReactor(remaining) {
    const percent = Math.round((remaining / TOTAL_ENERGY) * 100);
    const dashOffset = REACTOR_CIRCUMFERENCE * (1 - percent / 100);

    reactorPercentEl.textContent = String(percent);
    reactorUnitsEl.textContent = String(remaining);
    reactorRing.style.strokeDashoffset = String(dashOffset);

    const hue = Math.round((percent / 100) * 130);
    const scale = 0.82 + percent / 1000;

    reactorRing.style.stroke = `hsl(${hue}, 95%, 68%)`;
    reactorCore.style.transform = `scale(${scale})`;
    reactorCore.style.boxShadow = `0 0 ${12 + percent / 5}px hsla(${hue}, 95%, 68%, 0.9)`;
  }

  function renderCards() {
    const used = getUsedEnergy();
    const remaining = TOTAL_ENERGY - used;

    usedEnergyEl.textContent = String(used);
    remainingEnergyEl.textContent = String(remaining);

    systemCards.forEach((card) => {
      const input = card.querySelector(".power-input");
      const slider = card.querySelector(".power-slider");
      const minusBtn = card.querySelector(".minus");
      const plusBtn = card.querySelector(".plus");
      const valueEl = card.querySelector(".efficiency-value");
      const meterFill = card.querySelector(".meter-fill");
      const value = getCardValue(card);

      input.value = String(value);
      slider.value = String(value);
      valueEl.textContent = `${value}%`;
      meterFill.style.width = `${value}%`;
      minusBtn.disabled = value <= 0;
      plusBtn.disabled = remaining <= 0;
    });

    updateReactor(remaining);

    if (remaining === 0 && !allocationFeedback.textContent.includes("cannot")) {
      setFeedback("All energy allocated. Reduce one subsystem to re-balance.", false);
    } else if (remaining > 0 && !allocationFeedback.textContent.includes("cannot")) {
      setFeedback("Use buttons, number fields, or sliders to allocate energy.", false);
    }
  }

  // Prevents total allocation from exceeding TOTAL_ENERGY.
  function assignValue(card, requestedValue) {
    const input = card.querySelector(".power-input");
    const slider = card.querySelector(".power-slider");
    const current = getCardValue(card);
    const safeRequested = clamp(toInt(requestedValue), 0, TOTAL_ENERGY);
    const otherUsed = getUsedEnergy() - current;
    const maxAllowed = TOTAL_ENERGY - otherUsed;

    if (safeRequested > maxAllowed) {
      input.value = String(maxAllowed);
      slider.value = String(maxAllowed);
      card.classList.add("invalid");
      setFeedback(`${card.dataset.system} cannot exceed ${maxAllowed} units right now.`, true);
    } else {
      input.value = String(safeRequested);
      slider.value = String(safeRequested);
      card.classList.remove("invalid");
      setFeedback("Allocation updated successfully.", false);
    }

    renderCards();
  }

  systemCards.forEach((card) => {
    const input = card.querySelector(".power-input");
    const slider = card.querySelector(".power-slider");
    const minusBtn = card.querySelector(".minus");
    const plusBtn = card.querySelector(".plus");

    plusBtn.addEventListener("click", () => {
      assignValue(card, getCardValue(card) + 1);
    });

    minusBtn.addEventListener("click", () => {
      assignValue(card, getCardValue(card) - 1);
    });

    input.addEventListener("input", () => {
      assignValue(card, input.value);
    });

    input.addEventListener("blur", () => {
      assignValue(card, input.value);
    });

    slider.addEventListener("input", () => {
      assignValue(card, slider.value);
    });
  });

  renderCards();
}
