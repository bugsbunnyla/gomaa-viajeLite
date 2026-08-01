// ============================================
// gomaa-bag2go — App Logic
// ============================================

const state = {
  currentStep: 1,
  splitMode: false,
  weight: 35,
  dimWeight: 27,
  billableWeight: 35,
  speed: 'same-day',
  carrier: null,
  rates: {},
  payment: 'card',
  holdFee: 0,
  splitFee: 0,
  platformFee: 2.99,
  stopCount: 1,
  user: null
};

const SPEED_LABELS = {
  'same-day': 'Same Day',
  'next-day': 'Next Day',
  '3-day': '3-Day',
  '5-day': '5-Day',
  'custom': 'Custom',
  'international': 'International'
};

const SPEED_ETAS = {
  'same-day': 'Today by 8PM',
  'next-day': 'Tomorrow by 8PM',
  '3-day': '3 business days',
  '5-day': '5 business days',
  'custom': 'Your chosen dates',
  'international': '5-10 business days'
};

const CARRIER_SERVICES = {
  fedex: { 'same-day': 'SameDay', 'next-day': 'Priority', '3-day': 'Express Saver', '5-day': 'Ground', 'custom': 'Ground', 'international': 'International Priority' },
  ups: { 'same-day': 'Express Critical', 'next-day': 'Next Day Air', '3-day': '3 Day Select', '5-day': 'Ground', 'custom': 'Ground', 'international': 'Worldwide Express' },
  dhl: { 'same-day': 'Same Day', 'next-day': 'Express 9:00', '3-day': 'Express Worldwide', '5-day': 'Economy Select', 'custom': 'Economy Select', 'international': 'Express Worldwide' },
  amazon: { 'same-day': 'Same-Day', 'next-day': 'One-Day', '3-day': 'Two-Day', '5-day': 'Standard', 'custom': 'Standard', 'international': 'International Standard' }
};

// ===== TAB SWITCHING =====
function switchTab(btn, tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#tab-book, #tab-track, #tab-history, #tab-addresses, #tab-settings').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
}

// ===== AUTH MODAL =====
function showAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function hideAuthModal() { document.getElementById('authModal').classList.add('hidden'); }
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}
function login() {
  const email = document.getElementById('loginEmail').value;
  if (!email) { showToast('Please enter email', 'error'); return; }
  state.user = { email, name: email.split('@')[0] };
  document.getElementById('authBtn').classList.add('hidden');
  document.getElementById('userBtn').classList.remove('hidden');
  document.getElementById('userBtn').textContent = state.user.name;
  hideAuthModal();
  showToast('Welcome back, ' + state.user.name + '!', 'success');
}
function register() {
  const email = document.getElementById('regEmail').value;
  if (!email) { showToast('Please enter email', 'error'); return; }
  state.user = { email, name: document.getElementById('regFirstName').value || email.split('@')[0] };
  document.getElementById('authBtn').classList.add('hidden');
  document.getElementById('userBtn').classList.remove('hidden');
  document.getElementById('userBtn').textContent = state.user.name;
  hideAuthModal();
  showToast('Account created! Welcome, ' + state.user.name + '!', 'success');
}
function logout() {
  state.user = null;
  document.getElementById('authBtn').classList.remove('hidden');
  document.getElementById('userBtn').classList.add('hidden');
  showToast('Signed out successfully', 'success');
}

