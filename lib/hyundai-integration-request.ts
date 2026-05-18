/** Standard wrapper for IntegrationWebsite POST bodies (per Postman). */
export function integrationRequestBody(
  fields: Record<string, unknown>
): Record<string, unknown> {
  return {
    requestDateTime: new Date().toISOString(),
    rowVersion: '',
    ...fields,
  };
}
