function updateStickyBarVisibility() {
  if (!stickyBottomBar || !resultHeroSection) return;
  const rect = resultHeroSection.getBoundingClientRect();
  const viewH = Math.min(window.innerHeight, 850);
  const heroInView = rect.top < viewH && rect.bottom > 80;

  if (heroInView) {
    stickyBottomBar.classList.remove('visible');
    stickyBottomBar.setAttribute('aria-hidden', 'true');
  } else {
    stickyBottomBar.classList.add('visible');
    stickyBottomBar.setAttribute('aria-hidden', 'false');
  }
}

import {
  calculateParentalLeave,
  calculate18MonthsDeadline,
  isWithin18Months,
  formatCurrency,
  formatManwon,
  parseWageInput,
  buildMonthlyTimeline,
} from './calc.js';

// DOM 요소 캐시
const modeRadios = document.querySelectorAll('input[name="mode"]');
const childBirthDateInput = document.getElementById('childBirthDate');

const parent1Group = document.getElementById('parent1Group');
const parent1Heading = document.getElementById('parent1Heading');
const wage1Input = document.getElementById('wage1');
const startDate1Input = document.getElementById('startDate1');
const months1Input = document.getElementById('months1');
const m1Display = document.getElementById('m1Display');
const m1DecBtn = document.getElementById('m1Dec');
const m1IncBtn = document.getElementById('m1Inc');

const parent2Group = document.getElementById('parent2Group');
const parent2Heading = document.getElementById('parent2Heading');
const wage2Input = document.getElementById('wage2');
const startDate2Input = document.getElementById('startDate2');
const months2Input = document.getElementById('months2');
const m2Display = document.getElementById('m2Display');
const m2DecBtn = document.getElementById('m2Dec');
const m2IncBtn = document.getElementById('m2Inc');

const heroLabel = document.getElementById('heroLabel');
const heroTotal = document.getElementById('heroTotal');
const heroGainText = document.getElementById('heroGainText');

const legendP1Label = document.getElementById('legendP1Label');
const legendP2Label = document.getElementById('legendP2Label');
const legendP2Item = document.getElementById('legendP2Item');
const legendRetroItem = document.getElementById('legendRetroItem');
const activeMonthBreakdown = document.getElementById('activeMonthBreakdown');
const chartSvgWrap = document.getElementById('chartSvgWrap');
const chartFootnote = document.getElementById('chartFootnote');
const accessibleTimelineBody = document.getElementById('accessibleTimelineBody');

const personSummaryRow1 = document.getElementById('personSummaryRow1');
const personSummaryRow2 = document.getElementById('personSummaryRow2');
const person1Name = document.getElementById('person1Name');
const person1Val = document.getElementById('person1Val');
const person2Name = document.getElementById('person2Name');
const person2Val = document.getElementById('person2Val');

const scheduleBlock1 = document.getElementById('scheduleBlock1');
const scheduleBlock2 = document.getElementById('scheduleBlock2');
const scheduleTitle1 = document.getElementById('scheduleTitle1');
const scheduleTitle2 = document.getElementById('scheduleTitle2');
const scheduleBody1 = document.getElementById('scheduleBody1');
const scheduleBody2 = document.getElementById('scheduleBody2');

const stickyBottomBar = document.getElementById('stickyBottomBar');
const stickyBarText = document.getElementById('stickyBarText');
const stickyBarBtn = document.getElementById('stickyBarBtn');
const resultHeroSection = document.querySelector('.result-hero');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const toast = document.getElementById('toast');

let activeMonthIndex = null;
let currentTimelineData = null;

// 날짜 초기 기본값
function setDefaultDates() {
  const today = new Date();

  // 기본 자녀 생년월일: 약 3개월 전
  const birth = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  if (!childBirthDateInput.value) {
    childBirthDateInput.value = birth.toISOString().slice(0, 10);
  }

  // 먼저 쉬는 사람: 약 2개월 전
  const start1 = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  if (!startDate1Input.value) {
    startDate1Input.value = start1.toISOString().slice(0, 10);
  }

  // 나중에 쉬는 사람: 약 4개월 뒤
  const start2 = new Date(today.getFullYear(), today.getMonth() + 4, 1);
  if (!startDate2Input.value) {
    startDate2Input.value = start2.toISOString().slice(0, 10);
  }
}

