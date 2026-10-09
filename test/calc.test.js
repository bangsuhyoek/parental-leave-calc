import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateParentalLeave,
  getNormalMonthBenefit,
  getSingleParentMonthBenefit,
  get6Plus6MonthBenefit,
  isWithin18Months,
  calculate18MonthsDeadline,
  FLOOR_BENEFIT,
} from '../calc.js';

test('1. 일반 육아휴직 1인 - 통상임금 300만원, 12개월 (예시 1)', () => {
  const result = calculateParentalLeave({
    mode: 'solo',
    parentA: { wage: 3000000, months: 12 },
  });

  assert.equal(result.parentA.total, 23100000);
  assert.equal(result.parentA.schedule.length, 12);
  // 1~3개월: 각 250만
  assert.equal(result.parentA.schedule[0].amount, 2500000);
  assert.equal(result.parentA.schedule[1].amount, 2500000);
  assert.equal(result.parentA.schedule[2].amount, 2500000);
  // 4~6개월: 각 200만
  assert.equal(result.parentA.schedule[3].amount, 2000000);
  assert.equal(result.parentA.schedule[4].amount, 2000000);
  assert.equal(result.parentA.schedule[5].amount, 2000000);
  // 7~12개월: 각 160만
  for (let i = 6; i < 12; i++) {
    assert.equal(result.parentA.schedule[i].amount, 1600000);
  }
});

test('2. 일반 육아휴직 1인 - 통상임금 500만원, 12개월 (예시 2)', () => {
  const result = calculateParentalLeave({
    mode: 'solo',
    parentA: { wage: 5000000, months: 12 },
  });

  assert.equal(result.parentA.total, 23100000);
  // 상한선 도달로 300만원과 동일
  assert.equal(result.parentA.schedule[0].amount, 2500000);
  assert.equal(result.parentA.schedule[3].amount, 2000000);
  assert.equal(result.parentA.schedule[6].amount, 1600000);
});

test('3. 6+6 부부 순차 사용 - 통상임금 500만원, 각 6개월 (예시 3)', () => {
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-03-01',
    parentA: { wage: 5000000, months: 6, startDate: '2025-04-01' },
    parentB: { wage: 5000000, months: 6, startDate: '2025-10-01' },
  });

  assert.equal(result.is6Plus6Eligible, true);
  assert.equal(result.specialMonths, 6);
  assert.equal(result.isSequential, true);
  assert.equal(result.firstParentRole, 'A');

  // 월별 상한액 체계: 250, 250, 300, 350, 400, 450
  const expectedAmounts = [2500000, 2500000, 3000000, 3500000, 4000000, 4500000];
  assert.deepEqual(
    result.parentA.schedule.map(s => s.amount),
    expectedAmounts
  );
  assert.deepEqual(
    result.parentB.schedule.map(s => s.amount),
    expectedAmounts
  );

  // 1인당 6개월 합계 2,000만원
  assert.equal(result.parentA.total, 20000000);
  assert.equal(result.parentB.total, 20000000);
  // 부부 합계 4,000만원
  assert.equal(result.householdTotal, 40000000);

  // 첫 번째 부모의 휴직 중 수령액 (일반 기준: 1350만) 및 소급 정산 차액 (650만)
  assert.equal(result.parentA.duringLeaveTotal, 13500000);
  assert.equal(result.parentA.retroactiveTopUp, 6500000);
  assert.equal(result.parentA.duringLeaveTotal + result.parentA.retroactiveTopUp, 20000000);

  // 일반 대비 부부 추가 수령액: 4,000만 - 2,700만 = 1,300만원
  assert.equal(result.benefitGain, 13000000);
});

