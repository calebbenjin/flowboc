'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const classes = [
  { name:'Morning Flow', date:'Monday · 2 Nov · 7:00 AM WAT', duration:'60 minutes', mode:'Online class', price:'₦8,000', spots:'8 spaces available', image:'assets/morning.jpg', alt:'Yoga mats arranged in a bright studio', description:'Ease into your day with a gentle, energising flow. Make a little room for yourself before the world wakes up.' },
  { name:'Slow down & reset', date:'Wednesday · 4 Nov · 6:00 PM WAT', duration:'75 minutes', mode:'In-person class', price:'₦10,000', spots:'5 spaces available', image:'assets/evening.jpg', alt:'A calm studio prepared for an evening practice', description:'A slower practice for a softer landing. Gentle movement, unhurried breathing, and a little time to return to yourself.' },
  { name:'Private practice', date:'Friday · 6 Nov · 10:00 AM WAT', duration:'60 minutes', mode:'Online class', price:'₦20,000', spots:'1 space available', image:'assets/studio.jpg', alt:'A yoga studio with room for a private practice', description:'A class built around you. An individual session with space for your pace, your questions, and the way you want to move.' }
];
let currentClass = 0;
let selectedPlan = 'starter';
let billingInterval = 'monthly';
const planPricing = { starter: { label:'Starter', monthly:9, annual:90 }, pro: { label:'Pro', monthly:19, annual:190 } };
let booking = {};
let profile = { name:'', slug:'', className:'Morning Flow', format:'Online class' };
const dialog = $('#flow-dialog');
const content = $('#dialog-content');
if(new URLSearchParams(window.location.search).get('embedded')==='true') document.body.classList.add('embedded-preview');
const previewNotice = '<p class="preview-warning">This is a design preview. No account, payment, or real booking is created. Details entered here are used only in this temporary preview.</p>';
const steps = n => `<div class="dialog-stepbar" aria-label="Step ${n} of 3"><span class="${n>=1?'active':''}"></span><span class="${n>=2?'active':''}"></span><span class="${n>=3?'active':''}"></span></div>`;
function showDialog(html) {
  content.innerHTML = html;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  requestAnimationFrame(() => {
    const target = $('input',content) || $('#dialog-close');
    target.focus({ preventScroll:true });
  });
}
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {
  if (e.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close();
});
function notify(text) {
  const t=$('#toast'); t.textContent=text; t.classList.add('visible');
  clearTimeout(notify.timer); notify.timer=setTimeout(()=>t.classList.remove('visible'),3500);
}

$$('[data-section]').forEach(section => {
  const note=document.createElement('aside');
  note.className='section-note';
  note.innerHTML=`<strong>SECTION ${section.dataset.section} / DESIGN INTENT</strong>${esc(section.dataset.note)}`;
  section.prepend(note);
  const index=document.createElement('span');index.className='section-index';index.textContent=section.dataset.section+' / 12';index.setAttribute('aria-hidden','true');section.append(index);
});
$('#notes-toggle').addEventListener('click', e => {
  const on=document.body.classList.toggle('show-notes');
  e.currentTarget.setAttribute('aria-pressed',String(on));
  e.currentTarget.innerHTML=`Design notes <span>${on?'−':'＋'}</span>`;
});
function setMode(structure) {
  document.body.classList.toggle('structure-mode',structure);
  $('#structure-mode').classList.toggle('active',structure);
  $('#visual-mode').classList.toggle('active',!structure);
  $('#structure-mode').setAttribute('aria-pressed',String(structure));
  $('#visual-mode').setAttribute('aria-pressed',String(!structure));
}
$('#structure-mode').addEventListener('click',()=>setMode(true));
$('#visual-mode').addEventListener('click',()=>setMode(false));
$('#menu-toggle').addEventListener('click',e=>{
  const open=e.currentTarget.getAttribute('aria-expanded')!=='true';
  e.currentTarget.setAttribute('aria-expanded',String(open));
  e.currentTarget.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  e.currentTarget.textContent=open?'×':'☰';
  $('#mobile-nav').hidden=!open;
});
$$('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{
  $('#mobile-nav').hidden=true;
  $('#menu-toggle').setAttribute('aria-expanded','false');
  $('#menu-toggle').setAttribute('aria-label','Open navigation');
  $('#menu-toggle').textContent='☰';
}));

