import {
  calculateParentalLeave,
  calculate18MonthsDeadline,
  formatCurrency,
  formatManwon,
  parseWageInput,
} from './calc.js';

// DOM 요소 캐시
const modeInputs = document.querySelectorAll('input[name="mode"]');
const childBirthDateInput = document.getElementById('childBirthDate');
const childDeadlineText = document.getElementById('childDeadlineText');

const parent2Card = document.getElementById('parent2Card');
const parent1Title = document.getElementById('parent1Title');

const wage1Input = document.getElementById('wage1');
const wage1Preview = document.getElementById('wage1Preview');
const wage1Hint = document.getElementById('wage1Hint');
const startDate1Input = document.getElementById('startDate1');
const months1Slider = document.getElementById('months1Slider');
const months1Number = document.getElementById('months1Number');

const wage2Input = document.getElementById('wage2');
const wage2Preview = document.getElementById('wage2Preview');
const wage2Hint = document.getElementById('wage2Hint');
const startDate2Input = document.getElementById('startDate2');
const months2Slider = document.getElementById('months2Slider');
const months2Number = document.getElementById('months2Number');

const copyLinkBtn = document.getElementById('copyLinkBtn');
const toast = document.getElementById('toast');

// 결과 렌더링 컨테이너
const verdictBadge = document.getElementById('verdictBadge');
const verdictReasons = document.getElementById('verdictReasons');

const householdTotalEl = document.getElementById('householdTotal');
const benefitGainCard = document.getElementById('benefitGainCard');
const benefitGainEl = document.getElementById('benefitGain');

const topUpContainer = document.getElementById('topUpContainer');
const firstParentLeaveEl = document.getElementById('firstParentLeave');
const retroactiveTopUpEl = document.getElementById('retroactiveTopUp');

const parent1TotalEl = document.getElementById('parent1Total');
const parent1ScheduleBody = document.getElementById('parent1ScheduleBody');

const parent2SummarySection = document.getElementById('parent2SummarySection');
const parent2TotalEl = document.getElementById('parent2Total');
const parent2ScheduleCard = document.getElementById('parent2ScheduleCard');
const parent2ScheduleBody = document.getElementById('parent2ScheduleBody');

const comparisonSection = document.getElementById('comparisonSection');
const compSpecialBar = document.getElementById('compSpecialBar');
const compNormalBar = document.getElementById('compNormalBar');
const compSpecialText = document.getElementById('compSpecialText');
const compNormalText = document.getElementById('compNormalText');
const compDiffText = document.getElementById('compDiffText');

// 기본 날짜 설정
function setDefaultDates() {
  const today = new Date();
  
  // 기본 자녀 생년월일: 약 3개월 전
  const birth = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  if (!childBirthDateInput.value) {
    childBirthDateInput.value = birth.toISOString().slice(0, 10);
  }

  // 부모 1 휴직 시작일: 약 2개월 전
  const start1 = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  if (!startDate1Input.value) {
    startDate1Input.value = start1.toISOString().slice(0, 10);
  }

  // 부모 2 휴직 시작일: 약 4개월 뒤
  const start2 = new Date(today.getFullYear(), today.getMonth() + 4, 1);
  if (!startDate2Input.value) {
    startDate2Input.value = start2.toISOString().slice(0, 10);
  }
}

// URL 쿼리 파라미터 읽기 (이전 버전 및 새 버전 호환)
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('mode')) {
    const mode = params.get('mode');
    const radio = document.querySelector('input[name="mode"][value="' + mode + '"]');
    if (radio) radio.checked = true;
  }
  
  if (params.has('birth')) childBirthDateInput.value = params.get('birth');
  
  if (params.has('w1')) {
    const parsed = parseWageInput(params.get('w1'));
    if (parsed.valid) {
      wage1Input.value = (parsed.value / 10000).toString();
    } else {
      wage1Input.value = '350';
    }
  } else if (!wage1Input.value) {
    wage1Input.value = '350';
  }
  
  if (params.has('s1')) startDate1Input.value = params.get('s1');
  if (params.has('m1')) {
    const m1 = parseInt(params.get('m1'), 10) || 12;
    months1Slider.value = m1;
    months1Number.value = m1;
  }

  if (params.has('w2')) {
    const parsed = parseWageInput(params.get('w2'));
    if (parsed.valid) {
      wage2Input.value = (parsed.value / 10000).toString();
    } else {
      wage2Input.value = '350';
    }
  } else if (!wage2Input.value) {
    wage2Input.value = '350';
  }

  if (params.has('s2')) startDate2Input.value = params.get('s2');
  if (params.has('m2')) {
    const m2 = parseInt(params.get('m2'), 10) || 12;
    months2Slider.value = m2;
    months2Number.value = m2;
  }
}

