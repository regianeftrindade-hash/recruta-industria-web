const fs = require('fs');
const path = require('path');

(async function(){
  try{
    const dynamicRequire = new Function('pkg', 'try{ return require(pkg) }catch(e){ return null }');
    const dynamicResolve = new Function('p', 'try{ return require.resolve(p) }catch(e){ return null }');
    const initSqlJs = dynamicRequire('sql.js');
    const SQL = await initSqlJs({ locateFile: (file) => {
      const candidate = 'sql.js/dist/' + file;
      const resolved = dynamicResolve(candidate);
      if (resolved) return resolved;
      return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
    }});

    const dbPath = path.resolve(__dirname, '..', 'data', 'payments.sqlite');
    if(!fs.existsSync(dbPath)){
      console.error('DB not found at', dbPath);
      process.exit(1);
    }

    const buf = fs.readFileSync(dbPath);
    const db = new SQL.Database(new Uint8Array(buf));

    const cnt = db.exec("SELECT COUNT(*) AS cnt FROM payments;");
    const count = (cnt.length && cnt[0].values && cnt[0].values[0]) ? cnt[0].values[0][0] : 0;
    console.log('COUNT:', count);

    const res = db.exec("SELECT id, externalId, status, amount, method, createdAt FROM payments ORDER BY createdAt DESC LIMIT 5;");
    if(res.length){
      const cols = res[0].columns;
      const vals = res[0].values;
      const rows = vals.map(r => Object.fromEntries(r.map((v,i)=>[cols[i], v])));
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('ROWS: []');
    }
  }catch(err){
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
