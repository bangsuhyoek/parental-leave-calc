/**
 * 대한민국 육아휴직 급여 및 6+6 부모육아휴직제 공식 산정 모듈
 * 
 * 법령 근거:
 * - 고용보험법 시행령 제95조 (일반 육아휴직 급여)
 * - 고용보험법 시행령 제95조의3 (6+6 부모육아휴직제 및 한부모 근로자 육아휴직 급여 특례)
 * - 고용노동부 고객상담센터(1350) 및 고용24 공식 안내
 * 
 * 기준 시점: 2025년 1월 시행 (2025.02.23 상한 인상 반영), 2026년 10월 확인
 */

export const FLOOR_BENEFIT = 700000; // 하한액 월 70만원

// 6+6 부모육아휴직제 월별 상한액 (1~6개월차, 통상임금 100%)
// ※ 2025년 2월 23일 개정: 1개월차 상한액이 200만원에서 250만원으로 인상됨
export const SPECIAL_6PLUS6_CAPS = [
  2500000, // 1개월차
  2500000, // 2개월차
  3000000, // 3개월차
  3500000, // 4개월차
  4000000, // 5개월차
  4500000, // 6개월차
];

/**
 * 자녀 생년월일 기준 생후 18개월 도래일(마감일) 계산
 * @param {string} birthDateStr 'YYYY-MM-DD'
 * @returns {string|null} 'YYYY-MM-DD'
 */
export function calculate18MonthsDeadline(birthDateStr) {
  if (!birthDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
    return null;
  }
  const [y, m, d] = birthDateStr.split('-').map(Number);
  const targetMonthIndex = (m - 1) + 18;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(d, daysInTargetMonth);
  return targetYear + '-' + String(targetMonth).padStart(2, '0') + '-' + String(targetDay).padStart(2, '0');
}

/**
 * 휴직 시작일이 자녀 생후 18개월 이내인지 판별
 * @param {string} birthDateStr 'YYYY-MM-DD'
 * @param {string} startDateStr 'YYYY-MM-DD'
 * @returns {boolean}
 */
export function isWithin18Months(birthDateStr, startDateStr) {
  const deadline = calculate18MonthsDeadline(birthDateStr);
  if (!deadline || !startDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
    return false;
  }
  return startDateStr <= deadline;
}

/**
 * 일반 육아휴직 특정 월차 급여 계산
 * 1~3개월: 100%, 상한 250만, 하한 70만
 * 4~6개월: 100%, 상한 200만, 하한 70만
 * 7개월 이상: 80%, 상한 160만, 하한 70만
 * @param {number} wage 월 통상임금 (원)
 * @param {number} monthIndex 월차 (1부터 시작)
 */
export function getNormalMonthBenefit(wage, monthIndex) {
  let rate;
  let cap;
  let ruleLabel;

  if (monthIndex <= 3) {
    rate = 1.0;
    cap = 2500000;
    ruleLabel = '일반 1~3개월차 (100%, 상한 250만)';
  } else if (monthIndex <= 6) {
    rate = 1.0;
    cap = 2000000;
    ruleLabel = '일반 4~6개월차 (100%, 상한 200만)';
  } else {
    rate = 0.8;
    cap = 1600000;
    ruleLabel = '일반 7개월차 이후 (80%, 상한 160만)';
  }

  const raw = Math.round(wage * rate);
  const amount = Math.min(cap, Math.max(FLOOR_BENEFIT, raw));

  return {
    month: monthIndex,
    ruleType: 'normal',
    ruleLabel,
    rate,
    cap,
    raw,
    amount,
  };
}

/**
 * 한부모 특례 특정 월차 급여 계산
 * 1~3개월: 100%, 상한 300만, 하한 70만
 * 4~6개월: 100%, 상한 200만, 하한 70만
 * 7개월 이상: 80%, 상한 160만, 하한 70만
 * @param {number} wage 월 통상임금 (원)
 * @param {number} monthIndex 월차 (1부터 시작)
 */