// ===== STEPPER =====
function goToStep(n) {
  if (n === 2) {
    const pStreet = document.getElementById('pickupStreet').value;
    const pCity = document.getElementById('pickupCity').value;
    const pState = document.getElementById('pickupState').value;
    const pZip = document.getElementById('pickupZip').value;
    if (!pStreet || !pCity || !pState || !pZip) {
      showToast('Please fill all required pickup address fields', 'error');
      return;
    }
    let validStops = true;
    document.querySelectorAll('.stop-card').forEach(card => {
      if (!card.querySelector('.stop-street').value || !card.querySelector('.stop-city').value) validStops = false;
    });
    if (!validStops) { showToast('Please complete all delivery stop addresses', 'error'); return; }
    updateSummary();
  }
  if (n === 4) {
    fetchRates();
  }
  if (n === 5) {
    if (!state.carrier) { showToast('Please select a carrier first', 'error'); return; }
    buildConfirmSummary();
  }

  for (let i = 1; i <= 5; i++) {
    document.getElementById('step' + i).classList.add('hidden');
  }
  document.getElementById('step' + n).classList.remove('hidden');
  document.getElementById('step' + n).classList.add('fade-in');

  document.querySelectorAll('.step').forEach((s, idx) => {
    const stepNum = idx + 1;
    s.classList.remove('active', 'completed');
    if (stepNum === n) s.classList.add('active');
    else if (stepNum < n) s.classList.add('completed');
  });

  document.querySelectorAll('.step-line').forEach((l, idx) => {
    const lineNum = idx + 1;
    l.classList.toggle('completed', lineNum < n);
  });

  state.currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== STOPS =====
function toggleSplit() {
  const toggle = document.getElementById('splitToggle');
  state.splitMode = !state.splitMode;
  toggle.classList.toggle('active', state.splitMode);
  updateSplitFee();
  updateSummary();
  showToast(state.splitMode ? 'Split shipment mode enabled' : 'Split shipment mode disabled', 'success');
}

function addStop() {
  state.stopCount++;
  const container = document.getElementById('stopsContainer');
  const div = document.createElement('div');
  div.className = 'stop-card fade-in';
  div.dataset.stop = state.stopCount;
  div.innerHTML = '<div class="stop-header"><span class="stop-badge">📍 Stop ' + state.stopCount + '</span><button class="stop-remove" onclick="removeStop(' + state.stopCount + ')">Remove</button></div><div class="form-grid"><div class="form-group full-width"><label class="form-label">Street Address <span class="required">*</span></label><input type="text" class="form-input stop-street" placeholder="Enter street address"></div><div class="form-group"><label class="form-label">City <span class="required">*</span></label><input type="text" class="form-input stop-city" placeholder="City"></div><div class="form-group"><label class="form-label">State <span class="required">*</span></label><input type="text" class="form-input stop-state" placeholder="State"></div><div class="form-group"><label class="form-label">ZIP <span class="required">*</span></label><input type="text" class="form-input stop-zip" placeholder="ZIP"></div><div class="form-group"><label class="form-label">Country <span class="required">*</span></label><select class="form-select stop-country"><option value="US" selected>United States</option><option value="CA">Canada</option><option value="UK">United Kingdom</option><option value="DE">Germany</option><option value="FR">France</option><option value="AU">Australia</option><option value="JP">Japan</option><option value="IN">India</option><option value="AE">UAE</option><option value="SG">Singapore</option></select></div><div class="form-group"><label class="form-label">Recipient Name <span class="required">*</span></label><input type="text" class="form-input stop-name" placeholder="Full name"></div><div class="form-group"><label class="form-label">Recipient Phone <span class="required">*</span></label><input type="tel" class="form-input stop-phone" placeholder="+1 (555) 000-0000"></div><div class="form-group full-width"><label class="form-label">Delivery Instructions</label><textarea class="form-textarea stop-instructions" placeholder="Special instructions..."></textarea></div></div>';
  container.appendChild(div);
  updateSummary();
}

function removeStop(id) {
  const card = document.querySelector('.stop-card[data-stop="' + id + '"]');
  if (card) { card.remove(); updateSummary(); }
}

// ===== WEIGHT =====
function selectWeight(lbs, el) {
  document.querySelectorAll('.weight-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('exactWeight').value = lbs;
  updateWeight(lbs);
}

function updateWeight(lbs) {
  state.weight = parseFloat(lbs) || 35;
  calcDimWeight();
}

function calcDimWeight() {
  const l = parseFloat(document.getElementById('dimL').value) || 1;
  const w = parseFloat(document.getElementById('dimW').value) || 1;
  const h = parseFloat(document.getElementById('dimH').value) || 1;
  state.dimWeight = Math.ceil((l * w * h) / 139);
  state.billableWeight = Math.max(state.weight, state.dimWeight);
  document.getElementById('dimWeightDisplay').textContent = state.dimWeight;
  updateSummary();
}

// ===== SPEED =====
function selectSpeed(speed, el) {
  document.querySelectorAll('.window-tab').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.speed = speed;
  document.getElementById('customWindowPanel').classList.toggle('hidden', speed !== 'custom');
  updateSummary();
  if (state.currentStep === 4) fetchRates();
}

// ===== HOLD FEE =====
function updateHoldFee() {
  const date = document.getElementById('holdUntilDate').value;
  if (date) {
    const days = Math.max(1, Math.ceil((new Date(date) - new Date()) / 86400000));
    state.holdFee = days * 3.50;
  } else {
    state.holdFee = 0;
  }
  document.getElementById('holdFeeDisplay').textContent = state.holdFee.toFixed(2);
  updateSummary();
}

function updateSplitFee() {
  const stops = document.querySelectorAll('.stop-card').length;
  state.splitFee = state.splitMode ? Math.max(0, (stops - 1)) * 5.00 : 0;
}

// ===== CARRIER RATES =====
function fetchRates() {
  const baseRate = state.billableWeight * 1.25;
  const multipliers = { 'same-day': 3.5, 'next-day': 2.2, '3-day': 1.5, '5-day': 1.0, 'custom': 1.2, 'international': 2.8 };
  const carrierMultipliers = { fedex: 1.0, ups: 1.05, dhl: 1.15, amazon: 0.92 };
  const speed = state.speed;

  ['fedex', 'ups', 'dhl', 'amazon'].forEach(carrier => {
    const rate = Math.round(baseRate * multipliers[speed] * carrierMultipliers[carrier] * 100) / 100;
    state.rates[carrier] = rate;
    document.getElementById(carrier + 'Rate').textContent = '$' + rate.toFixed(2);
    document.getElementById(carrier + 'Service').textContent = CARRIER_SERVICES[carrier][speed] || 'Standard';
    document.getElementById(carrier + 'Eta').textContent = SPEED_ETAS[speed];
  });

  showToast('Rates refreshed for all carriers', 'success');
  updateSummary();
}

function selectCarrier(carrier, el) {
  document.querySelectorAll('.carrier-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.carrier = carrier;
  updateSummary();
}

// ===== PAYMENT =====
function selectPayment(method, el) {
  document.querySelectorAll('.payment-option').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  state.payment = method;
  updateSummary();
}

// ===== SUMMARY =====
function updateSummary() {
  const pState = document.getElementById('pickupState').value || 'NY';
  const stops = document.querySelectorAll('.stop-card');
  let destState = 'CA';
  if (stops.length > 0) {
    const lastStop = stops[stops.length - 1];
    destState = lastStop.querySelector('.stop-state').value || 'CA';
  }

  document.getElementById('sumPickup').textContent = pState + ' → ' + destState;
  document.getElementById('sumStops').textContent = stops.length + ' stop' + (stops.length > 1 ? 's' : '');
  document.getElementById('sumWeight').textContent = state.billableWeight + ' lbs';
  document.getElementById('sumService').textContent = SPEED_LABELS[state.speed];
  document.getElementById('sumCarrier').textContent = state.carrier ? state.carrier.toUpperCase() : '—';

  updateSplitFee();
  document.getElementById('sumSplit').textContent = '$' + state.splitFee.toFixed(2);
  document.getElementById('sumHold').textContent = '$' + state.holdFee.toFixed(2);

  let total = state.platformFee + state.splitFee + state.holdFee;
  if (state.carrier && state.rates[state.carrier]) total += state.rates[state.carrier];
  document.getElementById('sumTotal').textContent = total > state.platformFee ? '$' + total.toFixed(2) : '—';
}

// ===== CONFIRM =====
function buildConfirmSummary() {
  const pStreet = document.getElementById('pickupStreet').value;
  const pCity = document.getElementById('pickupCity').value;
  const pState = document.getElementById('pickupState').value;
  const pZip = document.getElementById('pickupZip').value;
  const pCountry = document.getElementById('pickupCountry').value;
  const pPhone = document.getElementById('pickupPhone').value;
  document.getElementById('confirmPickup').innerHTML = pStreet + '<br>' + pCity + ', ' + pState + ' ' + pZip + '<br>' + pCountry + '<br>Phone: ' + pPhone;

  let stopsHtml = '';
  document.querySelectorAll('.stop-card').forEach((card, idx) => {
    const street = card.querySelector('.stop-street').value;
    const city = card.querySelector('.stop-city').value;
    const state = card.querySelector('.stop-state').value;
    const zip = card.querySelector('.stop-zip').value;
    const country = card.querySelector('.stop-country').value;
    const name = card.querySelector('.stop-name').value;
    const phone = card.querySelector('.stop-phone').value;
    stopsHtml += '<strong>Stop ' + (idx + 1) + ':</strong> ' + (name || '—') + '<br>' + street + '<br>' + city + ', ' + state + ' ' + zip + '<br>' + country + '<br>Phone: ' + (phone || '—') + '<br><br>';
  });
  document.getElementById('confirmStops').innerHTML = stopsHtml || 'No stops configured';

  document.getElementById('confirmPackage').innerHTML = 'Actual Weight: ' + state.weight + ' lbs<br>Dimensional Weight: ' + state.dimWeight + ' lbs<br>Billable Weight: ' + state.billableWeight + ' lbs<br>Dimensions: ' + document.getElementById('dimL').value + ' × ' + document.getElementById('dimW').value + ' × ' + document.getElementById('dimH').value + ' in';

  let windowHtml = 'Service: ' + SPEED_LABELS[state.speed] + '<br>';
  if (state.speed === 'custom') {
    const from = document.getElementById('customFrom').value;
    const to = document.getElementById('customTo').value;
    windowHtml += 'Delivery Range: ' + (from || 'Not set') + ' to ' + (to || 'Not set') + '<br>';
  } else {
    windowHtml += 'Estimated: ' + SPEED_ETAS[state.speed] + '<br>';
  }
  const holdDate = document.getElementById('holdUntilDate').value;
  const holdTime = document.getElementById('holdReleaseTime').value;
  if (holdDate) {
    windowHtml += '<br><strong>Hold Request:</strong><br>Hold until: ' + holdDate + '<br>';
    if (holdTime) windowHtml += 'Release: ' + holdTime;
  }
  document.getElementById('confirmWindow').innerHTML = windowHtml;

  const carrierName = state.carrier ? state.carrier.toUpperCase() : 'Not selected';
  const rate = state.carrier && state.rates[state.carrier] ? '$' + state.rates[state.carrier].toFixed(2) : '—';
  const payments = { card: 'Credit/Debit Card', cash: 'Cash on Pickup', wallet: 'Digital Wallet', upi: 'UPI', zelle: 'Zelle', klarna: 'Klarna', karma: 'Karma Pay', payaperson: 'Pay A Person' };
  document.getElementById('confirmCarrier').innerHTML = 'Carrier: ' + carrierName + '<br>Estimated Rate: ' + rate + '<br>Payment Method: ' + payments[state.payment] + '<br>Split Shipment: ' + (state.splitMode ? 'Yes ($' + state.splitFee.toFixed(2) + ')' : 'No') + '<br>Hold Fee: $' + state.holdFee.toFixed(2);

  const baseRate = state.carrier && state.rates[state.carrier] ? state.rates[state.carrier] : 0;
  const total = baseRate + state.splitFee + state.holdFee + state.platformFee;
  document.getElementById('confirmCost').innerHTML = 'Base Rate: ' + (baseRate ? '$' + baseRate.toFixed(2) : '—') + '<br>Split Fee: $' + state.splitFee.toFixed(2) + '<br>Hold Fee: $' + state.holdFee.toFixed(2) + '<br>Platform Fee: $' + state.platformFee.toFixed(2) + '<br><strong>Total: $' + total.toFixed(2) + '</strong>';
}

function confirmBooking() {
  if (!state.carrier) { showToast('Please select a carrier first', 'error'); return; }
  const tracking = 'B2G-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  showToast('🎉 Shipment booked! Tracking: ' + tracking, 'success');
  setTimeout(() => {
    switchTab(document.querySelector('.nav-tab:nth-child(3)'), 'history');
  }, 2000);
}

// ===== TRACKING =====
function trackShipment() {
  const input = document.getElementById('trackInput').value.trim();
  if (!input) { showToast('Enter a tracking number', 'error'); return; }
  const resultDiv = document.getElementById('trackResult');
  const statuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const carrier = ['FedEx', 'UPS', 'DHL', 'Amazon'][Math.floor(Math.random() * 4)];
  resultDiv.innerHTML = '<div class="shipment-card fade-in"><div class="shipment-header"><span class="shipment-id">' + input + '</span><span class="shipment-status status-' + status.toLowerCase().replace(/ /g, '') + '">' + status + '</span></div><div style="font-size:14px;color:var(--gray-600);line-height:1.6;"><strong>Carrier:</strong> ' + carrier + '<br><strong>Origin:</strong> New York, NY<br><strong>Destination:</strong> Los Angeles, CA<br><strong>Last Update:</strong> ' + new Date().toLocaleString() + '</div></div>';
}

// ===== SETTINGS =====
function saveCarrierConfig(carrier) {
  const endpoint = document.getElementById(carrier + 'Endpoint').value;
  const key = document.getElementById(carrier + 'Key').value;
  if (!endpoint || !key) { showToast('Please enter both endpoint and API key', 'error'); return; }
  localStorage.setItem('bag2go_' + carrier + '_endpoint', endpoint);
  localStorage.setItem('bag2go_' + carrier + '_key', key);
  showToast(carrier.toUpperCase() + ' configuration saved!', 'success');
}

// ===== TOAST =====
function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + (type || '');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  calcDimWeight();
  updateSummary();
});