test('4. 6+6 부부 - 통상임금 300만원, 각 6개월 (예시 4)', () => {
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-03-01',
    parentA: { wage: 3000000, months: 6, startDate: '2025-04-01' },
    parentB: { wage: 3000000, months: 6, startDate: '2025-04-01' },
  });

  assert.equal(result.is6Plus6Eligible, true);
  assert.equal(result.specialMonths, 6);

  // 통상임금 300만원: 1~2개월 250만, 3~6개월 300만
  const expectedAmounts = [2500000, 2500000, 3000000, 3000000, 3000000, 3000000];
  assert.deepEqual(
    result.parentA.schedule.map(s => s.amount),
    expectedAmounts
  );
  assert.equal(result.parentA.total, 17000000);
  assert.equal(result.parentB.total, 17000000);
  assert.equal(result.householdTotal, 34000000);
});

test('5. 6+6 부부 - 통상임금 200만원 (모든 상한선 이하)', () => {
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-01-01',
    parentA: { wage: 2000000, months: 6, startDate: '2025-02-01' },
    parentB: { wage: 2000000, months: 6, startDate: '2025-08-01' },
  });

  assert.equal(result.is6Plus6Eligible, true);
  // 1~6개월 모두 200만원 수령
  for (let i = 0; i < 6; i++) {
    assert.equal(result.parentA.schedule[i].amount, 2000000);
    assert.equal(result.parentB.schedule[i].amount, 2000000);
  }
  assert.equal(result.parentA.total, 12000000);
  assert.equal(result.parentB.total, 12000000);
  assert.equal(result.householdTotal, 24000000);
  // 통상임금이 일반 상한(200만) 이하이므로 소급 정산 차액은 0원
  assert.equal(result.parentA.retroactiveTopUp, 0);
});

test('6. 하한액 70만원 검증 - 통상임금 60만원', () => {
  const resultSolo = calculateParentalLeave({
    mode: 'solo',
    parentA: { wage: 600000, months: 12 },
  });

  // 전 기간 하한액 70만원 보장
  for (let i = 0; i < 12; i++) {
    assert.equal(resultSolo.parentA.schedule[i].amount, 700000);
  }
  assert.equal(resultSolo.parentA.total, 8400000);

  // 6+6에서도 하한액 70만원 보장
  const result6Plus6 = get6Plus6MonthBenefit(600000, 1);
  assert.equal(result6Plus6.amount, 700000);
});

test('7. 한부모 근로자 특례 - 통상임금 400만원, 12개월', () => {
  const result = calculateParentalLeave({
    mode: 'single',
    parentA: { wage: 4000000, months: 12 },
  });

  assert.equal(result.mode, 'single');
  // 1~3개월: 100%, 상한 300만원
  assert.equal(result.parentA.schedule[0].amount, 3000000);
  assert.equal(result.parentA.schedule[1].amount, 3000000);
  assert.equal(result.parentA.schedule[2].amount, 3000000);
  // 4~6개월: 100%, 상한 200만원
  assert.equal(result.parentA.schedule[3].amount, 2000000);
  assert.equal(result.parentA.schedule[4].amount, 2000000);
  assert.equal(result.parentA.schedule[5].amount, 2000000);
  // 7~12개월: 80%(320만), 상한 160만원
  for (let i = 6; i < 12; i++) {
    assert.equal(result.parentA.schedule[i].amount, 1600000);
  }
  // 합계: (300*3) + (200*3) + (160*6) = 900 + 600 + 960 = 2,460만원
  assert.equal(result.parentA.total, 24600000);
});

