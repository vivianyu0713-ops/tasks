import { NextResponse } from "next/server";
import { createWorkItem, createWorkItemSchema, listWorkItems } from "@/lib/work-items";

export async function GET() {
  try {
    const items = await listWorkItems();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询事项失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createWorkItemSchema.parse(body);
    const item = await createWorkItem(input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建事项失败" },
      { status: 400 },
    );
  }
}
