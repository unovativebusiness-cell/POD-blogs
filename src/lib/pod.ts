export interface Feature {
  id: number;
  name: string;
  description: string;
  url: string;
  logo: string | null;
}

export interface SiteChrome {
  blurb: string;
  officeLabel: string;
  officeValue: string;
  features: Feature[];
}

function env(name: string, fallback: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  return fromProcess || fromImport || fallback;
}

const POD_API = env('POD_API_URL', 'https://api.photographerondemand.in/').replace(/\/?$/, '/');

const fallback: SiteChrome = {
  blurb: "POD, India's First On Demand Personal Photographer App For Everybody.",
  officeLabel: 'Head Office',
  officeValue: 'Ahmedabad, Gujarat.',
  features: [],
};

type Cache = { chrome?: Promise<SiteChrome> };
const cache: Cache = ((globalThis as unknown as { __podChrome?: Cache }).__podChrome ??= {});

function externalUrl(url: string): string {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

export function getSiteChrome(): Promise<SiteChrome> {
  cache.chrome ??= loadChrome();
  return cache.chrome;
}

async function loadChrome(): Promise<SiteChrome> {
  try {
    const [masterResponse, featureResponse] = await Promise.all([
      fetch(`${POD_API}landing/web/getMaster`),
      fetch(`${POD_API}landing/web/getFeatures`),
    ]);
    if (!masterResponse.ok || !featureResponse.ok) return fallback;

    const master = (await masterResponse.json()) as {
      r?: { id: number; value?: string }[];
    };
    const features = (await featureResponse.json()) as {
      r?: { id: number; name?: string; description?: string; url?: string; logo?: string }[];
    };
    const byId = new Map((master.r ?? []).map((item) => [item.id, item.value ?? '']));

    return {
      blurb: byId.get(24) || fallback.blurb,
      officeLabel: byId.get(25) || fallback.officeLabel,
      officeValue: byId.get(26) || fallback.officeValue,
      features: (features.r ?? []).map((feature) => ({
        id: feature.id,
        name: feature.name || 'Feature',
        description: feature.description || '',
        url: externalUrl(feature.url || ''),
        logo: feature.logo ? `${POD_API}uploads/web/feature/${feature.logo}` : null,
      })),
    };
  } catch (error) {
    console.warn('POD site chrome could not be loaded', error);
    return fallback;
  }
}
