export const config = { runtime: 'edge' };

// 간단 이미지 프록시: http/https만 허용, 사설망/루프백 차단, 원본 Content-Type 전달, CORS 허용
export default async function handler(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('url');
    if (!target) return new Response('Missing url', { status: 400 });

    let u: URL;
    try { u = new URL(target); } catch { return new Response('Invalid url', { status: 400 }); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return new Response('Only http/https allowed', { status: 400 });
    }

    // 매우 기본적인 SSRF 방어: 루프백/사설 대역/링크-로컬 차단 (정적 검사)
    const host = u.hostname;
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);
    const blocked = (
      host === 'localhost' || host.endsWith('.localhost') ||
      host === '127.0.0.1' || host === '::1' ||
      (isIp && (
        host.startsWith('10.') ||
        host.startsWith('127.') ||
        host.startsWith('169.254.') ||
        host.startsWith('192.168.') ||
        (host.startsWith('172.') && (() => { const s = Number(host.split('.')[1]); return s >= 16 && s <= 31; })())
      ))
    );
    if (blocked) return new Response('Blocked host', { status: 400 });

    const resp = await fetch(u.toString(), { headers: { 'user-agent': 'ditto-keychain-proxy' } });
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-store');
    return new Response(resp.body, { status: resp.status, headers });
  } catch (e: any) {
    return new Response('Proxy error', { status: 502 });
  }
}