// Stepper 업데이트 헬퍼
function updateStepper(personNum, val) {
  const clamped = Math.max(1, Math.min(18, val));
  if (personNum === 1) {
    months1Input.value = clamped;
    m1Display.textContent = clamped + '개월';
    m1DecBtn.disabled = clamped <= 1;
    m1IncBtn.disabled = clamped >= 18;
  } else {
    months2Input.value = clamped;
    m2Display.textContent = clamped + '개월';
    m2DecBtn.disabled = clamped <= 1;
    m2IncBtn.disabled = clamped >= 18;
  }
}

// URL 쿼리 파라미터 읽기
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('mode')) {
    const mode = params.get('mode');
    const radio = document.querySelector('input[name="mode"][value="' + mode + '"]');
    if (radio) radio.checked = true;
  }

  if (params.has('birth')) {
    childBirthDateInput.value = params.get('birth');
  }

  if (params.has('w1')) {
    const parsed = parseWageInput(params.get('w1'));
    if (parsed.valid) {
      wage1Input.value = Math.round(parsed.value / 10000).toString();
    }
  }

  if (params.has('s1')) {
    startDate1Input.value = params.get('s1');
  }

  if (params.has('m1')) {
    const m1 = parseInt(params.get('m1'), 10) || 12;
    updateStepper(1, m1);
  } else {
    updateStepper(1, 12);
  }

  if (params.has('w2')) {
    const parsed = parseWageInput(params.get('w2'));
    if (parsed.valid) {
      wage2Input.value = Math.round(parsed.value / 10000).toString();
    }
  }

  if (params.has('s2')) {
    startDate2Input.value = params.get('s2');
  }

  if (params.has('m2')) {
    const m2 = parseInt(params.get('m2'), 10) || 12;
    updateStepper(2, m2);
  } else {
    updateStepper(2, 12);
  }
}

// URL 쿼리 파라미터 저장 (기존 파라미터와 100% 호환)
function saveStateToUrl(wageWon1, wageWon2) {
  const currentMode = document.querySelector('input[name="mode"]:checked')?.value || 'couple';
  const params = new URLSearchParams();

  params.set('mode', currentMode);
  if (childBirthDateInput.value) params.set('birth', childBirthDateInput.value);

  if (wageWon1) params.set('w1', wageWon1.toString());
  if (startDate1Input.value) params.set('s1', startDate1Input.value);
  params.set('m1', months1Input.value);

  if (currentMode === 'couple') {
    if (wageWon2) params.set('w2', wageWon2.toString());
    if (startDate2Input.value) params.set('s2', startDate2Input.value);
    params.set('m2', months2Input.value);
  }

  const newUrl = window.location.pathname + '?' + params.toString();
  window.history.replaceState({}, '', newUrl);
}

