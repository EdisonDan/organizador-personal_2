import { createClient } from "@/lib/supabase/client";

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Sube un archivo a la carpeta del usuario dentro del bucket "app-images"
 * (el bucket sirve tanto imágenes como archivos adjuntos en general) y
 * devuelve su URL pública junto con metadatos básicos.
 */
export async function uploadFile(userId: string, file: File, folder: string): Promise<UploadedFile> {
  const supabase = createClient();
  const path = `${userId}/${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { error } = await supabase.storage.from("app-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("app-images").getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: file.type, size: file.size };
}