export function getSingleParentMonthBenefit(wage, monthIndex) {
  let rate;
  let cap;
  let ruleLabel;

  if (monthIndex <= 3) {
    rate = 1.0;
    cap = 3000000;
    ruleLabel = '한부모 특례 1~3개월차 (100%, 상한 300만)';
  } else if (monthIndex <= 6) {
    rate = 1.0;
    cap = 2000000;
    ruleLabel = '일반 4~6개월차 (100%, 상한 200만)';
  } else {
    rate = 0.8;
    cap = 1600000;
    ruleLabel = '일반 7개월차 이후 (80%, 상한 160만)';
  }

  const raw = Math.round(wage * rate);
  const amount = Math.min(cap, Math.max(FLOOR_BENEFIT, raw));

  return {
    month: monthIndex,
    ruleType: 'single',
    ruleLabel,
    rate,
    cap,
    raw,
    amount,
  };
}

/**
 * 6+6 부모육아휴직제 특례 특정 월차 급여 계산 (1~6개월차)
 * 통상임금 100%, 하한 70만, 월차별 상한 250만~450만
 * @param {number} wage 월 통상임금 (원)
 * @param {number} monthIndex 월차 (1~6)
 */
export function get6Plus6MonthBenefit(wage, monthIndex) {
  if (monthIndex < 1 || monthIndex > 6) {
    throw new Error('6+6 특례는 1~6개월차까지만 적용됩니다.');
  }
  const cap = SPECIAL_6PLUS6_CAPS[monthIndex - 1];
  const rate = 1.0;
  const raw = Math.round(wage * rate);
  const amount = Math.min(cap, Math.max(FLOOR_BENEFIT, raw));

  return {
    month: monthIndex,
    ruleType: 'special_6plus6',
    ruleLabel: '6+6 특례 ' + monthIndex + '개월차 (100%, 상한 ' + (cap / 10000).toLocaleString('ko-KR') + '만)',
    rate,
    cap,
    raw,
    amount,
  };
}

/**
 * 전체 육아휴직 급여 계산 엔진
 * @param {Object} params
 * @param {'couple'|'single'|'solo'} params.mode
 * @param {string} [params.childBirthDate] 'YYYY-MM-DD'
 * @param {Object} params.parentA { wage: number, startDate?: string, months: number, name?: string }
 * @param {Object} [params.parentB] { wage: number, startDate?: string, months: number, name?: string }
 */
