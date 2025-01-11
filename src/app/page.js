import React from 'react';
import TableAndChart from './TableAndChart/TableAndChart';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Data Visualization - Nitin Singh</h1>
      </header>

      <main className={styles.main}>
        <TableAndChart />
      </main>
    </div>
  );
}
