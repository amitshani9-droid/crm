// src/airtable.js
// Utility to fetch data from Airtable using the official SDK
import Airtable from 'airtable';

const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appYYOLggK34YEZsM';
const TABLE_NAME = 'Table 1'; // Strictly set to Table 1 to match Airtable setup

if (AIRTABLE_PAT) {
  base = new Airtable({ apiKey: AIRTABLE_PAT }).base(BASE_ID);
}

/**
 * Sanitizes fields before sending to Airtable.
 * Removes empty strings, nulls, and undefined values to prevent 422 errors.
 */
function sanitizeFields(fields) {
  const sanitized = {};
  
  // Basic Fields
  if (fields.Name) sanitized.Name = String(fields.Name);
  if (fields.Status) sanitized.Status = String(fields.Status);
  
  // Optional Fields - only add if they have a real value
  const optionalKeys = [
    'Company', 
    'Phone', 
    'Email', 
    'Event Type', 
    'Event Date', 
    'Notes'
  ];

  optionalKeys.forEach(key => {
    if (fields[key] !== undefined && fields[key] !== null && String(fields[key]).trim() !== '') {
      sanitized[key] = fields[key];
    }
  });

  // Attachments - only if array and non-empty
  if (fields.Attachments && Array.isArray(fields.Attachments) && fields.Attachments.length > 0) {
    sanitized.Attachments = fields.Attachments;
  }

  return sanitized;
}

