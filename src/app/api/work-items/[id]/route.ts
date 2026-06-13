import { NextResponse } from "next/server";
import { deleteWorkItem, updateWorkItem, updateWorkItemSchema } from "@/lib/work-items";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = updateWorkItemSchema.parse(body);
    const item = await updateWorkItem(id, input);

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新事项失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteWorkItem(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除事项失败" },
      { status: 400 },
    );
  }
}
