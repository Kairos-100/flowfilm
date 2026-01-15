export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export async function listDriveFolders(accessToken: string) {
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    pageSize: '100',
    fields: 'files(id,name,parents,modifiedTime)',
    orderBy: 'name',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Drive folders');
  }
  
  const data = await response.json();
  return data.files || [];
}

export async function listDriveFiles(accessToken: string, folderIds?: string[]) {
  let query = "trashed=false";
  
  if (folderIds && folderIds.length > 0) {
    const folderQuery = folderIds.map(id => `'${id}' in parents`).join(' or ');
    query = `(${folderQuery}) and ${query}`;
  }

  const params = new URLSearchParams({
    q: query,
    pageSize: '100',
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,parents)',
    orderBy: 'modifiedTime desc',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Drive files');
  }
  
  const data = await response.json();
  return data.files || [];
}

export async function uploadDriveFile(accessToken: string, file: File, folderId?: string) {
  const metadata = {
    name: file.name,
    ...(folderId && { parents: [folderId] }),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload file to Drive');
  }
  
  return await response.json();
}

export async function downloadDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to download file from Drive');
  }
  
  return await response.blob();
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete file from Drive');
  }
}

