import{d as M,r as d,P as h,o as k,c as b,a as o,b as s,V as C,w as m,e as v,f as w,n as P,g as x,h as c,_ as z,i as D,j as L}from"./_plugin-vue_export-helper-BMuJGTrQ.js";const B=M({__name:"Parent",setup(N){const n=d("Hello popup window."),u=new h(window);function g(l,e,a){const p=u.showDialog(l,e,a);if(p==null)throw new Error("ダイアログが生成できませんでした．");return p}const r=d(""),t=d({display:"none"});async function y(){t.value.display="block";const l=g("/child1/","child1",{left:50,top:100,width:600,height:600,lockable:!0});l.addMessageListener("initialized",()=>{l.sendMessage("data",{message:`[from Parent to Child1]
`+n.value})}),l.addMessageListener("close",()=>{t.value.display="none"});const e=await l.wait("result");r.value=e.message,t.value.display="block"}const i=d("");function V(){const l=g("/child2/","child2",{left:400,top:100,width:600,height:600});l.addMessageListener("initialized",()=>{l.sendMessage("data",{message:`[from Parent to Child2]
`+n.value})}),l.addMessageListener("result",e=>{i.value=e.message}),l.addMessageListener("close",e=>{console.log("receive close",e)})}return k(()=>{u.start()}),(l,e)=>(x(),b("div",null,[e[9]||(e[9]=o("h1",null,"ダイアログ",-1)),o("div",null,[e[5]||(e[5]=o("h3",{style:{"background-color":"azure"}},"ダイアログに送信するメッセージ",-1)),s(C,{modelValue:n.value,"onUpdate:modelValue":e[0]||(e[0]=a=>n.value=a)},null,8,["modelValue"]),s(v,{style:{margin:"1rem 0"},onClick:y},{default:m(()=>e[3]||(e[3]=[c("モーダルダイアログ表示")])),_:1}),e[6]||(e[6]=o("br",null,null,-1)),s(v,{style:{margin:"1rem 0"},onClick:V},{default:m(()=>e[4]||(e[4]=[c("モードレスダイアログ表示")])),_:1})]),o("div",null,[e[7]||(e[7]=o("h3",{style:{"background-color":"azure"}},"モーダルダイアログから帰ってきたメッセージ",-1)),s(w,{modelValue:r.value,"onUpdate:modelValue":e[1]||(e[1]=a=>r.value=a),placeholder:"モーダルダイアログの入力値",readonly:""},null,8,["modelValue"]),e[8]||(e[8]=o("h3",{style:{"background-color":"azure"}},"モードレスダイアログから帰ってきたメッセージ",-1)),s(w,{modelValue:i.value,"onUpdate:modelValue":e[2]||(e[2]=a=>i.value=a),placeholder:"モードレスダイアログの入力値",readonly:""},null,8,["modelValue"])]),o("div",{class:"gray-cover",style:P(t.value)},null,4)]))}}),S=z(B,[["__scopeId","data-v-f715e622"]]),f=D(S);L(f);f.mount("#app");
