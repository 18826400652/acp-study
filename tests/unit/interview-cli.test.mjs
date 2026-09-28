import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { unlockWithPassword } from '../../js/crypto.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'interview');
const PASSWORD = 'fixture-password-2026';

function run(script, env, args = []) {
  return spawnSync(process.execPath, [path.join(ROOT, 'scripts', script)].concat(args), {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, INTERVIEW_TEST: '1', INTERVIEW_ITER: '1000', ...env },
  });
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iv-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('build refuses to run without the source folder or password', (t) => {
  const out = path.join(tempDir(t), 'x.enc');
  assert.match(run('build-interview.mjs', { INTERVIEW_SRC: '', INTERVIEW_ENC: out }).stderr, /INTERVIEW_SRC/);
  assert.match(run('build-interview.mjs', { INTERVIEW_SRC: FIXTURE, INTERVIEW_PASSWORD: '', INTERVIEW_ENC: out }).stderr, /INTERVIEW_PASSWORD/);
  assert.equal(fs.existsSync(out), false);
});

test('build requires all eight category files', (t) => {
  const out = path.join(tempDir(t), 'x.enc');
  const res = run('build-interview.mjs', { INTERVIEW_SRC: FIXTURE, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /缺少类别文件：C、D、E、F、G、H/);
  assert.equal(fs.existsSync(out), false);
});

test('build refuses to write when source text is found in the repo', (t) => {
  const dir = tempDir(t);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  ['C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    const text = `# ${l}. 占位类别\n\n### ${l}1. 占位问题${l}：完全不会出现在仓库里的标题\n\n**结论**：x\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-stub.md`), text);
  });
  const out = path.join(dir, 'x.enc');
  const res = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /tests\/fixtures\/interview\/qbank\/A-sample\.md/);
  assert.equal(fs.existsSync(out), false);
});

test('build writes a working envelope when the repo is clean, and decrypt restores it outside the repo', async (t) => {
  const dir = tempDir(t);
  // 标题只能动态拼出来：写成字面量会被防泄漏扫描在本测试文件里找到
  const title = (l) => `临时问题 ${l} 只存在于系统临时目录`;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    fs.mkdirSync(path.join(dir, 'qbank'), { recursive: true });
    const text = `# ${l}. 临时类别\n\n### ${l}1. ${title(l)}\n\n**结论**：临时结论 ${l}\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-tmp.md`), text);
  });
  const out = path.join(dir, 'x.enc');
  const build = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stdout, /8 个类别，8 张卡片/);
  const envelope = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal((await unlockWithPassword(envelope, PASSWORD)).payload.cards['iv-h'][0].no, 'H1');

  const again = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.equal(again.status, 0, again.stderr);
  assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).salt, envelope.salt);

  const restoreDir = path.join(dir, 'restore');
  const dec = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out }, [restoreDir]);
  assert.equal(dec.status, 0, dec.stderr);
  const restored = JSON.parse(fs.readFileSync(path.join(restoreDir, 'interview-payload.json'), 'utf8'));
  assert.equal(restored.cards['iv-a'][0].title, title('A'));
});

test('decrypt refuses an output folder inside the repo or a missing bank file', (t) => {
  const inside = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD }, [path.join(ROOT, 'tmp-out')]);
  assert.notEqual(inside.status, 0);
  assert.match(inside.stderr, /输出目录必须在仓库之外/);
  assert.equal(fs.existsSync(path.join(ROOT, 'tmp-out')), false);
  const dir = tempDir(t);
  const missing = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: path.join(dir, 'none.enc') }, [dir]);
  assert.match(missing.stderr, /找不到密文文件/);
});

test('decrypt rejects a wrong password and writes nothing', (t) => {
  const dir = tempDir(t);
  // 标题只能动态拼出来：写成字面量会被防泄漏扫描在本测试文件里找到
  const title = (l) => `临时问题 ${l} 只用于错误密码测试`;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    fs.mkdirSync(path.join(dir, 'qbank'), { recursive: true });
    const text = `# ${l}. 临时类别\n\n### ${l}1. ${title(l)}\n\n**结论**：临时结论 ${l}\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-tmp.md`), text);
  });
  const out = path.join(dir, 'x.enc');
  const build = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.equal(build.status, 0, build.stderr);

  const restoreDir = path.join(dir, 'restore-wrong');
  const wrongPassword = 'a-totally-different-password-0000';
  const dec = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: wrongPassword, INTERVIEW_ENC: out }, [restoreDir]);
  assert.notEqual(dec.status, 0);
  assert.match(dec.stderr, /密码不对/);
  assert.equal(fs.existsSync(path.join(restoreDir, 'interview-payload.json')), false);
});

test('build refuses to write test-grade iterations to the default interview.enc path', (t) => {
  const dir = tempDir(t);
  // 标题只能动态拼出来：写成字面量会被防泄漏扫描在本测试文件里找到
  const title = (l) => `临时问题 ${l} 只用于迭代次数下限测试`;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    fs.mkdirSync(path.join(dir, 'qbank'), { recursive: true });
    const text = `# ${l}. 临时类别\n\n### ${l}1. ${title(l)}\n\n**结论**：临时结论 ${l}\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-tmp.md`), text);
  });
  const realOut = path.join(ROOT, 'data', 'interview.enc');
  const existedBefore = fs.existsSync(realOut);
  const before = existedBefore ? fs.readFileSync(realOut) : null;
  // INTERVIEW_ENC 显式置空，模拟“没有设置”，让脚本落回仓库里真正的默认路径
  const res = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: '' });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /测试用的迭代次数不能写入正式密文/);
  assert.equal(fs.existsSync(realOut), existedBefore);
  if (existedBefore) assert.deepEqual(fs.readFileSync(realOut), before);
});
