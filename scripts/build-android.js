const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const mobileDir = path.join(__dirname, '..', 'trueque-mobile');
const configPath = path.join(mobileDir, 'metro.config.js');
const bakPath = path.join(mobileDir, 'metro.config.js.bak');

console.log('--- Iniciando automatización de build Android ---');

try {
  // Renombrar temporalmente metro.config.js a .bak si existe (evita crash en Windows con eas build)
  if (fs.existsSync(configPath)) {
    console.log('Renombrando temporalmente metro.config.js a .bak para evitar crash en Windows...');
    fs.renameSync(configPath, bakPath);
  } else {
    console.log('No se encontro metro.config.js, procediendo sin renombrar.');
  }
  
  console.log('Ejecutando eas build...');
  // Ejecutamos eas build dentro de la carpeta trueque-mobile
  execSync('npx eas build -p android --profile preview', { 
    cwd: mobileDir,
    stdio: 'inherit' 
  });
  
  console.log('--- Build finalizado con éxito ---');
} catch (error) {
  console.error('\n!!! Ocurrio un error durante la construcción !!!\n');
} finally {
  // Restaurar metro.config.js
  if (fs.existsSync(bakPath)) {
    console.log('Restaurando metro.config.js...');
    fs.renameSync(bakPath, configPath);
    console.log('Archivo restaurado correctamente.');
  }
}
