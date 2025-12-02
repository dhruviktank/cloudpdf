// S3 upload helpers: presign + upload with progress

export async function getPresignedUrl(apiBase, filename, sessionId) {
  const res = await fetch(`${apiBase}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'x-session-id': sessionId } : {})
    },
    body: JSON.stringify({ filename })
  })
  if (!res.ok) throw new Error('Presign URL failed')
  const { url, key } = await res.json()
  return { url, key }
}

export function uploadToPresigned(url, data, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    // Intentionally do not set Content-Type; browser will set it for File/Blob
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))

    const body = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' })
    xhr.send(body)
  })
}

export async function uploadBufferToS3(apiBase, sessionId, data, filename, onProgress) {
  const { url, key } = await getPresignedUrl(apiBase, filename, sessionId)
  await uploadToPresigned(url, data, onProgress)
  return key
}