// 실시간 계산 및 화면 반영
export function updateCalculation() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'couple';
  const childBirthDate = childBirthDateInput.value;

  // 1. 모드별 레이아웃 전환
  if (mode === 'couple') {
    parent2Group.style.display = 'flex';
    parent1Heading.textContent = '먼저 쉬는 사람';
    parent2Heading.textContent = '나중에 쉬는 사람';
    heroLabel.textContent = '부부가 받는 총 금액';
    personSummaryRow2.style.display = 'flex';
    scheduleBlock2.style.display = 'block';
    legendP2Item.style.display = 'inline-flex';
    legendP1Label.textContent = '먼저 쉬는 사람';
    legendP2Label.textContent = '나중에 쉬는 사람';
  } else if (mode === 'single') {
    parent2Group.style.display = 'none';
    parent1Heading.textContent = '쉬는 사람';
    heroLabel.textContent = '내가 받는 총 금액';
    personSummaryRow2.style.display = 'none';
    scheduleBlock2.style.display = 'none';
    legendP2Item.style.display = 'none';
    legendRetroItem.style.display = 'none';
    legendP1Label.textContent = '쉬는 사람';
  } else { // solo
    parent2Group.style.display = 'none';
    parent1Heading.textContent = '쉬는 사람';
    heroLabel.textContent = '내가 받는 총 금액';
    personSummaryRow2.style.display = 'none';
    scheduleBlock2.style.display = 'none';
    legendP2Item.style.display = 'none';
    legendRetroItem.style.display = 'none';
    legendP1Label.textContent = '쉬는 사람';
  }

  // 2. 통상임금 파싱
  const p1 = parseWageInput(wage1Input.value);
  let p2 = { valid: true, value: 0 };
  if (mode === 'couple') {
    p2 = parseWageInput(wage2Input.value);
  }

  if (!p1.valid || !p2.valid) {
    heroTotal.textContent = '-';
    heroGainText.textContent = '통상임금을 숫자로 입력해주세요.';
    heroGainText.className = 'hero-subtext muted';
    return;
  }

  const wage1 = p1.value;
  const months1 = parseInt(months1Input.value, 10) || 12;
  const wage2 = p2.value;
  const months2 = parseInt(months2Input.value, 10) || 12;

  const calcParams = {
    mode,
    childBirthDate: childBirthDate || null,
    parentA: {
      wage: wage1,
      months: months1,
      startDate: startDate1Input.value || null,
      name: mode === 'couple' ? '먼저 쉬는 사람' : '쉬는 사람',
    },
  };

  if (mode === 'couple') {
    calcParams.parentB = {
      wage: wage2,
      months: months2,
      startDate: startDate2Input.value || null,
      name: '나중에 쉬는 사람',
    };
  }

  let result;
  try {
    result = calculateParentalLeave(calcParams);
  } catch (err) {
    console.error(err);
    return;
  }

  // 3. Result Hero 업데이트 (150ms 모션)
  heroTotal.textContent = formatManwon(result.householdTotal);
  heroTotal.classList.add('updating');
  setTimeout(() => {
    heroTotal.classList.remove('updating');
  }, 150);

  // Result Subline
  if (mode === 'couple') {
    if (result.is6Plus6Eligible && result.benefitGain > 0) {
      heroGainText.textContent = '6+6 덕분에 ' + formatManwon(result.benefitGain) + ' 더 받아요';
      heroGainText.className = 'hero-subtext';
    } else if (result.is6Plus6Eligible && result.benefitGain === 0) {
      heroGainText.textContent = '통상임금 기준으로 6+6 특례와 일반 급여 수령액이 같아요.';
      heroGainText.className = 'hero-subtext muted';
    } else {
      const deadline = calculate18MonthsDeadline(childBirthDate);
      const s1 = startDate1Input.value;
      const s2 = startDate2Input.value;
      let reason = '아이 생후 18개월이 지나 시작해서 6+6이 적용되지 않아요.';
      if (s2 && deadline && s2 > deadline) {
        reason = '나중에 쉬는 사람이 아이 생후 18개월이 지나 시작해서 6+6이 적용되지 않아요.';
      } else if (s1 && deadline && s1 > deadline) {
        reason = '먼저 쉬는 사람이 아이 생후 18개월이 지나 시작해서 6+6이 적용되지 않아요.';
      }
      heroGainText.textContent = reason;
      heroGainText.className = 'hero-subtext muted';
    }
  } else if (mode === 'single') {
    heroGainText.textContent = '한부모 근로자 특례(첫 3개월 상한 300만원)가 적용돼요.';
    heroGainText.className = 'hero-subtext muted';
  } else {
    heroGainText.textContent = '배우자가 쓰지 않는 일반 육아휴직 급여 기준이에요.';
    heroGainText.className = 'hero-subtext muted';
  }

  // 4. Per-person Summary 업데이트
  const pA = result.parentA;
  person1Name.textContent = mode === 'couple' ? '먼저 쉬는 사람' : '쉬는 사람';
  let p1Text = formatManwon(pA.total);
  if (pA.retroactiveTopUp > 0) {
    p1Text += ' · 이 중 소급 ' + formatManwon(pA.retroactiveTopUp);
  }
  person1Val.textContent = p1Text;

  if (mode === 'couple' && result.parentB) {
    const pB = result.parentB;
    person2Name.textContent = '나중에 쉬는 사람';
    let p2Text = formatManwon(pB.total);
    if (pB.retroactiveTopUp > 0) {
      p2Text += ' · 이 중 소급 ' + formatManwon(pB.retroactiveTopUp);
    }
    person2Val.textContent = p2Text;
  }

  // 5. Details Tables 업데이트
  scheduleTitle1.textContent = mode === 'couple' ? '먼저 쉬는 사람' : '쉬는 사람';
  renderScheduleTable(scheduleBody1, pA.schedule);
  if (mode === 'couple' && result.parentB) {
    scheduleTitle2.textContent = '나중에 쉬는 사람';
    renderScheduleTable(scheduleBody2, result.parentB.schedule);
  }

  // 6. Monthly Timeline Chart 렌더링
  const timelineData = buildMonthlyTimeline(result);
  currentTimelineData = timelineData;
  renderTimelineChart(timelineData, result);

  // Sticky bottom bar text update
  if (stickyBarText) {
    if (mode === 'couple') {
      stickyBarText.textContent = '부부 총 ' + formatManwon(result.householdTotal);
    } else {
      stickyBarText.textContent = '총 ' + formatManwon(result.householdTotal);
    }
  }

  saveStateToUrl(wage1, wage2);
}

