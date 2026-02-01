import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const token = req.headers.get("authorization");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/api/v1/generate/lyrics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.detail || "Backend error" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in lyrics generation proxy:", error);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }
}
