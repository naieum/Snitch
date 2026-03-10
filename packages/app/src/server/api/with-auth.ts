import { resolveUser } from "../middleware/api-auth";

type AuthHandler = (request: Request, userId: string, ...args: string[]) => Promise<Response>;

const JSON_HEADERS = { "Content-Type": "application/json" };

export function withAuth(handler: AuthHandler, ...pathParams: string[]) {
  return async ({ request }: { request: Request }) => {
    const user = await resolveUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
    }
    return handler(request, user.userId, ...pathParams);
  };
}

// For handlers that take a param from the URL
export function withAuthAndParam(handler: (request: Request, userId: string, param: string) => Promise<Response>) {
  return async ({ request, params }: { request: Request; params: Record<string, string> }) => {
    const user = await resolveUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
    }
    // Extract the first param value
    const paramValues = Object.values(params);
    return handler(request, user.userId, paramValues[0]);
  };
}

export function withAuthAndParams(handler: (...args: any[]) => Promise<Response>) {
  return async ({ request, params }: { request: Request; params: Record<string, string> }) => {
    const user = await resolveUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
    }
    return handler(request, user.userId, ...Object.values(params));
  };
}
