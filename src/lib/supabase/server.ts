import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions y Route
 * Handlers. Lee y escribe la sesión en las cookies de la petición.
 *
 * Nota: si se llama desde un Server Component puro, `setAll` puede fallar
 * silenciosamente (no se pueden escribir cookies ahí). Eso está bien mientras
 * el proxy (src/proxy.ts) esté refrescando la sesión en cada petición.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: se puede ignorar porque
            // el proxy ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