const themeMap={violet:['#6355ff','#eeebff'],sand:['#af774d','#f0e3d0'],forest:['#28654d','#dfe9d9']};
$$('[data-theme]').forEach(button=>button.addEventListener('click',()=>{
  const theme=themeMap[button.dataset.theme];
  $('#custom-page').style.setProperty('--page-theme',theme[0]);
  $('#custom-page').style.setProperty('--page-bg',theme[1]);
  $$('[data-theme]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
}));

function selectClass(index) {
  currentClass=index;
  const c=classes[index];
  $('#class-image').src=c.image;$('#class-image').alt=c.alt;
  $('#class-mode').textContent=c.mode.toUpperCase();
  $('#class-date').textContent=c.date.toUpperCase();
  $('#class-title').textContent=c.name;$('#class-desc').textContent=c.description;
  $('#class-duration').textContent=c.duration;$('#class-spots').textContent=c.spots;$('#class-price').textContent=c.price;
  $('#class-preview').setAttribute('aria-labelledby','class-tab-'+index);
  $$('[data-class]').forEach(button=>{const active=Number(button.dataset.class)===index;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
}
$$('[data-class]').forEach(b=>b.addEventListener('click',()=>selectClass(Number(b.dataset.class))));
selectClass(0);
function openBooking(index) {
  booking={index,name:'',email:'',phone:''};
  renderBookingDetails();
}
function renderBookingDetails() {
  const c=classes[booking.index];
  showDialog(`<div class="dialog-label">GUEST BOOKING / DEMO</div><h2 id="dialog-title" class="dialog-title">A little space for you.</h2><p class="dialog-subtitle">${esc(c.name)} · ${esc(c.price)}<br>${esc(c.date)} · ${esc(c.mode)}</p>${steps(1)}<form id="booking-details"><label class="form-field">Your full name<input name="name" autocomplete="off" required maxlength="80" value="${esc(booking.name)}" placeholder="Your name"></label><label class="form-field">Email address<input name="email" type="email" autocomplete="off" required maxlength="160" value="${esc(booking.email)}" placeholder="you@example.com"></label><label class="form-field">Phone number<input name="phone" type="tel" autocomplete="off" required maxlength="30" value="${esc(booking.phone)}" placeholder="Your phone number"></label><div class="dialog-actions"><button class="btn" type="submit">Continue as a guest ${icon('arrow')}</button></div></form><p class="micro">No Flowboc account required.</p>${previewNotice}`);
  $('#booking-details').addEventListener('submit',e=>{
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    booking.name=String(data.get('name')).trim();booking.email=String(data.get('email')).trim();booking.phone=String(data.get('phone')).trim();
    if(!booking.name||!booking.phone){notify('Please enter your name and phone number.');return;}
    renderBookingReview();
  });
}
function renderBookingReview() {
  const c=classes[booking.index];
  showDialog(`<div class="dialog-label">GUEST BOOKING / DEMO</div><h2 id="dialog-title" class="dialog-title">Your class, at a glance.</h2><p class="dialog-subtitle">In the live product, this step leads to the supported payment provider. Here you can preview the confirmation without paying.</p>${steps(2)}<div class="summary-row"><span>Class</span><strong>${esc(c.name)}</strong></div><div class="summary-row"><span>When</span><strong>${esc(c.date)}</strong></div><div class="summary-row"><span>Student</span><strong>${esc(booking.name)}</strong></div><div class="summary-row"><span>Confirmation email</span><strong>${esc(booking.email)}</strong></div><div class="summary-row"><span>Example class price</span><strong>${esc(c.price)}</strong></div><div class="dialog-actions"><button class="dialog-back" id="book-back">← Back</button><button class="btn" id="simulate-payment">Simulate confirmation ${icon('arrow')}</button></div>${previewNotice}`);
  $('#book-back').addEventListener('click',renderBookingDetails);
  $('#simulate-payment').addEventListener('click',renderBookingDone);
}
function renderBookingDone() {
  const c=classes[booking.index];
  showDialog(`<div class="dialog-label">DEMO COMPLETE</div><div class="success-icon">✓</div><h2 id="dialog-title" class="dialog-title">That’s the guest experience.</h2><p class="dialog-subtitle">In Flowboc, a successful paid booking creates a confirmation email for the student and a notification for the instructor. No student account is needed.</p>${steps(3)}<div class="summary-row"><span>Sample class</span><strong>${esc(c.name)}</strong></div><div class="summary-row"><span>Booking status</span><strong>Preview only · Nothing booked</strong></div><div class="summary-row"><span>Payment taken</span><strong>None</strong></div><div class="dialog-actions"><button class="btn" id="booking-to-setup">Build my instructor page ${icon('arrow')}</button></div><button class="dialog-back modal-secondary" id="finish-booking">Back to the wireframe</button>${previewNotice}`);
  $('#booking-to-setup').addEventListener('click',()=>openSetup());
  $('#finish-booking').addEventListener('click',()=>dialog.close());
}
$$('[data-book]').forEach(b=>b.addEventListener('click',()=>openBooking(Number(b.dataset.book))));
$('#preview-book').addEventListener('click',()=>openBooking(currentClass));

function openSetup(plan) {
  if(plan) selectedPlan=plan;
  renderSetupProfile();
}
function renderSetupProfile() {
  showDialog(`<div class="dialog-label">INSTRUCTOR SETUP / PREVIEW</div><h2 id="dialog-title" class="dialog-title">Let’s make it feel like you.</h2><p class="dialog-subtitle">Try a simple profile preview. You’ll continue on Flowboc when you are ready to create a real account.</p>${steps(1)}<form id="profile-form"><label class="form-field">Your teaching or business name<input id="teacher-name" name="name" required maxlength="70" autocomplete="off" placeholder="e.g. Maya Yoga" value="${esc(profile.name)}"></label><label class="form-field">Your personal link<input id="teacher-slug" name="slug" required minlength="3" maxlength="45" pattern="[a-z0-9-]+" title="Use lowercase letters, numbers, and hyphens" autocomplete="off" placeholder="maya-yoga" value="${esc(profile.slug)}"><span class="field-help">flowboc.com/<span id="slug-preview">${esc(profile.slug||'your-name')}</span> · Availability is not checked in this preview.</span></label><div class="dialog-actions"><button class="btn" type="submit">Add your first class ${icon('arrow')}</button></div></form>${previewNotice}`);
  let slugEdited=Boolean(profile.slug);
  $('#teacher-slug').addEventListener('input',e=>{slugEdited=true;$('#slug-preview').textContent=e.target.value||'your-name';});
  $('#teacher-name').addEventListener('input',e=>{
    if(slugEdited)return;
    const slug=e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/[\s-]+/g,'-').slice(0,45);
    $('#teacher-slug').value=slug;$('#slug-preview').textContent=slug||'your-name';
  });
  $('#profile-form').addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(e.currentTarget);
    profile.name=String(data.get('name')).trim();profile.slug=String(data.get('slug')).trim();
    if(!profile.name){notify('Add your teaching name to continue.');return;}
    renderSetupClass();
  });
}
function renderSetupClass() {
  showDialog(`<div class="dialog-label">INSTRUCTOR SETUP / PREVIEW</div><h2 id="dialog-title" class="dialog-title">What will you teach first?</h2><p class="dialog-subtitle">Your page can bring different class formats together. Choose a starting point for this example.</p>${steps(2)}<form id="class-setup"><label class="form-field">Class name<input name="className" required maxlength="70" value="${esc(profile.className)}" placeholder="e.g. Morning Flow"></label><fieldset class="format-fieldset"><legend>Class format</legend><div class="choice-list">${['Online class','In-person class','Private session'].map((f,i)=>`<label class="format-option"><input type="radio" name="format" value="${esc(f)}" ${profile.format===f?'checked':''}><span>${esc(f)}</span><small>${['Meet students through your class link.','Bring your community together in person.','Give one student your full attention.'][i]}</small></label>`).join('')}</div></fieldset><div class="dialog-actions"><button type="button" id="setup-back" class="dialog-back">← Back</button><button class="btn" type="submit">Preview my page ${icon('arrow')}</button></div></form>${previewNotice}`);
  $('#setup-back').addEventListener('click',renderSetupProfile);
  $('#class-setup').addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(e.currentTarget);profile.className=String(data.get('className')).trim();profile.format=String(data.get('format'));
    if(!profile.className){notify('Add a class name to continue.');return;}
    renderSetupDone();
  });
}
function renderSetupDone() {
  const chosen = planPricing[selectedPlan];
  const chosenPrice = `$${chosen[billingInterval]}/${billingInterval==='annual'?'year':'month'}`;
  showDialog(`<div class="dialog-label">INSTRUCTOR SETUP / PREVIEW</div><h2 id="dialog-title" class="dialog-title">Your business home, imagined.</h2><p class="dialog-subtitle">A small glimpse of what you could build. Continue to Flowboc to create your account, confirm your link, and complete your page.</p>${steps(3)}<div class="summary-row"><span>Plan preview</span><strong>${chosen.label} · ${chosenPrice} USD</strong></div><p class="field-help">${billingInterval==='annual'?'Annual billing is paid upfront.':'Monthly billing.'} Confirm your plan and billing choice on Flowboc after signup.</p><div class="summary-box"><span class="profile-mark">${esc(profile.name.charAt(0).toUpperCase())}</span><h3>${esc(profile.name)}</h3><p>flowboc.com/${esc(profile.slug)}</p><div class="summary-class"><span>${esc(profile.className)}<small class="field-help">${esc(profile.format)}</small></span><span>↗</span></div></div><div class="dialog-actions"><button class="dialog-back" id="setup-edit">← Edit</button><a class="btn" href="/auth?plan=${selectedPlan}" target="_blank" rel="noopener">Continue to Flowboc signup ↗</a></div><p class="micro">14-day free trial. No card required.</p>${previewNotice}`);
  $('#setup-edit').addEventListener('click',renderSetupClass);
}
$$('[data-setup]').forEach(button=>button.addEventListener('click',()=>openSetup(button.dataset.plan)));

