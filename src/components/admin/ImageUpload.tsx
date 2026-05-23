import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link2, X, Loader2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  bucket: "hero-slides" | "offer-slides" | "category-icons" | "admin-uploads" | "product-images";
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  folder?: string;
};

export function ImageUpload({
  value,
  onChange,
  bucket,
  label = "Image",
  accept = "image/*",
  maxSizeMB = 5,
  folder = "",
}: Props) {
  const [mode, setMode] = useState<"upload" | "url">(value && /^https?:\/\//.test(value) && !value.includes(`/${bucket}/`) ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success("ছবি আপলোড হয়েছে ✅");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Link2 className="h-3 w-3" /> URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <label className={`block rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition cursor-pointer p-4 text-center ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <input type="file" accept={accept} onChange={onFile} disabled={uploading} className="hidden" />
          {uploading ? (
            <div className="inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> আপলোড হচ্ছে...</div>
          ) : (
            <div className="text-sm">
              <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
              <div className="font-medium">ক্লিক করে ছবি বাছাই করুন</div>
              <div className="text-xs text-muted-foreground mt-0.5">Max {maxSizeMB}MB</div>
            </div>
          )}
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={() => onChange(urlInput)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(urlInput)}
            className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"
          >
            Set
          </button>
        </div>
      )}

      {value && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-auto rounded-lg border border-border object-cover" />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); }}
            className="absolute -top-2 -right-2 grid place-items-center h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs shadow"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
