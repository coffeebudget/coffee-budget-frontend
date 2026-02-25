const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function exportAccountData(token: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/users/account/export`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to export account data');
  }

  return response.blob();
}

export async function deleteAccount(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/account`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete account');
  }
}
