// After a lead is submitted to Supabase, ping our notification endpoint
async function notifyNewLead(leadType, data) {
  try {
    await fetch('https://ip-172-31-2-122.tail991214.ts.net/gmail-pubsub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'fsbo_lead',
        lead_type: leadType,
        name: `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
        email: data.email || '',
        phone: data.phone || '',
        property: data.propertyAddress || data.property_address || data.address || ''
      })
    });
  } catch(e) { /* silent fail - don't block the form */ }
}
