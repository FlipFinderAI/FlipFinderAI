import { FIXTURES } from "./fixtures.generated";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method !== "GET" ||
      url.pathname !== "/community-fixtures"
    ) {
      return json({ error: "Not found." }, 404);
    }

    const clubId = url.searchParams.get("clubId")?.trim();

    if (!clubId) {
      return json({ error: "clubId is required." }, 400);
    }

    const fixtures = FIXTURES.filter(
      fixture => fixture.clubIds.includes(clubId),
    );

    return json({ fixtures });
  },
};