// URL 쿼리 파라미터 업데이트
function saveStateToUrl(wageWon1, wageWon2) {
  const currentMode = document.querySelector('input[name="mode"]:checked')?.value || 'couple';
  const params = new URLSearchParams();
  
  params.set('mode', currentMode);
  if (childBirthDateInput.value) params.set('birth', childBirthDateInput.value);
  
  if (wageWon1) params.set('w1', wageWon1.toString());
  if (startDate1Input.value) params.set('s1', startDate1Input.value);
  params.set('m1', months1Number.value);

  if (currentMode === 'couple') {
    if (wageWon2) params.set('w2', wageWon2.toString());
    if (startDate2Input.value) params.set('s2', startDate2Input.value);
    params.set('m2', months2Number.value);
  }

  const newUrl = window.location.pathname + '?' + params.toString();
  window.history.replaceState({}, '', newUrl);
}

// 실시간 계산 및 화면 반영
export function updateCalculation() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'couple';
  const childBirthDate = childBirthDateInput.value;

  // 18개월 마감일 텍스트 갱신
  if (childBirthDate) {
    const deadline = calculate18MonthsDeadline(childBirthDate);
    if (deadline) {
      childDeadlineText.textContent = '생후 18개월 도래일(마감일): ' + deadline;
      childDeadlineText.style.display = 'block';
    } else {
      childDeadlineText.style.display = 'none';
    }
  } else {
    childDeadlineText.style.display = 'none';
  }

  // 모드별 UI 전환
  if (mode === 'couple') {
    parent2Card.style.display = 'block';
    parent2ScheduleCard.style.display = 'block';
    parent2SummarySection.style.display = 'block';
    parent1Title.textContent = '부모 1 (엄마/선사용)';
    comparisonSection.style.display = 'block';
  } else if (mode === 'single') {
    parent2Card.style.display = 'none';
    parent2ScheduleCard.style.display = 'none';
    parent2SummarySection.style.display = 'none';
    parent1Title.textContent = '한부모 근로자';
    comparisonSection.style.display = 'none';
  } else { // solo
    parent2Card.style.display = 'none';
    parent2ScheduleCard.style.display = 'none';
    parent2SummarySection.style.display = 'none';
    parent1Title.textContent = '신청 근로자';
    comparisonSection.style.display = 'none';
  }

  // 임금 입력값 검증 및 파싱
  const p1 = parseWageInput(wage1Input.value);
  let hasError = false;

  if (p1.valid) {
    wage1Hint.className = 'live-wage-hint';
    wage1Hint.textContent = '= ' + formatCurrency(p1.value);
    wage1Preview.textContent = '(' + formatManwon(p1.value) + ')';
  } else {
    wage1Hint.className = 'live-wage-error';
    wage1Hint.textContent = '⚠️ ' + p1.error;
    wage1Preview.textContent = '';
    hasError = true;
  }

  let p2 = { valid: true, value: 0 };
  if (mode === 'couple') {
    p2 = parseWageInput(wage2Input.value);
    if (p2.valid) {
      wage2Hint.className = 'live-wage-hint';
      wage2Hint.textContent = '= ' + formatCurrency(p2.value);
      wage2Preview.textContent = '(' + formatManwon(p2.value) + ')';
    } else {
      wage2Hint.className = 'live-wage-error';
      wage2Hint.textContent = '⚠️ ' + p2.error;
      wage2Preview.textContent = '';
      hasError = true;
    }
  }

  if (hasError) {
    // 유효하지 않은 입력값이면 계산을 중단하고 안내
    verdictBadge.className = 'badge badge-warning';
    verdictBadge.innerHTML = '<span>⚠️</span> 통상임금을 올바르게 입력해주세요.';
    verdictReasons.innerHTML = '<li>통상임금 입력란에 300 또는 300만원 형식으로 숫자를 입력해주세요.</li>';
    householdTotalEl.textContent = '-';
    if (benefitGainEl) benefitGainEl.textContent = '-';
    parent1TotalEl.textContent = '-';
    parent2TotalEl.textContent = '-';
    parent1ScheduleBody.innerHTML = '';
    parent2ScheduleBody.innerHTML = '';
    return;
  }

  const wage1 = p1.value;
  const months1 = parseInt(months1Number.value, 10) || 12;
  const wage2 = p2.value;
  const months2 = parseInt(months2Number.value, 10) || 12;

  const calcParams = {
    mode,
    childBirthDate: childBirthDate || null,
    parentA: {
      wage: wage1,
      months: months1,
      startDate: startDate1Input.value || null,
      name: mode === 'couple' ? '부모 1' : (mode === 'single' ? '한부모' : '신청자'),
    },
  };

  if (mode === 'couple') {
    calcParams.parentB = {
      wage: wage2,
      months: months2,
      startDate: startDate2Input.value || null,
      name: '부모 2',
    };
  }

  let result;
  try {
    result = calculateParentalLeave(calcParams);
  } catch (err) {
    console.error(err);
    return;
  }

  // 1. 배지 및 사유
  verdictReasons.innerHTML = '';
  if (mode === 'couple') {
    if (result.is6Plus6Eligible) {
      verdictBadge.className = 'badge badge-success';
      verdictBadge.innerHTML = '<span>✔</span> 6+6 부모함께육아휴직제 적용 (' + result.specialMonths + '개월 특례)';
    } else {
      verdictBadge.className = 'badge badge-warning';
      verdictBadge.innerHTML = '<span>⚠</span> 6+6 요건 미충족 (일반 육아휴직 규정 적용)';
    }

    result.eligibilityReasons.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      verdictReasons.appendChild(li);
    });
  } else if (mode === 'single') {
    verdictBadge.className = 'badge badge-info';
    verdictBadge.innerHTML = '<span>★</span> 한부모 특례 적용 (1~3개월 상한 300만원)';
    const li = document.createElement('li');
    li.textContent = '한부모가족지원법에 따른 한부모 근로자 특례 급여가 산정되었습니다.';
    verdictReasons.appendChild(li);
  } else {
    verdictBadge.className = 'badge badge-neutral';
    verdictBadge.innerHTML = '<span>ℹ</span> 일반 육아휴직 급여 적용';
    const li = document.createElement('li');
    li.textContent = '배우자 미사용 단독 신청 기준(1~3개월 상한 250만, 4~6개월 200만, 7개월~ 80% 상한 160만)입니다.';
    verdictReasons.appendChild(li);
  }

  // 2. 요약 카드 렌더링
  householdTotalEl.textContent = formatCurrency(result.householdTotal);

  if (mode === 'couple') {
    benefitGainCard.style.display = 'block';
    if (result.benefitGain > 0) {
      benefitGainEl.textContent = '+' + formatCurrency(result.benefitGain) + ' (' + formatManwon(result.benefitGain) + ' 더 받음)';
      benefitGainEl.className = 'stat-value text-gain';
    } else {
      benefitGainEl.textContent = '0원 (일반 급여와 동일)';
      benefitGainEl.className = 'stat-value';
    }

    // 소급 정산 섹션 (순차 사용 시)
    if (result.is6Plus6Eligible && result.isSequential && (result.parentA.retroactiveTopUp > 0 || result.parentB.retroactiveTopUp > 0)) {
      topUpContainer.style.display = 'grid';
      const firstParent = result.parentA.isFirstParent ? result.parentA : result.parentB;
      firstParentLeaveEl.textContent = formatCurrency(firstParent.duringLeaveTotal);
      retroactiveTopUpEl.textContent = '+' + formatCurrency(firstParent.retroactiveTopUp);
    } else {
      topUpContainer.style.display = 'none';
    }
  } else {
    benefitGainCard.style.display = 'none';
    topUpContainer.style.display = 'none';
  }

  // 3. 부모 1 테이블 렌더링
  parent1TotalEl.textContent = formatCurrency(result.parentA.total);
  renderScheduleTable(
    parent1ScheduleBody,
    result.parentA.schedule,
    result.parentA.isFirstParent,
    result.parentA.normalSchedule
  );

  // 4. 부모 2 테이블 렌더링 (couple 모드인 경우)
  if (mode === 'couple' && result.parentB) {
    parent2TotalEl.textContent = formatCurrency(result.parentB.total);
    renderScheduleTable(
      parent2ScheduleBody,
      result.parentB.schedule,
      result.parentB.isFirstParent,
      result.parentB.normalSchedule
    );
  }

  // 5. 비교 바 차트 렌더링
  if (mode === 'couple') {
    const specialVal = result.householdTotal;
    const normalVal = result.normalHouseholdTotal;
    const maxVal = Math.max(specialVal, normalVal, 1);

    compSpecialBar.style.width = ((specialVal / maxVal) * 100).toFixed(1) + '%';
    compNormalBar.style.width = ((normalVal / maxVal) * 100).toFixed(1) + '%';

    compSpecialText.textContent = formatCurrency(specialVal);
    compNormalText.textContent = formatCurrency(normalVal);

    if (result.benefitGain > 0) {
      compDiffText.innerHTML = '6+6 부모함께육아휴직제 적용 시 부부 합산 <strong>' + formatCurrency(result.benefitGain) + ' (' + formatManwon(result.benefitGain) + ')</strong>의 급여를 더 수령합니다.';
    } else {
      compDiffText.innerHTML = '통상임금 수준에 따라 6+6 특례와 일반 급여 수령액이 동일합니다.';
    }
  }

  saveStateToUrl(wage1, wage2);
}

