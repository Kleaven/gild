import { describe, expect, it } from 'vitest';
import { processMarkdown } from './engine';

describe('Step 32: The Armored Markdown Engine', () => {
  
  describe('Security (XSS) Kill-Test', () => {
    it('strips <script> tags and their content completely', async () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const { html } = await processMarkdown(input);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert');
      expect(html).toBe('<p>Hello  World</p>');
    });

    it('removes event handlers like onerror from <img>', async () => {
      const input = 'Dangerous image: <img src="x" onerror="alert(1)">';
      const { html } = await processMarkdown(input);
      expect(html).toContain('<img src="x">');
      expect(html).not.toContain('onerror');
    });

    it('rejects javascript: protocols in links', async () => {
      const input = '[Click Me](javascript:alert(1))';
      const { html } = await processMarkdown(input);
      // Depending on schema, it might strip href or the whole link
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('href="javascript:');
    });

    it('blocks iframes, objects, and embeds', async () => {
      const input = `
        <iframe src="https://malicious.com"></iframe>
        <object data="test.swf"></object>
        <embed src="test.swf">
      `;
      const { html } = await processMarkdown(input);
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('<object');
      expect(html).not.toContain('<embed');
    });

    it('strips form and button elements to prevent hijacking', async () => {
      const input = '<form action="/phish"><button>Submit</button></form>';
      const { html } = await processMarkdown(input);
      expect(html).not.toContain('<form');
      expect(html).not.toContain('<button');
      expect(html).toBe('Submit');
    });
  });

  describe('Professional Rendering (GFM)', () => {
    it('renders tables correctly', async () => {
      const input = `
| Item | Price | Qty |
| :--- | :---: | ---: |
| Apple | $1.00 | 5 |
| Banana | $0.50 | 10 |
      `;
      const { html } = await processMarkdown(input);
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      // GFM uses align attribute for table alignment
      expect(html).toContain('<td align="right">10</td>');
    });

    it('handles task lists', async () => {
      const input = '- [x] Completed task\n- [ ] Pending task';
      const { html } = await processMarkdown(input);
      expect(html).toContain('checked');
      expect(html).toContain('disabled');
      expect(html).toContain('type="checkbox"');
    });

    it('applies security attributes to external links', async () => {
      const input = 'Check out [Google](https://google.com)';
      const { html } = await processMarkdown(input);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="nofollow noopener noreferrer"');
    });

    it('provides syntax highlighting classes', async () => {
      const input = '```typescript\nconst x: number = 1;\n```';
      const { html } = await processMarkdown(input);
      expect(html).toContain('<pre>');
      expect(html).toContain('language-typescript');
      expect(html).toContain('hljs');
      // Verify some highlight.js classes are present
      expect(html).toContain('hljs-');
    });
  });

  describe('Robustness & Edge Cases', () => {
    it('handles null, undefined, and empty strings', async () => {
      expect((await processMarkdown(null)).html).toBe('');
      expect((await processMarkdown(undefined)).html).toBe('');
      expect((await processMarkdown('')).html).toBe('');
    });

    it('calculates word count correctly', async () => {
      const input = 'One two three four five.';
      const { wordCount } = await processMarkdown(input);
      expect(wordCount).toBe(5);
    });

    it('handles large strings without crashing', async () => {
      const largeInput = 'Word '.repeat(5000); // 5000 words
      const { html, wordCount } = await processMarkdown(largeInput);
      expect(wordCount).toBe(5000);
      expect(html.length).toBeGreaterThan(25000);
    });
  });
});
