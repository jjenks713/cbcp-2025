const { LOCALE } = require('./contentfulAdmin');

/** Strip Contentful's per-locale wrapper + Link/Array shapes into flat JS values the frontend can render/edit directly. */
function unwrapFields(rawFields, fieldDefs) {
  const out = {};
  for (const def of fieldDefs) {
    const raw = rawFields?.[def.id]?.[LOCALE];
    if (raw == null) {
      out[def.id] = def.type === 'Array' ? [] : null;
      continue;
    }
    if (def.type === 'Link') {
      out[def.id] = raw.sys?.id ?? null;
    } else if (def.type === 'Array' && def.items?.type === 'Link') {
      out[def.id] = Array.isArray(raw) ? raw.map((link) => link?.sys?.id).filter(Boolean) : [];
    } else {
      out[def.id] = raw;
    }
  }
  return out;
}

/**
 * Reverse of unwrapFields - flat JS values from the admin form back into
 * Contentful's per-locale Link/Array shapes. An emptied value (blank
 * string, no link, empty list) comes back as null, meaning "remove this
 * field" - see applyFields.
 */
function wrapFields(flatFields, fieldDefs) {
  const out = {};
  for (const def of fieldDefs) {
    if (!(def.id in flatFields)) continue;
    const value = flatFields[def.id];

    if (def.type === 'Boolean') {
      out[def.id] = { [LOCALE]: Boolean(value) };
    } else if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      out[def.id] = null;
    } else if (def.type === 'Link') {
      out[def.id] = { [LOCALE]: { sys: { type: 'Link', linkType: def.linkType, id: value } } };
    } else if (def.type === 'Array' && def.items?.type === 'Link') {
      out[def.id] = {
        [LOCALE]: value.filter(Boolean).map((id) => ({ sys: { type: 'Link', linkType: def.items.linkType, id } })),
      };
    } else if (def.type === 'Integer' || def.type === 'Number') {
      out[def.id] = { [LOCALE]: Number(value) };
    } else {
      out[def.id] = { [LOCALE]: value };
    }
  }
  return out;
}

/** Merge wrapped fields onto an entry's existing fields, dropping the ones wrapFields marked as cleared. */
function applyFields(existingFields, wrappedFields) {
  const merged = { ...existingFields, ...wrappedFields };
  for (const key of Object.keys(merged)) {
    if (merged[key] === null) delete merged[key];
  }
  return merged;
}

/** A field's regexp validation, if any, so the form can check it before submitting. */
function normalizePattern(validations) {
  const v = validations?.find((x) => x.regexp);
  return v ? { pattern: v.regexp.pattern, flags: v.regexp.flags || undefined, message: v.message } : undefined;
}

/** A field's range validation (numbers), if any - e.g. price/stock can't go below 0. */
function normalizeRange(validations) {
  const v = validations?.find((x) => x.range);
  return v ? { min: v.range.min, max: v.range.max, message: v.message } : undefined;
}

/** Content type schema trimmed to what the admin UI needs to render a form/table. */
function normalizeContentType(ct) {
  return {
    id: ct.sys.id,
    name: ct.name,
    displayField: ct.displayField,
    fields: ct.fields
      .filter((f) => !f.omitted)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        required: Boolean(f.required),
        linkType: f.linkType,
        linkContentTypes: f.validations?.find((v) => v.linkContentType)?.linkContentType,
        pattern: normalizePattern(f.validations),
        range: normalizeRange(f.validations),
        items: f.items
          ? {
              type: f.items.type,
              linkType: f.items.linkType,
              linkContentTypes: f.items.validations?.find((v) => v.linkContentType)?.linkContentType,
            }
          : undefined,
      })),
  };
}

module.exports = { unwrapFields, wrapFields, applyFields, normalizeContentType };
