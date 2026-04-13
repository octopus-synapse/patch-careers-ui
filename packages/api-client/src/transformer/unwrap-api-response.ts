import { defineTransformer } from 'orval';

/**
 * Orval input transformer that strips the ApiResponseDto wrapper from
 * all endpoint response schemas.
 *
 * Before: allOf: [{ $ref: ApiResponseDto }, { properties: { data: <DTO> } }]
 * After:  <DTO> (the schema from the `data` property)
 *
 * Combined with the customFetch unwrapping of { success, data } at runtime,
 * this gives consumers clean types: query.data.connections instead of
 * query.data.data.data.connections.
 */
export default defineTransformer((spec) => {
  const apiResponseRef = '#/components/schemas/ApiResponseDto';

  // Walk all paths and response schemas
  if (spec.paths) {
    for (const pathItem of Object.values(spec.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const operation of Object.values(pathItem as Record<string, unknown>)) {
        if (!operation || typeof operation !== 'object') continue;
        const op = operation as Record<string, unknown>;
        const responses = op.responses as Record<string, unknown> | undefined;
        if (!responses) continue;

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

  // Remove ApiResponseDto from components since nothing references it anymore
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

  // Check if first element is $ref to ApiResponseDto
  const first = allOf[0];
  if (!first || (first as Record<string, unknown>).$ref !== apiResponseRef) return null;

  // Second element should have properties.data with the actual DTO schema
  const second = allOf[1] as Record<string, unknown>;
  const properties = second?.properties as Record<string, unknown> | undefined;
  if (!properties?.data) return null;

  // Return the data property schema directly — this is the actual DTO
  return properties.data as Record<string, unknown>;
}
