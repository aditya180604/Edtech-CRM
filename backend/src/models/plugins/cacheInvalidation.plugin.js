import { invalidate } from '../../utils/cache.js';

/**
 * Invalidate public read caches whenever documents of a schema change.
 * Covers document saves, query updates/deletes, insertMany and bulkWrite, which are
 * the only write paths the services use for these models.
 */
const QUERY_WRITE_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
];

function writeChangedSomething(res) {
  if (res == null) return false; // findOneAnd* matched nothing
  if (typeof res.modifiedCount === 'number' || typeof res.upsertedCount === 'number') {
    return (res.modifiedCount || 0) + (res.upsertedCount || 0) > 0;
  }
  if (typeof res.deletedCount === 'number') return res.deletedCount > 0;
  return true;
}

function updateTouches(update, fields) {
  if (!update) return true;
  const paths = [];
  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith('$') && value && typeof value === 'object') paths.push(...Object.keys(value));
    else paths.push(key);
  }
  return paths.some((p) => fields.includes(p.split('.')[0]));
}

/**
 * @param {string[]} namespaces cache namespaces to clear
 * @param {{ relevantFields?: string[] }} options only invalidate when one of these fields
 *   changes (or on create/delete). Used for high-write models such as User, where most
 *   writes (token rotation, last login) do not affect public data.
 */
export function cacheInvalidationPlugin(namespaces, { relevantFields } = {}) {
  return (schema) => {
    const fire = () => invalidate(namespaces);

    if (relevantFields) {
      schema.pre('save', function (next) {
        this.$locals.cacheRelevant = this.isNew || relevantFields.some((f) => this.isModified(f));
        next();
      });
      schema.pre(QUERY_WRITE_OPS, { document: false, query: true }, function (next) {
        const op = this.op || '';
        this._cacheRelevant = /delete/i.test(op) ? true : updateTouches(this.getUpdate(), relevantFields);
        next();
      });
    }

    schema.post('save', function () {
      if (!relevantFields || this.$locals.cacheRelevant) fire();
    });

    schema.post(QUERY_WRITE_OPS, { document: false, query: true }, function (res) {
      if (relevantFields && this._cacheRelevant === false) return;
      if (writeChangedSomething(res)) fire();
    });

    schema.post(['deleteOne', 'updateOne'], { document: true, query: false }, fire);
    schema.post('insertMany', fire);
    schema.post('bulkWrite', fire);
  };
}