export function calculateParentalLeave(params) {
  const { mode = 'couple', childBirthDate, parentA, parentB } = params;

  if (!parentA || typeof parentA.wage !== 'number' || typeof parentA.months !== 'number') {
    throw new Error('첫 번째 부모의 통상임금 및 휴직 개월 수가 필요합니다.');
  }

  // 1. 단일 부모 모드 (한부모)
  if (mode === 'single') {
    const monthsA = Math.max(1, Math.min(18, Math.round(parentA.months)));
    const scheduleA = [];
    let totalA = 0;
    for (let m = 1; m <= monthsA; m++) {
      const item = getSingleParentMonthBenefit(parentA.wage, m);
      scheduleA.push(item);
      totalA += item.amount;
    }

    return {
      mode: 'single',
      is6Plus6Eligible: false,
      specialMonths: 0,
      eligibilityReasons: ['한부모 근로자 특례(1~3개월 상한 300만)가 적용되었습니다.'],
      parentA: {
        name: parentA.name || '한부모',
        wage: parentA.wage,
        months: monthsA,
        startDate: parentA.startDate || null,
        schedule: scheduleA,
        total: totalA,
        normalTotal: totalA,
        retroactiveTopUp: 0,
        duringLeaveTotal: totalA,
      },
      parentB: null,
      householdTotal: totalA,
      normalHouseholdTotal: totalA,
      benefitGain: 0,
    };
  }

  // 2. 단독 사용 모드 (배우자 미사용)
  if (mode === 'solo') {
    const monthsA = Math.max(1, Math.min(18, Math.round(parentA.months)));
    const scheduleA = [];
    let totalA = 0;
    for (let m = 1; m <= monthsA; m++) {
      const item = getNormalMonthBenefit(parentA.wage, m);
      scheduleA.push(item);
      totalA += item.amount;
    }

    return {
      mode: 'solo',
      is6Plus6Eligible: false,
      specialMonths: 0,
      eligibilityReasons: ['배우자 미사용(혼자 사용)으로 일반 육아휴직 급여 규정이 적용되었습니다.'],
      parentA: {
        name: parentA.name || '신청자',
        wage: parentA.wage,
        months: monthsA,
        startDate: parentA.startDate || null,
        schedule: scheduleA,
        total: totalA,
        normalTotal: totalA,
        retroactiveTopUp: 0,
        duringLeaveTotal: totalA,
      },
      parentB: null,
      householdTotal: totalA,
      normalHouseholdTotal: totalA,
      benefitGain: 0,
    };
  }

  // 3. 부부 모드 (couple)
  if (!parentB || typeof parentB.wage !== 'number' || typeof parentB.months !== 'number') {
    throw new Error('부부 모드에서는 두 부모의 정보가 모두 필요합니다.');
  }

  const monthsA = Math.max(1, Math.min(18, Math.round(parentA.months)));
  const monthsB = Math.max(1, Math.min(18, Math.round(parentB.months)));
  const deadline18M = calculate18MonthsDeadline(childBirthDate);

  const reasons = [];
  let is6Plus6Eligible = true;

  if (!childBirthDate) {
    is6Plus6Eligible = false;
    reasons.push('자녀 생년월일이 입력되지 않아 6+6 부모육아휴직제 충족 여부를 확인할 수 없습니다.');
  } else if (!deadline18M) {
    is6Plus6Eligible = false;
    reasons.push('유효하지 않은 자녀 생년월일 형식입니다.');
  } else {
    // 생후 18개월 체크
    const validA = parentA.startDate ? isWithin18Months(childBirthDate, parentA.startDate) : true;
    const validB = parentB.startDate ? isWithin18Months(childBirthDate, parentB.startDate) : true;

    if (parentA.startDate && !validA) {
      is6Plus6Eligible = false;
      reasons.push('첫 번째 부모의 휴직 시작일(' + parentA.startDate + ')이 자녀 생후 18개월 도래일(' + deadline18M + ')을 초과했습니다.');
    }
    if (parentB.startDate && !validB) {
      is6Plus6Eligible = false;
      reasons.push('두 번째 부모의 휴직 시작일(' + parentB.startDate + ')이 자녀 생후 18개월 도래일(' + deadline18M + ')을 초과했습니다.');
    }
  }

  // 6+6 특례 적용 개월 수: 부모 양쪽 모두 사용한 개월 수 중 최대 6개월
  // specialMonths = min(6, monthsA, monthsB)
  const specialMonths = is6Plus6Eligible ? Math.min(6, monthsA, monthsB) : 0;

  if (is6Plus6Eligible) {
    reasons.push('부모 모두 자녀 생후 18개월 이내에 시작하여 공통 사용 기간(' + specialMonths + '개월) 동안 6+6 특례 상한액이 적용됩니다.');
    if (monthsA > specialMonths || monthsB > specialMonths) {
      reasons.push(specialMonths + '개월 초과 기간은 일반 육아휴직 급여 규정(4~6개월 200만, 7개월 이상 80% 상한 160만)이 적용됩니다.');
    }
  } else {
    reasons.push('6+6 부모육아휴직제 요건 미충족으로 일반 육아휴직 급여 규정이 적용됩니다.');
  }

  // 일반 급여 스케줄 계산 (비교군)
  const normalScheduleA = [];
  let normalTotalA = 0;
  for (let m = 1; m <= monthsA; m++) {
    const item = getNormalMonthBenefit(parentA.wage, m);
    normalScheduleA.push(item);
    normalTotalA += item.amount;
  }

  const normalScheduleB = [];
  let normalTotalB = 0;
  for (let m = 1; m <= monthsB; m++) {
    const item = getNormalMonthBenefit(parentB.wage, m);
    normalScheduleB.push(item);
    normalTotalB += item.amount;
  }

  // 실제 적용 급여 스케줄 계산
  const scheduleA = [];
  let totalA = 0;
  for (let m = 1; m <= monthsA; m++) {
    const item = (is6Plus6Eligible && m <= specialMonths)
      ? get6Plus6MonthBenefit(parentA.wage, m)
      : getNormalMonthBenefit(parentA.wage, m);
    scheduleA.push(item);
    totalA += item.amount;
  }

  const scheduleB = [];
  let totalB = 0;
  for (let m = 1; m <= monthsB; m++) {
    const item = (is6Plus6Eligible && m <= specialMonths)
      ? get6Plus6MonthBenefit(parentB.wage, m)
      : getNormalMonthBenefit(parentB.wage, m);
    scheduleB.push(item);
    totalB += item.amount;
  }

  // 순차 사용(sequential) 여부 판별
  let isSequential = false;
  let firstParentRole = 'A'; // 'A' or 'B'
  if (parentA.startDate && parentB.startDate) {
    if (parentA.startDate < parentB.startDate) {
      isSequential = true;
      firstParentRole = 'A';
    } else if (parentB.startDate < parentA.startDate) {
      isSequential = true;
      firstParentRole = 'B';
    } else {
      isSequential = false; // 동시 시작
    }
  } else {
    isSequential = true;
    firstParentRole = 'A';
  }

  // 소급 정산 차액 계산 (선사용 부모)
  let retroactiveTopUpA = 0;
  let retroactiveTopUpB = 0;
  let duringLeaveTotalA = totalA;
  let duringLeaveTotalB = totalB;

  if (is6Plus6Eligible && isSequential) {
    if (firstParentRole === 'A') {
      let topUp = 0;
      for (let m = 1; m <= specialMonths; m++) {
        const specialAmt = scheduleA[m - 1].amount;
        const normalAmt = normalScheduleA[m - 1].amount;
        topUp += Math.max(0, specialAmt - normalAmt);
      }
      retroactiveTopUpA = topUp;
      duringLeaveTotalA = normalTotalA;
    } else {
      let topUp = 0;
      for (let m = 1; m <= specialMonths; m++) {
        const specialAmt = scheduleB[m - 1].amount;
        const normalAmt = normalScheduleB[m - 1].amount;
        topUp += Math.max(0, specialAmt - normalAmt);
      }
      retroactiveTopUpB = topUp;
      duringLeaveTotalB = normalTotalB;
    }
  }

  const householdTotal = totalA + totalB;
  const normalHouseholdTotal = normalTotalA + normalTotalB;
  const benefitGain = householdTotal - normalHouseholdTotal;

  return {
    mode: 'couple',
    is6Plus6Eligible,
    specialMonths,
    isSequential,
    firstParentRole,
    childBirthDate: childBirthDate || null,
    deadline18Months: deadline18M,
    eligibilityReasons: reasons,
    parentA: {
      name: parentA.name || '첫 번째 부모',
      wage: parentA.wage,
      months: monthsA,
      startDate: parentA.startDate || null,
      isFirstParent: isSequential && firstParentRole === 'A',
      schedule: scheduleA,
      normalSchedule: normalScheduleA,
      total: totalA,
      normalTotal: normalTotalA,
      duringLeaveTotal: duringLeaveTotalA,
      retroactiveTopUp: retroactiveTopUpA,
    },
    parentB: {
      name: parentB.name || '두 번째 부모',
      wage: parentB.wage,
      months: monthsB,
      startDate: parentB.startDate || null,
      isFirstParent: isSequential && firstParentRole === 'B',
      schedule: scheduleB,
      normalSchedule: normalScheduleB,
      total: totalB,
      normalTotal: normalTotalB,
      duringLeaveTotal: duringLeaveTotalB,
      retroactiveTopUp: retroactiveTopUpB,
    },
    householdTotal,
    normalHouseholdTotal,
    benefitGain,
  };
}

