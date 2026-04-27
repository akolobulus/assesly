
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function wixImageToUrl(
  wixImage: string,
  width: number = 422,
  height: number = 229
): string {
  if (!wixImage || !wixImage.startsWith('wix:image://')) {
    return wixImage;
  }

  try {
    const uriPart = wixImage.substring('wix:image://v1/'.length);
    const parts = uriPart.split('/');
    
    const hash = parts[0];
    if (!hash) return wixImage;

    const rawFilenameWithParams = parts.slice(1).join('/');
    const rawFilename = rawFilenameWithParams.split('#')[0];
    
    // Multiple decodes to handle cases where the filename might be double-encoded
    let decodedFilename = rawFilename;
    try {
      while (decodedFilename.includes('%')) {
        let prevDecoded = decodedFilename;
        decodedFilename = decodeURIComponent(decodedFilename);
        if (decodedFilename === prevDecoded) break; // Avoid infinite loops
      }
    } catch (e) {
      console.warn("Could not fully decode filename, proceeding with partially decoded string:", decodedFilename);
    }
    
    // Re-encode the fully decoded filename to make it URL-safe
    const encodedFilename = encodeURIComponent(decodedFilename);

    return `https://static.wixstatic.com/media/${hash}/v1/fill/w_${width},h_${height},al_c,q_80,usm_0.66_1.00_0.01,enc_auto/${encodedFilename}`;
  } catch (error) {
    console.error("Failed to parse Wix image URL:", wixImage, error);
    return wixImage; // Return original on error
  }
}