export async function fetchAirtableRecords() {
  if (!base) {
    console.warn("Airtable PAT missing. Make sure VITE_AIRTABLE_PAT is set in your .env file. Returning dummy data for preview.");
    return [
      { id: '1', Status: 'פניות חדשות', Name: 'דני כהן', Phone: '0541234567', Email: 'dani@example.com', 'Event Type': 'חתונת שישי', 'Event Date': '2026-05-15', Notes: 'פניה מהאתר, מחפש מקום פתוח' },
      { id: '2', Status: 'פניות חדשות', Name: 'מיכל לוי', Phone: '0529876543', Email: 'michal@example.com', 'Event Type': 'בר מצווה' },
      { id: '3', Status: 'בטיפול', Name: 'רועי ונועה', Phone: '0501112233', Email: 'rn@example.com', 'Event Type': 'חתונה', Notes: 'פגישת טעימות בשבוע הבא' },
      { id: '4', Status: 'סגור', Name: 'משפחת ישראלי', Phone: '0534445566', Email: 'israeli@example.com', 'Event Type': 'בת מצווה', Notes: 'לוודא הגעת ספקים ב-16:00' }
    ];
  }

  try {
    const records = await base(TABLE_NAME).select().all();
    return records.map(record => {
      // CRITICAL FIX: Prioritize Airtable's internal record.id for all updates to prevent 422 errors.
      // We store it as 'id' so components can pass it back to updateAirtableRecord.
      const recordId = record.id;
      
      // Hebrew Date Parsing
      let parsedDate = record.fields['Event Date'];
      if (parsedDate) {
        const d = new Date(parsedDate);
        if (!isNaN(d.getTime())) {
          // Format as DD/MM/YYYY
          parsedDate = d.toLocaleDateString('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }

      return {
        id: recordId,
        ...record.fields,
        Company: record.fields.Company || '',
        ['Event Date']: parsedDate, // Override with parsed date
        _rawDate: record.fields['Event Date'], // Keep raw for sorting/math if needed
        Attachments: record.fields.Attachments || [] // Ensure it's an array
      };
    });
  } catch (error) {
    console.error("Error fetching Airtable records:", error);
    return [];
  }
}

export async function updateAirtableRecord(recordId, fields) {
  if (!base) {
    console.warn("Using dummy data, skipping Airtable SDK update hook.");
    return true; // Simulate success
  }

  try {
    await base(TABLE_NAME).update([
      {
        id: recordId,
        fields: fields
      }
    ]);
    return true;
  } catch (error) {
    console.error("Error updating Airtable record:", error);
    return false;
  }
}

export async function uploadFileToRecord(recordId, file, existingAttachments = []) {
  if (!base) {
    console.warn("Using dummy data, skipping Airtable SDK upload hook.");
    return null;
  }

  try {
    // 1. Upload to permanent hosting (Cloudinary) to get a secure public URL
    const formData = new FormData();
    formData.append('file', file);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dahpqxpbb';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    formData.append('upload_preset', uploadPreset); 
    
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    
    const uploadData = await uploadRes.json();
    
    if (!uploadData.secure_url) {
      throw new Error(`Failed to upload to Cloudinary: ${uploadData.error?.message || 'Unknown error'}`);
    }

    const publicUrl = uploadData.secure_url;

    // 2. Append to Airtable Attachments payload
    const newAttachment = {
      url: publicUrl,
      filename: file.name
    };

    const updatedAttachments = [...existingAttachments, newAttachment];

    // 3. Update Airtable record natively with the public URL
    await base(TABLE_NAME).update([
      {
        id: recordId,
        fields: {
          Attachments: updatedAttachments
        }
      }
    ]);

    return newAttachment;
  } catch (error) {
    console.error("Error uploading file to Cloudinary/Airtable:", error);
    return null;
  }
}

/**
 * Bulk imports records into Airtable, handling mapping and deduplication.
 * @param {Array} records - Array of cleaned record objects ready for Airtable.
 * @returns {Object} { success: boolean, count: number }
 */
export async function importRecordsBatch(records) {
  if (!base) {
    console.warn("Using dummy data, skipping Airtable bulk import.");
    return { success: true, count: records.length };
  }

  try {
    // 1. Fetch current records for Deduplication check (Phone number)
    const existingRecords = await fetchAirtableRecords();
    const existingPhoneMap = new Map(existingRecords.map(r => [r.Phone, r.id]));

    // 2. Separate into "To Create" and "To Update"
    const toCreate = [];
    const toUpdate = [];

    records.forEach(rec => {
      const existingId = existingPhoneMap.get(rec.Phone);
      const sanitized = sanitizeFields(rec);
      
      if (existingId) {
        toUpdate.push({
          id: existingId,
          fields: sanitized
        });
      } else {
        toCreate.push({
          fields: sanitized
        });
      }
    });

    // 3. Process Batch Creations (API limit: 10 per request)
    const createPromises = [];
    for (let i = 0; i < toCreate.length; i += 10) {
      const chunk = toCreate.slice(i, i + 10);
      createPromises.push(base(TABLE_NAME).create(chunk));
    }

    // 4. Process Batch Updates (API limit: 10 per request)
    const updatePromises = [];
    for (let i = 0; i < toUpdate.length; i += 10) {
      const chunk = toUpdate.slice(i, i + 10);
      updatePromises.push(base(TABLE_NAME).update(chunk));
    }

    // 5. Fire all requests
    await Promise.all([...createPromises, ...updatePromises]);

    return { success: true, count: records.length };
  } catch (err) {
    console.error("=== BULK IMPORT ERROR ===");
    console.error("Message:", err.message);
    if (err.error) console.error("Airtable Error Code:", err.error);
    if (err.statusCode) console.error("Status Code:", err.statusCode);
    return { success: false, count: 0, error: err.message };
  }
}

export async function createAirtableRecord(fields) {
  if (!base) {
    console.warn("Using dummy data, skipping Airtable SDK create hook.");
    return true; // Simulate success
  }

  try {
    // Clean and strictly format the payload for Airtable
    const sanitizedPayload = sanitizeFields(fields);

    // DEBUG: Show exactly what is being sent to Airtable
    console.log("=== AIRTABLE PAYLOAD ===", sanitizedPayload);
    
    await base(TABLE_NAME).create([
      {
        fields: sanitizedPayload
      }
    ]);
    return true;
  } catch (error) {
    console.error("Error creating Airtable record:", error);
    return false;
  }
}

export async function deleteAirtableRecord(recordId) {
  if (!base) {
    console.warn("Using dummy data, skipping Airtable SDK delete hook.");
    return true; // Simulate success
  }

  try {
    await base(TABLE_NAME).destroy(recordId);
    return true;
  } catch (error) {
    console.error("Error deleting Airtable record:", error);
    return false;
  }
}


