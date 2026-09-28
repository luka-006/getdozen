"use client";

import { useEffect, useRef, useState } from "react";
import { compressProductImageForUpload } from "@/lib/product-image-compress";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  validateProductImage,
} from "@/lib/product-image";

type Props = {
  productType: "app" | "game";
};

export function ProductImageField({ productType }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreview(null);

    const picked = event.target.files?.[0];
    if (!picked) return;

    const file = await compressProductImageForUpload(picked);
    const buffer = new Uint8Array(await file.arrayBuffer());
    const error = validateProductImage(file, buffer);
    if (error) {
      setClientError(error);
      event.target.value = "";
      return;
    }

    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }

    const objectUrl = URL.createObjectURL(file);
    previewRef.current = objectUrl;
    setPreview(objectUrl);
  }

  function clearImage() {
    setClientError(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const label = productType === "game" ? "Game icon" : "App icon";

  return (
    <div className="field">
      <label htmlFor="product_image">{label} (optional)</label>
      <div className="flex flex-wrap items-start gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-14 w-14 rounded-[10px] border border-border bg-mist object-cover"
            width={56}
            height={56}
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id="product_image"
            name="product_image"
            type="file"
            accept={PRODUCT_IMAGE_ACCEPT}
            className="input"
            onChange={handleChange}
          />
          {preview ? (
            <button
              type="button"
              className="text-[13px] text-blue"
              onClick={clearImage}
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-[12px] text-ink/55">
        JPEG, PNG, WebP, or GIF. Max {PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024)} MB.
        Large images are resized before upload.
      </p>
      {clientError ? (
        <p className="text-[13px] text-flag">{clientError}</p>
      ) : null}
    </div>
  );
}
