// Configure this to a Formspree endpoint or leave as '/api/contact' to use your backend
const FORM_ENDPOINT = window.FORM_ENDPOINT || '/api/contact';

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', function(e){
    const href = this.getAttribute('href');
    if(href.length>1){
      e.preventDefault();
      document.querySelector(href).scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
});

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuToggle && menuToggle.addEventListener('click', () => {
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});

// Contact form handling (frontend -> backend)
const form = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');
const resetBtn = document.getElementById('resetBtn');

async function postContact(payload){
  try{
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    return res.json();
  }catch(err){
    return { error: 'Network error' };
  }
}

form && form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  // Basic validation
  if(!data.name || !data.email || !data.message){
    formMsg.textContent = 'Please fill the required fields.';
    return;
  }
  formMsg.textContent = 'Sending...';

  const result = await postContact(data);
  if(result && result.ok){
    formMsg.textContent = 'Thanks! We received your message. We will contact you shortly.';
    form.reset();
  }else{
    formMsg.textContent = result && result.error ? (result.error) : 'Failed to send message. Please try again later.';
  }
});

resetBtn && resetBtn.addEventListener('click', ()=>{form.reset(); formMsg.textContent='';});

// Set current year in footer
const year = document.getElementById('year');
if(year) year.textContent = new Date().getFullYear();

// Load runtime text config and apply text to elements with data-i18n
async function applyTextConfig(){
  try{
    const res = await fetch('config.json', {cache: 'no-store'});
    if(!res.ok) return;
    const cfg = await res.json();
    Object.keys(cfg).forEach(key=>{
      const els = document.querySelectorAll(`[data-i18n="${key}"]`);
      els.forEach(el=>{
        // If element is input/textarea/button, set value or placeholder when appropriate
        if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'){
          if(el.type === 'text' || el.type === 'email' || el.tagName === 'TEXTAREA'){
            el.placeholder = cfg[key];
          }else{
            el.value = cfg[key];
          }
        }else{
          el.textContent = cfg[key];
        }
      });
    });
  }catch(err){
    // ignore config errors
    console.warn('Config load failed', err);
  }
}

// Apply config early
applyTextConfig();