// 월별 자세히 보기 테이블 렌더링
function renderScheduleTable(tbody, schedule) {
  tbody.innerHTML = '';
  schedule.forEach(item => {
    const tr = document.createElement('tr');

    const tdMonth = document.createElement('td');
    tdMonth.textContent = item.month + '개월차';
    tr.appendChild(tdMonth);

    const tdAmt = document.createElement('td');
    tdAmt.textContent = formatManwon(item.amount);
    tdAmt.className = 'text-right font-medium';
    tr.appendChild(tdAmt);

    const tdRule = document.createElement('td');
    let ruleText = '';
    const capMan = Math.round(item.cap / 10000);
    if (item.ruleType === 'special_6plus6') {
      ruleText = '6+6 · 상한 ' + capMan + '만';
    } else if (item.ruleType === 'single') {
      ruleText = '한부모 · 상한 ' + capMan + '만';
    } else {
      ruleText = '일반 · 상한 ' + capMan + '만';
    }
    tdRule.textContent = ruleText;
    tdRule.className = 'text-right';
    tr.appendChild(tdRule);

    tbody.appendChild(tr);
  });
}

// 월별 타임라인 차트 렌더링 (Pure SVG + Accessible Table)
function renderTimelineChart(timelineData, result) {
  const { timeline, maxMonthTotal, hasRetro, retroMonthKey } = timelineData;
  if (!timeline || timeline.length === 0) return;

  // 레전드 표시 제어
  if (hasRetro) {
    legendRetroItem.style.display = 'inline-flex';
    chartFootnote.style.display = 'block';
  } else {
    legendRetroItem.style.display = 'none';
    chartFootnote.style.display = 'none';
  }

  // 스크린리더용 테이블 채우기
  accessibleTimelineBody.innerHTML = '';
  timeline.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.year}년 ${item.month}월</td>
      <td>${formatCurrency(item.parentA)}</td>
      <td>${formatCurrency(item.parentB)}</td>
      <td>${formatCurrency(item.retro)}</td>
      <td>${formatCurrency(item.total)}</td>
    `;
    accessibleTimelineBody.appendChild(tr);
  });

  // SVG 차트 치수 설정 (~220px 데스크톱, ~180px 모바일 대응)
  const N = timeline.length;
  const svgWidth = 500;
  const svgHeight = 220;
  const chartBottomY = 180;
  const maxBarH = 140;

  const leftPad = 14;
  const rightPad = 14;
  const usableW = svgWidth - leftPad - rightPad;
  const step = usableW / N;
  const minGap = 4;
  const barW = Math.max(6, Math.min(22, step - minGap));

  let barsHtml = '';
  const baselineY = chartBottomY + 1;

  // 기준선
  // 은은한 기준 그리드선 (높이 가늠용)
  let gridVal = 5000000;
  if (maxMonthTotal < 3500000) {
    gridVal = 2000000;
  } else if (maxMonthTotal < 6000000) {
    gridVal = 3000000;
  } else {
    gridVal = 5000000;
  }

  if (gridVal < maxMonthTotal && maxMonthTotal > 0) {
    const gridY = chartBottomY - Math.round((gridVal / maxMonthTotal) * maxBarH);
    barsHtml += '<line x1="' + leftPad + '" y1="' + gridY + '" x2="' + (svgWidth - rightPad) + '" y2="' + gridY + '" stroke="#E5E8EB" stroke-width="1" stroke-dasharray="3 3" />';
    barsHtml += '<text x="' + (svgWidth - rightPad) + '" y="' + (gridY - 4) + '" text-anchor="end" font-size="10" fill="#8B95A1" font-family="inherit">' + formatManwon(gridVal) + '</text>';
  }

  barsHtml += '<line x1="' + (leftPad - 4) + '" y1="' + baselineY + '" x2="' + (svgWidth - rightPad + 4) + '" y2="' + baselineY + '" stroke="#E5E8EB" stroke-width="1" />';

  timeline.forEach((item, idx) => {
    const cx = leftPad + idx * step + step / 2;
    const bx = cx - barW / 2;

    const hA = maxMonthTotal > 0 ? Math.round((item.parentA / maxMonthTotal) * maxBarH) : 0;
    const hB = maxMonthTotal > 0 ? Math.round((item.parentB / maxMonthTotal) * maxBarH) : 0;
    const hR = maxMonthTotal > 0 ? Math.round((item.retro / maxMonthTotal) * maxBarH) : 0;

    let currY = chartBottomY;
    let segs = '';

    // Parent A segment (#0B7A6F)
    if (hA > 0) {
      currY -= hA;
      segs += `<rect x="${bx}" y="${currY}" width="${barW}" height="${hA}" fill="#0B7A6F" rx="2" />`;
    }

    // Parent B segment (#70C0B7)
    if (hB > 0) {
      currY -= hB;
      segs += `<rect x="${bx}" y="${currY}" width="${barW}" height="${hB}" fill="#70C0B7" rx="2" />`;
    }

    // Retro segment (#E8A33D)
    if (hR > 0) {
      currY -= hR;
      segs += `<rect x="${bx}" y="${currY}" width="${barW}" height="${hR}" fill="#E8A33D" rx="2" />`;
    }

    // X-axis label
    const interval = N <= 12 ? 1 : (N <= 18 ? 2 : 3);
    const showLabel = (idx % interval === 0);

    const labelHtml = showLabel
      ? `<text x="${cx}" y="${baselineY + 14}" text-anchor="middle" font-size="10" fill="#8B95A1" font-family="inherit">${item.label}</text>`
      : '';

    // Bar click/tap hit area
    barsHtml += `
      <g class="chart-bar-group" data-idx="${idx}" tabindex="0" role="button" aria-label="${item.year}년 ${item.month}월 총 ${formatManwon(item.total)}">
        <rect x="${cx - step / 2}" y="10" width="${step}" height="${chartBottomY}" fill="transparent" />
        ${segs}
        ${labelHtml}
      </g>
    `;
  });

  chartSvgWrap.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
      ${barsHtml}
    </svg>
  `;

  // 기본 활성 월 정보 표시: 소급 정산월이 있으면 소급월, 없으면 입금액 최대월
  let defaultIdx = 0;
  if (hasRetro && retroMonthKey) {
    const rIdx = timeline.findIndex(t => t.monthKey === retroMonthKey);
    if (rIdx >= 0) defaultIdx = rIdx;
  } else {
    let maxAmt = -1;
    timeline.forEach((t, i) => {
      if (t.total > maxAmt) {
        maxAmt = t.total;
        defaultIdx = i;
      }
    });
  }

  showMonthBreakdown(timeline[defaultIdx]);

  // 바 그룹 인터랙션 바인딩
  const barGroups = chartSvgWrap.querySelectorAll('.chart-bar-group');
  barGroups.forEach(bg => {
    const idx = parseInt(bg.getAttribute('data-idx'), 10);
    const item = timeline[idx];

    const activate = () => {
      barGroups.forEach(b => b.style.opacity = '0.45');
      bg.style.opacity = '1';
      showMonthBreakdown(item);
    };

    bg.addEventListener('mouseenter', activate);
    bg.addEventListener('click', activate);
    bg.addEventListener('focus', activate);
  });

  chartSvgWrap.addEventListener('mouseleave', () => {
    barGroups.forEach(b => b.style.opacity = '1');
    showMonthBreakdown(timeline[defaultIdx]);
  });
}

