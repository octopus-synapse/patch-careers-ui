/**
 * Avatar upload. The generated fetcher JSON-stringifies every body, so it can't
 * send multipart/form-data; this posts a raw `fetch` to the upload endpoint
 * (multipart field name `file`, per the backend) reusing the api-client's
 * configured base URL + bearer header, then returns the public image URL.
 */
import { getApiClientRuntime } from "@patch-careers/api-client/client";
import { Platform } from "react-native";

export type PickedImage = { uri: string; name: string; type: string };

export async function uploadProfileImage(file: PickedImage): Promise<{ url: string; key: string }> {
  const runtime = getApiClientRuntime();
  const form = new FormData();
  if (Platform.OS === "web") {
    // Web: the picker yields a blob/data URL — materialize it into a Blob.
    const blob = await (await fetch(file.uri)).blob();
    form.append("file", blob, file.name);
  } else {
    // React Native: FormData accepts a { uri, name, type } file part.
    form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }

  const headers: Record<string, string> = { ...runtime.defaultHeaders, Accept: "application/json" };
  if (runtime.isNative) headers["Accept-Mode"] = "tokens";
  const auth = runtime.getAuthHeader ? await runtime.getAuthHeader() : null;
  if (auth) headers.Authorization = auth;

  const res = await fetch(`${runtime.baseURL}/api/v1/upload/profile-image`, {
    method: "POST",
    headers,
    body: form,
    ...(runtime.useCookies ? { credentials: "include" as const } : {}),
  });
  if (!res.ok) throw new Error(`Falha no upload da imagem (${res.status})`);
  return (await res.json()) as { url: string; key: string };
}
