const cloudinary = require('cloudinary').v2;

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 이미지를 Cloudinary에 업로드
 * @param {Buffer|string} file - 파일 버퍼 또는 base64 문자열
 * @param {Object} options - 업로드 옵션
 * @returns {Promise<Object>} - Cloudinary 응답
 */
const uploadImage = async (file, options = {}) => {
  const defaultOptions = {
    folder: 'cams-molds',
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    // Buffer인 경우 base64로 변환
    let uploadData = file;
    if (Buffer.isBuffer(file)) {
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`;
    }

    cloudinary.uploader.upload(uploadData, uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * 파일 경로에서 이미지 업로드
 * @param {string} filePath - 파일 경로
 * @param {Object} options - 업로드 옵션
 * @returns {Promise<Object>} - Cloudinary 응답
 */
const uploadImageFromPath = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'cams-molds',
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return cloudinary.uploader.upload(filePath, uploadOptions);
};

/**
 * Cloudinary에서 이미지 삭제
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} - Cloudinary 응답
 */
const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * URL에서 public_id 추출
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - public_id
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  
  // URL 형식: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadImageFromPath,
  deleteImage,
  getPublicIdFromUrl
};
