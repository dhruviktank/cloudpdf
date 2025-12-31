// S3 upload helpers: presign + upload with progress
const fileType = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

export async function getPresignedUrl(filename, sessionId) {
  try {
    const res = await fetch(`${API_BASE}/document/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({
        action: 'createDocument',
        filename,
        sessionId,
        contentType: fileType[filename.split('.').pop().toLowerCase()] || 'application/pdf',
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Presign URL failed (${res.status}): ${errorText}`);
    }

    const json = await res.json().catch(() => {
      throw new Error('Invalid JSON from presign API');
    });
    const { uploadUrl, documentId } = json;

    if (!uploadUrl || !documentId) {
      throw new Error('Presign API response missing uploadUrl or documentId');
    }

    return { uploadUrl, documentId };
  } catch (err) {
    console.error('getPresignedUrl error:', err);
    throw err; // rethrow for caller
  }
}
export function uploadToPresigned(url, data, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`S3 upload failed: ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(data);
    } catch (err) {
      reject(err);
    }
  });
}
export async function uploadBufferToS3(
  sessionId,
  data,
  filename,
  onProgress
) {
  try {
    const { uploadUrl, documentId } = await getPresignedUrl(
      filename,
      sessionId
    );

    await uploadToPresigned(uploadUrl, data, onProgress);

    return documentId;
  } catch (err) {
    console.error('uploadBufferToS3 error:', err);
    throw new Error(
      err.message || 'Failed to upload file to S3'
    );
  }
}
