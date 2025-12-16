/**
 * 이미지 처리 유틸리티
 * - 모바일 사진 압축
 * - 리사이즈
 * - 업로드 진행률
 */

// 이미지 압축
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 비율 유지하며 리사이즈
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('이미지 압축 실패'));
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

// 다중 이미지 압축
export async function compressImages(files, options = {}, onProgress = null) {
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    try {
      const compressed = await compressImage(files[i], options);
      results.push({ success: true, file: compressed, original: files[i] });
    } catch (error) {
      results.push({ success: false, error: error.message, original: files[i] });
    }

    if (onProgress) {
      onProgress((i + 1) / total * 100, i + 1, total);
    }
  }

  return results;
}

// 파일 업로드 with 진행률
export async function uploadWithProgress(url, file, options = {}) {
  const { headers = {}, onProgress = null, method = 'POST' } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = (e.loaded / e.total) * 100;
        onProgress(percentage, e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`업로드 실패: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('네트워크 오류')));
    xhr.addEventListener('abort', () => reject(new Error('업로드 취소됨')));

    xhr.open(method, url);
    
    // 헤더 설정
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 인증 토큰 추가
    const authData = localStorage.getItem('cams-auth');
    if (authData) {
      const { token } = JSON.parse(authData);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }

    xhr.send(formData);
  });
}

// 다중 파일 업로드 with 진행률
export async function uploadMultipleWithProgress(url, files, options = {}) {
  const { onFileProgress = null, onTotalProgress = null, retryCount = 2 } = options;
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    let success = false;
    let lastError = null;

    for (let retry = 0; retry <= retryCount && !success; retry++) {
      try {
        const result = await uploadWithProgress(url, files[i], {
          ...options,
          onProgress: (percentage, loaded, fileTotal) => {
            if (onFileProgress) {
              onFileProgress(i, percentage, loaded, fileTotal);
            }
          }
        });
        results.push({ success: true, result, file: files[i] });
        success = true;
      } catch (error) {
        lastError = error;
        if (retry < retryCount) {
          await new Promise(r => setTimeout(r, 1000 * (retry + 1))); // 지수 백오프
        }
      }
    }

    if (!success) {
      results.push({ success: false, error: lastError?.message, file: files[i] });
    }

    if (onTotalProgress) {
      onTotalProgress((i + 1) / total * 100, i + 1, total);
    }
  }

  return results;
}

// 이미지 미리보기 URL 생성
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

// 미리보기 URL 해제
export function revokePreviewUrl(url) {
  URL.revokeObjectURL(url);
}

// 파일 크기 포맷
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이미지 파일 검증
export function validateImageFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  const errors = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push(`지원하지 않는 파일 형식입니다. (${allowedTypes.join(', ')})`);
  }

  if (file.size > maxSize) {
    errors.push(`파일 크기가 너무 큽니다. (최대 ${formatFileSize(maxSize)})`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  compressImage,
  compressImages,
  uploadWithProgress,
  uploadMultipleWithProgress,
  createPreviewUrl,
  revokePreviewUrl,
  formatFileSize,
  validateImageFile
};
