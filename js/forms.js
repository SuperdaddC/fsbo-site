// Supabase config
const SUPABASE_URL = 'https://apuctuqlmykeemtcasji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdWN0dXFsbXlrZWVtdGNhc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTg4MjgsImV4cCI6MjA1NDc3NDgyOH0.eRPiFMRJbWdomVqAqAvn8cQzWBm4OasGFSfB0lMt0DQ';

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
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const ok = await submitToSupabase('contact', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
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
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const ok = await submitToSupabase('buyer', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
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
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const ok = await submitToSupabase('seller', data);
    if (ok) {
      form.style.display = 'none';
      form.parentElement.querySelector('.form-success').style.display = 'block';
    } else {
      btn.disabled = false;
      btn.textContent = 'Request Consultation';
      alert('Something went wrong — please try again or call us directly.');
    }
  });
})();