export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0원';
  return amount.toLocaleString('ko-KR') + '원';
}

export function formatManwon(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0만원';
  const manwon = amount / 10000;
  if (Number.isInteger(manwon)) {
    return manwon.toLocaleString('ko-KR') + '만원';
  }
  return manwon.toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '만원';
}



/**
 * 월 통상임금 입력값 파싱 (만원 기준 기본 지원)
 * @param {string|number} input
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function parseWageInput(input) {
  if (input === null || input === undefined) {
    return { valid: false, error: '금액을 입력해주세요.' };
  }
  const str = String(input).trim();
  if (!str) {
    return { valid: false, error: '금액을 입력해주세요.' };
  }
  if (str.startsWith('-') || /^-/.test(str)) {
    return { valid: false, error: '0 이상의 금액을 입력해주세요.' };
  }

  const hasMan = /만/.test(str);
  const cleaned = str.replace(/[, \s]/g, '');

  if (hasMan) {
    const match = cleaned.match(/^([0-9]+(\.[0-9]+)?)만/);
    if (!match) {
      return { valid: false, error: '올바른 금액을 입력해주세요.' };
    }
    const n = parseFloat(match[1]);
    if (isNaN(n) || n < 0) {
      return { valid: false, error: '올바른 금액을 입력해주세요.' };
    }
    return { valid: true, value: Math.round(n * 10000) };
  } else {
    const withoutWon = cleaned.replace(/원$/, '');
    if (!/^[0-9]+(\.[0-9]+)?$/.test(withoutWon)) {
      return { valid: false, error: '올바른 금액을 입력해주세요.' };
    }
    const n = parseFloat(withoutWon);
    if (isNaN(n) || n < 0) {
      return { valid: false, error: '올바른 금액을 입력해주세요.' };
    }
    if (n >= 100000) {
      return { valid: true, value: Math.round(n) };
    } else {
      return { valid: true, value: Math.round(n * 10000) };
    }
  }
}



/**
 * 월별 가구 급여 입금 타임라인 산정 (순차 사용 시 소급 정산 시점 반영)
 * @param {Object} result calculateParentalLeave 반환 객체
 * @param {Object} [options]
 * @param {string} [options.startA] 'YYYY-MM-DD' 또는 'YYYY-MM'
 * @param {string} [options.startB] 'YYYY-MM-DD' 또는 'YYYY-MM'
 * @returns {Object} timeline 데이터
 */
