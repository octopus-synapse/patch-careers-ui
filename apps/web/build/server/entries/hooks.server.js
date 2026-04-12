const handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  if (response.headers.get("content-type")?.includes("text/html")) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
};
export {
  handle
};
