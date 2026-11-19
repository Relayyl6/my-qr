// Mask password / sensitive field values in rrweb event data or telemetry payloads
export function maskSensitiveFields(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveFields);

  const obj = data as Record<string, unknown>;
  const masked: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    // Check if input element type or name indicates a password
    if (
      key === 'value' &&
      typeof val === 'string' &&
      (obj['type'] === 'password' || obj['name'] === 'password')
    ) {
      masked[key] = '••••••••';
    } else if (
      key === 'attributes' &&
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val)
    ) {
      const attrs = val as Record<string, unknown>;
      if (attrs['type'] === 'password' || attrs['name'] === 'password') {
        masked[key] = { ...attrs, value: '••••••••' };
      } else {
        masked[key] = maskSensitiveFields(val);
      }
    } else {
      masked[key] = maskSensitiveFields(val);
    }
  }

  return masked;
}
