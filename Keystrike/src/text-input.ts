// Text encounters consume committed input only. Keep this DOM adapter separate
// from the deterministic core and never send intermediate composition updates.
import type { Action } from './core.ts';
export function bindTextInput(input: HTMLInputElement, send: (a: Action) => void) {
  let composing = false;
  const commit = (text: string, composition = false) => {
    input.value = '';
    const chars = Array.from(text.normalize('NFC'));
    if (!composition && chars.length !== 1) return;
    if (chars.length > 45) return;
    for (const char of chars) send({ kind: 'text', text: char });
  };
  input.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      return;
    }
    if (!e.isComposing && e.key === 'Backspace') {
      e.preventDefault();
      send({ kind: 'backspace' });
    }
    if (e.key === 'Enter') e.preventDefault();
  });
  input.addEventListener('paste', (e) => e.preventDefault());
  input.addEventListener('drop', (e) => e.preventDefault());
  input.addEventListener('beforeinput', (e) => {
    const event = e as InputEvent;
    if (event.isComposing || composing) return;
    if (event.inputType !== 'insertText' || Array.from(event.data ?? '').length !== 1)
      e.preventDefault();
  });
  input.addEventListener('compositionstart', () => {
    composing = true;
  });
  input.addEventListener('compositionend', (e) => {
    composing = false;
    commit(e.data, true);
  });
  input.addEventListener('input', (e) => {
    if (composing || (e as InputEvent).isComposing) return;
    if (!(e as InputEvent).inputType || (e as InputEvent).inputType === 'insertText')
      commit(input.value);
    else input.value = '';
  });
}
