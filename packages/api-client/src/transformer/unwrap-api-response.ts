import { defineTransformer } from 'orval';

export default defineTransformer((spec) => {
  const apiResponseRef = '#/components/schemas/ApiResponseDto';

  if (spec.paths) {
    for (const pathItem of Object.values(spec.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const operation of Object.values(pathItem as Record<string, unknown>)) {
        if (!operation || typeof operation !== 'object') continue;
        const op = operation as Record<string, unknown>;
        const responses = op.responses as Record<string, unknown> | undefined;
        if (!responses) continue;

        const codes = Object.keys(responses);
        const has2xx = codes.some((c) => c.startsWith('2'));

        // Only strip non-2xx if there is at least one 2xx response
        if (has2xx) {
          for (const code of codes) {
            if (!code.startsWith('2')) {
              delete responses[code];
            }
          }
        }

        for (const response of Object.values(responses)) {
          if (!response || typeof response !== 'object') continue;
          const resp = response as Record<string, unknown>;
          const content = resp.content as Record<string, unknown> | undefined;
          if (!content) continue;

          const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
          if (!jsonContent?.schema) continue;

          const schema = jsonContent.schema as Record<string, unknown>;
          const unwrapped = unwrapApiResponseSchema(schema, apiResponseRef);
          if (unwrapped) {
            jsonContent.schema = unwrapped;
          }
        }
      }
    }
  }

  if (spec.components?.schemas) {
    const schemas = spec.components.schemas as Record<string, unknown>;
    delete schemas.ApiResponseDto;
  }

  return spec;
});

function unwrapApiResponseSchema(
  schema: Record<string, unknown>,
  apiResponseRef: string,
): Record<string, unknown> | null {
  const allOf = schema.allOf as Record<string, unknown>[] | undefined;
  if (!allOf || allOf.length !== 2) return null;

  const first = allOf[0];
  if (!first || (first as Record<string, unknown>).$ref !== apiResponseRef) return null;

  const second = allOf[1] as Record<string, unknown>;
  const properties = second?.properties as Record<string, unknown> | undefined;
  if (!properties?.data) return null;

  return properties.data as Record<string, unknown>;
}
