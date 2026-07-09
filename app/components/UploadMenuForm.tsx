"use client";

import type { CreateMenuPayload } from "@/app/services/business/upload-menu";
import {
  AlertCircle,
  FilePlus,
  FileText,
  Loader2,
  Trash2,
  Type,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const inputBase =
  "h-11 w-full rounded-xl border bg-white px-4 text-[16px] leading-normal text-zinc-900 outline-none ring-zinc-900/0 transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaBase =
  "min-h-[100px] w-full rounded-xl border bg-white px-4 py-3 text-[16px] leading-relaxed text-zinc-900 outline-none ring-zinc-900/0 transition placeholder:text-zinc-400 focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60";

const selectBase = `${inputBase} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat py-2 pr-10`;

const MENU_TYPE_OPTIONS = [
  { value: "Breakfast", label: "Breakfast" },
  { value: "Brunch", label: "Brunch" },
  { value: "Lunch", label: "Lunch" },
  { value: "Dinner", label: "Dinner" },
  { value: "Late night", label: "Late night" },
  { value: "All day", label: "All day" },
] as const;

const ACCEPT_MENU = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_MENU_BYTES = 10 * 1024 * 1024;

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

export type UploadMenuFormValues = {
  name: string;
  description: string;
  menuType: string;
};

export type UploadMenuFormProps = {
  restaurantId: number;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: CreateMenuPayload) => Promise<void>;
};

function RequiredStar() {
  return <span className="text-red-500">*</span>;
}

function fieldRing(hasError: boolean) {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-900/10"
    : "border-zinc-200 focus:border-zinc-300";
}

type MenuDropProps = {
  id: string;
  disabled: boolean;
  file: File | null;
  error?: string;
  onFile: (file: File | null) => void;
};

