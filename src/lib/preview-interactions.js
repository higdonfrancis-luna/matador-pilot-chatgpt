/** @param {HTMLElement} root */
export function initializePreview(root){
 const timers=[];const observers=[];
 const schedule=(callback,ms)=>{const timer=setInterval(callback,ms);timers.push(timer);return timer};

// All state is local to this review preview. Forms never submit data.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const carouselNames={
 '5fe1ff36':'Client testimonials', '04ad8bc':'Featured media',
 '4fe8a63':'Member videos', 'a5c5f19':'Case studies',
 '5631cf8':'Firm experiences', '3e35998':'Client logos',
 '0633515':'Guides and resources', '77b7873':'More client testimonials',
 '889c979':'Featured media in the footer'
};
root.querySelectorAll('.swiper-wrapper').forEach((track,carouselIndex)=>{
 const slides=[...track.children].filter(x=>x.classList.contains('swiper-slide'));
 if(!slides.length)return;
 const viewport=track.parentElement,widget=track.closest('[data-widget_type]');
 let settings={};try{settings=JSON.parse(widget?.dataset.settings||'{}')}catch{}
 const imageCarousel=widget?.dataset.widget_type?.startsWith('image-carousel');
 const continuous=imageCarousel&&Number(settings.autoplay_speed)===0;
 const title=carouselNames[widget?.dataset.id]||`Content carousel ${carouselIndex+1}`;
 const trackId=`preview-carousel-${carouselIndex+1}`;
 track.id=trackId;
 viewport.classList.toggle('preview-marquee',continuous);
 viewport.tabIndex=0;viewport.setAttribute('aria-roledescription','carousel');viewport.setAttribute('aria-label',title);
 widget?.querySelectorAll('.swiper-pagination,.elementor-swiper-button').forEach(x=>x.remove());
 let index=0,count=1,gap=10,hovered=false,focused=false,userPaused=false;
 const controls=document.createElement('div');controls.className='preview-slider-controls';
 controls.setAttribute('role','group');controls.setAttribute('aria-label',`${title} controls`);
 const button=(text,label)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.setAttribute('aria-controls',trackId);return b};
 const prev=button('‹',`Previous ${title.toLowerCase()}`),next=button('›',`Next ${title.toLowerCase()}`);
 const dots=document.createElement('div');dots.className='preview-dots';
 const dotsWanted=settings.pagination==='bullets';
 const pause=button('Pause',`Pause ${title.toLowerCase()}`);pause.className='preview-pause';pause.setAttribute('aria-pressed','false');
 if(continuous){
  // A complete duplicate sequence makes the last-to-first boundary seamless.
  slides.forEach(slide=>{const clone=slide.cloneNode(true);clone.dataset.previewClone='true';clone.setAttribute('aria-hidden','true');clone.inert=true;clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));track.append(clone);slide.setAttribute('aria-hidden','false');slide.inert=false});
  controls.classList.add('preview-marquee-controls');controls.append(pause);
 }else{controls.append(prev);if(dotsWanted)controls.append(dots);controls.append(next)}
 viewport.after(controls);
 function render(){
  if(continuous)return;
  const max=Math.max(0,slides.length-count);index=Math.max(0,Math.min(index,max));
  track.style.transform=`translateX(-${index*((viewport.clientWidth-gap*(count-1))/count+gap)}px)`;
  slides.forEach((slide,i)=>{const active=i>=index&&i<index+count;slide.setAttribute('aria-hidden',String(!active));slide.inert=!active});
  [...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===(index===max?Math.ceil(slides.length/count)-1:Math.floor(index/count)))));
 }
 function move(n){const max=Math.max(0,slides.length-count);index+=n;if(index>max)index=0;if(index<0)index=max;render()}
 function configure(){
  const width=window.innerWidth;
  count=Number(width<768?(settings.slides_to_show_mobile||(imageCarousel?2:1)):width<1025?(settings.slides_to_show_tablet||(imageCarousel?3:2)):(settings.slides_to_show||(imageCarousel?5:1)));
  count=Math.min(count||1,slides.length);
  const spacing=width<768?settings.image_spacing_custom_mobile:width<1025?settings.image_spacing_custom_tablet:settings.image_spacing_custom;
  const raw=spacing?.size;
  gap=Number(raw!==undefined&&raw!==''?raw:(settings.image_spacing_custom?.size??settings.space_between?.size??(imageCarousel?0:10)));
  viewport.style.setProperty('--preview-count',count);viewport.style.setProperty('--preview-gap',`${gap}px`);
  if(continuous){
   const step=(viewport.clientWidth-gap*(count-1))/count+gap;
   track.style.setProperty('--preview-loop-distance',`${step*slides.length}px`);
   track.style.setProperty('--preview-loop-duration',`${(Number(settings.speed)||5000)*slides.length}ms`);
   track.classList.add('preview-continuous-track');
   if(reduced){track.style.animationPlayState='paused';pause.hidden=true;controls.hidden=true}
  }else{
   dots.replaceChildren();for(let i=0;i<Math.ceil(slides.length/count);i++){const b=button('',`${title}, page ${i+1}`);b.addEventListener('click',()=>{index=Math.min(i*count,slides.length-count);render()});dots.append(b)}
   controls.hidden=slides.length<=count;
   render();
  }
 }
 prev.addEventListener('click',()=>move(-count));next.addEventListener('click',()=>move(count));
 pause.addEventListener('click',()=>{userPaused=!userPaused;pause.textContent=userPaused?'Play':'Pause';pause.setAttribute('aria-pressed',String(userPaused));pause.setAttribute('aria-label',`${userPaused?'Play':'Pause'} ${title.toLowerCase()}`);track.style.animationPlayState=userPaused?'paused':'running'});
 viewport.addEventListener('keydown',e=>{if(continuous)return;if(e.key==='ArrowRight'){e.preventDefault();move(count)}if(e.key==='ArrowLeft'){e.preventDefault();move(-count)}});
 let startX=null;viewport.addEventListener('pointerdown',e=>{startX=e.clientX});viewport.addEventListener('pointerup',e=>{if(!continuous&&startX!==null&&Math.abs(e.clientX-startX)>45)move(e.clientX<startX?count:-count);startX=null});
 const pauseArea=widget||viewport;
 pauseArea.addEventListener('mouseenter',()=>{hovered=true});pauseArea.addEventListener('mouseleave',()=>{hovered=false});pauseArea.addEventListener('focusin',()=>{focused=true});pauseArea.addEventListener('focusout',e=>{focused=pauseArea.contains(e.relatedTarget)});
 const observer=new ResizeObserver(configure);observers.push(observer);observer.observe(viewport);configure();
 if(!continuous&&!reduced&&settings.autoplay==='yes')schedule(()=>{if(!hovered&&!focused&&!document.hidden)move(1)},Number(settings.autoplay_speed)||5000);
});
root.querySelectorAll('.elementor-tabs').forEach(tabs=>{
 const labels=[...tabs.querySelectorAll('.elementor-tab-title')],panels=[...tabs.querySelectorAll('.elementor-tab-content')];
 const activate=key=>{labels.forEach(el=>{const yes=el.dataset.tab===key;el.classList.toggle('elementor-active',yes);el.setAttribute('aria-selected',String(yes));el.tabIndex=yes?0:-1});panels.forEach(el=>{el.classList.toggle('preview-active',el.dataset.tab===key);el.hidden=el.dataset.tab!==key})};
 labels.forEach(el=>{el.addEventListener('click',()=>activate(el.dataset.tab));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(el.dataset.tab)}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const keys=[...new Set(labels.map(x=>x.dataset.tab))];const key=keys[(keys.indexOf(el.dataset.tab)+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length];activate(key);labels.find(x=>x.dataset.tab===key&&x.offsetParent)?.focus()}})});activate('1');
});
root.querySelectorAll('.elementor-menu-toggle').forEach(toggle=>{
 const menu=toggle.parentElement.querySelector(':scope > nav.elementor-nav-menu--dropdown');
 const activate=()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.classList.toggle('elementor-active',open);menu?.classList.toggle('preview-menu-open',open);if(menu)menu.setAttribute('aria-hidden',String(!open))};
 toggle.addEventListener('click',activate);toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')activate()});
});
root.querySelectorAll('.preview-video').forEach(button=>button.addEventListener('click',()=>{const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1&rel=0`;frame.title='Matador member testimonial';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.className='preview-video-iframe';button.replaceWith(frame)}));
root.querySelectorAll('.preview-form').forEach(form=>{form.addEventListener('submit',e=>e.preventDefault());form.querySelector('.preview-submit').addEventListener('click',()=>{if(form.reportValidity())form.querySelector('.preview-form-result').textContent='The fields passed validation. This is a preview; no inquiry was sent.'})});
root.querySelectorAll('[data-to-value]').forEach(el=>{el.textContent=el.dataset.toValue});
root.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>{if(img.dataset.triedOriginal)return;img.dataset.triedOriginal='1';const marker='/www.matadorsolutions.net/';const pos=img.src.indexOf(marker);if(pos!==-1){img.removeAttribute('srcset');img.src='https://www.matadorsolutions.net/'+img.src.slice(pos+marker.length)}})});

return ()=>{timers.forEach(clearInterval);observers.forEach(observer=>observer.disconnect())};
}
