type MatchResponse = { scores: { jobId: string; overallScore: number }[] };
type Pending = {
  id: string;
  resolve: (score: number | null) => void;
  reject: (reason: unknown) => void;
};

/** Coalesce pair queries into the API's maximum of twenty jobs per request. */
export function createMatchBatcher(
  fetch: (resumeId: string, ids: string[]) => Promise<MatchResponse>,
) {
  const queues = new Map<string, Pending[]>();
  return (resumeId: string, id: string): Promise<number | null> =>
    new Promise((resolve, reject) => {
      const queued = queues.get(resumeId);
      if (queued) {
        queued.push({ id, resolve, reject });
        return;
      }
      queues.set(resumeId, [{ id, resolve, reject }]);
      queueMicrotask(() => {
        const pending = queues.get(resumeId) ?? [];
        queues.delete(resumeId);
        const ids = [...new Set(pending.map((item) => item.id))];
        for (let offset = 0; offset < ids.length; offset += 20) {
          const chunk = ids.slice(offset, offset + 20);
          const listeners = pending.filter((item) => chunk.includes(item.id));
          void fetch(resumeId, chunk).then(
            ({ scores }) => {
              const byId = new Map(
                scores
                  .filter((item) => Number.isFinite(item.overallScore))
                  .map((item) => [item.jobId, item.overallScore]),
              );
              for (const item of listeners) item.resolve(byId.get(item.id) ?? null);
            },
            (reason) => {
              for (const item of listeners) item.reject(reason);
            },
          );
        }
      });
    });
}
