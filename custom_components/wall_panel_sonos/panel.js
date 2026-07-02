function t(t,e,s,i){var r,o=arguments.length,a=o<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,s,i);else for(var n=t.length-1;n>=0;n--)(r=t[n])&&(a=(o<3?r(a):o>3?r(e,s,a):r(e,s))||a);return o>3&&a&&Object.defineProperty(e,s,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),r=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&r.set(e,t))}return t}toString(){return this.cssText}};const a=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:n,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,v=u.trustedTypes,_=v?v.emptyScript:"",$=u.reactiveElementPolyfillSupport,m=(t,e)=>t,g={toAttribute(t,e){switch(e){case Boolean:t=t?_:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},f=(t,e)=>!n(t,e),b={attribute:!0,type:String,converter:g,reflect:!1,useDefault:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let y=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&l(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:r}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const o=i?.call(this);r?.call(this,e),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...d(t),...h(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),r=e.litNonce;void 0!==r&&i.setAttribute("nonce",r),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:g).toAttribute(e,s.type);this._$Em=t,null==r?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:g;this._$Em=i;const o=r.fromAttribute(e,t.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(void 0!==t){const o=this.constructor;if(!1===i&&(r=this[t]),s??=o.getPropertyOptions(t),!((s.hasChanged??f)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==r||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[m("elementProperties")]=new Map,y[m("finalized")]=new Map,$?.({ReactiveElement:y}),(u.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=t=>t,w=x.trustedTypes,S=w?w.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+k,P=`<${C}>`,U=document,O=()=>U.createComment(""),R=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,T="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,I=/-->/g,N=/>/g,z=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,D=/"/g,L=/^(?:script|style|textarea|title)$/i,F=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),B=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),q=new WeakMap,G=U.createTreeWalker(U,129);function V(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const J=(t,e)=>{const s=t.length-1,i=[];let r,o=2===e?"<svg>":3===e?"<math>":"",a=H;for(let e=0;e<s;e++){const s=t[e];let n,l,c=-1,d=0;for(;d<s.length&&(a.lastIndex=d,l=a.exec(s),null!==l);)d=a.lastIndex,a===H?"!--"===l[1]?a=I:void 0!==l[1]?a=N:void 0!==l[2]?(L.test(l[2])&&(r=RegExp("</"+l[2],"g")),a=z):void 0!==l[3]&&(a=z):a===z?">"===l[0]?(a=r??H,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?z:'"'===l[3]?D:j):a===D||a===j?a=z:a===I||a===N?a=H:(a=z,r=void 0);const h=a===z&&t[e+1].startsWith("/>")?" ":"";o+=a===H?s+P:c>=0?(i.push(n),s.slice(0,c)+E+s.slice(c)+k+h):s+k+(-2===c?e:h)}return[V(t,o+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class K{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0;const a=t.length-1,n=this.parts,[l,c]=J(t,e);if(this.el=K.createElement(l,s),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=G.nextNode())&&n.length<a;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(E)){const e=c[o++],s=i.getAttribute(t).split(k),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:r,name:a[2],strings:s,ctor:"."===a[1]?tt:"?"===a[1]?et:"@"===a[1]?st:Y}),i.removeAttribute(t)}else t.startsWith(k)&&(n.push({type:6,index:r}),i.removeAttribute(t));if(L.test(i.tagName)){const t=i.textContent.split(k),e=t.length-1;if(e>0){i.textContent=w?w.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],O()),G.nextNode(),n.push({type:2,index:++r});i.append(t[e],O())}}}else if(8===i.nodeType)if(i.data===C)n.push({type:2,index:r});else{let t=-1;for(;-1!==(t=i.data.indexOf(k,t+1));)n.push({type:7,index:r}),t+=k.length-1}r++}}static createElement(t,e){const s=U.createElement("template");return s.innerHTML=t,s}}function Z(t,e,s=t,i){if(e===B)return e;let r=void 0!==i?s._$Co?.[i]:s._$Cl;const o=R(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(t),r._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=r:s._$Cl=r),void 0!==r&&(e=Z(t,r._$AS(t,e.values),r,i)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??U).importNode(e,!0);G.currentNode=i;let r=G.nextNode(),o=0,a=0,n=s[0];for(;void 0!==n;){if(o===n.index){let e;2===n.type?e=new X(r,r.nextSibling,this,t):1===n.type?e=new n.ctor(r,n.name,n.strings,this,t):6===n.type&&(e=new it(r,this,t)),this._$AV.push(e),n=s[++a]}o!==n?.index&&(r=G.nextNode(),o++)}return G.currentNode=U,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),R(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==B&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&R(this._$AH)?this._$AA.nextSibling.data=t:this.T(U.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=K.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Q(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new K(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const r of t)i===e.length?e.push(s=new X(this.O(O()),this.O(O()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=W}_$AI(t,e=this,s,i){const r=this.strings;let o=!1;if(void 0===r)t=Z(this,t,e,0),o=!R(t)||t!==this._$AH&&t!==B,o&&(this._$AH=t);else{const i=t;let a,n;for(t=r[0],a=0;a<r.length-1;a++)n=Z(this,i[s+a],e,a),n===B&&(n=this._$AH[a]),o||=!R(n)||n!==this._$AH[a],n===W?t=W:t!==W&&(t+=(n??"")+r[a+1]),this._$AH[a]=n}o&&!i&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Y{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class et extends Y{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class st extends Y{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??W)===B)return;const s=this._$AH,i=t===W&&s!==W||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==W&&(s===W||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(K,X),(x.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;class at extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let r=i._$litPart$;if(void 0===r){const t=s?.renderBefore??null;i._$litPart$=r=new X(e.insertBefore(O(),t),t,void 0,s??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const nt=ot.litElementPolyfillSupport;nt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");const lt={attribute:!0,type:String,converter:g,reflect:!1,hasChanged:f},ct=(t=lt,e,s)=>{const{kind:i,metadata:r}=s;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),o.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const r=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,r,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const r=this[i];e.call(this,s),this.requestUpdate(i,r,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function dt(t){return(e,s)=>"object"==typeof s?ct(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function ht(t){return dt({...t,state:!0,attribute:!1})}let pt=class extends at{constructor(){super(...arguments),this.narrow=!1,this._data=null,this._error=null,this._saving=!1,this._open="favorites",this._openItem={},this._subscribed=!1}updated(){!this._subscribed&&this.hass&&(this._subscribed=!0,this._subscribe())}disconnectedCallback(){super.disconnectedCallback(),this._unsub?.(),this._unsub=void 0,this._subscribed=!1}async _subscribe(){try{this._unsub=await this.hass.connection.subscribeMessage(t=>{this._data=t},{type:"wall_panel_sonos/subscribe"})}catch(t){this._error=`Couldn't reach the wall_panel_sonos integration — is it installed and is "wall_panel_sonos:" present in configuration.yaml? (${t instanceof Error?t.message:t})`}}async _save(t,e){this._data&&(this._data={...this._data,[t]:e}),this._saving=!0,this._error=null;try{await this.hass.callWS({type:"wall_panel_sonos/set",key:t,value:e})}catch(t){this._error=`Save failed: ${t instanceof Error?t.message:t}`}finally{this._saving=!1}}_move(t,e,s){const i=e+s;if(i<0||i>=t.length)return t;const r=t.slice();return[r[e],r[i]]=[r[i],r[e]],r}_toggleItem(t){this._openItem={...this._openItem,[t]:!this._openItem[t]}}_mediaPlayers(){return this.hass?Object.keys(this.hass.states).filter(t=>t.startsWith("media_player.")).sort():[]}_scripts(){return this.hass?Object.keys(this.hass.states).filter(t=>t.startsWith("script.")).sort():[]}render(){return F`
      <div class="wrap">
        <h1>Sonos Card</h1>
        <div class="lede">
          Shared favorites, groups, and station art for every
          <code>wall-panel-sonos-card</code> with <code>use_shared_store: true</code>.
          Changes apply to all dashboards immediately — no reload needed.
        </div>
        ${this._error?F`<div class="banner error">${this._error}</div>`:W}
        ${this._saving?F`<div class="banner saving">Saving…</div>`:W}
        ${this._data||this._error?W:F`<div class="banner saving">Loading…</div>`}
        ${this._data?F`
          ${this._section("favorites","Favorites",`${this._data.favorites.length} items`,()=>this._renderFavorites(this._data))}
          ${this._section("groups","Groups",`${this._data.groups.length} items`,()=>this._renderGroups(this._data))}
          ${this._section("station_art","Station art",`${this._data.station_art.length} mappings`,()=>this._renderStationArt(this._data))}
        `:W}
      </div>
    `}_section(t,e,s,i){const r=this._open===t;return F`
      <div class="sec">
        <div class="sec-head" @click=${()=>{this._open=r?null:t}}>
          <span>${r?"▾":"▸"} ${e}</span>
          <span class="count">${s}</span>
        </div>
        ${r?F`<div class="sec-body">${i()}</div>`:W}
      </div>
    `}_patchFav(t,e,s){this._save("favorites",t.favorites.map((t,i)=>i===e?{...t,...s}:t))}_renderFavorites(t){const e=t.favorites,s=this._scripts();return F`
      ${e.map((i,r)=>{const o=`fav:${r}`,a=!!this._openItem[o],n=i.script?"script":"media";return F`
          <div class="item">
            <div class="item-head" @click=${()=>this._toggleItem(o)}>
              <span>${a?"▾":"▸"}</span>
              <span class="name">${i.name||i.id||"(untitled)"}</span>
              <span class="kind">${i.type??""}</span>
              <div class="actions" @click=${t=>t.stopPropagation()}>
                <button class="btn" ?disabled=${0===r}
                  @click=${()=>this._save("favorites",this._move(e,r,-1))}>↑</button>
                <button class="btn" ?disabled=${r===e.length-1}
                  @click=${()=>this._save("favorites",this._move(e,r,1))}>↓</button>
                <button class="btn danger"
                  @click=${()=>this._save("favorites",e.filter((t,e)=>e!==r))}>Remove</button>
              </div>
            </div>
            ${a?F`
              <div class="item-body">
                <div class="row-inline">
                  <div>
                    <label>ID</label>
                    <input type="text" .value=${i.id??""}
                      @change=${e=>this._patchFav(t,r,{id:e.target.value.trim()})}/>
                  </div>
                  <div>
                    <label>Name</label>
                    <input type="text" .value=${i.name??""}
                      @change=${e=>this._patchFav(t,r,{name:e.target.value})}/>
                  </div>
                </div>
                <div class="row">
                  <label>Type</label>
                  <div class="chip-list">
                    ${["playlist","station","album"].map(e=>F`
                      <span class="chip ${i.type===e?"on":""}"
                        @click=${()=>this._patchFav(t,r,{type:e})}>${e}</span>
                    `)}
                  </div>
                </div>
                <div class="row">
                  <label>Source</label>
                  <div class="chip-list">
                    <span class="chip ${"media"===n?"on":""}"
                      @click=${()=>this._patchFav(t,r,{script:void 0})}>media_content_id</span>
                    <span class="chip ${"script"===n?"on":""}"
                      @click=${()=>this._patchFav(t,r,{media_content_id:void 0,media_content_type:void 0})}>script</span>
                  </div>
                </div>
                ${"media"===n?F`
                  <div class="row">
                    <label>media_content_id</label>
                    <textarea rows="2"
                      @change=${e=>this._patchFav(t,r,{media_content_id:e.target.value.trim()||void 0})}
                      >${i.media_content_id??""}</textarea>
                    <div class="help">Get one via Developer Tools → Services → media_player.play_media → Choose media.</div>
                  </div>
                  <div class="row">
                    <label>media_content_type</label>
                    <input type="text" .value=${i.media_content_type??""} placeholder="music"
                      @change=${e=>this._patchFav(t,r,{media_content_type:e.target.value.trim()||void 0})}/>
                  </div>
                `:F`
                  <div class="row">
                    <label>Script</label>
                    <select @change=${e=>this._patchFav(t,r,{script:e.target.value||void 0})}>
                      <option value="">— pick a script —</option>
                      ${s.map(t=>F`<option value=${t} ?selected=${i.script===t}>${t}</option>`)}
                    </select>
                  </div>
                `}
                <div class="row">
                  <label>Art (URL or CSS gradient, optional)</label>
                  <textarea rows="2"
                    placeholder="linear-gradient(135deg, #1a1a1a 0%, #6a4a2c 100%)"
                    @change=${e=>this._patchFav(t,r,{art:e.target.value.trim()||void 0})}
                    >${i.art??""}</textarea>
                </div>
              </div>
            `:W}
          </div>
        `})}
      <div class="adder">
        <button class="btn primary" @click=${()=>{this._save("favorites",[...e,{id:`favorite_${e.length+1}`,name:"New favorite",type:"playlist"}]),this._openItem={...this._openItem,[`fav:${e.length}`]:!0}}}>+ Add favorite</button>
      </div>
    `}_patchGroup(t,e,s){this._save("groups",t.groups.map((t,i)=>i===e?{...t,...s}:t))}_renderGroups(t){const e=t.groups,s=this._mediaPlayers();return F`
      ${e.map((i,r)=>{const o=`grp:${r}`,a=!!this._openItem[o];return F`
          <div class="item">
            <div class="item-head" @click=${()=>this._toggleItem(o)}>
              <span>${a?"▾":"▸"}</span>
              <span class="name">${i.label||i.id}</span>
              <span class="kind">${i.entities?.length??0} rooms</span>
              <div class="actions" @click=${t=>t.stopPropagation()}>
                <button class="btn" ?disabled=${0===r}
                  @click=${()=>this._save("groups",this._move(e,r,-1))}>↑</button>
                <button class="btn" ?disabled=${r===e.length-1}
                  @click=${()=>this._save("groups",this._move(e,r,1))}>↓</button>
                <button class="btn danger"
                  @click=${()=>this._save("groups",e.filter((t,e)=>e!==r))}>Remove</button>
              </div>
            </div>
            ${a?F`
              <div class="item-body">
                <div class="row-inline">
                  <div>
                    <label>ID</label>
                    <input type="text" .value=${i.id??""}
                      @change=${e=>this._patchGroup(t,r,{id:e.target.value.trim()})}/>
                  </div>
                  <div>
                    <label>Label</label>
                    <input type="text" .value=${i.label??""}
                      @change=${e=>this._patchGroup(t,r,{label:e.target.value})}/>
                  </div>
                </div>
                <div class="row">
                  <label>Rooms (all media_player entities shown — pick your Sonos ones)</label>
                  <div class="chip-list">
                    ${s.map(e=>{const s=(i.entities??[]).includes(e);return F`
                        <span class="chip ${s?"on":""}"
                          @click=${()=>this._patchGroup(t,r,{entities:s?(i.entities??[]).filter(t=>t!==e):[...i.entities??[],e]})}>${this.hass.states[e]?.attributes?.friendly_name??e}</span>
                      `})}
                  </div>
                </div>
              </div>
            `:W}
          </div>
        `})}
      <div class="adder">
        <button class="btn primary" @click=${()=>{this._save("groups",[...e,{id:`group_${e.length+1}`,label:"New group",entities:[]}]),this._openItem={...this._openItem,[`grp:${e.length}`]:!0}}}>+ Add group</button>
      </div>
    `}_patchArt(t,e,s){this._save("station_art",t.station_art.map((t,i)=>i===e?{...t,...s}:t))}_renderStationArt(t){const e=t.station_art;return F`
      ${e.map((s,i)=>{const r=`art:${i}`,o=!!this._openItem[r];return F`
          <div class="item">
            <div class="item-head" @click=${()=>this._toggleItem(r)}>
              <span>${o?"▾":"▸"}</span>
              <span class="name">${s.name||s.match||"(unmatched)"}</span>
              <div class="actions" @click=${t=>t.stopPropagation()}>
                <button class="btn" ?disabled=${0===i}
                  @click=${()=>this._save("station_art",this._move(e,i,-1))}>↑</button>
                <button class="btn" ?disabled=${i===e.length-1}
                  @click=${()=>this._save("station_art",this._move(e,i,1))}>↓</button>
                <button class="btn danger"
                  @click=${()=>this._save("station_art",e.filter((t,e)=>e!==i))}>Remove</button>
              </div>
            </div>
            ${o?F`
              <div class="item-body">
                <div class="row">
                  <label>Match (case-insensitive substring of media_content_id)</label>
                  <input type="text" .value=${s.match??""} placeholder="stationId=s297990"
                    @change=${e=>this._patchArt(t,i,{match:e.target.value})}/>
                  <div class="help">Find one via Developer Tools → States while the station plays.</div>
                </div>
                <div class="row">
                  <label>Label</label>
                  <input type="text" .value=${s.name??""}
                    @change=${e=>this._patchArt(t,i,{name:e.target.value||void 0})}/>
                </div>
                <div class="row">
                  <label>Image URL</label>
                  <input type="text" .value=${s.image??""} placeholder="https://example.com/logo.png"
                    @change=${e=>this._patchArt(t,i,{image:e.target.value.trim()||void 0})}/>
                </div>
              </div>
            `:W}
          </div>
        `})}
      <div class="adder">
        <button class="btn primary" @click=${()=>{this._save("station_art",[...e,{match:""}]),this._openItem={...this._openItem,[`art:${e.length}`]:!0}}}>+ Add mapping</button>
      </div>
    `}};pt.styles=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new o(s,t,i)})`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-family: var(--paper-font-body1_-_font-family, sans-serif);
    }
    .wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 24px 16px 64px;
    }
    h1 {
      font-size: 24px;
      font-weight: 500;
      margin: 8px 0 4px;
    }
    .lede {
      color: var(--secondary-text-color);
      font-size: 14px;
      margin-bottom: 20px;
    }
    .sec {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      margin: 12px 0;
      overflow: hidden;
      background: var(--card-background-color);
    }
    .sec-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      font-size: 16px;
    }
    .sec-head .count {
      margin-left: auto;
      font-size: 12px;
      color: var(--secondary-text-color);
      font-weight: 400;
    }
    .sec-body { padding: 4px 16px 16px; }
    .row { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
    .row-inline { display: flex; gap: 8px; align-items: flex-end; padding: 6px 0; }
    .row-inline > div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; color: var(--secondary-text-color); }
    input, select, textarea {
      padding: 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      box-sizing: border-box;
      width: 100%;
    }
    textarea { resize: vertical; }
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
    .item {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin: 8px 0;
    }
    .item-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
    }
    .item-head .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-head .kind { font-size: 12px; color: var(--secondary-text-color); }
    .item-body { padding: 6px 12px 12px; border-top: 1px solid var(--divider-color); }
    .btn {
      background: none;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
    }
    .btn.danger { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
    .btn.primary {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .actions { display: flex; gap: 6px; }
    .adder { margin-top: 10px; }
    .chip-list { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 0; }
    .chip {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--divider-color);
      background: var(--primary-background-color);
      cursor: pointer;
      font-size: 13px;
      user-select: none;
    }
    .chip.on {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .banner {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 12px 0;
      font-size: 14px;
    }
    .banner.error { background: var(--error-color, #cf6679); color: #fff; }
    .banner.saving { background: var(--secondary-background-color); color: var(--secondary-text-color); }
  `,t([dt({attribute:!1})],pt.prototype,"hass",void 0),t([dt({type:Boolean})],pt.prototype,"narrow",void 0),t([ht()],pt.prototype,"_data",void 0),t([ht()],pt.prototype,"_error",void 0),t([ht()],pt.prototype,"_saving",void 0),t([ht()],pt.prototype,"_open",void 0),t([ht()],pt.prototype,"_openItem",void 0),pt=t([(t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("wall-panel-sonos-panel")],pt);export{pt as WallPanelSonosPanel};
