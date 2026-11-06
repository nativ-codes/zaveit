// Finds a Post's source picture the way the app does: oEmbed for YouTube, Reddit and TikTok, otherwise og:image.
const USER_AGENT = "Mozilla/5.0 (compatible; zaveit-migration/1.0)";

const OEMBED = [
  { domains: ["youtube.com", "youtu.be"], endpoint: "https://www.youtube.com/oembed" },
  { domains: ["reddit.com", "redd.it"], endpoint: "https://www.reddit.com/oembed", resolve: true },
  { domains: ["tiktok.com"], endpoint: "https://www.tiktok.com/oembed", resolve: true },
];

const matchesDomain = (hostname, domains) =>
  domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

const get = async (url, init) => {
  const response = await fetch(url, { ...init, headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  return response;
};

const decodeEntities = (text) =>
  text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export const findOgImage = (html) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (/(?:property|name)=["'](?:og:image|og:image:url|twitter:image)["']/i.test(tag)) {
      const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
      if (content) {
        return decodeEntities(content);
      }
    }
  }
  return undefined;
};

const findCovers = (value) => {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value.covers) && typeof value.covers[0] === "string") return value.covers[0];
  for (const child of Object.values(value)) {
    const cover = findCovers(child);
    if (cover) return cover;
  }
  return undefined;
};

const findTikTokCover = async (url) => {
  const videoId = url.match(/\/(?:video|photo)\/(\d+)/)?.[1];
  if (!videoId) return undefined;
  const html = await (await get(`https://www.tiktok.com/embed/v2/${videoId}`)).text();
  const state = html.match(/<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  return state ? findCovers(JSON.parse(state)) : undefined;
};

export const findSourcePicture = async (postUrl) => {
  const rule = OEMBED.find(({ domains }) => matchesDomain(new URL(postUrl).hostname.toLowerCase(), domains));

  if (rule) {
    let url = rule.resolve ? (await get(postUrl, { method: "HEAD" })).url : postUrl;
    url = url.replace(/^https?:\/\/(?:[^/]+\.)?reddit\.com/i, "https://www.reddit.com");
    // Like the app: TikTok's oEmbed often has no thumbnail_url, its embed page has the cover.
    const tiktokCover = rule.endpoint.includes("tiktok") && (await findTikTokCover(url).catch(() => undefined));
    if (tiktokCover) {
      return tiktokCover;
    }
    const data = await (await get(`${rule.endpoint}?format=json&url=${encodeURIComponent(url)}`)).json();
    if (data.thumbnail_url) {
      return data.thumbnail_url;
    }
  }

  const picture = findOgImage(await (await get(postUrl)).text());
  if (!picture) {
    throw new Error("no og:image");
  }
  return new URL(picture, postUrl).href.replace(/^http:/, "https:");
};

export const downloadPicture = async (url) =>
  Buffer.from(await (await get(url)).arrayBuffer());
