// Утилиты дат, сроков и отображения значений. Без доступа к DOM и хранилищу.
export const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number);const z=new Date(y,m-1,d+Number(n));return `${z.getFullYear()}-${String(z.getMonth()+1).padStart(2,'0')}-${String(z.getDate()).padStart(2,'0')}`};
export const diffDays=date=>{if(!date)return Infinity;const d=new Date(date+'T12:00:00');const now=new Date(localDate()+'T12:00:00');return Math.round((d-now)/86400000)};
export const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n||0)+' ₽';
export const fmtDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'}):'Не указана';
export const amount=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(n||0);