export function buildMonthlyTimeline(result, options = {}) {
  if (!result || !result.parentA) {
    throw new Error('유효한 계산 결과 객체가 필요합니다.');
  }

  const startAStr = options.startA || result.parentA.startDate || '2026-01-01';
  const startBStr = (result.mode === 'couple' && result.parentB)
    ? (options.startB || result.parentB.startDate || '2026-07-01')
    : null;

  function parseYM(str) {
    if (!str || typeof str !== 'string') return { year: 2026, month: 1 };
    const match = str.match(/^(\d{4})-(\d{2})/);
    if (!match) return { year: 2026, month: 1 };
    return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
  }

  function getYMOffset(baseYM, offset) {
    const totalMonth = (baseYM.month - 1) + offset;
    const year = baseYM.year + Math.floor(totalMonth / 12);
    const month = (totalMonth % 12) + 1;
    return {
      year,
      month,
      monthKey: year + '-' + String(month).padStart(2, '0'),
      label: String(year).slice(2) + '.' + String(month).padStart(2, '0'),
      absoluteMonth: year * 12 + month,
    };
  }

  const ymA = parseYM(startAStr);
  const ymB = startBStr ? parseYM(startBStr) : null;

  const monthMap = new Map();

  function getOrCreateMonth(ymInfo) {
    if (!monthMap.has(ymInfo.monthKey)) {
      monthMap.set(ymInfo.monthKey, {
        monthKey: ymInfo.monthKey,
        label: ymInfo.label,
        year: ymInfo.year,
        month: ymInfo.month,
        absoluteMonth: ymInfo.absoluteMonth,
        parentA: 0,
        parentB: 0,
        retro: 0,
        total: 0,
        breakdown: [],
      });
    }
    return monthMap.get(ymInfo.monthKey);
  }

  const isSeq = result.is6Plus6Eligible && result.isSequential;
  const pAFirst = isSeq && result.parentA.isFirstParent;
  const pBFirst = isSeq && result.parentB && result.parentB.isFirstParent;

  // 1. Parent A 월별 급여
  const monthsA = result.parentA.schedule.length;
  for (let m = 0; m < monthsA; m++) {
    const ymInfo = getYMOffset(ymA, m);
    const item = getOrCreateMonth(ymInfo);
    const amount = (pAFirst && result.parentA.normalSchedule)
      ? result.parentA.normalSchedule[m].amount
      : result.parentA.schedule[m].amount;
    item.parentA += amount;
  }

  // 2. Parent B 월별 급여 (부부 모드)
  if (result.mode === 'couple' && result.parentB) {
    const monthsB = result.parentB.schedule.length;
    for (let m = 0; m < monthsB; m++) {
      const ymInfo = getYMOffset(ymB, m);
      const item = getOrCreateMonth(ymInfo);
      const amount = (pBFirst && result.parentB.normalSchedule)
        ? result.parentB.normalSchedule[m].amount
        : result.parentB.schedule[m].amount;
      item.parentB += amount;
    }
  }

  // 3. 소급 정산 일괄 입금 (두 번째 부모 첫 급여월 입금 가정)
  let hasRetro = false;
  let retroMonthKey = null;

  if (pAFirst && result.parentA.retroactiveTopUp > 0 && ymB) {
    const retroYM = getYMOffset(ymB, 0);
    const item = getOrCreateMonth(retroYM);
    item.retro += result.parentA.retroactiveTopUp;
    hasRetro = true;
    retroMonthKey = retroYM.monthKey;
  } else if (pBFirst && result.parentB.retroactiveTopUp > 0 && ymA) {
    const retroYM = getYMOffset(ymA, 0);
    const item = getOrCreateMonth(retroYM);
    item.retro += result.parentB.retroactiveTopUp;
    hasRetro = true;
    retroMonthKey = retroYM.monthKey;
  }

  // 4. 연속 캘린더 타임라인 생성
  let minAbs = Infinity;
  let maxAbs = -Infinity;

  for (const item of monthMap.values()) {
    if (item.absoluteMonth < minAbs) minAbs = item.absoluteMonth;
    if (item.absoluteMonth > maxAbs) maxAbs = item.absoluteMonth;
  }

  const timeline = [];
  let maxMonthTotal = 0;

  for (let abs = minAbs; abs <= maxAbs; abs++) {
    const year = Math.floor((abs - 1) / 12);
    const month = ((abs - 1) % 12) + 1;
    const monthKey = year + '-' + String(month).padStart(2, '0');
    const label = String(year).slice(2) + '.' + String(month).padStart(2, '0');

    let item = monthMap.get(monthKey);
    if (!item) {
      item = {
        monthKey,
        label,
        year,
        month,
        absoluteMonth: abs,
        parentA: 0,
        parentB: 0,
        retro: 0,
        total: 0,
        breakdown: [],
      };
    } else {
      item.total = item.parentA + item.parentB + item.retro;
      const bd = [];
      const parent1Label = result.mode === 'couple' ? (result.parentA.name || '먼저 쉬는 사람') : '쉬는 사람';
      const parent2Label = result.mode === 'couple' ? (result.parentB?.name || '나중에 쉬는 사람') : '';

      if (item.parentA > 0) {
        bd.push({
          role: 'parentA',
          name: parent1Label,
          amount: item.parentA,
          type: 'regular',
        });
      }
      if (item.parentB > 0) {
        bd.push({
          role: 'parentB',
          name: parent2Label,
          amount: item.parentB,
          type: 'regular',
        });
      }
      if (item.retro > 0) {
        const recipientName = pAFirst ? parent1Label : parent2Label;
        bd.push({
          role: pAFirst ? 'parentA' : 'parentB',
          name: recipientName + ' 소급 정산',
          amount: item.retro,
          type: 'retro',
        });
      }
      item.breakdown = bd;
    }

    if (item.total > maxMonthTotal) {
      maxMonthTotal = item.total;
    }
    timeline.push(item);
  }

  const totalSum = timeline.reduce((sum, it) => sum + it.total, 0);

  return {
    timeline,
    maxMonthTotal,
    totalSum,
    hasRetro,
    retroMonthKey,
    startMonthLabel: timeline[0]?.label || '',
    endMonthLabel: timeline[timeline.length - 1]?.label || '',
  };
}
