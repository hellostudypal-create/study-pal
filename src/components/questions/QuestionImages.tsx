"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface QuestionImageItem {
  id: string;
  role: "question" | "option" | "answer";
  label: string | null;
  imagePath: string;
}

const ROLE_LABELS: Record<QuestionImageItem["role"], string> = {
  question: "Question",
  option: "Option",
  answer: "Answer",
};

export function QuestionImages({
  questionId,
  initialImages,
}: {
  questionId: string;
  initialImages: QuestionImageItem[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [role, setRole] = useState<QuestionImageItem["role"]>("question");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("role", role);
    if (role === "option" && label) form.append("label", label);

    const res = await fetch(`/api/questions/${questionId}/images`, {
      method: "POST",
      body: form,
    });

    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }

    const data = await res.json();
    setImages((prev) => [...prev, data.image]);
    fileInput.value = "";
    setLabel("");
    router.refresh();
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Remove this image?")) return;
    const res = await fetch(`/api/questions/${questionId}/images/${imageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/questions/${img.imagePath}`}
                alt={img.label ?? img.role}
                className="aspect-square w-full object-contain bg-muted"
              />
              <div className="flex items-center justify-between gap-1 p-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {img.role === "option" ? `Option ${img.label ?? ""}` : ROLE_LABELS[img.role]}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-3 rounded-md border border-dashed border-border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="role">Image type</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as QuestionImageItem["role"])}
            >
              <option value="question">Question figure</option>
              <option value="option">Answer option</option>
              <option value="answer">Solution / explanation</option>
            </Select>
          </div>
          {role === "option" && (
            <div className="space-y-1.5">
              <Label htmlFor="label">Option label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. A"
                maxLength={5}
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="file">Image file</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={uploading}>
          {uploading ? "Uploading…" : "Add image"}
        </Button>
      </form>
    </div>
  );
}
