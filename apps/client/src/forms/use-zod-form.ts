/**
 * useForm preset wiring React Hook Form to a Zod schema (ADR-0005).
 *
 * Validates on touch and resolves errors from the schema, so a form's source
 * of truth is its Zod schema (often a Kubb-generated one) rather than ad-hoc
 * field checks. Constrained to object schemas (the shape every form has) so
 * @hookform/resolvers' zod overload resolves; `z.input`/`z.output` are threaded
 * so schemas with coercion or transforms keep their typed parsed result.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export function useZodForm<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, "resolver">,
) {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    mode: "onTouched",
    ...options,
    resolver: zodResolver(schema),
  });
}