function showMonthBreakdown(item) {
  if (!item) return;
  const parts = [];
  if (item.parentA > 0) {
    const name = document.querySelector('input[name="mode"]:checked')?.value === 'couple' ? '먼저 쉬는 사람' : '쉬는 사람';
    parts.push(name + ' ' + formatManwon(item.parentA));
  }
  if (item.parentB > 0) {
    parts.push('나중에 쉬는 사람 ' + formatManwon(item.parentB));
  }
  if (item.retro > 0) {
    parts.push('소급 정산 ' + formatManwon(item.retro));
  }

  activeMonthBreakdown.innerHTML = `
    <div class="breakdown-primary">${item.year}년 ${item.month}월 · ${formatManwon(item.total)}</div>
    <div class="breakdown-secondary">${parts.join(' · ')}</div>
  `;
}

// 이벤트 리스너 설정
function setupEventListeners() {
  modeRadios.forEach(r => r.addEventListener('change', updateCalculation));

  childBirthDateInput.addEventListener('input', updateCalculation);

  wage1Input.addEventListener('input', updateCalculation);
  startDate1Input.addEventListener('input', updateCalculation);

  m1DecBtn.addEventListener('click', () => {
    const cur = parseInt(months1Input.value, 10) || 12;
    updateStepper(1, cur - 1);
    updateCalculation();
  });
  m1IncBtn.addEventListener('click', () => {
    const cur = parseInt(months1Input.value, 10) || 12;
    updateStepper(1, cur + 1);
    updateCalculation();
  });

  wage2Input.addEventListener('input', updateCalculation);
  startDate2Input.addEventListener('input', updateCalculation);

  m2DecBtn.addEventListener('click', () => {
    const cur = parseInt(months2Input.value, 10) || 12;
    updateStepper(2, cur - 1);
    updateCalculation();
  });
  m2IncBtn.addEventListener('click', () => {
    const cur = parseInt(months2Input.value, 10) || 12;
    updateStepper(2, cur + 1);
    updateCalculation();
  });

  // 스티키 바 IntersectionObserver 및 스크롤 핸들러
  if (stickyBottomBar && resultHeroSection) {
    document.body.classList.add('has-sticky-bar');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(() => {
        updateStickyBarVisibility();
      }, { threshold: [0, 0.1, 0.5, 1.0] });
      observer.observe(resultHeroSection);
    }

    window.addEventListener('scroll', updateStickyBarVisibility, { passive: true });
    window.addEventListener('resize', updateStickyBarVisibility, { passive: true });
    updateStickyBarVisibility();

    if (stickyBarBtn) {
      stickyBarBtn.addEventListener('click', () => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        resultHeroSection.scrollIntoView({ behavior: prefersReduced ? 'instant' : 'smooth', block: 'center' });
      });
    }
  }

  // 링크 복사 버튼
  copyLinkBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('결과 링크를 복사했어요');
    } catch {
      const tempInput = document.createElement('input');
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast('결과 링크를 복사했어요');
    }
  });
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// 초기화
function init() {
  setDefaultDates();
  loadStateFromUrl();
  setupEventListeners();
  updateCalculation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



