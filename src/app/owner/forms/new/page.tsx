"use client";
import { useState } from "react";
import { createForm } from "@/lib/supabase/forms";
import { useRouter } from "next/navigation";

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function NewFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [gdprText, setGdprText] = useState(
    "I agree to the processing of my personal data in accordance with GDPR regulations and the company's privacy policy"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error } = await createForm({
      title,
      description,
      slug: slug,
      is_internal: isInternal,
      gdpr_consent_text: gdprText,
      status: "inactive",
    } as any);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) router.push(`/owner/forms/${data.id}/edit`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create Form</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="border rounded w-full px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => {
              if (!slug) setSlug(slugify(e.target.value));
            }}
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="border rounded w-full px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            className="border rounded w-full px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="employee-feedback-2025"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            URL: welcome.masterfabric.co/form/
            {slug || "your-slug"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="internal"
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          <label htmlFor="internal">
            Internal Only (MasterFabric employees)
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            GDPR Consent Text
          </label>
          <textarea
            className="border rounded w-full px-3 py-2"
            value={gdprText}
            onChange={(e) => setGdprText(e.target.value)}
            rows={3}
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 border rounded"
          >
            {saving ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
