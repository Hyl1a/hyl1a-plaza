const fs = require('fs');

async function testEndpoint(name, url) {
  try {
    const r = await fetch(url);
    if (r.ok) {
      const ct = r.headers.get('content-type') || '';
      const buf = await r.arrayBuffer();
      if (ct.includes('octet') || ct.includes('gltf') || buf.byteLength < 200000) {
        try {
          const data = Buffer.from(buf);
          const magic = data.toString('ascii', 0, 4);
          if (magic === 'glTF') {
            const jsonLength = data.readUInt32LE(12);
            const jsonStr = data.toString('utf8', 20, 20 + jsonLength);
            const json = JSON.parse(jsonStr);
            const meshNames = (json.meshes || []).map(m => m.name || '(unnamed)');
            console.log(`${name}: OK ${buf.byteLength}b GLB | ${meshNames.length} meshes: [${meshNames.join(', ')}]`);
            return;
          }
        } catch(e) {}
      }
      console.log(`${name}: ${r.status} ${buf.byteLength}b ct="${ct}" (not GLB)`);
    } else {
      const txt = await r.text();
      console.log(`${name}: ${r.status} ${txt.substring(0, 60)}`);
    }
  } catch(e) {
    console.log(`${name}: FAILED ${e.message.substring(0, 60)}`);
  }
}

const miiData = 'AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn';

async function main() {
  // Try various known FFL-Testing servers
  await testEndpoint('ariankordi-face',     `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${miiData}&type=face&shaderType=wiiu`);
  await testEndpoint('ariankordi-all_body', `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${miiData}&type=all_body&shaderType=wiiu`);
  
  // Try without shaderType to see if default includes body
  await testEndpoint('ariankordi-no-shader', `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${miiData}&type=all_body`);
  
  // Try with instanceCount and clothesColor - maybe these trigger body
  await testEndpoint('ariankordi-clothes',   `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${miiData}&type=face&clothesColor=default&instanceCount=1`);
  
  // Try nn-cdn which some projects use
  await testEndpoint('studio-api',           `https://studio.mii.nintendo.com/miis/image.png?data=${miiData}&type=all_body&width=512`);
  
  // Try the secure version
  await testEndpoint('ariankordi-secure',    `https://mii.ariankordi.net/miis/image.glb?data=${miiData}&type=all_body&shaderType=wiiu`);

  // Try mii-renderer.nxw.pw
  await testEndpoint('nxw-renderer',         `https://mii-renderer.nxw.pw/miis/image.glb?data=${miiData}&type=all_body&shaderType=wiiu`);
  
  // Try without verifyCharInfo
  await testEndpoint('ariankordi-noverify',  `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${miiData}&type=all_body&shaderType=wiiu&verifyCharInfo=0`);
}

main();