function MenuFileDropField({ id, disabled, file, error, onFile }: MenuDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const imagePreviewUrl = useMemo(() => {
    if (!file || !isImageMime(file.type)) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const validateAndSet = useCallback(
    (f: File | null, inputEl: HTMLInputElement | null) => {
      setLocalError(undefined);
      if (!f) {
        onFile(null);
        return;
      }
      const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(f.type)) {
        setLocalError("Use PDF, PNG, JPG, or WEBP only.");
        if (inputEl) inputEl.value = "";
        return;
      }
      if (f.size > MAX_MENU_BYTES) {
        setLocalError("File must be 10MB or smaller.");
        if (inputEl) inputEl.value = "";
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      validateAndSet(f, e.target);
    },
    [validateAndSet],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0] ?? null;
      validateAndSet(f, inputRef.current);
    },
    [disabled, validateAndSet],
  );

  const clearFile = useCallback(() => {
    setLocalError(undefined);
    if (inputRef.current) inputRef.current.value = "";
    onFile(null);
  }, [onFile]);

  const combinedError = error ?? localError;
  const showErrorStyle = Boolean(combinedError);
  const isPdf = file?.type === "application/pdf";

  const previewShellClass = `overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white shadow-md shadow-zinc-900/10 ring-1 ring-black/[0.06] ${
    disabled ? "pointer-events-none opacity-60" : ""
  }`;

  const previewActions = !disabled ? (
    <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-md transition hover:bg-zinc-100"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" aria-hidden />
        Replace file
      </button>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
        onClick={clearFile}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Remove
      </button>
    </div>
  ) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_MENU}
        className="hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={onChange}
      />

      {file && imagePreviewUrl ? (
        <div className={previewShellClass}>
          <div className="relative aspect-[16/10] max-h-72 w-full bg-zinc-100/80 shadow-inner">
            <img
              src={imagePreviewUrl}
              alt="Menu preview"
              className="h-full w-full object-contain"
            />
            {previewActions}
          </div>
        </div>
      ) : file && isPdf ? (
        <div className={previewShellClass}>
          <div className="relative flex aspect-[16/10] max-h-72 w-full flex-col items-center justify-center gap-2 bg-zinc-100/80 px-6 pt-8 pb-24 text-center shadow-inner">
            <FileText className="h-14 w-14 text-zinc-400" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-semibold text-zinc-800">PDF menu</p>
            <p className="max-w-full truncate text-xs text-zinc-500" title={file.name}>
              {file.name}
            </p>
            {previewActions}
          </div>
        </div>
      ) : file ? (
        <div className={previewShellClass}>
          <div className="relative flex aspect-[16/10] max-h-72 w-full items-center justify-center bg-zinc-100/80 p-6 shadow-inner">
            <p className="text-sm text-zinc-600">Preview not available</p>
            {previewActions}
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-label="Upload catalog or menu file"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
            disabled ? "pointer-events-none opacity-60" : ""
          } ${
            isDragging
              ? "scale-[1.01] border-black bg-zinc-100 shadow-lg ring-2 ring-black/10"
              : showErrorStyle
                ? "border-red-300 bg-red-50/50 hover:border-red-400"
                : "border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-200/70 hover:border-zinc-400 hover:shadow-md"
          }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              isDragging
                ? "bg-black text-white"
                : "bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200"
            }`}
          >
            <FilePlus
              className={`h-7 w-7 ${isDragging ? "text-white" : "text-zinc-600"}`}
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <span className="max-w-[260px]">
            <span className="block text-sm font-semibold text-zinc-900">
              {isDragging ? "Drop file here" : "Choose a catalog or menu file"}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
              Drag a file here or click to choose from your computer. PDF, PNG,
              JPG, or WEBP (max 10MB).
            </span>
          </span>
          <span className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm">
            Browse files
          </span>
        </label>
      )}

      {combinedError ? (
        <p className="text-sm text-red-600">{combinedError}</p>
      ) : null}
    </div>
  );
}

export default function UploadMenuForm({
  restaurantId,
  submitting,
  errorMessage,
  onSubmit,
}: UploadMenuFormProps) {
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuFileError, setMenuFileError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadMenuFormValues>({
    defaultValues: {
      name: "",
      description: "",
      menuType: "Dinner",
    },
  });

  const submit = handleSubmit(async (data) => {
    setMenuFileError(undefined);
    if (!menuFile) {
      setMenuFileError("Choose a menu file to upload.");
      return;
    }

    const payload: CreateMenuPayload = {
      restaurantId,
      name: data.name.trim(),
      description: data.description.trim(),
      menuType: data.menuType,
      file: menuFile,
    };
    await onSubmit(payload);
  });

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm ring-1 ring-black/[0.03] sm:p-8">
      <form className="flex flex-col gap-6 font-sans" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="menu-name"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
          >
            <Type className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            Menu or catalog name <RequiredStar />
          </label>
          <input
            id="menu-name"
            type="text"
            disabled={submitting}
            placeholder="e.g. Summer 2025"
            aria-invalid={!!errors.name}
            className={`${inputBase} py-2 ${fieldRing(!!errors.name)}`}
            {...register("name", {
              required: "Name is required.",
              maxLength: { value: 200, message: "Name must be 200 characters or less." },
            })}
          />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-description" className="text-sm font-medium text-zinc-700">
            Description <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="menu-description"
            rows={3}
            disabled={submitting}
            placeholder="e.g. Seasonal items and drinks."
            aria-invalid={!!errors.description}
            className={`${textareaBase} ${fieldRing(!!errors.description)}`}
            {...register("description", {
              maxLength: { value: 2000, message: "Description must be 2000 characters or less." },
            })}
          />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="menu-type"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            Menu type <RequiredStar />
          </label>
          <select
            id="menu-type"
            disabled={submitting}
            aria-invalid={!!errors.menuType}
            className={`${selectBase} ${fieldRing(!!errors.menuType)}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            }}
            {...register("menuType", { required: "Choose a menu type." })}
          >
            {MENU_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.menuType ? (
            <p className="text-sm text-red-600">{errors.menuType.message}</p>
          ) : null}
        </div>

        <section className="flex flex-col gap-3 border-t border-zinc-100 pt-6">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-zinc-900">
            <FilePlus className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
            Upload catalog or menu file
            <RequiredStar />
          </h2>
          <MenuFileDropField
            id="menu-file"
            disabled={submitting}
            file={menuFile}
            error={menuFileError}
            onFile={setMenuFile}
          />
        </section>

        {errorMessage ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        ) : null}

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            aria-label={submitting ? "Saving" : "Save and continue"}
            className="group relative inline-flex h-12 min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-base font-medium text-white shadow-lg shadow-zinc-900/25 transition-all duration-200 ease-out hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={`inline-flex items-center justify-center gap-2 ${
                submitting ? "invisible" : ""
              }`}
              aria-hidden={submitting}
            >
              <span>Save and continue</span>
              <Upload
                className="h-5 w-5 opacity-90 transition-transform group-hover:-translate-y-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </span>
            {submitting ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Loader2
                  className="h-6 w-6 animate-spin text-white"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </span>
            ) : null}
          </button>
        </div>
      </form>
    </div>
  );
}
