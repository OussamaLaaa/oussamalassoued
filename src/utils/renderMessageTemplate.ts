export type TemplateVariables = Record<string, string | number | undefined | null>;

const resolveFallback = (key: string) => {
  if (key === 'myName') return 'Oussama';
  return '';
};

export const renderMessageTemplate = (templateBody: string, variables: TemplateVariables) => {
  if (!templateBody) return '';

  return templateBody.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
    const value = variables[key];
    if (value == null) return resolveFallback(key);
    return String(value);
  });
};
