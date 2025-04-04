import OSS from 'ali-oss';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { Multer } from 'multer';
import { generateShareCode } from '../utils/shareCode';

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

export const uploadToOSS = async (file: Multer.File, folder: string): Promise<string> => {
  try {
    const ext = file.originalname.split('.').pop();
    const filename = `${folder}/${generateShareCode()}.${ext}`;
    
    const result = await client.put(filename, file.buffer);
    return result.url;
  } catch (error) {
    console.error('上传文件到 OSS 失败:', error);
    throw new Error('上传文件失败');
  }
};

export const generateThumbnail = async (videoUrl: string): Promise<string> => {
  try {
    const filename = `thumbnails/${generateShareCode()}.jpg`;
    // TODO: 实现视频缩略图生成逻辑
    return filename;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    throw new Error('生成缩略图失败');
  }
};

export const uploadProductImage = async (file: Multer.File): Promise<string> => {
  try {
    return await uploadToOSS(file, 'products');
  } catch (error) {
    console.error('上传商品图片失败:', error);
    throw new Error('上传商品图片失败');
  }
};

export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  try {
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      throw new Error('无效的图片 URL');
    }
    await client.delete(`products/${filename}`);
  } catch (error) {
    console.error('删除商品图片失败:', error);
    throw new Error('删除商品图片失败');
  }
};

export const uploadVideo = async (file: Multer.File): Promise<string> => {
  try {
    return await uploadToOSS(file, 'videos');
  } catch (error) {
    console.error('上传视频失败:', error);
    throw new Error('上传视频失败');
  }
};

export const deleteVideo = async (videoUrl: string): Promise<void> => {
  try {
    const filename = videoUrl.split('/').pop();
    if (!filename) {
      throw new Error('无效的视频 URL');
    }
    await client.delete(`videos/${filename}`);
  } catch (error) {
    console.error('删除视频失败:', error);
    throw new Error('删除视频失败');
  }
}; 