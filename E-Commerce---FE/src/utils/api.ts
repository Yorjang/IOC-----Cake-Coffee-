export const parseRes = async (res: Response) => {
  if (res.status === 204) return null;
  const data = await res.json();
  if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
    return data.data !== undefined ? data.data : data;
  }
  return data;
};
