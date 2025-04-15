export function extractIPv4(ip) {
  if (!ip) return 'unknown';

  // Verificar se está no formato IPv4-mapeado para IPv6
  const ipv4MappedRegex = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
  const match = ip.match(ipv4MappedRegex);

  // Se for um IPv4 mapeado, retornar apenas a parte IPv4
  if (match) {
    return match[1];
  }

  // Caso de localhost IPv6
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // Caso contrário, retornar o IP original
  return ip;
}