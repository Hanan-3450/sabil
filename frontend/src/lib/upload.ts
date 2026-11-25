import { apiFetch } from "./api";

export function uploadFileWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Storage upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network or CORS error while uploading to storage"));
    };

    xhr.send(file);
  });
}

export async function presignAndUpload(
  kind: "pdf" | "audio",
  file: File,
  onProgress: (percent: number) => void
): Promise<{ key: string; contentType: string }> {
  const fallbackType =
    kind === "pdf" ? "application/pdf" : "audio/mpeg";
  const contentType = file.type || fallbackType;

  const { uploadUrl, key } = await apiFetch<{
    uploadUrl: string;
    key: string;
  }>("/api/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      kind,
      fileName: file.name,
      contentType,
      fileSizeBytes: file.size,
    }),
  });

  await uploadFileWithProgress(uploadUrl, file, contentType, onProgress);
  return { key, contentType };
}