/**
 * iPhones default to saving photos as HEIC — a format browsers cannot display in an
 * <img> tag. Uploads of HEIC files succeed silently (no error), but the image never
 * renders anywhere afterward. This converts HEIC/HEIF files to JPEG entirely
 * client-side before we ever upload them, so the person never has to think about
 * file formats.
 */
export async function ensureUploadableImage(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name);

  if (!isHeic) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = file.name.replace(/\.hei[cf]$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('HEIC conversion failed, uploading original file:', err);
    return file;
  }
}
