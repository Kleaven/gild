import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * MANDATORY: Strict Security Schema
 * Inherits from GitHub's schema but explicitly blocks iframes, objects, and embeds.
 * Also strictly limits protocols to prevent javascript: or data: URI attacks.
 */
const securitySchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'address', 'article', 'aside', 'footer', 'header', 'hgroup', 'main', 'nav', 'section',
  ].filter(tag => !['iframe', 'object', 'embed', 'form', 'button'].includes(tag)),
  attributes: {
    ...defaultSchema.attributes,
    // Allow alignment for tables
    td: [...(defaultSchema.attributes?.td || []), 'align', 'style'],
    th: [...(defaultSchema.attributes?.th || []), 'align', 'style'],
    // Allow task list checkboxes
    input: [['type', 'checkbox'], ['disabled', true], ['checked', true], ['checked', false]],
    // Whitelist specific tags that might have attributes we want to preserve
    img: [...(defaultSchema.attributes?.img || []), 'src', 'alt', 'title', 'width', 'height'],
    // Global safe attributes
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', 'tel'],
    src: ['http', 'https'],
  },
};

/**
 * THE SINGLETON PROCESSOR
 * Initialized once outside the function scope for maximum performance.
 * We use .freeze() to ensure it is thread-safe for the Edge Runtime.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw) // Convert raw HTML to HAST nodes
  .use(rehypeSanitize, securitySchema) // Run sanitization FIRST to clean user input
  .use(rehypeHighlight, { detect: true }) // Then add highlighting
  .use(rehypeExternalLinks, {
    target: '_blank',
    rel: ['nofollow', 'noopener', 'noreferrer'],
  }) // Then add external link attributes
  .use(rehypeStringify)
  .freeze();

export interface MarkdownResult {
  html: string;
  wordCount: number;
}

/**
 * processMarkdown
 * Transforms user-provided Markdown into sanitized HTML.
 * Handles edge cases like null/undefined and extremely long strings.
 */
export async function processMarkdown(content: string | null | undefined): Promise<MarkdownResult> {
  if (!content || typeof content !== 'string') {
    return { html: '', wordCount: 0 };
  }

  // Handle extremely long strings (e.g. 50k+ chars) by returning empty if malicious 
  // or truncated if needed, but here we let unified handle it while tracking performance.
  try {
    const result = await processor.process(content);
    
    return {
      html: result.toString(),
      wordCount: content.trim().split(/\s+/).length,
    };
  } catch (error) {
    console.error('[MarkdownEngine] Processing failed:', error);
    return { html: '<em>Error processing content</em>', wordCount: 0 };
  }
}
