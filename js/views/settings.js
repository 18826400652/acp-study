import { h } from '../ui.js';
import { setExamDate, validateImport, emptyProgress, exportFileName } from '../progress.js';

function group(title, ...children) {
  return h('section', { class: 'settings-group' }, h('h2', {}, title), children);
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importFile(ctx, input, dateInput, status) {
  const file = input.files && input.files[0];
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    status.textContent = '导入失败：文件不是有效的 JSON';
    return;
  } finally {
    input.value = '';
  }
  const res = validateImport(parsed);
  if (!res.ok) {
    status.textContent = `导入失败：${res.error}`;
    return;
  }
  if (!window.confirm('导入会覆盖当前全部进度，确定吗？')) return;
  ctx.update(() => res.value);
  dateInput.value = res.value.examDate || '';
  status.textContent = '导入成功';
}

export function renderSettings(ctx) {
  const status = h('p', { class: 'settings-status muted', role: 'status' });
  const dateInput = h('input', { class: 'field-input', type: 'date', id: 'exam-date', value: ctx.getProgress().examDate || '' });
  dateInput.addEventListener('change', () => {
    ctx.update((p) => setExamDate(p, dateInput.value || null));
    status.textContent = dateInput.value ? '考试日期已保存' : '已清除考试日期';
  });
  const fileInput = h('input', { class: 'visually-hidden', type: 'file', id: 'import-file', accept: 'application/json,.json' });
  fileInput.addEventListener('change', () => {
    importFile(ctx, fileInput, dateInput, status).catch((err) => {
      console.error(err);
      status.textContent = '导入失败：读取文件出错';
    });
  });
  const exportNow = () => {
    downloadJson(ctx.getProgress(), exportFileName(new Date()));
    status.textContent = '已导出进度文件，请妥善保存';
  };
  const clearAll = () => {
    if (!window.confirm('确定清空全部进度吗？此操作无法撤销，建议先导出备份。')) return;
    ctx.update(() => emptyProgress());
    dateInput.value = '';
    status.textContent = '已清空全部进度';
  };
  return [
    group('考试日期',
      h('label', { class: 'field-label', for: 'exam-date' }, '设置后首页会显示倒计时'),
      dateInput),
    group('备份与迁移',
      h('p', { class: 'muted' }, '进度只保存在本机浏览器里。清理浏览器数据或手机管家「一键清理」都会丢失进度，建议定期导出，存到微信文件传输助手或网盘。'),
      h('button', { class: 'btn btn-secondary btn-block', type: 'button', onClick: exportNow }, '导出进度'),
      h('label', { class: 'btn btn-secondary btn-block', for: 'import-file' }, '导入进度'),
      fileInput),
    group('危险操作',
      h('button', { class: 'btn btn-danger btn-block', type: 'button', onClick: clearAll }, '清空全部进度')),
    status,
  ];
}
