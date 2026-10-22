import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return typeof html === 'string' ? html : '';
}