test('8. 자녀 생후 18개월 경계값 검증 (정확히 18개월 vs 초과)', () => {
  const childBirth = '2025-01-01';
  const deadline = calculate18MonthsDeadline(childBirth);
  assert.equal(deadline, '2026-07-01');

  // 정확히 18개월 도래일 시작: 적격
  assert.equal(isWithin18Months(childBirth, '2026-07-01'), true);

  // 18개월 도래일 하루 뒤 시작: 부적격
  assert.equal(isWithin18Months(childBirth, '2026-07-02'), false);

  // 계산 엔진 전체 통합 검증
  const eligibleResult = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: childBirth,
    parentA: { wage: 5000000, months: 6, startDate: '2025-02-01' },
    parentB: { wage: 5000000, months: 6, startDate: '2026-07-01' },
  });
  assert.equal(eligibleResult.is6Plus6Eligible, true);
  assert.equal(eligibleResult.specialMonths, 6);

  const ineligibleResult = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: childBirth,
    parentA: { wage: 5000000, months: 6, startDate: '2025-02-01' },
    parentB: { wage: 5000000, months: 6, startDate: '2026-07-02' },
  });
  assert.equal(ineligibleResult.is6Plus6Eligible, false);
  assert.equal(ineligibleResult.specialMonths, 0);
});

test('9. Opus 보정 검증 (a): 둘 다 500만원, A=6개월, B=3개월', () => {
  // specialMonths = min(6, 6, 3) = 3
  // A: 250, 250, 300, 200, 200, 200 -> total 14,000,000
  // B: 250, 250, 300 -> total 8,000,000
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-01-01',
    parentA: { wage: 5000000, months: 6, startDate: '2025-02-01' },
    parentB: { wage: 5000000, months: 3, startDate: '2025-08-01' },
  });

  assert.equal(result.is6Plus6Eligible, true);
  assert.equal(result.specialMonths, 3);

  const expectedA = [2500000, 2500000, 3000000, 2000000, 2000000, 2000000];
  const expectedB = [2500000, 2500000, 3000000];

  assert.deepEqual(result.parentA.schedule.map(s => s.amount), expectedA);
  assert.deepEqual(result.parentB.schedule.map(s => s.amount), expectedB);

  assert.equal(result.parentA.total, 14000000);
  assert.equal(result.parentB.total, 8000000);
  assert.equal(result.householdTotal, 22000000);

  // A 소급 정산: 3개월차 차액 (300만 - 250만 = 50만)
  assert.equal(result.parentA.retroactiveTopUp, 500000);
  assert.equal(result.parentA.duringLeaveTotal, 13500000);
});

test('10. Opus 보정 검증 (b): 둘 다 500만원, A=6개월, B=6개월', () => {
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-01-01',
    parentA: { wage: 5000000, months: 6, startDate: '2025-02-01' },
    parentB: { wage: 5000000, months: 6, startDate: '2025-08-01' },
  });

  assert.equal(result.specialMonths, 6);
  const expected = [2500000, 2500000, 3000000, 3500000, 4000000, 4500000];
  assert.deepEqual(result.parentA.schedule.map(s => s.amount), expected);
  assert.deepEqual(result.parentB.schedule.map(s => s.amount), expected);
});

test('11. Opus 보정 검증 (c): 둘 다 500만원, A=12개월, B=1개월', () => {
  // specialMonths = min(6, 12, 1) = 1
  // A: 1개월차 250, 2~3개월차 250, 4~6개월차 200, 7~12개월차 160
  // B: 1개월차 250
  const result = calculateParentalLeave({
    mode: 'couple',
    childBirthDate: '2025-01-01',
    parentA: { wage: 5000000, months: 12, startDate: '2025-02-01' },
    parentB: { wage: 5000000, months: 1, startDate: '2026-02-01' },
  });

  assert.equal(result.specialMonths, 1);
  assert.equal(result.parentB.total, 2500000);

  const expectedA = [
    2500000, // 1개월차 (6+6)
    2500000, 2500000, // 2~3개월차 (일반)
    2000000, 2000000, 2000000, // 4~6개월차 (일반)
    1600000, 1600000, 1600000, 1600000, 1600000, 1600000, // 7~12개월차 (일반)
  ];
  assert.deepEqual(result.parentA.schedule.map(s => s.amount), expectedA);
  assert.equal(result.parentA.total, 23100000);

  // 1개월차 6+6 상한도 250만, 일반 상한도 250만이므로 소급 정산 차액은 0원
  assert.equal(result.parentA.retroactiveTopUp, 0);
});

