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

// Generic form handler
function handleFormSubmit(formName, data){
  console.log(`Form submitted: ${formName}`, data);
  // For Netlify: forms auto-detect with netlify attribute
  // For now, store in console and show success
}

// Contact form
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    handleFormSubmit('contact', data);
    form.style.display = 'none';
    form.parentElement.querySelector('.form-success').style.display = 'block';
  });
})();

// Pre-qual form
(function(){
  const form = document.getElementById('prequalForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    handleFormSubmit('prequal', data);
    form.style.display = 'none';
    form.parentElement.querySelector('.form-success').style.display = 'block';
  });
})();

// Seller consultation form
(function(){
  const form = document.getElementById('sellerForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    handleFormSubmit('seller-consultation', data);
    form.style.display = 'none';
    form.parentElement.querySelector('.form-success').style.display = 'block';
  });
})();
