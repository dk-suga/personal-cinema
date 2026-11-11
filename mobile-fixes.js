/* Calendar dates are view projections: existing records require no destructive migration. */
function sessionWatchedOn(record,view,key){
 const days=Array.isArray(view.days)?view.days:[];
 if(days.includes(key))return true;
 if(!['In progress','Done'].includes(view.status))return false;
 if(episodic(record)){
  const period=view.period||(days.length===0&&view.start&&view.end?{start:view.start,end:view.end}:null);
  if(period?.start&&period?.end&&key>=period.start&&key<=period.end)return true;
  return key===view.start||key===view.end;
 }
 return view.status==='Done'&&key===view.end;
}
watchedOn=function(record,key){return viewsOf(record).some(view=>sessionWatchedOn(record,view,key))};

/* Anchor the dialog to the visible viewport, rather than the layout viewport's bottom. */
function dialogViewportBox(view,fallbackWidth,fallbackHeight){return {top:Math.max(0,view?.offsetTop||0),left:Math.max(0,view?.offsetLeft||0),width:Math.max(1,view?.width||fallbackWidth),height:Math.max(1,view?.height||fallbackHeight)}}
(function(){
 const dialog=document.getElementById('modal'),body=document.getElementById('modalbody'),root=document.documentElement;
 const mobile=()=>matchMedia('(max-width:650px)').matches;
 let scrollLock=null,frame=0,revealField=false;
 function lock(){if(scrollLock||!mobile())return;const page=document.body;scrollLock={y:window.scrollY,position:page.style.position,top:page.style.top,left:page.style.left,right:page.style.right,width:page.style.width,overflow:page.style.overflow,rootOverflow:root.style.overflow};page.style.position='fixed';page.style.top=-scrollLock.y+'px';page.style.left='0';page.style.right='0';page.style.width='100%';page.style.overflow='hidden';root.style.overflow='hidden';root.classList.add('cinema-dialog-open')}
 function unlock(){if(!scrollLock)return;const state=scrollLock,page=document.body;scrollLock=null;for(const name of ['position','top','left','right','width','overflow'])page.style[name]=state[name];root.style.overflow=state.rootOverflow;root.classList.remove('cinema-dialog-open');window.scrollTo(0,state.y)}
 function reveal(){const input=document.activeElement;if(!dialog.open||!body.contains(input)||!input.matches('input,textarea,select,[contenteditable]'))return;const a=input.getBoundingClientRect(),b=body.getBoundingClientRect(),top=b.top+16,bottom=b.bottom-24;let delta=0;if(a.height>bottom-top||a.top<top)delta=a.top-top;else if(a.bottom>bottom)delta=a.bottom-bottom;if(Math.abs(delta)>1)body.scrollTop+=delta}
 function update(){frame=0;if(!mobile()){if(!dialog.open)unlock();return}const box=dialogViewportBox(window.visualViewport,window.innerWidth,window.innerHeight);for(const [key,value]of Object.entries(box))root.style.setProperty('--dialog-'+key,value+'px');if(dialog.open)lock();if(revealField){revealField=false;reveal()}}
 function schedule(revealInput=false){revealField=revealField||revealInput;if(!frame)frame=requestAnimationFrame(update)}
 const originalOpen=openModal;
 openModal=function(content,label){if(mobile())lock();update();originalOpen(content,label);body.scrollTop=0;const form=body.querySelector('#editform');if(form){form.autocomplete='off';form.querySelector('[name="title"]')?.setAttribute('autocomplete','off')}schedule(true)};
 dialog.addEventListener('close',()=>{revealField=false;unlock();schedule()});
 dialog.addEventListener('focusin',()=>schedule(true));
 window.addEventListener('resize',()=>schedule(true));
 if(window.visualViewport){visualViewport.addEventListener('resize',()=>schedule(true));visualViewport.addEventListener('scroll',()=>schedule())}
 schedule();
})();
