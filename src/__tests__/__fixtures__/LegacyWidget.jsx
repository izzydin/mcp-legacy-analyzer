// @ts-nocheck
import React, { useState } from 'react';

// A heavy component (simulated by name matching 'Grid')
function DataGrid({ rows }) {
  return <table><tbody>{rows.map((r, i) => <tr key={i}><td>{r}</td></tr>)}</tbody></table>;
}

export function LegacyWidget() {
  const [dataList, setDataList] = useState([]);

  const handleProcess = () => {
    // Concurrent Scout Rule: Complex operation updating state passed to a heavy component
    let heavyArray = [];
    for (let i = 0; i < 1000; i++) {
      heavyArray.push(i * 2);
    }
    setDataList(heavyArray);
  };

  return (
    <div>
      <button onClick={handleProcess}>Process Data</button>
      <DataGrid rows={dataList} />
    </div>
  );
}
