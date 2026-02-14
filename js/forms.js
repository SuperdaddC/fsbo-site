// Supabase config
const SUPABASE_URL = 'https://apuctuqlmykeemtcasji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdWN0dXFsbXlrZWVtdGNhc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODY5NjMsImV4cCI6MjA3NTM2Mjk2M30.Kyjei2lczrVkFJkOzI8ViLEc-qiOBPrv5TtT6G33MHU';

// Notify server-side webhook when new lead comes in
async function notifyLead(leadType, data) {
  const name = `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim() || 'Unknown';
  const email = data.email || 'no email';
  const phone = data.phone || 'no phone';
  const property = data.propertyAddress || data.property_address || data.address || '';
  try {
    await fetch('https://ip-172-31-2-122.tail991214.ts.net/fsbo-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_type: leadType, name, email, phone, property })
    });
  } catch(e) { /* silent fail */ }
}

// Bot protection: check honeypot + basic validation
function isBot(form) {
  const hp = form.querySelector('input[name="company_url"]');
  return hp && hp.value.length > 0;
}

function validateLead(data) {
  const email = (data.email || '').trim();
  const phone = (data.phone || '').replace(/\D/g, '');
  const firstName = (data.firstName || data.first_name || '').trim();
  const lastName = (data.lastName || data.last_name || '').trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return false;
  }
  if (phone && (phone.length < 10 || phone.length > 11)) {
    alert('Please enter a valid phone number.');
    return false;
  }
  if (firstName && firstName.length < 2) {
    alert('Please enter your full first name.');
    return false;
  }
  if (lastName && lastName.length < 2) {
    alert('Please enter your full last name.');
    return false;
  }
  return true;
}

async function submitToSupabase(leadType, data) {
  const payload = {
    source: 'fsbo-site',
    lead_type: leadType,
    first_name: data.firstName || data.first_name || null,
    last_name: data.lastName || data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    property_address: data.propertyAddress || data.property_address || data.address || null,
    purchase_price: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
    down_payment_pct: data.downPayment ? parseFloat(data.downPayment) : null,
    home_value_estimate: data.homeValue ? parseFloat(data.homeValue) : null,
    employment_status: data.employment || null,
    annual_income_range: data.income || data.incomeRange || null,
    loan_type_interest: data.loanType || null,
    military_veteran: data.veteran === 'yes' || data.veteran === true || false,
    listing_tier: data.listingTier || null,
    message: data.message || data.comments || null,
    status: 'new'
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error('Supabase submit error:', err);
    return false;
  }
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  if(toggle && nav){
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if(!e.target.closest('.header')) nav.classList.remove('open');
    });
  }

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }, {threshold: 0.1});
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});

// Contact form
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if (isBot(form)) { form.style.display='none'; form.parentElement.querySelector('.form-success').style.display='block'; return; }
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!validateLead(data)) return;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    const ok = await submitToSupabase('contact', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
      notifyLead('contact', data);
    } else {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      alert('Something went wrong — please try again or call us directly.');
    }
  });
})();

// Pre-qual form (buyers)
(function(){
  const form = document.getElementById('prequalForm');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if (isBot(form)) { form.style.display='none'; form.parentElement.querySelector('.form-success').style.display='block'; return; }
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!validateLead(data)) return;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    const ok = await submitToSupabase('buyer', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
      notifyLead('buyer', data);
    } else {
      btn.disabled = false;
      btn.textContent = 'Get Pre-Qualified';
      alert('Something went wrong — please try again or call us directly.');
    }
  });
})();

// Seller consultation form
(function(){
  const form = document.getElementById('sellerForm');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if (isBot(form)) { form.style.display='none'; form.parentElement.querySelector('.form-success').style.display='block'; return; }
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!validateLead(data)) return;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    const ok = await submitToSupabase('seller', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
      notifyLead('seller', data);
    } else {
      btn.disabled = false;
      btn.textContent = 'Request Consultation';
      alert('Something went wrong — please try again or call us directly.');
    }
  });
})();