// 월차별 테이블 렌더링 헬퍼
function renderScheduleTable(tbody, schedule, isFirstParent, normalSchedule) {
  tbody.innerHTML = '';
  schedule.forEach((item, idx) => {
    const tr = document.createElement('tr');
    
    // 월차
    const tdMonth = document.createElement('td');
    tdMonth.textContent = item.month + '개월차';
    tdMonth.className = 'text-center font-semibold';
    tr.appendChild(tdMonth);

    // 적용 기준
    const tdRule = document.createElement('td');
    const badge = document.createElement('span');
    if (item.ruleType === 'special_6plus6') {
      badge.className = 'pill pill-special';
      badge.textContent = '6+6 특례 (100%)';
    } else if (item.ruleType === 'single') {
      badge.className = 'pill pill-single';
      badge.textContent = '한부모 특례';
    } else {
      badge.className = 'pill pill-normal';
      badge.textContent = item.rate === 1.0 ? '일반 (100%)' : '일반 (80%)';
    }
    tdRule.appendChild(badge);
    tr.appendChild(tdRule);

    // 상한액
    const tdCap = document.createElement('td');
    tdCap.textContent = (item.cap / 10000).toLocaleString('ko-KR') + '만원';
    tdCap.className = 'text-right text-muted';
    tr.appendChild(tdCap);

    // 지급액 (최종 정산 기준)
    const tdAmt = document.createElement('td');
    tdAmt.textContent = formatCurrency(item.amount);
    tdAmt.className = 'text-right font-semibold text-primary';
    tr.appendChild(tdAmt);

    // 순차 선사용자 소급 차액 표시
    const tdDetail = document.createElement('td');
    if (isFirstParent && normalSchedule && normalSchedule[idx]) {
      const normalAmt = normalSchedule[idx].amount;
      const diff = Math.max(0, item.amount - normalAmt);
      if (diff > 0) {
        tdDetail.innerHTML = '<span class="text-xs text-muted">휴직중: ' + (normalAmt / 10000) + '만</span><br><strong class="text-gain text-xs">소급: +' + (diff / 10000) + '만</strong>';
      } else {
        tdDetail.innerHTML = '<span class="text-xs text-muted">휴직 중 전액 지급</span>';
      }
    } else {
      tdDetail.innerHTML = '<span class="text-xs text-muted">매월 전액 지급</span>';
    }
    tdDetail.className = 'text-center';
    tr.appendChild(tdDetail);

    tbody.appendChild(tr);
  });
}

