// src/airtable.js
// Utility to fetch data from Airtable via our serverless proxy

/**
 * Robustly sanitizes phone numbers for Israeli local 10-digit format.
 */
export function sanitizePhone(phone) {
  if (!phone) return '';
  let str = String(phone).split('.')[0];
  let digits = str.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) {
    digits = '0' + digits.substring(3);
  } else if (digits.startsWith('5')) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Validates an Israeli phone number.
 */
export function isValidIsraeliPhone(phone) {
  if (!phone) return false;
  const sanitized = sanitizePhone(phone);
  // Israeli mobile: 05X + 7 digits. Landlines: 02/03/04/08/09 + 7 digits.
  return /^0(5[0-9]|[2-4]|[8-9])\d{7}$/.test(sanitized);
}

/**
 * Sanitizes fields before sending to the proxy.
 */
function sanitizeFields(fields) {
  const sanitized = {};
  if (fields.Name) sanitized.Name = String(fields.Name);
  if (fields.Status) sanitized.Status = String(fields.Status).trim();
  if (fields.Phone) sanitized.Phone = sanitizePhone(fields.Phone);
  
  const optionalKeys = ['Company', 'Email', 'Event Type', 'Event Date', 'Notes', 'Budget', 'Participants', 'Priority'];
  optionalKeys.forEach(key => {
    if (fields[key] !== undefined && fields[key] !== null && String(fields[key]).trim() !== '') {
      sanitized[key] = fields[key];
    }
  });

  if (fields.Attachments !== undefined && Array.isArray(fields.Attachments)) {
    sanitized.Attachments = fields.Attachments;
  }
  return sanitized;
}

export async function fetchAirtableRecords() {
  try {
    const response = await fetch('/api/airtable');
    if (!response.ok) throw new Error('Failed to fetch records');
    const records = await response.json();

    return records.map(record => {
      let parsedDate = record['Event Date'];
      if (parsedDate) {
        const d = new Date(parsedDate);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toLocaleDateString('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }

      return {
        ...record,
        Company: record.Company || '',
        ['Event Date']: parsedDate,
        _rawDate: record['Event Date'],
        Attachments: record.Attachments || []
      };
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    // Return dummy data in dev if proxy is not running
    if (import.meta.env.DEV) {
      console.warn("Proxy might not be running. Returning dummy data for development.");
      return [
        { id: '1', Status: 'פניות חדשות', Name: 'דני כהן', Phone: '0541234567', Email: 'dani@example.com', 'Event Type': 'חתונת שישי', 'Event Date': '15/05/2026', _rawDate: '2026-05-15', Notes: 'פניה מהאתר', Attachments: [] },
        { id: '2', Status: 'בטיפול', Name: 'מיכל לוי', Phone: '0529876543', Email: 'michal@example.com', 'Event Type': 'בר מצווה', _rawDate: null, Attachments: [] }
      ];
    }
    return [];
  }
}

export async function updateAirtableRecord(recordId, fields) {
  try {
    const sanitizedFields = sanitizeFields(fields);
    const response = await fetch('/api/airtable', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recordId, fields: sanitizedFields })
    });
    return response.ok;
  } catch (error) {
    console.error("Error updating record:", error);
    return false;
  }
}

export async function createAirtableRecord(fields) {
  try {
    const sanitizedPayload = sanitizeFields(fields);
    const response = await fetch('/api/airtable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: sanitizedPayload })
    });
    return response.ok;
  } catch (error) {
    console.error("Error creating record:", error);
    return false;
  }
}

export async function deleteAirtableRecord(recordId) {
  try {
    const response = await fetch(`/api/airtable?id=${encodeURIComponent(recordId)}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting record:", error);
    return false;
  }
}

export async function importRecordsBatch(records) {
  try {
    const cleanedRecords = records.map(r => ({ fields: sanitizeFields(r) }));
    const response = await fetch('/api/airtable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedRecords)
    });
    const data = await response.json();
    return { success: response.ok, count: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    console.error("Bulk import error:", err);
    return { success: false, count: 0, error: err.message };
  }
}

export async function uploadFileToRecord(recordId, file, existingAttachments = []) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); 
    
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    
    const uploadData = await uploadRes.json();
    if (!uploadData.secure_url) throw new Error('Cloudinary upload failed');

    const newAttachment = { url: uploadData.secure_url, filename: file.name };
    const success = await updateAirtableRecord(recordId, {
      Attachments: [...existingAttachments, newAttachment]
    });

    return success ? newAttachment : null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}


