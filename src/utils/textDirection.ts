const RTL_CHAR_PATTERN = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR_PATTERN = /[A-Za-z]/;

const isStrongRtl = (char: string) => RTL_CHAR_PATTERN.test(char);
const isStrongLtr = (char: string) => LTR_CHAR_PATTERN.test(char);

export const detectTextDirection = (text: string): 'rtl' | 'ltr' => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 'ltr';

  let rtlCount = 0;
  let ltrCount = 0;

  for (const char of trimmed) {
    if (isStrongRtl(char)) {
      rtlCount += 1;
      if (ltrCount === 0) return 'rtl';
      continue;
    }

    if (isStrongLtr(char)) {
      ltrCount += 1;
      if (rtlCount === 0) return 'ltr';
    }
  }

  if (rtlCount > ltrCount) return 'rtl';
  if (ltrCount > rtlCount) return 'ltr';
  return 'ltr';
};

export const getDirectionClass = (text: string) => (detectTextDirection(text) === 'rtl' ? 'text-right' : 'text-left');

export const getTextDirectionProps = (text: string) => {
  const dir = detectTextDirection(text);
  return {
    dir,
    className: dir === 'rtl' ? 'text-right' : 'text-left',
  };
};