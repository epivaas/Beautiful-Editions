const DEFAULT_PAGE_SIZE = 1000;

interface PagedQuery<T> {
  range(from: number, to: number): PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>;
}

export async function fetchAllRows<T>(
  createQuery: () => PagedQuery<T>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await createQuery().range(offset, offset + pageSize - 1);

    if (error) {
      return { data: rows, error };
    }

    const page = data || [];
    rows.push(...page);

    if (page.length < pageSize) {
      return { data: rows, error: null };
    }

    offset += page.length;
  }
}

export async function fetchAllRowsInChunks<T, I>(
  ids: I[],
  createQuery: (chunk: I[]) => PagedQuery<T>,
  chunkSize = 500
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const result = await fetchAllRows(() => createQuery(chunk));

    if (result.error) {
      return { data: rows, error: result.error };
    }

    rows.push(...result.data);
  }

  return { data: rows, error: null };
}