$$('[data-explain]').forEach(button=>button.addEventListener('click',()=>{
  const book=button.dataset.explain==='ebook';
  showDialog(`<div class="dialog-label">${book?'EBOOK':'CONSULTATION'} OFFER / PREVIEW</div><h2 id="dialog-title" class="dialog-title">${book?'The everyday practice.':'A little individual attention.'}</h2><p class="dialog-subtitle">${book?'An example ebook offer that can sit alongside classes on an instructor’s public page.':'An example video-call offer that connects a student to the instructor’s consultation link.'}</p><div class="summary-box">${book?'<svg class="offer-dialog-flower"><use href="#flower"/></svg>':'<svg class="offer-dialog-yoga"><use href="#yoga"/></svg>'}<h3>${book?'A practice guide by Maya Yoga':'A consultation with Maya Yoga'}</h3><p>${book?'After a successful purchase, the buyer receives a download link.':'A free or paid offer. After confirmation, the student receives the instructor’s meeting link.'}</p></div><div class="dialog-actions"><button class="btn" id="offer-to-setup">Create my own page ${icon('arrow')}</button></div>${previewNotice}`);
  $('#offer-to-setup').addEventListener('click',()=>openSetup());
}));

const attendance=new Set();
function renderDashboard(tab) {
  const target=$('#dashboard-content');
  if(tab==='upcoming') target.innerHTML=[['Morning Flow','Mon, 2 Nov · 7:00 AM','12 of 15 booked','Published'],['Slow down & reset','Wed, 4 Nov · 6:00 PM','10 of 15 booked','Published'],['Private practice','Fri, 6 Nov · 10:00 AM','1 of 1 booked','Full']].map(r=>`<div class="dash-row"><div><strong>${r[0]}</strong><small>${r[1]}</small></div><span>${r[2]}</span><span class="status">${r[3]}</span></div>`).join('');
  if(tab==='attendance') {
    target.innerHTML=['Amara','Jamie','Lina'].map((name,i)=>`<div class="dash-row"><div><strong>${name}</strong><small>Example student</small></div><span>Morning Flow</span><button class="attendance-toggle ${attendance.has(i)?'attended':''}" data-attend="${i}" aria-pressed="${attendance.has(i)}">${attendance.has(i)?'✓ Attended':'Mark attended'}</button></div>`).join('');
    $$('[data-attend]').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.attend);attendance.has(id)?attendance.delete(id):attendance.add(id);renderDashboard('attendance');}));
  }
  if(tab==='payments') target.innerHTML=[['Morning Flow','Example guest booking','₦8,000','Paid'],['Slow down & reset','Example guest booking','₦10,000','Paid'],['Private practice','Example guest booking','₦20,000','Pending']].map(r=>`<div class="dash-row"><div><strong>${r[0]}</strong><small>${r[1]}</small></div><span>${r[2]}</span><span class="status ${r[3]==='Pending'?'pending':''}">${r[3]}</span></div>`).join('');
}
$$('[data-dashboard]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-dashboard]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});
  renderDashboard(button.dataset.dashboard);
}));
renderDashboard('upcoming');

