// Надёжное фоновое сохранение единого снимка. Не является двусторонней синхронизацией.
export const CLOUD_DIRTY = 'pantry-cloud-dirty-v1';
export const CLOUD_LAST = 'pantry-last-cloud-sync';
export const CLOUD_ENABLED = 'pantry-autosync-enabled';

// Передаём зависимости явно, чтобы модуль можно было тестировать без DOM/Supabase.
export function createCloudSync({storage, online, configured, authenticated, getSnapshot, upload, status, notify,
                                  schedule = (fn, delay) => setTimeout(fn, delay),
                                  cancel = id => clearTimeout(id), now = () => new Date()}) {
  let timer = null;
  let enabled = false;
  let busy = false;
  let revision = 0;
  let failures = 0;

  function renderStatus() {
    const last = storage.getItem(CLOUD_LAST);
    const pending = storage.getItem(CLOUD_DIRTY) === '1';
    status(pending
      ? 'Есть локальные изменения, ожидающие отправки в облако.'
      : last ? 'Последнее сохранение в облако: ' + new Date(last).toLocaleString('ru-RU')
             : 'Облачное сохранение ещё не выполнено.');
  }
  function plan(delay = 1200) {
    if (timer !== null) cancel(timer);
    timer = null;
    if (!enabled || !configured() || !authenticated()) return;
    timer = schedule(() => { timer = null; void flush(); }, delay);
  }
  function queue() {
    storage.setItem(CLOUD_DIRTY, '1');
    revision++;
    renderStatus();
    plan();
  }
  async function flush() {
    if (!enabled || !configured() || !authenticated() || busy || storage.getItem(CLOUD_DIRTY) !== '1') return;
    if (!online()) { plan(30000); return; }
    busy = true;
    const savedRevision = revision;
    try {
      await upload(await getSnapshot());
      storage.setItem(CLOUD_LAST, now().toISOString());
      failures = 0;
      if (savedRevision === revision) storage.removeItem(CLOUD_DIRTY);
    } catch (error) {
      console.warn('Не удалось сохранить резервную копию:', error);
      failures++;
      if (failures === 1) notify('Облако временно недоступно. Повторим сохранение автоматически.');
    } finally {
      busy = false;
      renderStatus();
      if (storage.getItem(CLOUD_DIRTY) === '1') {
        plan(failures === 0 ? 1200 : Math.min(300000, 5000 * 2 ** Math.min(failures - 1, 6)));
      }
    }
  }
  function start() {
    enabled = storage.getItem(CLOUD_ENABLED) === '1' && authenticated();
    if (storage.getItem(CLOUD_DIRTY) === '1') plan(1500);
  }
  function stop() {
    enabled = false;
    if (timer !== null) cancel(timer);
    timer = null;
    storage.removeItem(CLOUD_ENABLED);
  }
  function beforeRestore() {
    stop();
    storage.removeItem(CLOUD_DIRTY);
    renderStatus();
  }
  function markSaved(savedRevision = revision) {
    enabled = true;
    failures = 0;
    storage.setItem(CLOUD_ENABLED, '1');
    storage.setItem(CLOUD_LAST, now().toISOString());
    if (savedRevision === revision) storage.removeItem(CLOUD_DIRTY);
    renderStatus();
    if (storage.getItem(CLOUD_DIRTY) === '1') plan();
  }
  function markFailed() {
    storage.setItem(CLOUD_DIRTY, '1');
    renderStatus();
  }
  return {plan, queue, flush, start, stop, beforeRestore, markSaved, markFailed, renderStatus,
    revision: () => revision,
    isEnabled: () => enabled, isBusy: () => busy};
}