// 이벤트 바인딩
function setupEventListeners() {
  // 모드 변경
  modeInputs.forEach(input => {
    input.addEventListener('change', updateCalculation);
  });

  // 자녀 생년월일
  childBirthDateInput.addEventListener('input', updateCalculation);

  // 부모 1
  wage1Input.addEventListener('input', updateCalculation);
  startDate1Input.addEventListener('input', updateCalculation);
  months1Slider.addEventListener('input', (e) => {
    months1Number.value = e.target.value;
    updateCalculation();
  });
  months1Number.addEventListener('input', (e) => {
    months1Slider.value = e.target.value;
    updateCalculation();
  });

  // 부모 2
  wage2Input.addEventListener('input', updateCalculation);
  startDate2Input.addEventListener('input', updateCalculation);
  months2Slider.addEventListener('input', (e) => {
    months2Number.value = e.target.value;
    updateCalculation();
  });
  months2Number.addEventListener('input', (e) => {
    months2Slider.value = e.target.value;
    updateCalculation();
  });

  // 빠른 금액 버튼 (250, 300, 400, 500, +50)
  document.querySelectorAll('[data-quick-wage]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const inputEl = document.getElementById(targetId);
      const action = btn.getAttribute('data-quick-wage');
      
      const parsed = parseWageInput(inputEl.value);
      let currentManwon = parsed.valid ? Math.round(parsed.value / 10000) : 0;

      if (action.startsWith('+')) {
        const add = parseInt(action.slice(1), 10);
        currentManwon += add;
      } else {
        currentManwon = parseInt(action, 10);
      }

      inputEl.value = currentManwon.toString();
      updateCalculation();
    });
  });

  // 링크 복사 버튼
  copyLinkBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('결과 링크가 클립보드에 복사되었습니다!');
    } catch {
      const tempInput = document.createElement('input');
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast('결과 링크가 클립보드에 복사되었습니다!');
    }
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// 초기화
window.addEventListener('DOMContentLoaded', () => {
  setDefaultDates();
  loadStateFromUrl();
  setupEventListeners();
  updateCalculation();
});

