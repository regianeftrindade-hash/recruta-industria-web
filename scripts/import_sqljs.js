const fs = require('fs');
const path = require('path');

async function main(){
  const dynamicRequire = new Function('pkg', 'try{ return require(pkg) }catch(e){ return null }');
  const dynamicResolve = new Function('p', 'try{ return require.resolve(p) }catch(e){ return null }');
  const initSqlJs = dynamicRequire('sql.js');
  const SQL = await initSqlJs({ locateFile: (file) => {
    const candidate = 'sql.js/dist/' + file;
    const resolved = dynamicResolve(candidate);
    if (resolved) return resolved;
    return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
  }});

  const sqlPath = path.resolve(__dirname, '..', 'data', 'payments_export.sql');
  if(!fs.existsSync(sqlPath)){
    console.error('SQL export not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const db = new SQL.Database();

  // sql.js supports executing multiple statements separated by semicolons
  try{
    db.run(sql);
  }catch(err){
    console.error('Error running SQL:', err.message || err);
    process.exit(1);
  }

  const outPath = path.resolve(__dirname, '..', 'data', 'payments.sqlite');
  const binary = db.export();
  fs.writeFileSync(outPath, Buffer.from(binary));
  console.log('Created', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
