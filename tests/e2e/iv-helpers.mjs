import path from 'node:path';
import { expect } from '@playwright/test';
import { loadSources, buildPayload, loadQuestions } from '../../scripts/interview-lib.mjs';
import { encryptPayload } from '../../js/crypto.js';

export const IV_PASSWORD = 'fixture-password-2026';
const FIXTURE_SRC = path.resolve(import.meta.dirname, '..', 'fixtures', 'interview');
export const FIXTURE_PAYLOAD = buildPayload(loadSources(FIXTURE_SRC), '2026-01-01T00:00:00Z', loadQuestions(FIXTURE_SRC));

let cached = null;
export function fixtureEnvelope() {
  if (!cached) cached = encryptPayload(FIXTURE_PAYLOAD, IV_PASSWORD, { iter: 1000 });
  return cached;
}

export async function serveEnvelope(page, envelope) {
  const body = JSON.stringify(await (envelope || fixtureEnvelope()));
  await page.unroute('**/data/interview.enc');
  await page.route('**/data/interview.enc', (route) => route.fulfill({ status: 200, contentType: 'application/json', body }));
}

export async function unlock(page) {
  await page.goto('./#/iv');
  await page.locator('#iv-password').fill(IV_PASSWORD);
  await page.getByRole('button', { name: '解锁' }).click();
  await expect(page.locator('#iv-password')).toHaveCount(0);
  await expect(page.locator('.domain-row')).toHaveCount(2);
}
