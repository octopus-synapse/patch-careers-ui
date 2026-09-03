/**
 * `uploadResumePdf` — POST a PDF to `/v1/resumes/imports/pdf`.
 *
 * Written by hand for the same reason the avatar uploader is: the endpoint
 * is `multipart/form-data` and the SDK generator emits JSON clients only.
 * It mirrors that uploader's shape so the auth and cookie rules stay in one
 * pattern rather than two.
 */
import { getApiClientRuntime } from "@patch-careers/api-client/client";
import { Platform } from "react-native";

export type PickedDocument = { uri: string; name: string; mimeType: string };

export async function uploadResumePdf(file: PickedDocument): Promise<{ resumeId: string }> {
  const runtime = getApiClientRuntime();
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    form.append("file", blob, file.name);
  } else {
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }

  const headers: Record<string, string> = { ...runtime.defaultHeaders, Accept: "application/json" };
  if (runtime.isNative) headers["Accept-Mode"] = "tokens";
  const auth = runtime.getAuthHeader ? await runtime.getAuthHeader() : null;
  if (auth) headers.Authorization = auth;

  const res = await fetch(`${runtime.baseURL}/api/v1/resumes/imports/pdf`, {
    method: "POST",
    headers,
    body: form,
    ...(runtime.useCookies ? { credentials: "include" as const } : {}),
  });
  if (!res.ok) throw new Error(`Resume PDF import failed (${res.status})`);
  return (await res.json()) as { resumeId: string };
}
