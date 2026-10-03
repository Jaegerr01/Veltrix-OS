/** Minimal ZIP writer (stored) + reader (stored/deflate). Pure, no dependencies; works in Node and browsers. */

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8');

let CRC_TABLE: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff,
    date: ((((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff),
  };
}

export interface ZipFile { name: string; data: Uint8Array | string }

export function createZip(files: ZipFile[], when: Date = new Date()): Uint8Array {
  const { time, date } = dosDateTime(when);
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true); local.setUint16(10, time, true); local.setUint16(12, date, true);
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true); cd.setUint16(12, time, true); cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true); cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0));
  let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

export const ZIP_LIMITS = { maxEntries: 500, maxEntryBytes: 1_000_000, maxTotalBytes: 20_000_000 };

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Read a .zip. Rejects path traversal, oversized entries (zip bombs) and encrypted/unsupported entries. */
export async function readZip(buf: Uint8Array): Promise<{ name: string; data: Uint8Array }[]> {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .zip file.');
  const count = v.getUint16(eocd + 10, true);
  if (count > ZIP_LIMITS.maxEntries) throw new Error(`Zip has too many files (max ${ZIP_LIMITS.maxEntries}).`);
  let p = v.getUint32(eocd + 16, true);
  const out: { name: string; data: Uint8Array }[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('Corrupt zip directory.');
    const flags = v.getUint16(p + 8, true);
    const method = v.getUint16(p + 10, true);
    const compSize = v.getUint32(p + 20, true);
    const size = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), cmtLen = v.getUint16(p + 32, true);
    const localOff = v.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + cmtLen;
    if (name.endsWith('/')) continue;
    if (flags & 1) throw new Error('Encrypted zips are not supported.');
    if (name.split('/').some(s => s === '..') || name.startsWith('/') || /^[A-Za-z]:/.test(name)) continue;
    if (size > ZIP_LIMITS.maxEntryBytes) continue;
    total += size;
    if (total > ZIP_LIMITS.maxTotalBytes) throw new Error('Zip is too large when unpacked.');
    const lnLen = v.getUint16(localOff + 26, true), leLen = v.getUint16(localOff + 28, true);
    const start = localOff + 30 + lnLen + leLen;
    const raw = buf.subarray(start, start + compSize);
    if (method === 0) out.push({ name, data: raw.slice() });
    else if (method === 8) {
      const data = await inflateRaw(raw);
      if (data.length > ZIP_LIMITS.maxEntryBytes) continue;
      out.push({ name, data });
    } else continue;
  }
  return out;
}

export const bytesToText = (b: Uint8Array) => dec.decode(b);
