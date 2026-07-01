import { access, readFile } from 'node:fs/promises';

const requiredFiles = ['index.html', 'style.css', 'script.js', 'favicon.svg', 'README.md'];
const requiredLinks = [
  'https://barbercloud.netlify.app',
  'https://github.com/Pietrobsn/barber-cloud-demo',
  'https://github.com/Pietrobsn/comanda-demo',
  'https://github.com/Pietrobsn',
  'https://www.linkedin.com/in/vitor-pietro-4729b73b6/',
  'https://wa.me/5581982977975',
  'mailto:vitorpietro86@gmail.com'
];
const forbiddenClaims = ['02+ anos', 'produto pronto, captando clientes', 'Ver demo online'];

const failures = [];

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    failures.push(`Arquivo obrigatório ausente: ${file}`);
  }
}

const html = await readFile('index.html', 'utf8');

for (const link of requiredLinks) {
  if (!html.includes(link)) failures.push(`Link obrigatório ausente: ${link}`);
}

for (const claim of forbiddenClaims) {
  if (html.toLocaleLowerCase('pt-BR').includes(claim.toLocaleLowerCase('pt-BR'))) {
    failures.push(`Conteúdo não permitido encontrado: ${claim}`);
  }
}

if (/href=["']#["']/i.test(html)) failures.push('Link vazio com href="#" encontrado.');
if (!html.includes('<title>Vitor Pietro | Desenvolvedor Web</title>')) failures.push('Título SEO incorreto.');

const ids = new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]));
const internalTargets = [...html.matchAll(/href=["']#([^"']+)["']/g)].map((match) => match[1]);

for (const target of internalTargets) {
  if (!ids.has(target)) failures.push(`Âncora interna sem destino: #${target}`);
}

if (failures.length) {
  console.error('Verificação falhou:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Verificação concluída: ${requiredFiles.length} arquivos, ${requiredLinks.length} links e ${internalTargets.length} âncoras validados.`);
}
