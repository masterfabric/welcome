"use client";
import { useEffect, useMemo, useState } from "react";
import {
  listMyForms,
  OwnerDashboardItem,
  deleteForm,
  duplicateForm,
} from "@/lib/supabase/forms";
import Link from "next/link";

export default function MyFormsPage() {
  const [items, setItems] = useState<OwnerDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"date" | "name" | "responses">("date");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await listMyForms();
      if (mounted && data) setItems(data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let arr = items;
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.title.toLowerCase().includes(t) || i.slug.toLowerCase().includes(t)
      );
    }
    if (sort === "date")
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    if (sort === "name")
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "responses")
      arr = [...arr].sort(
        (a, b) => (b.response_count || 0) - (a.response_count || 0)
      );
    return arr;
  }, [items, q, sort]);

  async function onDelete(id: string) {
    if (!confirm("Delete this form?")) return;
    await deleteForm(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function onDuplicate(id: string) {
    const { data } = await duplicateForm(id);
    if (data) {
      const { data: list } = await listMyForms();
      if (list) setItems(list);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Forms</h1>
        <Link href="/owner/forms/new" className="px-3 py-2 border rounded">
          New Form
        </Link>
      </div>
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by title or slug"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="date">Sort: Date</option>
          <option value="name">Sort: Name</option>
          <option value="responses">Sort: Responses</option>
        </select>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Access</th>
                <th className="text-right p-2">Responses</th>
                <th className="text-left p-2">Updated</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">
                    <Link
                      href={`/owner/forms/${it.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      {it.title}
                    </Link>
                  </td>
                  <td className="p-2">{it.slug}</td>
                  <td className="p-2 capitalize">{it.status}</td>
                  <td className="p-2">{it.access_type}</td>
                  <td className="p-2 text-right">{it.response_count}</td>
                  <td className="p-2">
                    {new Date(it.updated_at).toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/f/${it.slug}`}
                        className="px-2 py-1 border rounded"
                      >
                        View
                      </Link>
                      <Link
                        href={`/owner/forms/${it.id}/responses`}
                        className="px-2 py-1 border rounded"
                      >
                        Responses
                      </Link>
                      <button
                        onClick={() => onDuplicate(it.id)}
                        className="px-2 py-1 border rounded"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => onDelete(it.id)}
                        className="px-2 py-1 border rounded text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={7}>
                    No forms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
