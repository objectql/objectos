import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL("/api/auth/get-session", req.url);
  const res = await fetch(url, {
    headers: req.headers
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await res.json();
  const user = data?.user || data?.session?.user || null;
  const session = data?.session || null;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user, session });
}
