// Request-scoped batching for GraphQL resolve-fields.
//
// A resolve-field runs once per parent, so a list of N parents costs N queries:
// a 20-row plan with two products each was 1 + 20 (`products` per row) + 40
// (`product` per row product). A loader collects the keys every sibling field
// asks for during the same tick, runs ONE query for the whole batch, and hands
// each caller its own slice.
//
// Written here rather than installed (`dataloader`) because it is forty lines
// with no dependency, and because the batching decision — WHEN a batch closes —
// is the only subtle part and is better read than trusted. The scheduling below
// is the same one that package uses.
//
// A loader caches, so it MUST NOT outlive one request. It therefore lives on the
// GraphQL context object (see getRequestLoader), never on a resolver: Nest
// resolvers are singletons and a loader held there would serve stale rows to
// every later request.

export interface BatchLoader<K, V> {
    // Resolves once the batch this key joined has run. Repeated keys within a
    // request share one promise, so the same product asked for by ten rows is
    // fetched — and stored — once.
    load(key: K): Promise<V | undefined>;
}

// Given every key collected for one batch, return a map from key to value.
// Missing keys are legitimate (a soft-deleted product, a row with none) and
// surface as `undefined` to that caller only.
type BatchFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

export function createBatchLoader<K, V>(
    batchFn: BatchFn<K, V>,
): BatchLoader<K, V> {
    const cache = new Map<K, Promise<V | undefined>>();
    let queue: K[] = [];
    let scheduled: Promise<Map<K, V>> | null = null;

    const schedule = (): Promise<Map<K, V>> => {
        if (!scheduled) {
            scheduled = new Promise<Map<K, V>>((resolve, reject) => {
                // Two hops, deliberately. The microtask lets the sibling
                // resolvers that graphql-js starts in the same stack enqueue
                // their keys; Node then drains its nextTick queue only once the
                // microtask queue is empty, so a field resolved from ANOTHER
                // promise's continuation (the second level down — `product`
                // inside each row's `products`) still lands in this batch.
                void Promise.resolve().then(() => {
                    process.nextTick(() => {
                        const keys = queue;
                        queue = [];
                        scheduled = null;
                        batchFn(keys).then(resolve, reject);
                    });
                });
            });
        }
        return scheduled;
    };

    return {
        load(key: K): Promise<V | undefined> {
            const cached = cache.get(key);
            if (cached) return cached;

            queue.push(key);
            const result = schedule().then((values) => values.get(key));
            cache.set(key, result);
            return result;
        },
    };
}

// The GraphQL context object, as this app builds it (`{ req }` for both HTTP and
// websocket operations). Loaders are attached lazily under `loaders`.
export interface LoaderContext {
    loaders?: Map<string, unknown>;
}

// The one legitimate place to build a loader: lazily, on the request's context,
// under a name unique to what it loads. `create` runs at most once per request.
export function getRequestLoader<K, V>(
    context: LoaderContext,
    name: string,
    create: () => BatchLoader<K, V>,
): BatchLoader<K, V> {
    if (!context.loaders) {
        context.loaders = new Map<string, unknown>();
    }
    const existing = context.loaders.get(name);
    if (existing) return existing as BatchLoader<K, V>;

    const loader = create();
    context.loaders.set(name, loader);
    return loader;
}

// Fold a flat result set into the map a batch function must return: one entry
// per requested key, empty list included, so a parent with no children resolves
// to [] instead of undefined.
export function groupByKey<K, T>(
    keys: K[],
    items: T[],
    keyOf: (item: T) => K | null | undefined,
): Map<K, T[]> {
    const grouped = new Map<K, T[]>();
    keys.forEach((key) => grouped.set(key, []));
    items.forEach((item) => {
        const key = keyOf(item);
        if (key === null || key === undefined) return;
        const group = grouped.get(key);
        if (group) group.push(item);
    });
    return grouped;
}
