import { createClient } from "@/lib/supabase/client";

/**
 * Sube una imagen a la carpeta del usuario dentro del bucket "app-images" y
 * devuelve su URL pública. La política de Storage exige que el primer
 * segmento de la ruta sea el user_id, por eso se antepone acá.
 */
export async function uploadHabitImage(userId: string, file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("app-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("app-images").getPublicUrl(path);
  return data.publicUrl;
}
