export function getAdminToken(request: Request): string | null {
  const url = new URL(request.url);
  const query = url.searchParams.get("token");
  const header = request.headers.get("x-admin-token");
  return query?.trim() || header?.trim() || null;
}

export function isAuthorizedAdmin(token: string | null): boolean {
  const secret = process.env.ADMIN_GIFT_TOKEN?.trim();
  return Boolean(secret && token && token === secret);
}