$$('[data-email-preview]').forEach(button=>button.addEventListener('click',()=>{
  showDialog(`<div class="dialog-label">STUDENT UPDATE / PREVIEW</div><h2 id="dialog-title" class="dialog-title">A direct connection.</h2><p class="dialog-subtitle">An example of the kind of update an instructor could send through Flowboc’s newsletter tools.</p><div class="email-example"><small>FROM MAYA YOGA · EXAMPLE EMAIL</small><h3>A little room for yourself.</h3><p>Hello,<br><br>This week’s classes are ready. If you have been meaning to make a little time for your practice, you are welcome to join us.</p><p>Morning Flow · Monday, 7:00 AM<br>Slow down & reset · Wednesday, 6:00 PM</p><a id="email-class-link" href="#experience">Explore this week’s classes ↗</a><p>See you on the mat,<br>Maya</p></div><p class="preview-warning">This is an illustrative email. Nothing is sent, and no subscription is created.</p>`);
  $('#email-class-link').addEventListener('click',()=>dialog.close());
}));

$$('[data-period]').forEach(button=>button.addEventListener('click',()=>{
  const long=button.dataset.period==='8';
  $$('[data-period]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  $('#chart-revenue').textContent=long?'₦352,000':'₦192,000';$('#chart-views').textContent=long?'1,180':'640';$('#chart-bookings').textContent=long?'44':'24';$('#chart-fill-rate').textContent=long?'73%':'80%';$('#chart-range-label').textContent=long?'Week 8':'Week 4';
  const path=long?'M8 155 80 140 152 153 224 99 296 113 368 62 440 83 512 30':'M8 145 170 99 345 115 512 35';
  $('#chart-line').setAttribute('d',path);$('#chart-area').setAttribute('d',path+'V180H8Z');$('#chart-last').setAttribute('cy',long?'30':'35');$('#revenue-chart').setAttribute('aria-label',`Illustrative revenue chart over ${long?'eight':'four'} weeks`);
}));

function renderPlanPrices() {
  const annual = billingInterval === 'annual';
  for (const [key, plan] of Object.entries(planPricing)) {
    $('#'+key+'-price').textContent = '$'+plan[billingInterval];
    $('#'+key+'-price-unit').textContent = annual ? '/ year' : '/ month';
    $('#'+key+'-billing-detail').textContent = annual
      ? 'Billed upfront · $'+(plan.annual/12).toFixed(2)+'/month equivalent · Save $'+(plan.monthly*12-plan.annual)+'/year'
      : 'Billed monthly in USD.';
  }
}
$$('[data-billing]').forEach(button=>button.addEventListener('click',()=>{
  billingInterval=button.dataset.billing;
  $$('[data-billing]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderPlanPrices();
}));
renderPlanPrices();

$$('[data-recommend]').forEach(button=>button.addEventListener('click',()=>{
  selectedPlan=button.dataset.recommend;
  $$('[data-recommend]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  $('#starter-card').classList.toggle('recommended',selectedPlan==='starter');$('#pro-card').classList.toggle('recommended',selectedPlan==='pro');
  $('#recommendation').textContent=selectedPlan==='pro'?'Pro adds custom page design, newsletters, additional offers, and detailed business insights.':'Starter brings your classes, recurring schedule, and bookings together.';
}));

$$('[role="tablist"]').forEach(list=>{
  const tabs=$$('[role="tab"]',list);
  tabs.forEach((tab,index)=>{
    tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
    tab.addEventListener('keydown',e=>{
      let next=index;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%tabs.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;
      else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
      e.preventDefault();tabs[next].click();tabs[next].focus();
    });
  });
});
$$('.faqs details').forEach(detail=>detail.addEventListener('toggle',()=>{
  if(detail.open)$$('.faqs details').forEach(other=>{if(other!==detail)other.open=false;});
}));
