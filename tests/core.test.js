const test=require('node:test'),assert=require('node:assert/strict');
function ip(s){let a=s.split('.');if(a.length!==4||a.some(x=>!/^(0|[1-9]\d{0,2})$/.test(x)||+x>255))return null;return a.reduce((n,x)=>n*256+ +x,0)>>>0}
function v6(s){s=s.toLowerCase();if(!s.includes(':')||s.includes('%')||(s.match(/::/g)||[]).length>1)return false;let p=s.split(':'),n=p.filter(Boolean).length;return p.every(x=>!x||/^[0-9a-f]{1,4}$/.test(x))&&(s.includes('::')?n<8:n===8)}
test('IPv4 valid/invalid',()=>{assert.notEqual(ip('192.168.1.2'),null);assert.equal(ip('256.1.1.1'),null);assert.equal(ip('1.2.3'),null)});
test('IPv6 compressed/full',()=>{assert.equal(v6('2001:db8::1'),true);assert.equal(v6('2001:0db8:0000:0000:0000:0000:0000:0001'),true);assert.equal(v6('2001:::1'),false)});