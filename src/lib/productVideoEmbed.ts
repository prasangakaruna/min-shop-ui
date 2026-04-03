export type ProductVideoEmbed =
  | { kind: 'youtube'; embedSrc: string; title: string }
  | { kind: 'vimeo'; embedSrc: string; title: string }
  | { kind: 'html5'; src: string }
  | { kind: 'external'; href: string; title: string };

const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

function extractYoutubeId(url: URL, host: string): string | null {
  const h = host.replace(/^www\./, '');
  if (h === 'youtu.be') {
    const seg = url.pathname.split('/').filter(Boolean)[0] ?? '';
    return YT_ID.test(seg) ? seg : null;
  }
  if (h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtube-nocookie.com' || h === 'music.youtube.com') {
    const v = url.searchParams.get('v');
    if (v && YT_ID.test(v)) return v;
    const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embed) return embed[1];
    const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts) return shorts[1];
    const live = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (live) return live[1];
  }
  return null;
}

function extractVimeoId(url: URL, host: string): string | null {
  const h = host.replace(/^www\./, '');
  if (h === 'player.vimeo.com') {
    const m = url.pathname.match(/\/video\/(\d+)/);
    return m ? m[1] : null;
  }
  if (h === 'vimeo.com') {
    const m = url.pathname.match(/\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }
  return null;
}

function isDirectVideoFile(href: string, pathname: string): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(pathname) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(href);
}

/**
 * Turn a product video link into an embed config. Supports YouTube, Vimeo, and direct .mp4/.webm/.ogg URLs.
 * Other https URLs fall back to an external link.
 */
export function parseProductVideoUrl(raw: string | null | undefined): ProductVideoEmbed | null {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return null;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  const yt = extractYoutubeId(url, host);
  if (yt) {
    return {
      kind: 'youtube',
      embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0`,
      title: 'Product video',
    };
  }
  const vim = extractVimeoId(url, host);
  if (vim) {
    return {
      kind: 'vimeo',
      embedSrc: `https://player.vimeo.com/video/${encodeURIComponent(vim)}`,
      title: 'Product video',
    };
  }
  if (isDirectVideoFile(s, url.pathname)) {
    return { kind: 'html5', src: s };
  }

  return { kind: 'external', href: s, title: 'Watch product video' };
}
